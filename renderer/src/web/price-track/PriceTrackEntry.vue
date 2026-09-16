<template>
  <div class="grid grid-cols-[2fr_1fr] gap-x-2">
    <select class="w-full min-w-0 truncate" v-model="model">
      <option v-for="o in filtered" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <input class="w-full min-w-0" v-model="search" :placeholder="t('price_track.search')" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import { useI18n } from "vue-i18n";

export interface DropdownEntry {
  label: string;
  value: string;
}

export default defineComponent({
  name: "PriceTrackEntry",
  props: {
    modelValue: { type: String, required: true },
    options: { type: Array as PropType<DropdownEntry[]>, required: true },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const { t } = useI18n();
    const search = ref("");

    const model = computed({
      get: () => props.modelValue,
      set: (v: string) => emit("update:modelValue", v),
    });

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return props.options;
      return props.options.filter(
        (o) =>
          o.value === props.modelValue || // keep current selection visible
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q),
      );
    });

    return { t, search, model, filtered };
  },
});
</script>