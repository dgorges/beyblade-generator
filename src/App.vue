<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">BX</div>
        <div><h1>Beyblade Creator</h1><span>Parametric design studio</span></div>
      </div>
      <div class="top-actions">
        <button class="ghost-button" @click="randomize">🎲 Zufall</button>
        <button class="theme-button" @click="dark = !dark" :aria-label="dark ? 'Lightmode' : 'Darkmode'">{{ dark ? '☀️' : '🌙' }}</button>
      </div>
    </header>

    <main class="workspace">
      <section class="preview-card">
        <div class="preview-header">
          <div>
            <span class="eyebrow">3D PREVIEW · {{ stepLabels[step - 1] }}</span>
            <h2>{{ bey.name }}</h2>
          </div>
          <div class="preview-tools">
            <label class="toggle"><input v-model="exploded" type="checkbox"><span></span> Explodiert</label>
          </div>
        </div>

        <BeybladeViewer :bey="bey" :dark="dark" :exploded="exploded" />

        <div class="stats">
          <div><span>⚔️ Angriff</span><strong>{{ stats.attack }}</strong></div>
          <div><span>🛡️ Verteidigung</span><strong>{{ stats.defense }}</strong></div>
          <div><span>🌀 Ausdauer</span><strong>{{ stats.stamina }}</strong></div>
          <div><span>⚖️ Balance</span><strong>{{ stats.balance }}</strong></div>
        </div>
      </section>

      <aside class="controls">
        <div class="section-heading">
          <span class="eyebrow">BUILD YOUR BEY</span>
          <h2>Komponenten</h2>
        </div>

        <nav class="stepper" aria-label="Beyblade Komponenten">
          <button v-for="(label, index) in stepLabels" :key="label" :class="{ active: step === index + 1, done: step > index + 1 }" @click="step = index + 1">
            <span>{{ index + 1 }}</span><strong>{{ label }}</strong>
          </button>
        </nav>

        <ParameterPanel :bey="bey" :step="step" />

        <div class="wizard-actions">
          <button class="secondary" :disabled="step === 1" @click="step--">← Zurück</button>
          <button v-if="step < 4" class="primary" @click="step++">Weiter →</button>
          <button v-else class="primary" @click="exportAll">STL exportieren</button>
        </div>

        <div class="project-actions">
          <button class="secondary" @click="downloadProject">💾 JSON speichern</button>
          <label class="secondary file-button">📂 JSON laden<input type="file" accept=".json,application/json" @change="importProject"></label>
        </div>

        <p class="prototype-note"><strong>Hinweis:</strong> v0.2 bildet jetzt die komplette 3-teilige Architektur ab. Die dargestellten Anschlusszonen sind noch Referenzgeometrie und keine garantierte Originalmaß-Nachbildung.</p>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BeybladeViewer from './components/BeybladeViewer.vue'
import ParameterPanel from './components/ParameterPanel.vue'
import { createDefaultBey, cloneBey } from './models/BeyParameters.js'
import { downloadJson, readJsonFile, saveLocal, loadLocal } from './utils/projectFile.js'
import { exportPartStl } from './utils/stl.js'

const saved = loadLocal()
const bey = ref(saved ? normalizeProject(saved) : createDefaultBey())
const dark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
const step = ref(bey.value.activeStep || 1)
const exploded = ref(false)
const stepLabels = ['BLADE', 'RATCHET', 'BIT', 'PREVIEW']

const stats = computed(() => {
  const p = bey.value.blade
  const bit = bey.value.bit
  return {
    attack: clamp(Math.round(35 + p.wingLength * 3 + p.wingAngle * 0.35), 1, 99),
    stamina: clamp(Math.round(93 - p.wingLength * 2.2 - p.wingAngle * 0.2 + bit.tipRadius * 0.7), 1, 99),
    defense: clamp(Math.round(32 + p.outerWeight * 42 + p.wingWidth * 2), 1, 99),
    balance: clamp(Math.round(100 - Math.abs(0.5 - p.outerWeight) * 80 - Math.abs(p.bladeCount - 6) * 5), 1, 99)
  }
})

watch(bey, value => { value.activeStep = step.value; saveLocal(value) }, { deep: true })
watch(step, value => { bey.value.activeStep = value })
watch(dark, value => { document.documentElement.dataset.theme = value ? 'dark' : 'light' }, { immediate: true })

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function normalizeProject(value) {
  const base = createDefaultBey()
  return {
    ...base,
    ...value,
    blade: { ...base.blade, ...(value.blade || value.parameters || {}) },
    ratchet: { ...base.ratchet, ...(value.ratchet || {}) },
    bit: { ...base.bit, ...(value.bit || {}) }
  }
}

function randomize() {
  const names = ['Dragon Fury', 'Shadow Nova', 'Storm Fang', 'Iron Phoenix', 'Cosmic Bite', 'Thunder Claw']
  bey.value.name = names[Math.floor(Math.random() * names.length)]
  bey.value.type = ['attack', 'defense', 'stamina', 'balance'][Math.floor(Math.random() * 4)]
  bey.value.blade.bladeCount = 3 + Math.floor(Math.random() * 8)
  bey.value.blade.wingLength = Number((3 + Math.random() * 9).toFixed(1))
  bey.value.blade.wingWidth = Number((2 + Math.random() * 7).toFixed(1))
  bey.value.blade.wingAngle = Math.floor(Math.random() * 61)
  bey.value.blade.outerWeight = Number(Math.random().toFixed(2))
  bey.value.bit.tipType = ['point', 'needle', 'flat', 'ball'][Math.floor(Math.random() * 4)]
  step.value = 1
}

function downloadProject() { downloadJson(bey.value) }

async function importProject(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    bey.value = normalizeProject(await readJsonFile(file))
    step.value = bey.value.activeStep || 1
  } catch (error) {
    alert(error.message || 'Die Projektdatei konnte nicht geladen werden.')
  } finally { event.target.value = '' }
}

function exportAll() {
  exportPartStl(bey.value, 'blade')
  setTimeout(() => exportPartStl(bey.value, 'bit'), 250)
}

onMounted(() => { document.documentElement.dataset.theme = dark.value ? 'dark' : 'light' })
</script>
