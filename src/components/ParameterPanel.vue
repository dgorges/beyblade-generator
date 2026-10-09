<template>
  <section class="b_panel">
    <div v-if="lockedHint" class="b_info b_info--locked" role="status">
      <strong class="b_info__title"><AppIcon name="lock" /> {{ lockedHint }}</strong>
      <span>Dieses Teil ist fest. Es sorgt dafür, dass Starter, Ring und Bit zusammenpassen, und kann deshalb nicht verändert werden.</span>
    </div>
    <template v-if="focus === 'locked'"></template>
    <template v-else-if="step === 1">
      <template v-if="!focus">
        <div class="b_field">
          <label class="b_field__label" for="bey-name">Name</label>
          <input id="bey-name" v-model="bey.name" class="b_field__input" maxlength="32" />
        </div>

        <fieldset class="b_field b_field--group">
          <legend class="b_field__label">Grundform</legend>
          <div class="b_choices b_choices--four">
            <button v-for="item in types" :key="item.id" type="button" class="b_choice b_choice--compact" :class="{ 'b_choice--active': bey.type === item.id }" :aria-pressed="bey.type === item.id" @click="applyType(item.id)">
              <AppIcon :name="item.icon" class="b_choice__icon" />{{ item.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="b_field b_field--group">
          <legend class="b_field__label">Drehrichtung</legend>
          <div class="b_segmented">
            <button type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': bey.rotation === 'right' }" :aria-pressed="bey.rotation === 'right'" @click="bey.rotation = 'right'"><AppIcon name="redo" /> Rechts</button>
            <button type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': bey.rotation === 'left' }" :aria-pressed="bey.rotation === 'left'" @click="bey.rotation = 'left'"><AppIcon name="undo" /> Links</button>
          </div>
        </fieldset>

        <div class="b_tabs" role="tablist" aria-label="Blade-Teile">
          <button v-for="tab in bladeTabs" :key="tab.id" type="button" role="tab" class="b_tabs__tab" :class="{ 'b_tabs__tab--active': bladeTab === tab.id }" :aria-selected="bladeTab === tab.id" @click="bladeTab = tab.id">{{ tab.label }}</button>
        </div>
      </template>

      <template v-if="bladeTab === 'metal'">
        <div class="b_info"><strong class="b_info__title"><AppIcon name="edit" /> {{ labelOf('metal') }}</strong><span>Der äußere Ring trägt das Gewicht und die Angriffskanten. Der Innenbereich, an dem die festen Teile andocken, bleibt automatisch erhalten.</span></div>
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
        <div class="b_info"><strong class="b_info__title"><AppIcon name="edit" /> {{ labelOf('base') }}</strong><span>Die Basis sitzt unter dem Ring. Ihre Zinken zeigen nach unten Richtung Arena. Nabe und Bit-Aufnahme bleiben fest.</span></div>
        <RangeInput v-model="bey.base.diameter" label="Durchmesser" :min="kit.limits.baseDiameter[0]" :max="kit.limits.baseDiameter[1]" :step="0.5" suffix=" mm" />
        <RangeInput v-model="bey.base.spikes" label="Zinken" :min="1" :max="16" :step="1" />
        <RangeInput v-model="bey.base.spikeLength" label="Zinkenüberstand" :min="0" :max="5" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.spikeWidth" label="Zinkenbreite" :min="0.1" :max="0.9" :step="0.01" :display="percent" />
        <RangeInput v-model="bey.base.spikeDepth" label="Zinkentiefe (radial)" :min="1" :max="6" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.spikeHeight" label="Zinkenhöhe" :min="0" :max="7" :step="0.1" suffix=" mm" />
        <RangeInput v-model="bey.base.sweep" label="Zinkenform (stumpf ↔ scharf)" :min="-1" :max="1" :step="0.05" :display="signed" />
      </template>

      <template v-if="bladeTab === 'holes' || focus">
        <div v-if="!focus" class="b_info"><strong class="b_info__title"><AppIcon name="circle-substract" /> Löcher & Aussparungen</strong><span>Löcher sparen Gewicht und verschieben den Schwerpunkt. Im Schnittstellenbereich werden sie automatisch ausgelassen.</span></div>
        <h3 v-else class="b_panel__section-title"><AppIcon name="circle-substract" /> Löcher</h3>
        <div v-for="(hole, index) in holeList" :key="hole.id" class="b_hole" role="group" :aria-labelledby="`hole-${hole.id}`">
          <div class="b_hole__head">
            <strong :id="`hole-${hole.id}`">Loch {{ index + 1 }}</strong>
            <button type="button" class="b_button b_button--link" @click="bey.holes.splice(bey.holes.indexOf(hole), 1)">Entfernen</button>
          </div>
          <div v-if="!focus" class="b_segmented">
            <button type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': hole.target === 'metal' }" :aria-pressed="hole.target === 'metal'" @click="hole.target = 'metal'">{{ labelOf('metal') }}</button>
            <button type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': hole.target === 'base' }" :aria-pressed="hole.target === 'base'" @click="hole.target = 'base'">{{ labelOf('base') }}</button>
          </div>
          <div class="b_segmented b_segmented--three">
            <button v-for="shape in holeShapes" :key="shape.id" type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': hole.shape === shape.id }" :aria-pressed="hole.shape === shape.id" @click="hole.shape = shape.id">{{ shape.label }}</button>
          </div>
          <RangeInput v-model="hole.radius" label="Abstand zur Mitte" :min="holeRange[0]" :max="holeRange[1]" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.size" label="Größe" :min="0.8" :max="5" :step="0.1" suffix=" mm" />
          <RangeInput v-model="hole.count" label="Anzahl im Kreis" :min="1" :max="12" :step="1" />
          <RangeInput v-model="hole.angle" label="Drehung" :min="0" :max="360" :step="1" suffix="°" />
          <p v-if="holeState(hole)" class="b_hole__warning" role="status">{{ holeState(hole) }}</p>
        </div>
        <button type="button" class="b_button" @click="bey.holes.push(createHole(focus || 'metal', kit))"><AppIcon name="circle-add" /> Loch hinzufügen</button>
      </template>
    </template>

    <template v-else-if="step === 2">
      <div class="b_info"><strong class="b_info__title">Bit</strong><span>Oberer Anschluss und Flansch bleiben fest, damit der Bit in den Ratchet einrastet. Alles unterhalb des Flansches ist gestaltbar.</span></div>
      <div class="b_choices" role="group" aria-label="Spitzenform">
        <button v-for="item in bitShapes" :key="item.id" type="button" class="b_choice" :class="{ 'b_choice--active': bey.bit.shape === item.id }" :aria-pressed="bey.bit.shape === item.id" @click="bey.bit.shape = item.id">
          <strong class="b_choice__title">{{ item.label }}</strong><small class="b_choice__text">{{ item.description }}</small>
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
      <dl class="b_summary">
        <div class="b_summary__row"><dt class="b_summary__term">Gewicht ({{ bey.print.material }})</dt><dd class="b_summary__value">{{ stats.weight.toFixed(1) }} g</dd></div>
        <div class="b_summary__row"><dt class="b_summary__term">Durchmesser</dt><dd class="b_summary__value">{{ stats.diameter.toFixed(1) }} mm</dd></div>
        <div class="b_summary__row"><dt class="b_summary__term">Höhe gesamt</dt><dd class="b_summary__value">{{ stats.height.toFixed(1) }} mm</dd></div>
        <div class="b_summary__row"><dt class="b_summary__term">{{ labelOf('metal') }}</dt><dd class="b_summary__value">{{ bey.metal.wings }} Flügel · {{ bey.holes.filter(h => h.target === 'metal').length }} Lochgruppen</dd></div>
        <div class="b_summary__row"><dt class="b_summary__term">Grundlage</dt><dd class="b_summary__value">{{ kit.name }}</dd></div>
        <div class="b_summary__row"><dt class="b_summary__term">Bit</dt><dd class="b_summary__value">{{ bitLabel }}</dd></div>
      </dl>
      <fieldset class="b_field b_field--group">
        <legend class="b_field__label">Druckmaterial</legend>
        <div class="b_segmented b_segmented--three">
          <button v-for="m in ['PLA', 'PETG', 'TPU']" :key="m" type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': bey.print.material === m }" :aria-pressed="bey.print.material === m" @click="bey.print.material = m">{{ m }}</button>
        </div>
      </fieldset>
      <ul v-if="warnings.length" class="b_warnings" role="status">
        <li v-for="(w, i) in warnings" :key="i" class="b_warnings__item" :class="`b_warnings__item--${w.level}`"><AppIcon name="circle-info" /> {{ w.text }}</li>
      </ul>
      <fieldset v-if="kits.length > 1" class="b_field b_field--group">
        <legend class="b_field__label">Grundlage (nur lokal sichtbar)</legend>
        <div class="b_segmented">
          <button v-for="item in kits" :key="item.id" type="button" class="b_segmented__option" :class="{ 'b_segmented__option--active': kit.id === item.id }" :aria-pressed="kit.id === item.id" @click="emit('kit', item.id)">{{ item.name }}</button>
        </div>
      </fieldset>
      <div class="b_info"><strong class="b_info__title">Export</strong><span>Eine ZIP-Datei mit allen Teilen als STL, jeweils in Druckausrichtung, plus Assembly.stl nur für die Vorschau. Laut Kit: 100 % Infill und Stützstrukturen verwenden.</span></div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import RangeInput from './RangeInput.vue'
import AppIcon from './AppIcon.vue'
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
  lockedHint: { type: String, default: '' },
  focus: { type: String, default: '' }
})

