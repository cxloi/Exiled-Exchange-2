import type { Widget, Anchor } from "../overlay/widgets.js";

export type UrlListSectionType = "url" | "textbox" | "stash-search";

export interface UrlListEntry {
  id: number;
  name: string; // display label
  text: string; // url | plain text | stash search text
}

export interface UrlListSection {
  id: number;
  name: string;
  type: UrlListSectionType;
  entries: UrlListEntry[];
}

export interface UrlListWidget extends Widget {
  anchor: Anchor;
  sections: UrlListSection[];
}

export function nextId(items: Array<{ id: number }>): number {
  return Math.max(0, ...items.map((_) => _.id)) + 1;
}
