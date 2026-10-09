<template>
  <div class="b_app" :class="{ 'b_app--panel-closed': !panelOpen }">
    <header class="b_topbar">
      <div class="b_topbar__brand">
        <div class="b_logo" aria-hidden="true">BX</div>
        <div>
          <h1 class="b_topbar__title">Beyblade Creator</h1>
          <span class="b_topbar__subtitle">Kit: {{ kit.name }}</span>
        </div>
      </div>
      <div class="b_topbar__actions">
        <button class="b_button b_button--ghost b_topbar__action b_topbar__action--optional" type="button" @click="resetBey"><AppIcon name="circle-add" /> Neu</button>
        <button class="b_button b_button--ghost" type="button" :disabled="!design" @click="openShare"><AppIcon name="share" /> Teilen</button>
        <button class="b_button b_button--ghost b_topbar__action b_topbar__action--optional" type="button" @click="randomize"><AppIcon name="shuffle" /> Zufall</button>
        <button class="b_button b_button--icon" type="button" @click="dark = !dark" :aria-label="dark ? 'Lightmode' : 'Darkmode'" :title="dark ? 'Lightmode' : 'Darkmode'"><AppIcon :name="dark ? 'lightmode' : 'darkmode'" /></button>
      </div>
    </header>

    <main class="b_app__workspace">
      <section class="b_card b_preview" aria-labelledby="preview-title">
        <div class="b_preview__header">
          <div>
            <span class="b_eyebrow">3D PREVIEW · {{ stepLabels[step - 1] }}</span>
            <h2 id="preview-title" class="b_card__title">{{ bey.name }}</h2>
          </div>
        </div>

        <div v-if="notice" class="b_notice" role="status">
          {{ notice }}
          <button class="b_button b_button--plain" type="button" aria-label="Hinweis schließen" @click="notice = ''"><AppIcon name="close-x" /></button>
        </div>
        <div v-if="error" class="b_viewer__error" role="alert">
          <strong class="b_viewer__error-title">Kit-Dateien nicht gefunden</strong>
          <span>{{ error }}</span>
        </div>
        <BeybladeViewer v-else ref="viewer" :key="kit.id" :kit="kit" :heights="heights" :locked="locked" :design="design" :type="bey.type" :dark="dark" v-model:exploded="exploded" :busy="busy" :visibility="visibility" :selected="selected" :panel-open="panelOpen" @visibility="visibility = $event" @select="selectPart" />

        <div class="b_stats" :class="{ 'b_stats--open': statsOpen }">
          <button type="button" class="b_stats__toggle" :aria-expanded="statsOpen" aria-controls="stats-values" @click="statsOpen = !statsOpen">
            <span class="b_stats__toggle-label"><AppIcon name="star" /> Werte</span>
            <span v-if="!statsOpen" class="b_stats__summary">{{ stats.weight.toFixed(1) }} g · {{ stats.diameter.toFixed(1) }} mm · {{ rating.attack }} / {{ rating.defense }} / {{ rating.stamina }}</span>
            <AppIcon :name="statsOpen ? 'chevron-up' : 'chevron-down'" class="b_stats__chevron" />
          </button>
          <div id="stats-values" class="b_stats__grid">
          <div class="b_stats__item"><span class="b_stats__label"><AppIcon name="tag" /> Gewicht</span><strong class="b_stats__value">{{ stats.weight.toFixed(1) }} g</strong></div>
          <div class="b_stats__item"><span class="b_stats__label"><AppIcon name="grid-aspect-ratio" /> Durchmesser</span><strong class="b_stats__value">{{ stats.diameter.toFixed(1) }} mm</strong></div>
          <div class="b_stats__item"><span class="b_stats__label"><AppIcon name="sort" /> Höhe</span><strong class="b_stats__value">{{ stats.height.toFixed(1) }} mm</strong></div>
          <div class="b_stats__item" title="Angriff / Verteidigung / Ausdauer"><span class="b_stats__label"><AppIcon name="star" /> Werte A / V / Au</span><strong class="b_stats__value">{{ rating.attack }} / {{ rating.defense }} / {{ rating.stamina }}</strong></div>
          </div>
        </div>
      </section>

      <button v-if="!panelOpen" type="button" class="b_button b_button--primary b_app__panel-open" aria-controls="controls-panel" :aria-expanded="panelOpen" @click="panelOpen = true"><AppIcon name="edit" /> Bearbeiten</button>

      <aside id="controls-panel" class="b_card b_controls" :class="{ 'b_controls--closed': !panelOpen }" aria-labelledby="controls-title">
        <div class="b_controls__heading">
          <div>
            <span class="b_eyebrow">BUILD YOUR BEY</span>
            <h2 id="controls-title" class="b_card__title">Komponenten</h2>
          </div>
          <button type="button" class="b_button b_button--plain b_controls__close" aria-controls="controls-panel" :aria-expanded="panelOpen" aria-label="Bearbeitungspanel ausblenden" title="Panel ausblenden" @click="panelOpen = false"><AppIcon name="chevron-right" /></button>
        </div>

        <div v-if="focus" class="b_focus-bar">
          <span class="b_focus-bar__label"><AppIcon name="search" /> Fokus: <strong>{{ focusPart.label }}</strong></span>
          <button type="button" class="b_button b_button--small" @click="visibility = {}">Alle Teile zeigen</button>
        </div>
        <nav v-else class="b_stepper" aria-label="Schritte">
          <button v-for="(label, index) in stepLabels" :key="label" type="button" class="b_stepper__step" :class="{ 'b_stepper__step--active': step === index + 1, 'b_stepper__step--done': step > index + 1 }" :aria-current="step === index + 1 ? 'step' : undefined" @click="step = index + 1">
            <span class="b_stepper__number">{{ index + 1 }}</span><strong class="b_stepper__label">{{ label }}</strong>
          </button>
        </nav>

        <ParameterPanel v-model:blade-tab="bladeTab" :bey="bey" :kits="kitList" :locked-hint="lockedHint" :focus="focus" @kit="switchKit" :step="step" :kit="kit" :stats="stats" :warnings="warnings" :selected="selected" />

        <div v-if="!focus" class="b_controls__actions">
          <button class="b_button" type="button" :disabled="step === 1" @click="step--"><AppIcon name="chevron-left" /> Zurück</button>
          <button v-if="step < stepLabels.length" class="b_button b_button--primary" type="button" @click="step++">Weiter <AppIcon name="chevron-right" /></button>
          <button v-else class="b_button b_button--primary" type="button" :disabled="!design || busy" @click="exportAll"><AppIcon name="download" /> STL-Paket (ZIP)</button>
        </div>

        <div class="b_controls__actions b_controls__actions--secondary">
          <button class="b_button b_button--wide" type="button" :disabled="!design" @click="openShare"><AppIcon name="share" /> Teilen per WhatsApp oder E-Mail</button>
          <button class="b_button" type="button" @click="downloadJson(bey)"><AppIcon name="download" /> Projekt speichern</button>
          <label class="b_button b_button--file">
            <AppIcon name="folder-open" /> Projekt laden
            <input class="b_visually-hidden bJS_project-file" type="file" accept=".json,application/json" @change="importProject">
          </label>
        </div>
      </aside>
    </main>

    <ShareDialog v-if="shareOpen" :bey="bey" :image="shareImage" @close="shareOpen = false" />

    <footer class="b_footer">
      Nicht-kommerzielles Projekt für meine Jung! Danke an die KI.
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import BeybladeViewer from './components/BeybladeViewer.vue'
import ParameterPanel from './components/ParameterPanel.vue'
import AppIcon from './components/AppIcon.vue'
import ShareDialog from './components/ShareDialog.vue'
import { readSharedProject, clearSharedProject } from './utils/share.js'
import { createDefaultBey, normalizeProject, presetFor, PRESETS, BIT_SHAPES } from './models/BeyParameters.js'
import { downloadJson, readJsonFile, saveLocal, loadLocal } from './utils/projectFile.js'
import { exportZip } from './utils/stl.js'
import { loadKit, buildBey } from './geometry/client.js'
import { DENSITY } from './geometry/engine.js'
import { kits, DEFAULT_KIT } from './kits/index.js'
import { useTheme } from './composables/useTheme.js'

