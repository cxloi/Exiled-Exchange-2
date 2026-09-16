<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0"
      style="min-width: 5rem"
    >
      <div v-if="config.wmTitle" class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle }}</span>
      </div>
      <div class="flex flex-row px-4 gap-x-5 overflow-x-auto min-h-0">
        <div v-for="item in itemLs" :key="item.name">
          <item-quick-price
            currency-text
            fraction
            class="text-base"
            :price="item.price"
            :item-img="item.icon"
          />
          <div class="text-left text-gray-600 mb-1 whitespace-nowrap overflow-hidden">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces.js";
import type { PriceTrackWidget } from "./widget.js";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";

export default {
  widget: {
    type: "price-track",
    instances: "multi",
    trNameKey: "price_track.name",
  } satisfies WidgetSpec,
  components: {ItemQuickPrice}
};
</script>

<script setup lang="ts">
import { inject, computed, onMounted, onUnmounted } from "vue";
import type { WidgetManager } from "../overlay/interfaces.js";
import { BaseType, ITEM_BY_REF } from "@/assets/data";
import Widget from "../overlay/Widget.vue";
import { usePoeninja } from "@/web/background/Prices";

const { queuePricesFetch, findPriceByQuery, autoCurrency, ITEM_DROP } = usePoeninja();

function findItemByQueryId(queryId: string): BaseType | undefined {
  if (!queryId) return;
  const [ns, encodedName] = queryId.split("::");
  const [name, variant] = encodedName.split(" // ");
  let found = ITEM_BY_REF(ns as unknown as BaseType["namespace"], name);
  if (found && ns === "UNIQUE") {
    const filtered = found.filter((unique) => unique.unique!.base === variant);
    if (filtered.length) found = filtered;
  }
  // return any first item
  if (found && found.length) return found[0];
}

function findPriceByQueryId(queryId: string) {
  const [ns, encodedName] = queryId.split("::");
  const [name, variant] = encodedName.split(" // ");
  const priceEntry = findPriceByQuery({ ns, name, variant });
  if (priceEntry) {
    return autoCurrency(priceEntry.primaryValue);
  }
}

function getItemPrice(itemId: string){
  const dbItem = findItemByQueryId(itemId);
  if (!dbItem) return { error: `Can't find "${itemId}".` };

  return {
    icon: dbItem.icon,
    name: dbItem.name,
    price: findPriceByQueryId(itemId),
  }
}

const props = defineProps<{
  config: PriceTrackWidget;
}>();

const wm = inject<WidgetManager>("wm")!;

const INTERVAL = 600000;
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  queuePricesFetch();
  timer = setInterval(queuePricesFetch, INTERVAL);
});
onUnmounted(() => clearInterval(timer));

const itemLs = computed(() =>
  (props.config?.entries ?? []).map(e => getItemPrice(e.text))
);

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.entries = [
    {
      id: 1,
      text: "ITEM::Aldur's Legacy",
    },
  ];
  wm.show(props.config.wmId);
}
</script>

<style lang="postcss" module>

</style>
