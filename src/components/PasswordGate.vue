<template>
  <div class="gate">
    <form class="gate-card" @submit.prevent="submit">
      <div class="brand-mark">BX</div>
      <h1>Beyblade Creator</h1>
      <label for="gate-password">Passwort</label>
      <input id="gate-password" v-model="password" type="password" autocomplete="current-password" autofocus />
      <p v-if="error" class="gate-error" role="alert">{{ error }}</p>
      <button class="primary" type="submit" :disabled="busy || !password">{{ busy ? 'Prüfe …' : 'Öffnen' }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ salt: { type: String, required: true }, hash: { type: String, required: true } })
const emit = defineEmits(['unlock'])
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
