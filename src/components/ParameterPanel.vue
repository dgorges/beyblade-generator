<template>
  <section class="panel">
    <div v-if="lockedHint" class="info-box locked locked-hint">
      <strong>🔒 {{ lockedHint }}</strong>
      <span>Dieses Teil ist fest. Es sorgt dafür, dass Starter, Ring und Bit zusammenpassen, und kann deshalb nicht verändert werden.</span>
    </div>
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
        <RangeInput v-model="bey.metal.diameter" label="Durchmesser" :min="kit.limits.metalDiameter[0]" :max="kit.limits.metalDiameter[1]" :step="0.5" suffix=" mm" />
        <RangeInput v-model="bey.metal.wings" label="Flügel" :min="1" :max="12" :step="1" />
        <RangeInput v-model="bey.metal.wingLength" label="Flügellänge" :min="0" :max="6" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.wingWidth" label="Flügelbreite" :min="0.1" :max="0.95" :step="0.01" :display="percent" />
        <RangeInput v-model="bey.metal.sweep" label="Angriffskante (stumpf ↔ scharf)" :min="-1" :max="1" :step="0.05" :display="signed" />
        <RangeInput v-model="bey.metal.height" label="Ringhöhe" :min="kit.limits.metalHeight[0]" :max="kit.limits.metalHeight[1]" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.wallHeight" label="Flügel-Überhöhe" :min="kit.limits.wallHeight[0]" :max="kit.limits.wallHeight[1]" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.metal.twist" label="Flügeldrall" :min="0" :max="30" :step="1" suffix="°" />
        <RangeInput v-model="bey.metal.bevel" label="Kantenfase" :min="0" :max="1.5" :step="0.05" suffix=" mm" />
      </template>

      <template v-else-if="bladeTab === 'base'">
        <div class="info-box"><strong>🎨 Basis</strong><span>Die Basis sitzt unter dem Ring. Ihre Zinken zeigen nach unten Richtung Arena. Nabe, Bit-Aufnahme und Zapfenlöcher bleiben fest.</span></div>
        <RangeInput v-model="bey.base.diameter" label="Durchmesser" :min="kit.limits.baseDiameter[0]" :max="kit.limits.baseDiameter[1]" :step="0.5" suffix=" mm" />
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
          <RangeInput v-model="hole.radius" label="Abstand zur Mitte" :min="holeRange[0]" :max="holeRange[1]" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.size" label="Größe" :min="0.8" :max="5" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.count" label="Anzahl im Kreis" :min="1" :max="12" :step="1" />
          <RangeInput v-model="hole.angle" label="Drehung" :min="0" :max="360" :step="1" suffix="°" />
          <p v-if="holeState(hole)" class="hole-warning">{{ holeState(hole) }}</p>
        </div>
        <button type="button" class="secondary add-button" @click="bey.holes.push(createHole('metal', kit))">＋ Loch hinzufügen</button>
      </template>
    </template>

    <template v-else-if="step === 2">
      <div class="info-box"><strong>Bit</strong><span>🔒 Oberer Anschluss und Flansch bleiben fest, damit der Bit in den Ratchet einrastet. 🎨 Alles unterhalb des Flansches ist gestaltbar.</span></div>
      <div class="bit-grid">
        <button v-for="item in bitShapes" :key="item.id" type="button" :class="{ active: bey.bit.shape === item.id }" @click="bey.bit.shape = item.id">
          <strong>{{ item.label }}</strong><small>{{ item.description }}</small>
        </button>
      </div>
      <RangeInput v-model="bey.bit.bodyRadius" label="Schaftradius" :min="3" :max="kit.limits.bitRadius" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.bodyLength" label="Schaftlänge" :min="1" :max="9" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipRadius" label="Spitzenradius" :min="0.5" :max="kit.limits.bitRadius" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipLength" label="Spitzenhöhe" :min="0.5" :max="8" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.ribs" label="Griffrippen" :min="0" :max="16" :step="1" />
      <RangeInput v-model="bey.bit.diskRadius" label="Scheibe (Radius, 0 = keine)" :min="0" :max="kit.zones.bit.maxDisk" :step="0.1" suffix=" mm" />
      <RangeInput v-if="bey.bit.diskRadius > 0" v-model="bey.bit.diskThickness" label="Scheibendicke" :min="1" :max="4" :step="0.1" suffix=" mm" />
    </template>

    <template v-else>
      <div class="summary-card">
        <div><span>Gewicht ({{ bey.print.material }})</span><strong>{{ stats.weight.toFixed(1) }} g</strong></div>
        <div><span>Durchmesser</span><strong>{{ stats.diameter.toFixed(1) }} mm</strong></div>
        <div><span>Höhe gesamt</span><strong>{{ stats.height.toFixed(1) }} mm</strong></div>
        <div><span>Gewichtsring</span><strong>{{ bey.metal.wings }} Flügel · {{ bey.holes.filter(h => h.target === 'metal').length }} Lochgruppen</strong></div>
        <div><span>Grundlage</span><strong>{{ kit.name }}</strong></div>
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
      <div v-if="kits.length > 1" class="field">
        <label>Grundlage (nur lokal sichtbar)</label>
        <div class="segmented">
          <button v-for="item in kits" :key="item.id" type="button" :class="{ active: kit.id === item.id }" @click="emit('kit', item.id)">{{ item.name }}</button>
        </div>
      </div>
      <div class="info-box"><strong>Export</strong><span>Eine ZIP-Datei mit allen Teilen als STL, jeweils in Druckausrichtung, plus Assembly.stl nur für die Vorschau. Laut Kit: 100 % Infill und Stützstrukturen verwenden.</span></div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import RangeInput from './RangeInput.vue'
import { presetFor, BIT_SHAPES, HOLE_SHAPES, createHole } from '../models/BeyParameters.js'
import { holeExtent } from '../geometry/shapes.js'

const props = defineProps({
  bey: { type: Object, required: true },
  step: { type: Number, required: true },
  kit: { type: Object, required: true },
  kits: { type: Array, default: () => [] },
  stats: { type: Object, required: true },
  warnings: { type: Array, default: () => [] },
  bladeTab: { type: String, default: 'metal' },
  selected: { type: String, default: '' },
  lockedHint: { type: String, default: '' }
})

const emit = defineEmits(['update:bladeTab', 'kit'])
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
const holeRange = computed(() => [Math.min(props.kit.zones.metal.rKeep, props.kit.zones.base.plate.rKeep) + 0.5, props.kit.limits.metalDiameter[1] / 2])
const bitLabel = computed(() => bitShapes.find(item => item.id === props.bey.bit.shape)?.label ?? props.bey.bit.shape)

const percent = v => `${Math.round(v * 100)} %`
const signed = v => (v > 0 ? '+' : '') + v.toFixed(2)

function applyType(type) {
  props.bey.type = type
  const preset = presetFor(type, props.kit)
  Object.assign(props.bey.metal, preset.metal)
  Object.assign(props.bey.base, preset.base)
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
