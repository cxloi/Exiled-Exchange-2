import type { Widget, Anchor } from "../overlay/widgets.js";

export interface PriceTrackWidget extends Widget {
  anchor: Anchor;
  entries: Array<{
    id: number;
    text: string;
  }>;
}
