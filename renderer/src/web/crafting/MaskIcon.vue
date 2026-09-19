<template>
  <div :style="style" />
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ src: { type: String, required: true } })
const url = computed(() => `url("${props.src.replace(/\s+/g, '')}")`)
const style = computed(() => ({
  WebkitMaskImage: url.value,
  maskImage: url.value,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  backgroundColor: 'currentColor',
  display: 'block',
}))
</script>