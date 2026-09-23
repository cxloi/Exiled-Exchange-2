<template>
  <div class="max-w-md p-2">
    <input
      class="bg-gray-900 rounded px-1 w-48 mb-2"
      :placeholder="t('widget.title')"
      v-model="title"
    />

    <!-- base / target / modifier -->
    <div class="flex flex-col gap-y-1 mb-3">
      <div
        v-for="slot in LINK_SLOTS"
        :key="slot"
        class="grid gap-0.5 items-center"
        style="grid-template-columns: 5rem 1fr 1fr"
      >
        <span class="text-gray-500">{{ t(`crafting.${slot}`) }}</span>
        <input
          v-model="configWidget[slot].name"
          :placeholder="t('crafting.link_name')"
          class="bg-gray-900 rounded px-1 leading-6"
        />
        <input
          v-model.trim="configWidget[slot].url"
          :placeholder="t('crafting.link_url')"
          @change="configWidget[slot].url = toTradeId(configWidget[slot].url)"
          class="rounded px-1 leading-6"
        />
      </div>
    </div>

    <!-- steps -->
    <div class="text-gray-500 mb-1">{{ t("crafting.steps") }}</div>
    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="steps"
      item-key="id"
      handle="[data-qa=drag-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: step }">
        <div
          class="grid gap-0.5"
          style="grid-template-columns: auto 1fr 1fr auto"
        >
          <button
            class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
            data-qa="drag-handle"
          >
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          <input
            v-model="step.text"
            :placeholder="t('crafting.step_text')"
            class="bg-gray-900 px-1 col-span-2 leading-6"
          />
          <button
            class="leading-none rounded-r bg-gray-700 w-6 h-6"
            @click="removeStep(step.id)"
          >
            <i class="fas fa-times text-gray-400" />
          </button>
          <input
            v-model="step.btnText"
            :placeholder="t('crafting.step_btn_text')"
            class="bg-gray-900 px-1 col-start-2 leading-6 rounded"
          />
          <input
            v-model="step.search"
            :placeholder="t('crafting.step_search')"
            class="px-1 leading-6 rounded"
            :class="step.search.length > 50 ? 'bg-red-800' : 'bg-gray-900'"
          />
        </div>
      </template>
    </dnd-container>
    <button class="btn mt-2" style="min-width: 6rem" @click="addStep">
      {{ t("Add") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import { configProp, configModelValue } from "../settings/utils.js";
import { LINK_SLOTS, type CraftingWidget } from "./widget.js";
import { toTradeId } from "@/web/trade-url";

export default defineComponent({
  name: "crafting.name",
  components: { DndContainer },
  props: configProp<CraftingWidget>(),
  setup(props) {
    const { t } = useI18n();

    return {
      t,
      LINK_SLOTS,
      toTradeId,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      steps: configModelValue(() => props.configWidget, "steps"),
      removeStep(id: number) {
        props.configWidget.steps = props.configWidget.steps.filter(
          (_) => _.id !== id,
        );
      },
      addStep() {
        props.configWidget.steps.push({
          id: Math.max(0, ...props.configWidget.steps.map((_) => _.id)) + 1,
          text: "",
          btnText: "",
          search: "",
        });
      },
    };
  },
});
</script>
