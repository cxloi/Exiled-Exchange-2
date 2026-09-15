<template>
  <div class="max-w-md p-2">
    <input
      class="bg-gray-900 rounded px-1 w-48 mb-2"
      :placeholder="t('widget.title')"
      v-model="title"
    />
    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="entries"
      item-key="id"
      handle="[data-qa=drag-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: entry }">
        <div
          class="grid gap-0.5"
          style="grid-template-columns: auto 1fr auto auto"
        >
          <button
            class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
            data-qa="drag-handle"
          >
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          
          <select v-model="entry.text">
            <option v-for="o in translatedList(entry.id)" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <input class="w-24" v-model="searches[entry.id]" :placeholder="t('price_track.search')" />
          <button
            class="leading-none rounded-r bg-gray-700 w-6 h-6"
            @click="removeEntry(entry.id)"
          >
            <i class="fas fa-times text-gray-400" />
          </button>
        </div>
      </template>
    </dnd-container>
    <button class="btn mt-2" style="min-width: 6rem" @click="addEntry">
      {{ t("Add") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import { configProp, configModelValue } from "../settings/utils.js";
import type { PriceTrackWidget } from "./widget.js";
import { BaseType, ITEM_DROP, ITEM_BY_REF } from "@/assets/data";

interface Entry {
  query: string[];
  items: string[];
}

interface DropdownEntry {
  label: string;
  value: string;
}

function flatten(data: Entry[]): string[] {
  return [...new Set(data.flatMap(e => [...e.query, ...e.items]))];
}

export default defineComponent({
  name: "price_track.name",
  components: { DndContainer },
  props: configProp<PriceTrackWidget>(),
  setup(props) {
    const { t } = useI18n();
    const searches = ref<Record<number, string>>({});

    return {
      t,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      entries: configModelValue(() => props.configWidget, "entries"),
      removeEntry(id: number) {
        props.configWidget.entries = props.configWidget.entries.filter(
          (_) => _.id !== id,
        );
      },
      addEntry() {
        props.configWidget.entries.push({
          id: Math.max(0, ...props.configWidget.entries.map((_) => _.id)) + 1,
          text: "",
        });
      },
      searches
    };
  },
  methods: {
    translatedList(id: number): DropdownEntry[] {
      const q = (this.searches[id] ?? '').trim().toLowerCase();

      let flatLs = flatten(ITEM_DROP);
      let filterLs: DropdownEntry[] = [];
      flatLs.forEach(itemId => {
        if (!itemId) return;
        const [ns, encodedName] = itemId.split("::");
        const [refName, variant] = encodedName.split(" // ");
        
        filterLs.push({
          label: ITEM_BY_REF(ns as unknown as BaseType["namespace"], refName)?.at(0)?.name || '',
          value: itemId 
        });
      })
      
      filterLs.filter(o => o.label !== "")

      return q 
        ? filterLs.filter(o => {
            if (q) {
              return o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
            } else {
              return true;
            }
          })
        : filterLs;
    },
  }
});

</script>
