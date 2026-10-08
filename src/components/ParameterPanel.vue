<template>
  <section class="panel">
    <template v-if="step === 1">
      <div class="field">
        <label for="bey-name">Name</label>
        <input id="bey-name" v-model="bey.name" maxlength="32" />
      </div>

      <div class="field">
        <label>Grundform</label>
        <div class="type-grid">
          <button v-for="item in types" :key="item.id" type="button" :class="{ active: bey.type === item.id }" @click="applyType(item.id)">
            <span>{{ item.icon }}</span>{{ item.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>Drehrichtung</label>
        <div class="segmented">
          <button type="button" :class="{ active: bey.rotation === 'right' }" @click="bey.rotation = 'right'">↻ Rechts</button>
          <button type="button" :class="{ active: bey.rotation === 'left' }" @click="bey.rotation = 'left'">↺ Links</button>
        </div>
      </div>

      <div class="subtabs" role="tablist">
        <button v-for="tab in bladeTabs" :key="tab.id" type="button" role="tab" :aria-selected="bladeTab === tab.id" :class="{ active: bladeTab === tab.id }" @click="bladeTab = tab.id">{{ tab.label }}</button>
      </div>

      <template v-if="bladeTab === 'metal'">
        <div class="info-box"><strong>🎨 Gewichtsring</strong><span>Der äußere Ring trägt das Gewicht und die Angriffskanten. Die drei Zapfen und die Innenkante zum Oberring bleiben automatisch erhalten.</span></div>
        <RangeInput v-model="bey.metal.diameter" label="Durchmesser" :min="41" :max="50" :step="0.5" suffix=" mm" />
        <RangeInput v-model="bey.metal.wings" label="Flügel" :min="1" :max="12" :step="1" />
        <RangeInput v-model="bey.metal.wingLength" label="Flügellänge" :min="0" :max="6" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.wingWidth" label="Flügelbreite" :min="0.1" :max="0.95" :step="0.01" :display="percent" />
        <RangeInput v-model="bey.metal.sweep" label="Angriffskante (stumpf ↔ scharf)" :min="-1" :max="1" :step="0.05" :display="signed" />
        <RangeInput v-model="bey.metal.height" label="Ringhöhe" :min="3" :max="7.9" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.wallHeight" label="Flügel-Überhöhe" :min="0" :max="5" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.twist" label="Flügeldrall" :min="0" :max="30" :step="1" suffix="°" />
        <RangeInput v-model="bey.metal.bevel" label="Kantenfase" :min="0" :max="1.5" :step="0.05" suffix=" mm" />
      </template>

      <template v-else-if="bladeTab === 'base'">
        <div class="info-box"><strong>🎨 Basis</strong><span>Die Basis sitzt unter dem Ring. Ihre Zinken zeigen nach unten Richtung Arena. Nabe, Bit-Aufnahme und Zapfenlöcher bleiben fest.</span></div>
        <RangeInput v-model="bey.base.diameter" label="Durchmesser" :min="41" :max="50" :step="0.5" suffix=" mm" />
        <RangeInput v-model="bey.base.spikes" label="Zinken" :min="1" :max="16" :step="1" />
        <RangeInput v-model="bey.base.spikeLength" label="Zinkenüberstand" :min="0" :max="5" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.spikeWidth" label="Zinkenbreite" :min="0.1" :max="0.9" :step="0.01" :display="percent" />
        <RangeInput v-model="bey.base.spikeDepth" label="Zinkentiefe (radial)" :min="1" :max="6" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.spikeHeight" label="Zinkenhöhe" :min="0" :max="7" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.sweep" label="Zinkenform (stumpf ↔ scharf)" :min="-1" :max="1" :step="0.05" :display="signed" />
      </template>

      <template v-else>
        <div class="info-box"><strong>🕳️ Löcher & Aussparungen</strong><span>Löcher sparen Gewicht und verschieben den Schwerpunkt. Im 🔒 Schnittstellenbereich werden sie automatisch ausgelassen.</span></div>
        <div v-for="(hole, index) in bey.holes" :key="hole.id" class="hole-card">
          <div class="hole-head">
            <strong>Loch {{ index + 1 }}</strong>
            <button type="button" class="link-button" @click="bey.holes.splice(index, 1)">Entfernen</button>
          </div>
          <div class="segmented">
            <button type="button" :class="{ active: hole.target === 'metal' }" @click="hole.target = 'metal'">Gewichtsring</button>
            <button type="button" :class="{ active: hole.target === 'base' }" @click="hole.target = 'base'">Basis</button>
          </div>
          <div class="segmented three">
            <button v-for="shape in holeShapes" :key="shape.id" type="button" :class="{ active: hole.shape === shape.id }" @click="hole.shape = shape.id">{{ shape.label }}</button>
          </div>
          <RangeInput v-model="hole.radius" label="Abstand zur Mitte" :min="17" :max="25" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.size" label="Größe" :min="0.8" :max="5" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.count" label="Anzahl im Kreis" :min="1" :max="12" :step="1" />
          <RangeInput v-model="hole.angle" label="Drehung" :min="0" :max="360" :step="1" suffix="°" />
          <p v-if="holeState(hole)" class="hole-warning">{{ holeState(hole) }}</p>
        </div>
        <button type="button" class="secondary add-button" @click="bey.holes.push(createHole('metal'))">＋ Loch hinzufügen</button>
      </template>
    </template>

    <template v-else-if="step === 2">
      <div class="info-box locked"><strong>🔒 Ratchet {{ kit.ratchet.label }}</strong><span>Der Ratchet verbindet Blade und Bit. Er ist eine technische Schnittstelle und wird 1:1 aus dem Kit übernommen. Andere Ratchets (z. B. 3-80) kommen als weitere Kits dazu.</span></div>
      <div class="ratchet-grid">
        <button type="button" class="active">
          <strong>{{ kit.ratchet.label }}</strong><small>{{ kit.ratchet.lugs }} Vorsprünge · {{ kit.ratchet.height.toFixed(1) }} mm · {{ kit.name }}</small>
        </button>
      </div>
      <div class="locked-list">
        <span>Unveränderbare Kit-Teile</span>
        <ul>
          <li v-for="part in lockedParts" :key="part.id" :class="{ selected: selected === part.id }">🔒 {{ part.label }}</li>
        </ul>
      </div>
    </template>

    <template v-else-if="step === 3">
      <div class="info-box"><strong>Bit</strong><span>🔒 Oberer Anschluss und Flansch bleiben fest, damit der Bit in den Ratchet einrastet. 🎨 Alles unterhalb des Flansches ist gestaltbar.</span></div>
      <div class="bit-grid">
        <button v-for="item in bitShapes" :key="item.id" type="button" :class="{ active: bey.bit.shape === item.id }" @click="bey.bit.shape = item.id">
          <strong>{{ item.label }}</strong><small>{{ item.description }}</small>
        </button>
      </div>
      <RangeInput v-model="bey.bit.bodyRadius" label="Schaftradius" :min="3" :max="7.6" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.bodyLength" label="Schaftlänge" :min="1" :max="9" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipRadius" label="Spitzenradius" :min="0.5" :max="7.6" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipLength" label="Spitzenhöhe" :min="0.5" :max="8" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.ribs" label="Griffrippen" :min="0" :max="16" :step="1" />
    </template>

    <template v-else>
      <div class="summary-card">
        <div><span>Gewicht ({{ bey.print.material }})</span><strong>{{ stats.weight.toFixed(1) }} g</strong></div>
        <div><span>Durchmesser</span><strong>{{ stats.diameter.toFixed(1) }} mm</strong></div>
        <div><span>Höhe gesamt</span><strong>{{ stats.height.toFixed(1) }} mm</strong></div>
        <div><span>Gewichtsring</span><strong>{{ bey.metal.wings }} Flügel · {{ bey.holes.filter(h => h.target === 'metal').length }} Lochgruppen</strong></div>
        <div><span>Ratchet</span><strong>{{ kit.ratchet.label }}</strong></div>
        <div><span>Bit</span><strong>{{ bitLabel }}</strong></div>
      </div>
      <div class="field">
        <label>Druckmaterial</label>
        <div class="segmented three">
          <button v-for="m in ['PLA', 'PETG', 'TPU']" :key="m" type="button" :class="{ active: bey.print.material === m }" @click="bey.print.material = m">{{ m }}</button>
        </div>
      </div>
      <div v-if="warnings.length" class="warning-list">
        <p v-for="(w, i) in warnings" :key="i" :class="w.level">⚠️ {{ w.text }}</p>
      </div>
      <div class="info-box"><strong>Export</strong><span>Eine ZIP-Datei mit allen Teilen als STL, jeweils in Druckausrichtung, plus Assembly.stl nur für die Vorschau. Laut Kit: 100 % Infill und Stützstrukturen verwenden.</span></div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import RangeInput from './RangeInput.vue'
import { PRESETS, BIT_SHAPES, HOLE_SHAPES, createHole } from '../models/BeyParameters.js'
import { holeExtent } from '../geometry/shapes.js'

const props = defineProps({
  bey: { type: Object, required: true },
  step: { type: Number, required: true },
  kit: { type: Object, required: true },
  stats: { type: Object, required: true },
  warnings: { type: Array, default: () => [] },
  bladeTab: { type: String, default: 'metal' },
  selected: { type: String, default: '' }
})

const emit = defineEmits(['update:bladeTab'])
const bladeTab = computed({ get: () => props.bladeTab, set: v => emit('update:bladeTab', v) })
const bladeTabs = [
  { id: 'metal', label: 'Gewichtsring' },
  { id: 'base', label: 'Basis' },
  { id: 'holes', label: 'Löcher' }
]
const types = [
  { id: 'attack', label: 'Angriff', icon: '⚔️' },
  { id: 'defense', label: 'Verteidigung', icon: '🛡️' },
  { id: 'stamina', label: 'Ausdauer', icon: '🌀' },
  { id: 'balance', label: 'Balance', icon: '⚖️' }
]
const bitShapes = BIT_SHAPES
const holeShapes = HOLE_SHAPES
const lockedParts = computed(() => props.kit.parts.filter(p => p.role === 'locked'))
const bitLabel = computed(() => bitShapes.find(item => item.id === props.bey.bit.shape)?.label ?? props.bey.bit.shape)

const percent = v => `${Math.round(v * 100)} %`
const signed = v => (v > 0 ? '+' : '') + v.toFixed(2)

function applyType(type) {
  props.bey.type = type
  Object.assign(props.bey.metal, PRESETS[type].metal)
  Object.assign(props.bey.base, PRESETS[type].base)
}

function holeState(hole) {
  const zones = props.kit.zones
  const ext = holeExtent(hole)
  const inner = hole.target === 'metal' ? zones.metal.rKeep + 0.8 : zones.base.plate.rKeep + 0.8
  const outer = (hole.target === 'metal' ? props.bey.metal.diameter : props.bey.base.diameter) / 2 - 0.8
  if (hole.radius - ext < inner) return '🔒 Liegt im Schnittstellenbereich und wird nicht ausgeschnitten. Weiter nach außen schieben.'
  if (hole.radius + ext > outer) return 'Zu nah am Rand und wird nicht ausgeschnitten. Kleiner machen oder nach innen schieben.'
  const gap = (2 * Math.PI * hole.radius) / Math.max(1, hole.count) - 2 * ext
  if (gap < 0.8) return 'Löcher überlappen. Weniger Löcher oder kleinere Größe wählen.'
  return ''
}
</script>
