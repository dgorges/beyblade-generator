<template>
  <span class="app-icon" aria-hidden="true" v-html="svg"></span>
</template>

<script setup>
import { computed } from 'vue'

const icons = import.meta.glob('../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })
const props = defineProps({ name: { type: String, required: true } })
const svg = computed(() => icons[`../assets/icons/${props.name}.svg`] ?? '')
</script>
