import type { Widget, Anchor } from "../overlay/widgets.js";
import { ExpeditionCaptureRegion } from "./region.js";

export interface ExpeditionWidget extends Widget {
  anchor: Anchor;
  mode: "hotkey" | "continuous";
  hotkey: string | null;
  region: ExpeditionCaptureRegion | null;
  pollIntervalMs: number;
  /** shows the unprocessed OCR text lines alongside the parsed rows, for diagnosing
   * new/changed panels or matching issues without instrumenting code */
  showRawOcr: boolean;
  /** colors each resolved price by its rank among the currently-visible rows
   * (highest = green, lowest = red, anything between = yellow) - unresolved ("?")
   * rows are never colored by this, regardless of setting */
  colorCodeValues: boolean;
  /** lets the name grow the widget wide enough to show in full instead of
   * truncating, so what OCR actually recognized is always checkable - on by
   * default; turn off for a more compact widget once names aren't needed */
  uncapNameWidth: boolean;
}
