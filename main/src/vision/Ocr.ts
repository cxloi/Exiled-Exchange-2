import { execFile } from "child_process";
import { nativeImage, app } from "electron";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import { winCropImageFraction, macCropImageFraction, FractionRect, ImageData } from "./utils";

export interface ExpeditionOcrLine {
  text: string;
  /** top of this line's bounding box, as a fraction (0-1) of the cropped region's
   * height - lets the renderer position a price next to this exact row instead of
   * in a separate stacked list. */
  y: number;
  /** this line's bounding box height, as a fraction (0-1) of the cropped region's
   * height. */
  height: number;
}

export interface ExpeditionOcrResult {
  elapsed: number;
  lines: ExpeditionOcrLine[];
}

interface OcrWord {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OcrLine {
  text: string;
  words: OcrWord[];
}

interface OcrResponse {
  ok: boolean;
  error?: string;
  lines?: OcrLine[];
}

// Windows' own OCR engine (Windows.Media.Ocr - the same engine behind PowerToys'
// Text Extractor), reached via a spawned PowerShell/WinRT bridge since there's no
// Node/Electron API for it. Replaced the previous Tesseract.js/OpenCV.js pipeline
// entirely (see git history for that version, and EXPEDITION_CHECK.md for why):
// validated in ocr-playground/ against every real capture available, it read every
// item name correctly - including ones Tesseract's confidence scoring couldn't
// safely separate from icon-glyph noise - and produced zero garbage text from the
// icon glyphs themselves, at a few ms per call with no preprocessing whatsoever.
//
// No worker thread involved (unlike HeistGemFinder, which still uses one for the
// OpenCV.js/Tesseract.js WASM engine): spawning a subprocess is already
// asynchronous/non-blocking, so there's no heavy synchronous computation here to
// keep off Electron's main thread.
const WIN_SCRIPT_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'windows-ocr-recognize.ps1')
  : path.join(__dirname, 'windows-ocr-recognize.ps1');
// Mac' own OCR engine
const MAC_SCRIPT_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'macos-ocr-recognize.sh')
  : path.join(__dirname, 'macos-ocr-recognize.sh')

// Observed consistently across every real test capture: Windows/Mac recognizer
// substitutes look-alike letters for the digits "1" and "0" specifically in the
// leading quantity-prefix token ("1x" -> "IX", "10x" -> "IOX"), never elsewhere in
// a line. Safe to fix with a line-start-anchored regex; a global I->1/O->0 replace
// would corrupt real item names instead (e.g. "Orb"). See ocr-playground/README.md's
// "Windows OCR (native)" section for how this was found.
function normalizeQuantityPrefix(line: string): string {
  return line.replace(
    /^([IO]+)X\b/,
    (_, digits: string) => digits.replace(/I/g, "1").replace(/O/g, "0") + "x",
  );
}

async function runScript(imagePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    if (process.platform == "win32") {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", WIN_SCRIPT_PATH, imagePath],
        // A hung subprocess must not be able to wedge future OCR calls for the rest
        // of the session - this runs unattended for as long as the app is open,
        // unlike the playground's short-lived dev server.
        { maxBuffer: 10 * 1024 * 1024, timeout: 15_000 },
        (err, stdout, stderr) => {
          if (stdout && stdout.trim()) {
            resolve(stdout);
            return;
          }
          reject(new Error(stderr || String(err)));
        },
      );
    } 
    if (process.platform == "darwin") {
      execFile(
        "/bin/bash",
        [MAC_SCRIPT_PATH, imagePath],
        // A hung subprocess must not be able to wedge future OCR calls for the rest
        // of the session - this runs unattended for as long as the app is open,
        // unlike the playground's short-lived dev server.
        {
          maxBuffer: 10 * 1024 * 1024, timeout: 15_000,
          env: { ...process.env, OCR_LANGUAGES: 'zh-Hans,en-US' },
        },
        (err, stdout, stderr) => {
          if (stdout && stdout.trim()) {
            resolve(stdout);
            return;
          }
          reject(new Error(stderr || String(err)));
        },
      );
    }

  });
}

export async function ocrExpeditionPanel(
  screenshot: ImageData,
  rect: FractionRect,
): Promise<ExpeditionOcrResult> {
  const start = performance.now();

  let cropped = null;
  let image = null;
  if (process.platform == "win32") {
    cropped = winCropImageFraction(screenshot, rect);

    // Native screenshots are BGRA (see HeistGemFinder/the old ExpeditionOcr.ts for
    // the same assumption) - nativeImage.createFromBitmap expects exactly that on
    // little-endian systems, so no channel reordering is needed.
    image = nativeImage.createFromBitmap(Buffer.from(cropped.data), {
      width: cropped.width,
      height: cropped.height,
    });
  }

  if (process.platform == "darwin") {
    cropped = macCropImageFraction(screenshot, rect);

    image = nativeImage.createFromBitmap(Buffer.from(
        cropped.data.buffer,
        cropped.data.byteOffset,
        cropped.data.byteLength,
      ), {
        width: cropped.width,
        height: cropped.height,
      });
  }

  if (!image || !cropped) return Promise.reject(new Error("failed"));
 
  const pngBuffer = image.toPNG();

  const id = crypto.randomUUID();
  const imagePath = path.join(os.tmpdir(), `ee2-winocr-${id}.png`);

  try {
    await fs.writeFile(imagePath, pngBuffer);
    const stdout = await runScript(imagePath);
    const result: OcrResponse = JSON.parse(stdout);
    if (!result.ok) {
      throw new Error(result.error ?? "Unknown error from Native OCR bridge");
    }

    // result.text (OcrResult.Text) joins every line with a space, discarding row
    // boundaries - use the per-line array instead (see ocr-playground/app.js's
    // fix for the same bug, found first there).
    const lines: ExpeditionOcrLine[] = (result.lines ?? [])
      .map((line) => {
        const text = normalizeQuantityPrefix(line.text.trim());
        // A line's own bounding box isn't exposed separately by this API - derive
        // it from the union of its words' boxes instead.
        const top = Math.min(...line.words.map((w) => w.y));
        const bottom = Math.max(...line.words.map((w) => w.y + w.height));
        return {
          text,
          y: top / cropped.height,
          height: (bottom - top) / cropped.height,
        };
      })
      .filter((line) => line.text.length > 0);

    return { elapsed: performance.now() - start, lines };
  } finally {
    fs.unlink(imagePath).catch(() => {});
  }
}
