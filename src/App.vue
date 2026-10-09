<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">BX</div>
        <div><h1>Beyblade Creator</h1><span>Kit: {{ kit.name }}</span></div>
      </div>
      <div class="top-actions">
        <button class="ghost-button" type="button" @click="resetBey">✨ Neu</button>
        <button class="ghost-button" type="button" @click="randomize">🎲 Zufall</button>
        <button class="theme-button" type="button" @click="dark = !dark" :aria-label="dark ? 'Lightmode' : 'Darkmode'">{{ dark ? '☀️' : '🌙' }}</button>
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
            <label class="toggle"><input v-model="exploded" type="checkbox"><span></span> Explosionsansicht</label>
          </div>
        </div>

        <div v-if="notice" class="kit-notice" role="status">{{ notice }} <button type="button" @click="notice = ''">✕</button></div>
        <div v-if="error" class="viewer-error">
          <strong>Kit-Dateien nicht gefunden</strong>
          <span>{{ error }}</span>
        </div>
        <BeybladeViewer v-else :key="kit.id" :kit="kit" :heights="heights" :locked="locked" :design="design" :type="bey.type" :dark="dark" :exploded="exploded" :busy="busy" :visibility="visibility" :selected="selected" @visibility="visibility = $event" @select="selectPart" />

        <div class="stats">
          <div><span>⚖️ Gewicht</span><strong>{{ stats.weight.toFixed(1) }} g</strong></div>
          <div><span>⌀ Durchmesser</span><strong>{{ stats.diameter.toFixed(1) }} mm</strong></div>
          <div><span>↕ Höhe</span><strong>{{ stats.height.toFixed(1) }} mm</strong></div>
          <div><span>⚔️ / 🛡️ / 🌀</span><strong>{{ rating.attack }} / {{ rating.defense }} / {{ rating.stamina }}</strong></div>
        </div>
      </section>

      <aside class="controls">
        <div class="section-heading">
          <span class="eyebrow">BUILD YOUR BEY</span>
          <h2>Komponenten</h2>
        </div>

        <nav class="stepper" aria-label="Beyblade Komponenten">
          <button v-for="(label, index) in stepLabels" :key="label" type="button" :class="{ active: step === index + 1, done: step > index + 1 }" @click="step = index + 1">
            <span>{{ index + 1 }}</span><strong>{{ label }}</strong>
          </button>
        </nav>

        <ParameterPanel v-model:blade-tab="bladeTab" :bey="bey" :kits="kitList" @kit="switchKit" :step="step" :kit="kit" :stats="stats" :warnings="warnings" :selected="selected" />

        <div class="wizard-actions">
          <button class="secondary" type="button" :disabled="step === 1" @click="step--">← Zurück</button>
          <button v-if="step < 4" class="primary" type="button" @click="step++">Weiter →</button>
          <button v-else class="primary" type="button" :disabled="!design || busy" @click="exportAll">⬇ STL-Paket (ZIP)</button>
        </div>

        <div class="project-actions">
          <button class="secondary" type="button" @click="downloadJson(bey)">💾 Projekt speichern</button>
          <label class="secondary file-button">📂 Projekt laden<input type="file" accept=".json,application/json" @change="importProject"></label>
        </div>

        <p class="prototype-note"><strong>Hinweis:</strong> Grundlage ist das Modell „{{ kit.name }}“. Die 🔒 Schnittstellenteile werden unverändert übernommen. Die Werte zu Angriff, Verteidigung und Ausdauer sind nur grobe Schätzungen aus der Geometrie. Gedruckte Kreisel drehen sehr schnell und können brechen: nur unter Aufsicht spielen.</p>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import BeybladeViewer from './components/BeybladeViewer.vue'
