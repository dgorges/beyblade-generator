<template>
  <div class="b_range">
    <div class="b_range__head">
      <label class="b_range__label" :for="id">{{ label }}</label>
      <output class="b_range__value" :for="id">{{ display ? display(modelValue) : `${modelValue}${suffix}` }}</output>
    </div>
    <input :id="id" class="b_range__input" type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit('update:modelValue', Number($event.target.value))" />
  </div>
</template>

<script setup>
import { useId } from 'vue'

const id = useId()
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