const emit = defineEmits(['update:bladeTab', 'kit'])
const bladeTab = computed({ get: () => props.bladeTab, set: v => emit('update:bladeTab', v) })
const labelOf = role => props.kit.parts.find(p => p.role === role)?.label ?? role
const bladeTabs = computed(() => [
  { id: 'metal', label: labelOf('metal') },
  { id: 'base', label: labelOf('base') },
  { id: 'holes', label: 'Löcher' }
])
const types = [
  { id: 'attack', label: 'Angriff', icon: 'arrow-right-up' },
  { id: 'defense', label: 'Verteidigung', icon: 'circle-block' },
  { id: 'stamina', label: 'Ausdauer', icon: 'repeat' },
  { id: 'balance', label: 'Balance', icon: 'components' }
]
const bitShapes = BIT_SHAPES
const holeShapes = HOLE_SHAPES
const holeList = computed(() => (props.focus ? props.bey.holes.filter(h => h.target === props.focus) : props.bey.holes))
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
  if (hole.radius - ext < inner) return 'Liegt im Schnittstellenbereich und wird nicht ausgeschnitten. Weiter nach außen schieben.'
  if (hole.radius + ext > outer) return 'Zu nah am Rand und wird nicht ausgeschnitten. Kleiner machen oder nach innen schieben.'
  const gap = (2 * Math.PI * hole.radius) / Math.max(1, hole.count) - 2 * ext
  if (gap < 0.8) return 'Löcher überlappen. Weniger Löcher oder kleinere Größe wählen.'
  return ''
}
</script>