import ParameterPanel from './components/ParameterPanel.vue'
import { createDefaultBey, normalizeProject, presetFor, PRESETS, BIT_SHAPES } from './models/BeyParameters.js'
import { downloadJson, readJsonFile, saveLocal, loadLocal } from './utils/projectFile.js'
import { exportZip } from './utils/stl.js'
import { loadKit, buildBey } from './geometry/client.js'
import { DENSITY } from './geometry/engine.js'
import { kits, DEFAULT_KIT } from './kits/index.js'

const bey = ref(normalizeProject(loadLocal() ?? createDefaultBey()))
const kit = computed(() => kits[bey.value.kit] ?? kits[DEFAULT_KIT])
const kitList = Object.values(kits).filter(k => k.bundled || import.meta.env.DEV)
const notice = ref('')
const dark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
const step = ref(bey.value.activeStep || 1)
const exploded = ref(false)
const visibility = ref({})
const selected = ref('')
const bladeTab = ref('metal')
const stepLabels = ['BLADE', 'KIT', 'BIT', 'FERTIG']

const locked = shallowRef(null)
const heights = shallowRef(null)
const design = shallowRef(null)
const volumes = shallowRef({})
const warnings = shallowRef([])
const busy = ref(false)
const error = ref('')

const stats = computed(() => {
  const density = DENSITY[bey.value.print.material] ?? DENSITY.PLA
  const total = Object.values(volumes.value).reduce((a, b) => a + b, 0)
  let radius = 0
  for (const id of kit.value.parts.filter(p => p.role === 'metal' || p.role === 'base').map(p => p.id)) {
    const p = design.value?.[id]?.positions
    if (!p) continue
    for (let i = 0; i < p.length; i += 3) radius = Math.max(radius, Math.hypot(p[i], p[i + 1]))
  }
  let top = -Infinity
  let bottom = Infinity
  if (heights.value) {
    for (const part of kit.value.parts) {
      const refH = heights.value[part.id]
      let h = refH
      const p = design.value?.[part.id]?.positions
      if (p) { h = 0; for (let i = 2; i < p.length; i += 3) h = Math.max(h, p[i]) }
      const z0 = part.flip ? part.z + refH - h : part.z
      top = Math.max(top, z0 + h)
      bottom = Math.min(bottom, z0)
    }
  }
  return { weight: (total / 1000) * density, diameter: radius * 2, height: Number.isFinite(top) ? top - bottom : 0 }
})

const rating = computed(() => {
  const m = bey.value.metal
  const b = bey.value.bit
  const clamp = v => Math.max(1, Math.min(10, Math.round(v)))
  const sharp = { needle: 0, point: 1, ball: 2, rush: 4, flat: 5 }[b.shape] ?? 2
  return {
    attack: clamp(2 + m.wingLength * 0.8 + Math.max(0, m.sweep) * 2 + m.wallHeight * 0.4 + sharp * 0.6),
    defense: clamp(3 + (m.diameter - kit.value.limits.metalDiameter[0]) * 0.35 + m.wingWidth * 3 - m.wingLength * 0.3),
    stamina: clamp(9 - sharp * 1.2 - m.wingLength * 0.5 + (m.diameter - kit.value.limits.metalDiameter[0]) * 0.2 - bey.value.holes.length * 0.3)
  }
})

let timer = 0
function scheduleBuild() {
  clearTimeout(timer)
  timer = setTimeout(runBuild, 120)
}

async function runBuild() {
  if (!locked.value) return
  busy.value = true
  try {
    const result = await buildBey(bey.value)
    if (!result) return
    design.value = result.parts
    volumes.value = result.volumes
    warnings.value = result.warnings
  } catch (e) {
    warnings.value = [{ level: 'error', text: e.message }]
  } finally {
    busy.value = false
  }
}

watch(bey, value => {
  value.activeStep = step.value
  saveLocal(value)
  scheduleBuild()
}, { deep: true })
watch(step, value => { bey.value.activeStep = value })
watch(dark, value => { document.documentElement.dataset.theme = value ? 'dark' : 'light' }, { immediate: true })

