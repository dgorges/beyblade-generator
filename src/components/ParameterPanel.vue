<template>
  <section class="panel">
    <div class="field">
      <label>Name</label>
      <input v-model="bey.name" maxlength="32" />
    </div>

    <div class="field">
      <label>Typ</label>
      <div class="type-grid">
        <button v-for="item in types" :key="item.id" :class="{ active: bey.type === item.id }" @click="bey.type = item.id">
          <span>{{ item.icon }}</span>{{ item.label }}
        </button>
      </div>
    </div>

    <div class="field">
      <label>Drehrichtung</label>
      <div class="segmented">
        <button :class="{ active: bey.rotation === 'right' }" @click="bey.rotation = 'right'">↻ Rechts</button>
        <button :class="{ active: bey.rotation === 'left' }" @click="bey.rotation = 'left'">↺ Links</button>
      </div>
    </div>

    <template v-if="step === 1">
      <div class="info-box"><strong>Blade</strong><span>Die äußere Form ist frei gestaltbar. Der innere Anschlussbereich bleibt als Kompatibilitätszone reserviert.</span></div>
      <RangeInput v-model="bey.blade.diameter" label="Basis-Durchmesser" :min="40" :max="55" :step="0.5" suffix=" mm" />
      <RangeInput v-model="bey.blade.bladeCount" label="Flügel / Ausleger" :min="3" :max="10" :step="1" />
      <RangeInput v-model="bey.blade.wingLength" label="Flügellänge" :min="1" :max="12" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.blade.wingWidth" label="Flügelbreite" :min="1" :max="10" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.blade.wingAngle" label="Flügelwinkel" :min="0" :max="60" :step="1" suffix="°" />
      <RangeInput v-model="bey.blade.outerWeight" label="Gewicht nach außen" :min="0" :max="1" :step="0.01" :display="v => Math.round(v * 100) + ' %'" />
      <RangeInput v-model="bey.blade.thickness" label="Dicke" :min="3" :max="10" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.blade.bevel" label="Kantenabrundung" :min="0.2" :max="2" :step="0.1" suffix=" mm" />
    </template>

    <template v-else-if="step === 2">
      <div class="info-box locked"><strong>Ratchet</strong><span>Nur Auswahl. Das reale Teil bleibt unverändert und ist nicht Bestandteil des STL-Exports.</span></div>
      <div class="ratchet-grid">
        <button v-for="item in ratchets" :key="item.id" :class="{ active: bey.ratchet.id === item.id }" @click="selectRatchet(item)">
          <strong>{{ item.label }}</strong><small>{{ item.lugs }} Ausleger · {{ item.height.toFixed(1) }} mm</small>
        </button>
      </div>
    </template>

    <template v-else-if="step === 3">
      <div class="info-box"><strong>Bit</strong><span>Die obere Schnittstelle bleibt fest. Nur die Geometrie der unteren Spitze / Kontaktfläche wird verändert.</span></div>
      <div class="bit-grid">
        <button v-for="item in bitTypes" :key="item.id" :class="{ active: bey.bit.tipType === item.id }" @click="bey.bit.tipType = item.id">
          <strong>{{ item.label }}</strong><small>{{ item.description }}</small>
        </button>
      </div>
      <RangeInput v-model="bey.bit.height" label="Bit-Höhe" :min="5" :max="11" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipRadius" label="Spitzenradius" :min="0.5" :max="5" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.tipHeight" label="Spitzenhöhe" :min="1" :max="5" :step="0.1" suffix=" mm" />
      <RangeInput v-model="bey.bit.contactAngle" label="Kontaktwinkel" :min="0" :max="70" :step="1" suffix="°" />
      <RangeInput v-model="bey.bit.contactRadius" label="Kontaktfläche" :min="0.5" :max="6" :step="0.1" suffix=" mm" />
    </template>

    <template v-else>
      <div class="summary-card">
        <div><span>Blade</span><strong>{{ bey.blade.diameter.toFixed(1) }} mm · {{ bey.blade.bladeCount }} Flügel</strong></div>
        <div><span>Ratchet</span><strong>{{ bey.ratchet.label }}</strong></div>
        <div><span>Bit</span><strong>{{ bitLabel }}</strong></div>
      </div>
      <div class="info-box"><strong>Export</strong><span>Blade und Bit können als eigene STL-Dateien exportiert werden. Der Ratchet bleibt als Referenz ausgewählt.</span></div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import RangeInput from './RangeInput.vue'
import { RATCHETS, BIT_TYPES } from '../geometry/createBeyGeometry.js'

const props = defineProps({ bey: { type: Object, required: true }, step: { type: Number, required: true } })
const bey = props.bey
const step = props.step
const ratchets = RATCHETS
const bitTypes = BIT_TYPES
const bitLabel = computed(() => bitTypes.find(item => item.id === bey.value.bit.tipType)?.label ?? bey.value.bit.tipType)
const types = [
  { id: 'attack', label: 'Angriff', icon: '⚔️' },
  { id: 'defense', label: 'Verteidigung', icon: '🛡️' },
  { id: 'stamina', label: 'Ausdauer', icon: '🌀' },
  { id: 'balance', label: 'Balance', icon: '⚖️' }
]
function selectRatchet(item) { bey.value.ratchet = { ...item } }
</script>
