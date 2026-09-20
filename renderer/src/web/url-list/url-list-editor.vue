<template>
  <div class="p-2">
    <input
      class="bg-gray-900 rounded px-1 w-48 mb-2"
      :placeholder="t('widget.title')"
      v-model="title"
    />

    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="sections"
      item-key="id"
      handle="[data-qa=section-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: section, index: sectionIndex }">
        <div class="flex flex-col gap-0.5 pb-4">
          <div
            class="grid gap-0.5"
            style="grid-template-columns: auto 8rem 1fr auto"
          >
            <button
              class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
              data-qa="section-handle"
            >
              <i class="fas fa-grip-vertical text-gray-400" />
            </button>
            <select v-model="section.type" class="bg-gray-900 px-1">
              <option value="url">{{ t("url_list.type_url") }}</option>
              <option value="textbox">{{ t("url_list.type_textbox") }}</option>
              <option value="stash-search">
                {{ t("url_list.type_stash_search") }}
              </option>
            </select>
            <input
              v-model="section.name"
              :placeholder="t('url_list.section_name')"
              class="bg-gray-900 px-1"
            />
            <button
              class="leading-none rounded-r bg-gray-700 w-6 h-6"
              @click="removeSection(sectionIndex)"
            >
              <i class="fas fa-times text-gray-400" />
            </button>
          </div>

          <!-- indented under the section -->
          <dnd-container
            tag="div"
            class="flex flex-col gap-y-0.5 pl-6"
            v-model="section.entries"
            item-key="id"
            :group="`url-list-entries-${section.id}`"
            handle="[data-qa=entry-handle]"
            :animation="200"
            :force-fallback="true"
          >
            <template #item="{ element: entry, index }">
              <div
                class="grid gap-0.5 pt-1 pb-1.5"
                style="grid-template-columns: auto repeat(2, minmax(0, 1fr)) auto"
              >
                <button
                  class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
                  data-qa="entry-handle"
                >
                  <i class="fas fa-grip-vertical text-gray-400" />
                </button>
                <input
                  v-model="entry.text"
                  :placeholder="t('url_list.text')"
                  class="bg-gray-900 px-1 min-w-0"
                  :class="{ 'col-span-2': section.type === 'textbox' }"
                />
                <input
                  v-if="section.type !== 'textbox'"
                  v-model="entry.name"
                  :placeholder="t('url_list.friendly_name')"
                  class="bg-gray-900 px-1 min-w-0"
                />
                <button
                  class="leading-none rounded-r bg-gray-700 w-6 h-6"
                  @click="removeEntry(section, index)"
                >
                  <i class="fas fa-times text-gray-400" />
                </button>
              </div>
            </template>
          </dnd-container>

          <button
            class="ml-6 bg-gray-700 rounded text-gray-400"
            @click="addEntry(section)"
          >
            {{ t("url_list.add_entry") }}
          </button>
        </div>
      </template>
    </dnd-container>

    <button class="bg-gray-700 rounded text-gray-400 px-2" @click="addSection">
      {{ t("url_list.add_section") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import { configProp, configModelValue } from "../settings/utils.js";
import {
  nextId,
  type UrlListSection,
  type UrlListWidget,
} from "./widget.js";

export default defineComponent({
  name: "url_list.name",
  components: { DndContainer },
  props: configProp<UrlListWidget>(),
  setup(props) {
    const { t } = useI18n();

    return {
      t,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      sections: configModelValue(() => props.configWidget, "sections"),
      addSection() {
        props.configWidget.sections.push({
          id: nextId(props.configWidget.sections),
          name: "",
          type: "url",
          entries: [{ id: 1, name: "", text: "" }],
        });
      },
      removeSection(index: number) {
        props.configWidget.sections.splice(index, 1);
      },
      addEntry(section: UrlListSection) {
        section.entries.push({
          id: nextId(section.entries),
          name: "",
          text: "",
        });
      },
      removeEntry(section: UrlListSection, index: number) {
        section.entries.splice(index, 1);
      },
    };
  },
});
</script>