const bey = ref(normalizeProject(loadLocal() ?? createDefaultBey()))
const kit = computed(() => kits[bey.value.kit] ?? kits[DEFAULT_KIT])
const kitList = Object.values(kits).filter(k => k.bundled || import.meta.env.DEV)
const notice = ref('')
const viewer = ref(null)
const shareOpen = ref(false)
const shareImage = shallowRef(null)

async function openShare() {
  shareImage.value = null
  shareOpen.value = true
  shareImage.value = await viewer.value?.snapshot({ title: bey.value.name, subtitle: 'Beyblade Creator' }) ?? null
}

const { dark } = useTheme()
const statsOpen = ref(!window.matchMedia?.('(max-width: 1023px)').matches)
const panelOpen = ref(true)
const stepLabels = ['BLADE', 'BIT', 'FERTIG']
const step = ref(Math.min(bey.value.activeStep || 1, stepLabels.length))
const lockedHint = ref('')

const shared = readSharedProject()
if (shared) {
  clearSharedProject()
  if (confirm(`Geteiltes Beyblade „${shared.name || 'Beyblade'}“ öffnen? Dein aktuelles Design wird ersetzt.`)) {
    bey.value = normalizeProject(shared)
    step.value = 1
    saveLocal(bey.value)
  }
}
const exploded = ref(false)
const visibility = ref({})
const selected = ref('')
const bladeTab = ref('metal')

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

const focusPart = computed(() => {
  const isVisible = part => visibility.value[part.id] ?? !part.hidden
  const shown = kit.value.parts.filter(isVisible)
  return shown.length === 1 && shown.length < kit.value.parts.length ? shown[0] : null
})
const focus = computed(() => (focusPart.value ? (focusPart.value.role === 'locked' ? 'locked' : focusPart.value.role) : ''))

watch(focusPart, part => {
  if (!part) { lockedHint.value = ''; return }
  if (part.role === 'locked') { lockedHint.value = part.label; selected.value = part.id; return }
  lockedHint.value = ''
  if (part.role === 'metal') { step.value = 1; bladeTab.value = 'metal' }
  else if (part.role === 'base') { step.value = 1; bladeTab.value = 'base' }
  else if (part.role === 'bit') step.value = 2
  selected.value = part.id
})

const roleId = role => kit.value.parts.find(p => p.role === role)?.id ?? ''

function selectPart(part) {
  if (part.role === 'locked') {
    lockedHint.value = part.label
    selected.value = part.id
    return
  }
  lockedHint.value = ''
  if (part.role === 'metal') { step.value = 1; bladeTab.value = 'metal' }
  else if (part.role === 'base') { step.value = 1; bladeTab.value = 'base' }
  else if (part.role === 'bit') step.value = 2
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
  bey.value = { ...createDefaultBey(id), name: bey.value.name, rotation: bey.value.rotation, activeStep: 3 }
}

watch([step, bladeTab], ([s, tab]) => {
  lockedHint.value = ''
  if (s === 1) selected.value = tab === 'base' ? roleId('base') : tab === 'metal' ? roleId('metal') : ''
  else if (s === 2) selected.value = roleId('bit')
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
    step.value = Math.min(bey.value.activeStep || 1, stepLabels.length)
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
