<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      class="widget-default-style p-1 flex flex-col overflow-auto min-h-0"
      style="min-width: 5rem"
    >
      <div v-if="config.wmTitle" class="text-gray-100 p-1">
        <span class="truncate">{{ config.wmTitle }}</span>
      </div>

      <!-- sections stack vertically -->
      <div class="flex flex-col gap-1 overflow-auto min-h-0">
        <div
          v-for="section in config.sections"
          :key="section.id"
          :class="$style.section"
        >
          <div v-if="section.name" :class="$style.sectionTitle">
            {{ section.name }}
          </div>

          <!-- entries inside a section are laid out horizontally -->
          <div 
            class="flex items-stretch "
            :class="
              section.type === 'textbox'
                ? 'flex-col'
                : 'flex-row flex-wrap gap-1'
            "
          >
            <template v-for="entry in section.entries" :key="entry.id">
              <!-- textbox -->
              <div v-if="section.type === 'textbox'" :class="$style.textBox">
                <span class="whitespace-pre-wrap break-words">{{
                  entry.text
                }}</span>
              </div>

              <!-- url / stash-search -->
              <div v-else :class="$style.entryRow">
                <button
                  :class="[
                    $style.actionBtn,
                    section.type === 'url' && $style.urlBtn,
                  ]"
                  :title="entry.text"
                  @click="activate(section.type, entry)"
                >
                  <span :class="$style.label">{{ entry.name || entry.text }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces.js";

export default {
  widget: {
    type: "url-list",
    instances: "multi",
    trNameKey: "url_list.name",
    defaultInstances: (): UrlListWidget[] => {
      return [
        {
          wmId: 0,
          wmType: "url-list",
          wmTitle: "External url",
          wmWants: "hide",
          wmZorder: null,
          wmFlags: ["invisible-on-blur"],
          anchor: {
            pos: "tl",
            x: 35,
            y: 46,
          },
          sections: [
            {
              id: 1,
              name: "Links",
              type: "url",
              entries: [
                { id: 1, name: "POE DB", text: "https://poe2db.tw/" },
              ],
            },
          ],
        },
      ];
    },
  } satisfies WidgetSpec,
};
</script>

<script setup lang="ts">
import { inject } from "vue";
import { MainProcess } from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";

import Widget from "../overlay/Widget.vue";
import {
  type UrlListEntry,
  type UrlListSectionType,
  type UrlListWidget,
} from "./widget.js";

const props = defineProps<{
  config: UrlListWidget;
}>();

const wm = inject<WidgetManager>("wm")!;

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.sections = [
    {
      id: 1,
      name: "Links",
      type: "url",
      entries: [{ id: 1, name: "POEDB", text: "https://poe2db.tw/tw/" }],
    },
  ];
  wm.show(props.config.wmId);
}

function openUrl(url: string) {
  if (!url) return;
  window.open(url, "_blank");
}

function stashSearch(text: string) {
  MainProcess.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "stash-search", text },
  });
}

function activate(type: UrlListSectionType, entry: UrlListEntry) {
  if (type === "stash-search") {
    stashSearch(entry.text);
  } else {
    openUrl(entry.text);
  }
}
</script>

<style lang="postcss" module>
.section {
  flex-shrink: 0;
  @apply flex flex-col gap-y-1;
  @apply p-1 rounded;
  @apply bg-gray-900;
}

.sectionTitle {
  @apply text-gray-400 text-xs uppercase tracking-wide;
  @apply px-1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.entryRow {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 16rem;
  @apply flex items-stretch gap-x-1;
}

.actionBtn {
  flex: 0 1 auto;
  min-width: 0;
  @apply rounded;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &:hover {
    @apply bg-gray-700;
  }
}

.urlBtn {
  &:hover {
    @apply underline;
  }
}

.label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.textBox {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 24rem;
  @apply rounded p-0.5 leading-4;
  /* @apply text-gray-100 bg-gray-800; */
}
</style>
