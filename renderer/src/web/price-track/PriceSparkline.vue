<template>
  <svg
    v-if="points"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="shrink-0"
    :class="up ? 'text-green-500' : 'text-red-500'"
    preserveAspectRatio="none"
  >
    <polyline
      :points="points"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
  <div v-else :style="{ width: `${width}px`, height: `${height}px` }" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";

export default defineComponent({
  name: "PriceSparkline",
  props: {
    data: {
      type: Array as PropType<Array<number | null>>,
      default: () => [],
    },
    change: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 64,
    },
    height: {
      type: Number,
      default: 18,
    },
  },
  setup(props) {
    const points = computed(() => {
      const values = props.data.filter(
        (v): v is number => typeof v === "number" && isFinite(v),
      );
      if (values.length < 2) return "";

      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;
      const pad = 1.5;
      const usableH = props.height - pad * 2;

      return values
        .map((v, i) => {
          const x = (i / (values.length - 1)) * props.width;
          const y = pad + (1 - (v - min) / span) * usableH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    });

    return {
      points,
      up: computed(() => props.change >= 0),
    };
  },
});
</script>
