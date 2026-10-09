import { ref, watch } from 'vue'

const KEY = 'beyblade-creator-theme'

function initial() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'dark' || saved === 'light') return saved === 'dark'
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

const dark = ref(initial())

watch(dark, value => {
  document.documentElement.dataset.theme = value ? 'dark' : 'light'
  try { localStorage.setItem(KEY, value ? 'dark' : 'light') } catch {}
}, { immediate: true })

export function useTheme() {
  return { dark, toggle: () => { dark.value = !dark.value } }
}
