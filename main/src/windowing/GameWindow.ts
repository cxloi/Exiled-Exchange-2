import { type BrowserWindow, nativeImage, systemPreferences, shell } from "electron";
import { execFileSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { EventEmitter } from "events";
import { OverlayController, AttachEvent } from "electron-overlay-window";

export interface MacScreenshot {
  data: Buffer;
  width: number;
  height: number;
}

export interface GameWindow {
  on: (event: "active-change", listener: (isActive: boolean) => void) => this;
}
export class GameWindow extends EventEmitter {
  private _isActive = false;
  private _isTracking = false;

  get bounds() {
    return OverlayController.targetBounds;
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(active: boolean) {
    if (this.isActive !== active) {
      this._isActive = active;
      this.emit("active-change", this._isActive);
    }
  }

  get uiSidebarWidth() {
    // sidebar is 370px at 800x600
    const ratio = 370 / 600;
    return Math.round(this.bounds.height * ratio);
  }

  attach(window: BrowserWindow | undefined, title: string) {
    if (!this._isTracking) {
      OverlayController.events.on("focus", () => {
        this.isActive = true;
      });
      OverlayController.events.on("blur", () => {
        this.isActive = false;
      });
      OverlayController.attachByTitle(window, title, {
        hasTitleBarOnMac: true,
      });
      this._isTracking = true;
    }
  }

  onAttach(cb: (hasAccess: boolean | undefined) => void) {
    OverlayController.events.on("attach", (e: AttachEvent) => {
      cb(e.hasAccess);
    });
  }

  winScreenshot() {
    return OverlayController.screenshot();
  }

  macScreenshot(): MacScreenshot {
    if (systemPreferences.getMediaAccessStatus("screen") !== "granted") {
      shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
      );
      throw new Error("Screen Recording permission not granted");
    }

    const b = this.bounds;
    const file = join(tmpdir(), `overlay-${process.pid}-${Date.now()}.png`);

    try {
      execFileSync("/usr/sbin/screencapture", [
        "-x", // no shutter sound
        "-o", // no window shadow
        "-t", "png",
        "-R", `${b.x},${b.y},${b.width},${b.height}`,
        file,
      ], { timeout: 5000 });

      const img = nativeImage.createFromBuffer(readFileSync(file));
      const size = img.getSize();
      const rgba = img.toBitmap(); // RGBA on macOS

      for (let i = 0; i < rgba.length; i += 4) {
        const r = rgba[i];
        rgba[i] = rgba[i + 2];
        rgba[i + 2] = r;
      }

      return { data: rgba, width: size.width, height: size.height };
    } finally {
      try { unlinkSync(file); } catch {}
    }
  }
}
