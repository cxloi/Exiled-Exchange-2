<template>
  <div class="flex flex-col p-1 gap-1 min-h-0 h-full">
    <!-- title + display currency -->
    <div class="flex items-center gap-1 px-1">
      <slot name="title">
        <span class="text-gray-100 truncate flex-1 min-w-0">
          {{ data.wmTitle || t(":name") }}
        </span>
      </slot>
      <span v-if="loading" class="text-gray-600">
        <i class="fas fa-circle-notch fa-spin" />
      </span>
      <div class="flex gap-px shrink-0">
        <button
          v-for="option in DISPLAY_UNITS"
          :key="option.id"
          class="rounded bg-gray-900 px-1 h-6 flex items-center"
          :class="{ border: unit === option.id }"
          :title="t(`:unit_${option.id}`)"
          @click="data.unit = option.id"
        >
          <img
            v-if="option.icon"
            :src="option.icon"
            class="w-4 h-4"
            :class="{ 'opacity-50': unit !== option.id }"
          />
          <span v-else class="text-sm">{{ t(":unit_auto") }}</span>
        </button>
      </div>
      <button
        class="rounded bg-gray-900 px-1 h-6 flex items-center shrink-0"
        :class="{ border: compact }"
        :title="t(compact ? ':show_filters' : ':hide_filters')"
        @click="toggleCompact"
      >
        <i
          class="fas w-4 text-sm"
          :class="compact ? 'fa-angle-double-down' : 'fa-angle-double-up'"
        />
      </button>
    </div>

    <!-- global search -->
    <div v-if="!compact" class="flex gap-1 px-1 py-2">
      <div class="flex-1 min-w-0 flex items-center bg-gray-900 rounded px-1">
        <i class="fas fa-search text-gray-600 mr-1" />
        <input
          class="bg-transparent flex-1 min-w-0"
          :placeholder="t(':input')"
          v-model="search"
        />
        <button v-if="search" class="text-gray-600" @click="search = ''">
          <i class="fas fa-times" />
        </button>
      </div>
    </div>

    <!-- group filter -->
    <div v-if="!compact" class="flex flex-wrap gap-1 px-1">
      <button
        class="rounded px-2 bg-gray-900 text-sm"
        :class="{ border: groupFilter === 'all' }"
        @click="groupFilter = 'all'"
      >
        {{ t(":cat_all") }}
      </button>
      <button
        v-for="group in groups"
        :key="group.key"
        class="rounded px-2 bg-gray-900 text-sm"
        :class="{ border: groupFilter === group.key }"
        @click="groupFilter = group.key"
      >
        {{ t(`:${group.trKey}`) }}
      </button>
    </div>

    <!-- tabs (hidden while searching or collapsed) -->
    <div v-if="!compact && !isSearching" class="flex gap-1 px-1 pt-1">
      <button
        class="rounded px-2 bg-gray-900"
        :class="{ border: mode === 'top' }"
        @click="mode = 'top'"
      >
        {{ t(":tab_top") }}
      </button>
      <button
        class="rounded px-2 bg-gray-900"
        :class="{ border: mode === 'pinned' }"
        @click="mode = 'pinned'"
      >
        {{ t(":tab_pinned") }} ({{ pinnedRows.length }})
      </button>
    </div>

    <!-- rows -->
    <div class="flex flex-col my-2 overflow-y-auto min-h-0">
      <button
        v-for="row in rows"
        :key="row.id"
        :class="$style.row"
        @click="togglePin(row.id)"
      >
        <div class="w-8 h-8 flex items-center justify-center shrink-0">
          <ui-item-img
            v-if="hasIcon(row.icon)"
            :icon="row.icon"
            overflow-hidden
          />
          <span v-else class="text-gray-500">?</span>
        </div>
        <div
          class="flex-1 min-w-0 text-left truncate"
          :title="row.variant ? `${row.name} — ${row.variant}` : row.name"
        >
          {{ row.name }}
          <span v-if="row.variant" class="text-gray-600">
            {{ row.variant }}
          </span>
        </div>
        <price-sparkline :data="row.spark" :change="row.change" />
        <div
          class="text-right text-xs shrink-0"
          :class="row.change >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{
            row.change
              ? `${row.change > 0 ? "+" : ""}${row.change.toFixed(0)}%`
              : ""
          }}
        </div>
        <div class="w-24 shrink-0 flex justify-end">
          <item-quick-price
            currency-text
            fraction
            :show-img="false"
            :show-arrow="false"
            :price="toPrice(row.value)"
          />
        </div>
        <i
          class="fas fa-thumbtack w-4 shrink-0"
          :class="isPinned(row.id) ? 'text-gray-100' : 'text-gray-700'"
        />
      </button>

      <div v-if="!rows.length" class="text-center text-gray-600 p-4">
        <i class="fas fa-exclamation-triangle" />
        {{ isSearching ? t(":not_found") : t(":empty") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from "vue";
import {
  DISPLAY_UNITS,
  TRACKED_GROUPS,
  trackedBases,
  type DisplayUnit,
  type PriceTrackData,
  type TrackedBase,
} from "./widget.js";
import { usePoeninja, type CurrencyValue } from "@/web/background/Prices";
import { useI18n } from "vue-i18n";
import { useI18nNs } from "@/web/i18n";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import UiItemImg from "@/web/ui/UiItemImg.vue";
import PriceSparkline from "./PriceSparkline.vue";

const props = defineProps<{
  data: PriceTrackData;
  isShown: boolean;
}>();

const { t } = useI18nNs("price_track");
const { locale } = useI18n();

const {
  queuePricesFetch,
  findPriceByQuery,
  autoCurrency,
  xchgRate,
  xchgRateCurrency,
  lastUpdateTime,
  isLoading,
} = usePoeninja();

// exposed for the group-filter buttons in the template
const groups = TRACKED_GROUPS;

interface Row {
  id: string;
  name: string;
  variant?: string;
  icon: string;
  group: string;
  value: number; // divine value for sorting, display value only format at render
  change: number;
  spark: Array<number | null>;
}

const search = shallowRef("");
const mode = shallowRef<"top" | "pinned">("top");
const groupFilter = shallowRef<string>("all");

const compact = computed(() => props.data.compact ?? false);
const limit = computed(() => props.data.limit ?? 10);
const unit = computed<DisplayUnit>(() => props.data.unit ?? "auto");
const isSearching = computed(() => search.value.trim().length > 0);
const loading = isLoading;

// display currency toggle, local only 
// calc how much div per 1 unit, e.g. rates.chaos = value of one chaos in div
const rates = computed<Partial<Record<DisplayUnit, number>>>(() => {
  lastUpdateTime.value; // re-read the blob after every download
  const out: Partial<Record<DisplayUnit, number>> = { div: 1 };
  for (const option of DISPLAY_UNITS) {
    if (!option.ref) continue;
    const rate = findPriceByQuery({ ns: "ITEM", name: option.ref })
      ?.primaryValue;
    if (rate && rate > 0) {
      out[option.id] = rate;
    } else if (xchgRate.value && xchgRateCurrency.value?.id === option.id) {
      // fall back to the core/div rate parsed from the exchange blob
      out[option.id] = 1 / xchgRate.value;
    }
  }
  return out;
});

// calc price for render
function toPrice(divValue: number): CurrencyValue | undefined {
  if (!divValue) return undefined;
  if (unit.value === "auto") return autoCurrency(divValue);
  const rate = rates.value[unit.value];
  if (!rate) return autoCurrency(divValue);
  const converted = divValue / rate;
  return { min: converted, max: converted, currency: unit.value };
}

function toRow(tracked: TrackedBase): Row {
  const { base, variant } = tracked;
  const entry = findPriceByQuery({
    ns: base.namespace,
    name: base.refName,
    variant,
  });
  return {
    id: tracked.id,
    name: base.name,
    variant,
    icon: base.icon,
    group: tracked.group,
    value: entry?.primaryValue ?? 0,
    change: entry?.sparkline?.totalChange ?? 0,
    spark: entry?.sparkline?.data ?? [],
  };
}

// apply price check for all items
let frozenAll: Row[] = [];
const allRows = computed<Row[]>(() => {
  lastUpdateTime.value;
  if (!props.isShown) return frozenAll;
  frozenAll = trackedBases(locale.value).map(toRow);
  return frozenAll;
});

// group filter
const visibleRows = computed<Row[]>(() =>
  groupFilter.value === "all"
    ? allRows.value
    : allRows.value.filter((row) => row.group === groupFilter.value),
);

// compute on visibleRows, drop 0, sort price, apply cap
// each group contributes its own top slice, everything is merged
const topRows = computed<Row[]>(() => {
  const byValue = visibleRows.value
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const taken = new Map<string, number>();
  return byValue.filter((row) => {
    const group = groups.find((entry) => entry.key === row.group);
    const cap = group?.topLimit ?? limit.value;
    const used = taken.get(row.group) ?? 0;
    if (used >= cap) return false;
    taken.set(row.group, used + 1);
    return true;
  });
});

// compute on unfiltered and uncapped
let frozenPinned: Row[] = [];
const pinnedRows = computed<Row[]>(() => {
  if (!props.isShown) return frozenPinned;
  const byId = new Map(allRows.value.map((row) => [row.id, row]));
  frozenPinned = props.data.entries
    .map((entry) => byId.get(entry.text))
    .filter((row): row is Row => row != null);
  return frozenPinned;
});

// final render rows
let frozenRows: Row[] = [];
const rows = computed<Row[]>(() => {
  if (!props.isShown) return frozenRows;
  frozenRows = computeRows();
  return frozenRows;
});

function computeRows(): Row[] {
  if (isSearching.value) { // search on groupFiltered but uncapped
    const parts = search.value.trim().toLowerCase().split(/\s+/);
    return visibleRows.value
      .filter((row) => {
        const haystack =
          `${row.name} ${row.variant ?? ""} ${row.id}`.toLowerCase();
        return parts.every((part) => haystack.includes(part));
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  }
  if (mode.value === "pinned") { // search on unfiltered and uncapped
    return groupFilter.value === "all"
      ? pinnedRows.value
      : pinnedRows.value.filter((row) => row.group === groupFilter.value);
  }
  return topRows.value; // groupFiltered + capped
}

// pin logic
const pinnedIds = computed(
  () => new Set(props.data.entries.map((entry) => entry.text)),
);
function toggleCompact() {
  const next = !compact.value;
  // force clear search
  if (next) search.value = "";
  props.data.compact = next;
}

function isPinned(id: string) {
  return pinnedIds.value.has(id);
}
function togglePin(id: string) {
  const entries = props.data.entries;
  const idx = entries.findIndex((entry) => entry.text === id);
  if (idx !== -1) {
    entries.splice(idx, 1);
  } else {
    entries.push({
      id: Math.max(0, ...entries.map((entry) => entry.id)) + 1,
      text: id,
    });
  }
}

// keep express price interest
const FETCH_INTERVAL = 600000; // 10m
let fetchTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  queuePricesFetch();
  fetchTimer = setInterval(queuePricesFetch, FETCH_INTERVAL);
});
onUnmounted(() => {
  clearInterval(fetchTimer);
});


function hasIcon(icon: string) {
  return Boolean(icon) && icon !== "%NOT_FOUND%";
}
</script>

<style lang="postcss" module>
.row {
  @apply flex items-center gap-x-1 px-1 py-0.5 rounded;
  @apply text-gray-400;

  &:hover {
    @apply bg-gray-800 text-gray-100;
  }
}
</style>