const roleId = role => kit.value.parts.find(p => p.role === role)?.id ?? ''

function selectPart(part) {
  if (part.role === 'metal') { step.value = 1; bladeTab.value = 'metal' }
  else if (part.role === 'base') { step.value = 1; bladeTab.value = 'base' }
  else if (part.role === 'bit') step.value = 3
  else step.value = 2
  selected.value = part.id
}

function resetBey() {
  if (!confirm('Neues, schlichtes Beyblade beginnen? Das aktuelle Design wird ersetzt.')) return
  bey.value = createDefaultBey(kit.value.id)
  step.value = 1
  bladeTab.value = 'metal'
}

function switchKit(id) {
  if (id === bey.value.kit) return
  if (!confirm(`Zum Kit „${kits[id].name}“ wechseln? Ring, Basis und Bit werden auf die Startwerte dieses Kits zurückgesetzt.`)) return
  bey.value = { ...createDefaultBey(id), name: bey.value.name, rotation: bey.value.rotation, activeStep: 2 }
}

watch([step, bladeTab], ([s, tab]) => {
  const current = kit.value.parts.find(p => p.id === selected.value)
  if (s === 1) selected.value = tab === 'base' ? roleId('base') : tab === 'metal' ? roleId('metal') : ''
  else if (s === 2) selected.value = current?.role === 'locked' ? current.id : ''
  else if (s === 3) selected.value = roleId('bit')
  else selected.value = ''
})

function pick(list) { return list[Math.floor(Math.random() * list.length)] }
function rnd(min, max, digits = 1) { return Number((min + Math.random() * (max - min)).toFixed(digits)) }

function randomize() {
  const type = pick(Object.keys(PRESETS))
  bey.value.name = pick(['Dragon Fury', 'Shadow Nova', 'Storm Fang', 'Iron Phoenix', 'Cosmic Bite', 'Thunder Claw', 'Forest Titan'])
  bey.value.type = type
  const preset = presetFor(type, kit.value)
  const [wallMin, wallMax] = kit.value.limits.wallHeight
  bey.value.metal = { ...preset.metal, wings: Math.round(rnd(2, 9, 0)), wingLength: rnd(0.5, 5.5), wingWidth: rnd(0.2, 0.8, 2), sweep: rnd(-0.6, 0.9, 2), wallHeight: rnd(wallMin, wallMax) }
  bey.value.base = { ...preset.base, spikes: Math.round(rnd(4, 12, 0)), spikeHeight: rnd(1, 6), spikeLength: rnd(0, 3) }
  bey.value.bit.shape = pick(BIT_SHAPES).id
  step.value = 1
}

async function importProject(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    bey.value = normalizeProject(await readJsonFile(file))
    step.value = bey.value.activeStep || 1
  } catch (e) {
    alert(e.message || 'Die Projektdatei konnte nicht geladen werden.')
  } finally { event.target.value = '' }
}

function exportAll() {
  exportZip({ bey: bey.value, kit: kit.value, locked: locked.value, design: design.value, heights: heights.value })
}

async function activateKit(id) {
  error.value = ''
  locked.value = null
  heights.value = null
  design.value = null
  volumes.value = {}
  visibility.value = {}
  try {
    const result = await loadKit(id)
    if (id !== kit.value.id) return
    heights.value = result.heights
    locked.value = result.parts
    await runBuild()
  } catch (e) {
    if (id !== DEFAULT_KIT) {
      notice.value = `Das Kit „${kits[id].name}“ ist hier nicht verfügbar. Es wurde zu „${kits[DEFAULT_KIT].name}“ gewechselt.`
      bey.value = { ...createDefaultBey(DEFAULT_KIT), name: bey.value.name, rotation: bey.value.rotation }
    } else {
      error.value = e.message
    }
  }
}

watch(() => bey.value.kit, id => activateKit(id))
onMounted(() => activateKit(kit.value.id))
</script>
