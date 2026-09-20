import type { Widget, Anchor } from "../overlay/widgets.js";
import { type BaseType, ITEMS_ITERATOR } from "@/assets/data";

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

// everything PriceTrackPanel needs; free of any overlay/wm coupling
export interface PriceTrackData {
  entries: Array<{ // pinned list to persist
    id: number;
    text: string; // item id, eg `ITEM::Chaos Orb` `GEM::Martial Tempo`
    count?: number // for pinnedSum
  }>;
  limit?: number; // default per group limit
  unit?: DisplayUnit; // pure render only
  compact?: boolean; // collapse search + group chips + tabs
  wmTitle?: string; // optional, rendered by the default title slot
  showSum?: boolean;
}

export interface PriceTrackWidget extends Widget, PriceTrackData {
  anchor: Anchor;
  wmTitle: string; // Widget requires it, PriceTrackData does not -- narrow here
}

export interface TrackedBase {
  id: string; // `${ns}::${refName}` (+ ` // ${base}` for uniques)
  group: string; // group.category or group.namespace
  base: BaseType; // full item meta
  variant?: string;
}

// add key to every group
export const TRACKED_GROUPS = TRACKED_CATEGORIES.map((group) => ({
  ...group,
  key: groupKey(group),
}));

// not real drops, manual forge
const SKIPPED_VARIANTS = ["Runeforged", "Runemastered", "INCOMPLETE"];

// quick run ndjson find
function scan(group: TrackedGroup): Generator<BaseType> {
  return group.category
    ? ITEMS_ITERATOR(`"category": "${group.category}"`)
    : ITEMS_ITERATOR(`": "${group.namespace}"`);
}

// verify truly valid item
function matches(group: TrackedGroup, base: BaseType): boolean {
  return group.category
    ? base.craftable?.category === group.category
    : base.namespace === group.namespace;
}

// module scope: the ndjson scan runs once per locale, no matter how many
// panels/widgets are mounted, and survives all of the unmounting
let cacheLang = "";
let cacheBases: TrackedBase[] = [];

// prepare all the items
export function trackedBases(lang: string): TrackedBase[] {
  if (cacheLang === lang && cacheBases.length) return cacheBases;

  const seen = new Set<string>();
  const out: TrackedBase[] = [];
  for (const group of TRACKED_GROUPS) {
    for (const base of scan(group)) {
      if (!matches(group, base)) continue;
      if (!base.refName || !base.name) continue;
      const variant = base.unique?.base;
      if (
        SKIPPED_VARIANTS.some(
          (skip) => base.refName.includes(skip) || variant?.includes(skip),
        )
      )
        continue;

      // unique base variant different price
      const id =
        `${base.namespace}::${base.refName}` + (variant ? ` // ${variant}` : "");
      if (seen.has(id)) continue; // dedupe
      seen.add(id);
      out.push({ id, group: group.key, base, variant });
    }
  }
  cacheLang = lang;
  cacheBases = out;
  return out;
}
