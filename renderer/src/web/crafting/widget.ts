import type { Widget, Anchor } from "../overlay/widgets.js";
import type { PriceTrackData } from "../price-track/widget.js";

export interface CraftingLink {
  name: string;
  url: string;
}

export const LINK_SLOTS = ["base", "target", "modifier"] as const;
export type LinkSlot = (typeof LINK_SLOTS)[number];

export interface CraftingStep {
  id: number;
  text: string; // the instruction
  btnText: string; // regex name
  search: string; // stash search regex, empty then no button
}

export interface CraftingWidget extends Widget, PriceTrackData {
  anchor: Anchor;
  wmTitle: string;
  base: CraftingLink;
  target: CraftingLink;
  modifier: CraftingLink;
  steps: CraftingStep[];
}

export function emptyLink(): CraftingLink {
  return { name: "", url: "" };
}
