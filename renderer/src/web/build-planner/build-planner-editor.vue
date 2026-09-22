<template>
  <div class="p-2">
    <div class="mb-2">{{ t(":enable_read_client_logs") }}</div>
    <ui-checkbox class="mb-4" v-model="autoLoad">{{ t(":auto_load") }}</ui-checkbox>

    <div class="mb-4">
      <div class="mb-1">{{ t(":target_dir") }}</div>
      <input
        v-model.trim="targetDir"
        class="rounded bg-gray-900 px-1 block w-full font-sans"
        placeholder="...\Documents\My Games\Path of Exile 2\BuildPlanner"
      />
    </div>
    
    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="builds"
      item-key="id"
      handle="[data-qa=build-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: build, index: bi }">
        <div class="flex flex-col gap-0.5 pb-4">
          <div class="flex gap-0.5">
            <button
              class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
              data-qa="build-handle"
            >
              <i class="fas fa-grip-vertical text-gray-400" />
            </button>
            <input
              v-model="build.name"
              :placeholder="t(':build_name')"
              class="bg-gray-900 px-1 flex-1"
            />
            <button
              class="bg-gray-700 rounded-r w-6 h-6"
              @click="removeBuild(bi)"
            >
              <i class="fas fa-times text-gray-400" />
            </button>
          </div>

          <dnd-container
            tag="div"
            class="flex flex-col gap-y-0.5 pl-6"
            v-model="build.stages"
            item-key="id"
            :group="'stages-' + build.id"
            handle="[data-qa=stage-handle]"
            :animation="200"
            :force-fallback="true"
          >
            <template #item="{ element: stage, index: si }">
              <div class="flex flex-col gap-0.5">
                <div
                  class="grid gap-0.5 items-center"
                  style="grid-template-columns: auto 3.5rem 3.5rem 1fr auto"
                >
                  <button
                    class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
                    data-qa="stage-handle"
                  >
                    <i class="fas fa-grip-vertical text-gray-400" />
                  </button>
                  <input
                    v-model.number="stage.levelStart"
                    type="number"
                    min="1"
                    max="100"
                    :placeholder="t(':level_start')"
                    class="bg-gray-900 px-1"
                  />
                  <input
                    v-model.number="stage.levelEnd"
                    type="number"
                    min="1"
                    max="100"
                    :placeholder="t(':level_end')"
                    class="bg-gray-900 px-1"
                  />
                  <label
                    class="bg-gray-900 px-1 truncate cursor-pointer"
                    :class="{ 'text-gray-500': !stage.file }"
                  >
                    {{ stage.file ? stage.fileName : t(":choose_build_file") }}
                    <input
                      type="file"
                      accept=".build"
                      class="hidden"
                      @change="onFile(stage, $event)"
                    />
                  </label>
                  <button
                    class="bg-gray-700 rounded-r w-6 h-6"
                    @click="removeStage(build, si)"
                  >
                    <i class="fas fa-times text-gray-400" />
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-0.5 pl-6">
                  <textarea
                    v-model="stage.tech"
                    :placeholder="t(':tech')"
                    rows="2"
                    class="bg-gray-900 px-1 col-span-2 resize-y"
                  />
                </div>
              </div>
            </template>
          </dnd-container>
          <button
            class="ml-6 bg-gray-700 rounded text-gray-400"
            @click="addStage(build)"
          >
            {{ t(":add_stage") }}
          </button>
        </div>
      </template>
    </dnd-container>

    <button class="bg-gray-700 rounded text-gray-400 px-2" @click="addBuild">
      {{ t(":add_build") }}
    </button>
    <div v-if="error" class="text-red-400">{{ error }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import DndContainer from "vuedraggable";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { useI18nNs } from "@/web/i18n";
import { configModelValue, configProp } from "../settings/utils.js";
import {
  BuildEntry,
  BuildPlannerWidget,
  BuildStage,
  nextId,
  uploadBuild,
  deleteStoredBuild,
} from "./widget.js";

export default defineComponent({
  name: "build_planner.name",
  components: { DndContainer, UiCheckbox },
  props: configProp<BuildPlannerWidget>(),
  setup(props) {
    const { t } = useI18nNs("build_planner");
    const error = ref("");

    return {
      t,
      error,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      targetDir: configModelValue(() => props.configWidget, "targetDir"),
      autoLoad: configModelValue(() => props.configWidget, "autoLoad"),
      builds: configModelValue(() => props.configWidget, "builds"),
      addBuild() {
        const builds = props.configWidget.builds;
        builds.push({ id: nextId(builds), name: "", stages: [] });
      },
      removeBuild(index: number) {
        const [b] = props.configWidget.builds.splice(index, 1);
        b.stages.forEach((s) => s.file && deleteStoredBuild(s.file));
        if (props.configWidget.activeBuildId === b.id) {
          props.configWidget.activeBuildId = null;
        }
      },
      addStage(build: BuildEntry) {
        const last = build.stages[build.stages.length - 1];
        const start = last ? Math.min(100, last.levelEnd + 1) : 1;
        build.stages.push({
          id: nextId(build.stages),
          levelStart: start,
          levelEnd: 100,
          file: null,
          fileName: "",
          tech: "",
        });
      },
      removeStage(build: BuildEntry, index: number) {
        const [s] = build.stages.splice(index, 1);
        if (s.file) deleteStoredBuild(s.file);
      },
      async onFile(stage: BuildStage, e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        try {
          const name = await uploadBuild(file);
          if (stage.file) deleteStoredBuild(stage.file);
          stage.file = name;
          stage.fileName = file.name;
          error.value = "";
        } catch (err) {
          error.value = (err as Error).message;
        }
      },
    };
  },
});
</script>
