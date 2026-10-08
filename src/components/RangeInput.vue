<template>
  <div class="range-field">
    <div class="range-label">
      <label>{{ label }}</label>
      <output>{{ display ? display(modelValue) : `${modelValue}${suffix}` }}</output>
    </div>
    <input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit('update:modelValue', Number($event.target.value))" />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  label: { type: String, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  suffix: { type: String, default: '' },
  display: { type: Function, default: null }
})

defineEmits(['update:modelValue'])
</script>
