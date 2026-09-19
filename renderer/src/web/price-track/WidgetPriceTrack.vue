<template>
  <Widget :config="config" move-handles="corners" v-slot="{ isEditing }">
    <div
      class="widget-default-style flex flex-col min-h-0"
      style="width: 27rem; max-height: 30rem"
    >
      <PriceTrackPanel :data="config" :is-shown="isShown">
        <template #title>
          <input
            v-if="isEditing"
            class="bg-gray-700 rounded px-1 flex-1 min-w-0"
            :placeholder="t('widget.title')"
            v-model="config.wmTitle"
          />
          <span v-else class="text-gray-100 truncate flex-1 min-w-0">
            {{ config.wmTitle || t(":name") }}
          </span>
        </template>
      </PriceTrackPanel>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces.js";

export default {
  widget: {
    type: "price-track",
    instances: "multi",
    trNameKey: "price_track.name",
  } satisfies WidgetSpec,
};
</script>

<script setup lang="ts">
import { computed, inject } from "vue";
import type { WidgetManager } from "../overlay/interfaces.js";
import type { PriceTrackWidget } from "./widget.js";
import { useI18nNs } from "@/web/i18n";
import Widget from "../overlay/Widget.vue";
import PriceTrackPanel from "./PriceTrackPanel.vue";

const props = defineProps<{ config: PriceTrackWidget }>();

const wm = inject<WidgetManager>("wm")!;
const { t } = useI18nNs("price_track");

const isShown = computed(
  () =>
    props.config.wmWants === "show" &&
    (wm.active.value || !props.config.wmFlags.includes("invisible-on-blur")),
);

// widget creation
if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.entries = [];
  props.config.limit = 10;
  props.config.unit = "auto";
  props.config.compact = false;
  wm.show(props.config.wmId);
}
</script>
