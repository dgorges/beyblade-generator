<template>
  <PasswordGate v-if="!unlocked" :salt="salt" :hash="hash" @unlock="unlock" />
  <App v-else />
</template>

<script setup>
import { ref } from 'vue'
import App from './App.vue'
import PasswordGate from './components/PasswordGate.vue'

const KEY = 'beyblade-creator-unlocked'
const salt = import.meta.env.VITE_PASSWORD_SALT ?? ''
const hash = import.meta.env.VITE_PASSWORD_HASH ?? ''

function remembered() {
  try { return localStorage.getItem(KEY) === hash } catch { return false }
}

const unlocked = ref(!hash || remembered())

function unlock() {
  try { localStorage.setItem(KEY, hash) } catch {}
  unlocked.value = true
}
</script>
