<template>
  <main class="b_gate">
    <button class="b_button b_button--icon b_gate__theme" type="button" :aria-label="dark ? 'Lightmode' : 'Darkmode'" :title="dark ? 'Lightmode' : 'Darkmode'" @click="toggle"><AppIcon :name="dark ? 'lightmode' : 'darkmode'" /></button>
    <form class="b_card b_gate__card" aria-labelledby="gate-title" @submit.prevent="submit">
      <div class="b_logo" aria-hidden="true">BX</div>
      <h1 id="gate-title" class="b_gate__title">Beyblade Creator</h1>
      <label class="b_field__label" for="gate-password">Passwort</label>
      <input id="gate-password" v-model="password" class="b_field__input bJS_gate-password" type="password" autocomplete="current-password" autofocus :aria-invalid="!!error" :aria-describedby="error ? 'gate-error' : undefined" />
      <p v-if="error" id="gate-error" class="b_gate__error" role="alert">{{ error }}</p>
      <button class="b_button b_button--primary" type="submit" :disabled="busy || !password">{{ busy ? 'Prüfe …' : 'Öffnen' }}</button>
    </form>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({ salt: { type: String, required: true }, hash: { type: String, required: true } })
const emit = defineEmits(['unlock'])
const { dark, toggle } = useTheme()
const password = ref('')
const error = ref('')
const busy = ref(false)

async function derive(value) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(value), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(props.salt), iterations: 250000, hash: 'SHA-256' }, key, 256)
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function submit() {
  busy.value = true
  error.value = ''
  try {
    if (await derive(password.value) === props.hash) emit('unlock')
    else error.value = 'Das Passwort stimmt nicht.'
  } finally {
    busy.value = false
  }
}
</script>
