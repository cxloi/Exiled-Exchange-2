import type { Widget, Anchor } from "../overlay/widgets.js";

export interface TrackedGroup {
  trKey: string;
  category?: string;
  namespace?: string;
  topLimit?: number;
}

export const TRACKED_CATEGORIES: readonly TrackedGroup[] = [
  // topLimit default to 10(config.limit), used for combined list to show the most expensive, player dont really care about everything
  { category: "Currency", trKey: "cat_currency" },
  { category: "SoulCore", trKey: "cat_soul_core" },
  { category: "UncutSkillGem", trKey: "cat_uncut_gem" },
  { category: "Support Skill Gem", trKey: "cat_support_gem" },
  { category: "PinnacleKey", trKey: "cat_pinnacle_key" },
  { category: "Omen", trKey: "cat_omen" },
  { category: "MapFragment", trKey: "cat_map_fragment" },
  { namespace: "UNIQUE", trKey: "cat_unique", topLimit: 20 },
];

export function groupKey(group: TrackedGroup): string {
  return group.category ?? group.namespace ?? ""; // normalise 2 kind of fields as key
}

// by autoCurrency()
export type DisplayUnit = "auto" | "exalted" | "chaos" | "div";
export const DISPLAY_UNITS: ReadonlyArray<{
  id: DisplayUnit;
  ref?: string; // ref against div
  icon?: string;
}> = [
  { id: "auto" },
  { id: "exalted", ref: "Exalted Orb", icon: "/images/exa.png" },
  { id: "chaos", ref: "Chaos Orb", icon: "/images/chaos.png" },
  { id: "div", icon: "/images/divine.png" },
];

export interface PriceTrackWidget extends Widget {
  anchor: Anchor;
  entries: Array<{ // pinned list to persist
    id: number;
    text: string; // item id, eg `ITEM::Chaos Orb` `GEM::Martial Tempo`
  }>;
  limit?: number; // default per group limit
  unit?: DisplayUnit; // pure render only
}
