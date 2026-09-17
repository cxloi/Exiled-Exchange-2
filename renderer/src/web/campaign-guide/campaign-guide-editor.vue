<template>
  <div class="p-2">
    <div class="mb-4">{{ t(":enable_read_client_logs") }}</div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t("settings.poe_log_file") }}</div>
      <input
        v-model.trim="clientLog"
        class="rounded bg-gray-900 px-1 block w-full font-sans"
        placeholder="...?/Grinding Gear Games/Path of Exile 2/logs/Client.txt"
      />
    </div>
    <ui-checkbox class="mb-1" v-model="readClientLog">{{
      t("settings.read_client_log")
    }}</ui-checkbox>
    <div class="italic text-gray-500 mb-4">
      {{ t("settings.client_log_explain") }}
    </div>
    <div class="mb-4 border-b min-w-full" />

    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="maps"
      :item-key="objKey"
      handle="[data-qa=map-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: map, index: mapIndex }">
        <div class="flex flex-col gap-0.5 pb-4">
          <div
            class="grid gap-0.5"
            style="grid-template-columns: auto 8rem 1fr auto"
          >
            <button
              class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
              data-qa="map-handle"
            >
              <i class="fas fa-grip-vertical text-gray-400" />
            </button>
            <input
              v-model="map.mapId"
              :placeholder="t(':map_id')"
              class="bg-gray-900 px-1"
              :class="{ 'border border-red-500': isDup(map) }"
            />
            <input
              v-model="map.name"
              :placeholder="t(':map_name')"
              class="bg-gray-900 px-1"
            />
            <button
              class="leading-none rounded-r bg-gray-700 w-6 h-6"
              @click="removeMap(mapIndex)"
            >
              <i class="fas fa-times text-gray-400" />
            </button>
          </div>

          <dnd-container
            tag="div"
            class="flex flex-col gap-y-0.5 pl-6"
            v-model="map.guides"
            :item-key="objKey"
            group="guides"
            handle="[data-qa=guide-handle]"
            :animation="200"
            :force-fallback="true"
          >
            <template #item="{ element: guide, index }">
              <div
                class="grid gap-0.5 pt-1 pb-1.5"
                style="grid-template-columns: auto repeat(3, minmax(0, 1fr)) auto"
              >
                <button
                  class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
                  style="grid-row: 1 / 3; grid-column: 1"
                  data-qa="guide-handle"
                >
                  <i class="fas fa-grip-vertical text-gray-400" />
                </button>
                <input
                  v-model="guide.text"
                  :placeholder="t(':guide_text')"
                  class="bg-gray-900 px-1 min-w-0"
                />
                <input
                  v-model="guide.attr"
                  :placeholder="t(':earn_attr')"
                  class="bg-gray-900 px-1 min-w-0"
                />
                <input
                  v-model="guide.item"
                  :placeholder="t(':item_drop')"
                  class="bg-gray-900 px-1 min-w-0"
                />
                <button
                  class="leading-none rounded-r bg-gray-700 w-6 h-6"
                  style="grid-row: 1 / 3; grid-column: 5"
                  @click="removeGuide(map, index)"
                >
                  <i class="fas fa-times text-gray-400" />
                </button>
                
                <label class="flex items-center px-1" title="optional">
                  <input class="mr-1" type="checkbox" v-model="guide.optional" /> {{ t(":optional") }}
                </label>
                <label class="flex items-center px-1" title="section">
                  <input class="mr-1" type="checkbox" v-model="guide.section" /> {{ t(":section") }}
                </label>
                
              </div>
            </template>
          </dnd-container>

          <button
            class="ml-6 bg-gray-700 rounded text-gray-400"
            @click="addGuide(map)"
          >
            {{ t(':add_guide') }}
          </button>
        </div>
      </template>
    </dnd-container>

    <button class="bg-gray-700 rounded text-gray-400 px-2" @click="addMap">
      {{ t(':add_map') }}
    </button>

  </div>
</template>
<script lang="ts">
import { defineComponent, computed } from "vue";
import DndContainer from "vuedraggable";
import { useI18nNs } from "@/web/i18n";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import { Host } from "@/web/background/IPC.js";
import { CampaignGuideWidget, Guide, Map }  from "./widget";

export default defineComponent({
  name: "campaign_guide.name",
  components: { UiCheckbox, DndContainer },
  props: configProp<CampaignGuideWidget>(),
  setup(props) {
    const { t } = useI18nNs("campaign_guide");

    const keys = new WeakMap<object, number>();
    let seq = 0;
    const objKey = (o: object) => {
      if (!keys.has(o)) keys.set(o, ++seq);
      return keys.get(o)!;
    };

    return {
      t,
      readClientLog: configModelValue(() => props.config, "readClientLog"),
      clientLog: configModelValue(() => props.config, "clientLog"),
      triggerReparseLog: () => {
        Host.sendEvent({
          name: "CLIENT->MAIN::re-parse-log",
          payload: undefined,
        });
      },

      maps: configModelValue(() => props.configWidget, "maps"),
      objKey,
      removeMap(index: number) {
        props.configWidget.maps.splice(index, 1);
      },
      addMap() {
        props.configWidget.maps.push({ mapId: "", name: "", guides: [] });
      },
      addGuide(map: Map) {
        map.guides.push({ optional: false, text: "" });
      },
      removeGuide(map: Map, index: number) {
        map.guides.splice(index, 1);
      },
      isDup(map: Map) {
        return !!map.mapId &&
          props.configWidget.maps.filter((_) => _.mapId === map.mapId).length > 1;
      },
    };
  },
});
</script>
