<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :removable="true">
    <div
      class="p-1 flex flex-col gap-0.5 text-[#d9d6cf] [text-shadow:1px_1px_2px_#000]"
      style="width: 12rem"
    >
      <div class="flex justify-between items-center gap-1">
        <select
          v-model="activeBuildId"
          class="max-w-20 truncate rounded border mr-2 bg-transparent"
        >
          <option :value="null" disabled>{{ t(":select_build") }}</option>
          <option v-for="b in config.builds" :key="b.id" :value="b.id">
            {{ b.name || "#" + b.id }}
          </option>
        </select>
        <span class="shrink-0">{{ t(":level") }}</span>
        <input
          v-model.number="level"
          type="number"
          min="1"
          max="100"
          class="w-9 rounded border bg-transparent text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </div>

      <div v-if="stage" class="pl-1 truncate">
        {{ stage.levelStart }}–{{ stage.levelEnd }}: {{ stage.fileName }}
      </div>
      <template v-if="stage">
        <div v-if="stage.tech" class="pl-1 whitespace-pre-wrap break-words">
          {{ stage.tech }}
        </div>
      </template>
      <div v-else class="px-1 py-1">{{ t(":no_stage") }}</div>

      <div class="flex gap-1 justify-end">
        <div
          v-if="status"
          class="px-1 text-xs h-6 flex items-center"
          :class="error ? 'text-red-400' : 'text-green-400'"
        >
          {{ status }}
        </div>
        <button
          class="rounded bg-transparent px-1 h-6 flex items-center shrink-0"
          :disabled="!stage?.file || !config.targetDir || busy"
          @click="load"
        >
          <i class="fas fa-spinner w-4 text-sm" />
        </button>
        <button
          class="rounded bg-transparent px-1 h-6 flex items-center shrink-0"
          :disabled="!config.targetDir || busy"
          @click="reset"
        >
          <i class="fas fa-ban w-4 text-sm" />
        </button>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces.js";

export default {
  widget: {
    type: "build-planner",
    instances: "multi",
    trNameKey: "build_planner.name",
  } satisfies WidgetSpec,
};
</script>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import Widget from "../overlay/Widget.vue";
import type { WidgetManager } from "../overlay/interfaces.js";
import { useI18nNs } from "@/web/i18n";
import { useClientLog } from "../client-log/client-log.js";
import { BuildPlannerWidget, loadBuild, resetBuilds } from "./widget.js";

const props = defineProps<{ config: BuildPlannerWidget }>();
const wm = inject<WidgetManager>("wm")!;
const { t } = useI18nNs("build_planner");
const { playerLevel, setPlayerLevel } = useClientLog();

// editable level (shared with other level-based widgets; next level-up from the log overrides it)
const level = computed({
  get: () => playerLevel.value,
  set: (v: number | "") => {
    if (v === "" || !Number.isFinite(v)) return;
    setPlayerLevel(Math.min(100, Math.max(1, Math.round(v))));
  },
});

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = [];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.wmTitle = "";
  props.config.targetDir = "";
  props.config.autoLoad = false;
  props.config.activeBuildId = null;
  props.config.builds = [];
  wm.show(props.config.wmId);
}

const activeBuildId = computed({
  get: () => props.config.activeBuildId,
  set: (v) => {
    props.config.activeBuildId = v;
  },
});

const build = computed(() =>
  props.config.builds.find((b) => b.id === props.config.activeBuildId)
);

const stage = computed(() =>
  build.value?.stages.find(
    (s) => playerLevel.value >= s.levelStart && playerLevel.value <= s.levelEnd
  )
);

const busy = ref(false);
const status = ref("");
const error = ref(false);

async function run(fn: () => Promise<unknown>, okMsg: string) {
  busy.value = true;
  try {
    await fn();
    error.value = false;
    status.value = okMsg;
  } catch (e) {
    error.value = true;
    status.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

const load = () =>
  run(() => loadBuild(props.config.targetDir, stage.value!), t(":loaded"));

// auto load when the matching stage changes (level up / build switch)
watch(
  () => stage.value?.file,
  (file, prev) => {
    if (props.config.autoLoad && file && file !== prev && props.config.targetDir) {
      load();
    }
  }
);

const reset = () => run(() => resetBuilds(props.config.targetDir), t(":cleared"));
</script>
