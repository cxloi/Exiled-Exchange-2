import { cv } from "./wasm-bindings";

export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface WeightedPoint {
  x: number;
  y: number;
  weight: number;
}

export type LinePoints = [WeightedPoint, WeightedPoint];

export function findNonZeroWeights(matchResult: any): WeightedPoint[] {
  const locations = new cv.Mat();
  cv.findNonZero(matchResult, locations);
  const weights = Array<WeightedPoint>(locations.rows);
  for (let i = 0; i < locations.rows; ++i) {
    const x = locations.intAt(i, 0);
    const y = locations.intAt(i, 1);
    const weight = matchResult.floatAt(y, x);
    weights[i] = { x, y, weight };
  }
  locations.delete();
  return weights;
}

export function groupWeightedPoints(
  weights: WeightedPoint[],
  radius: number,
): WeightedPoint[] {
  // similar to non-maximum suppression
  const maxWeighted: WeightedPoint[] = [];
  for (const point of weights) {
    const closeIdx = maxWeighted.findIndex((maxPoint) => {
      const dist = Math.hypot(point.x - maxPoint.x, point.y - maxPoint.y);
      return dist < radius;
    });
    if (closeIdx === -1) {
      maxWeighted.push(point);
    } else if (point.weight > maxWeighted[closeIdx].weight) {
      maxWeighted[closeIdx] = point;
    }
  }
  return maxWeighted;
}

export function findLines(
  points: WeightedPoint[],
  yTolerance: number,
): LinePoints[] {
  points.sort((a, b) => a.x - b.x);
  const lines: LinePoints[] = [];
  for (let idxA = 0; idxA < points.length; ++idxA) {
    for (let idxB = idxA + 1; idxB < points.length; ++idxB) {
      const pointA = points[idxA];
      const pointB = points[idxB];
      if (Math.abs(pointA.y - pointB.y) > yTolerance) continue;
      lines.push([pointA, pointB]);
      break;
    }
  }
  return lines;
}

export function hsvToU8(h: number, s: number, v: number) {
  return [
    Math.round((h * 255) / 360),
    Math.round((s * 255) / 100),
    Math.round((v * 255) / 100),
  ];
}

export function timeIt(syncFn: () => void): number {
  const startTime = performance.now();
  syncFn();
  return performance.now() - startTime;
}

export interface FractionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Crops an ImageData to a rectangle given as fractions (0..1) of the image's own
// width/height, so a calibrated region stays correct across DPI changes and window
// resizes without any separate coordinate conversion. Clamped to the image bounds so a
// stale calibration (e.g. after resizing the game window) degrades to a smaller/shifted
// crop instead of throwing.
export function winCropImageFraction(
  image: ImageData,
  rect: FractionRect,
): ImageData {
  const bytesPerPixel = image.data.length / (image.width * image.height);

  const x = Math.min(Math.max(Math.round(rect.x * image.width), 0), image.width - 1);
  const y = Math.min(Math.max(Math.round(rect.y * image.height), 0), image.height - 1);
  const width = Math.min(Math.round(rect.width * image.width), image.width - x);
  const height = Math.min(Math.round(rect.height * image.height), image.height - y);

  const out = new Uint8Array(Math.max(width, 0) * Math.max(height, 0) * bytesPerPixel);
  for (let row = 0; row < height; row++) {
    const srcStart = ((y + row) * image.width + x) * bytesPerPixel;
    const destStart = row * width * bytesPerPixel;
    out.set(
      image.data.subarray(srcStart, srcStart + width * bytesPerPixel),
      destStart,
    );
  }
  return { width, height, data: out };
}

type MacBufferLike = Uint8Array | Buffer | number[] | { data: number[] };

function macToBytes(d: MacBufferLike): Uint8Array {
  if (ArrayBuffer.isView(d)) {
    return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
  }
  if (Array.isArray(d)) return Uint8Array.from(d);
  if (Array.isArray((d as any)?.data)) return Uint8Array.from((d as any).data);

  throw new TypeError(`unsupported image data: ${Object.prototype.toString.call(d)}`);
}

export function macCropImageFraction(
  image: { width: number; height: number; data: MacBufferLike },
  rect: FractionRect,
): ImageData {

  const src = macToBytes(image.data);
  const bytesPerPixel = src.length / (image.width * image.height);

  if (!Number.isInteger(bytesPerPixel)) {
    throw new Error(
      `stride mismatch: ${src.length} bytes for ${image.width}x${image.height}`,
    );
  }

  const x = Math.min(Math.max(Math.round(rect.x * image.width), 0), image.width - 1);
  const y = Math.min(Math.max(Math.round(rect.y * image.height), 0), image.height - 1);
  const width = Math.max(Math.min(Math.round(rect.width * image.width), image.width - x), 0);
  const height = Math.max(Math.min(Math.round(rect.height * image.height), image.height - y), 0);

  const out = new Uint8Array(width * height * bytesPerPixel);
  for (let row = 0; row < height; row++) {
    const srcStart = ((y + row) * image.width + x) * bytesPerPixel;
    out.set(src.subarray(srcStart, srcStart + width * bytesPerPixel), row * width * bytesPerPixel);
  }
  return { width, height, data: out };
}
