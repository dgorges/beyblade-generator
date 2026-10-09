<template>
  <div class="b_viewer">
    <div ref="container" class="b_viewer__canvas bJS_viewer-canvas" role="img" :aria-label="`3D-Ansicht. ${hovered ? hovered.label : 'Klick auf ein Teil öffnet seine Einstellungen.'}`" @pointermove="onHover" @pointerleave="hovered = null" @pointerdown="onDown" @pointerup="onUp"></div>
    <div class="b_viewer__toolbar" role="toolbar" aria-label="Beyblade Interaktivität">
      <button type="button" class="b_viewer__tool" :class="{ 'b_viewer__tool--active': exploded }" :aria-pressed="exploded" title="Teile auseinanderziehen" @click="emit('update:exploded', !exploded)"><AppIcon name="grid-even" /> Explosion</button>
      <button type="button" class="b_viewer__tool" :class="{ 'b_viewer__tool--active': spin }" :aria-pressed="spin" title="Automatisch drehen" @click="spin = !spin"><AppIcon name="refresh" /> Drehen</button>
      <button type="button" class="b_viewer__tool" :class="{ 'b_viewer__tool--active': showLocks }" :aria-pressed="showLocks" title="Gesperrte Schnittstellenteile hervorheben" @click="showLocks = !showLocks"><AppIcon name="lock" /> Schnittstellen</button>
      <div class="b_parts">
        <button type="button" class="b_viewer__tool" :aria-expanded="partsOpen" aria-controls="parts-list" @click="partsOpen = !partsOpen"><AppIcon name="show" /> Teile <AppIcon :name="partsOpen ? 'chevron-up' : 'chevron-down'" /></button>
        <div v-if="partsOpen" id="parts-list" class="b_parts__body">
          <div class="b_parts__actions">
            <button type="button" class="b_button b_button--small" @click="$emit('visibility', {})">Alle</button>
            <button type="button" class="b_button b_button--small" @click="onlyDesign">Nur Design</button>
          </div>
          <template v-for="group in kit.groups" :key="group.id">
            <span class="b_parts__group">{{ group.label }}</span>
            <div v-for="part in kit.parts.filter(p => p.group === group.id)" :key="part.id" class="b_parts__row" :class="{ 'b_parts__row--selected': selected === part.id }">
              <label class="b_parts__label">
                <input type="checkbox" :checked="isVisible(part)" @change="toggle(part, $event.target.checked)">
                <span class="b_parts__name"><AppIcon :name="part.role === 'locked' ? 'lock' : 'edit'" /> {{ part.label }}</span>
              </label>
              <button type="button" class="b_button b_button--small" :aria-label="`Nur ${part.label} zeigen`" title="Nur dieses Teil zeigen" @click="solo(part)"><AppIcon name="search" /></button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="b_viewer__alignment" role="toolbar" aria-label="Ansicht">
      <button type="button" class="b_viewer__tool" title="Modell einpassen" @click="fit()"><AppIcon name="zoom-in" /> Einpassen</button>
      <button type="button" class="b_viewer__tool" title="3D-Ansicht" @click="setView('iso')">3D</button>
      <button type="button" class="b_viewer__tool" title="Draufsicht" @click="setView('top')">Oben</button>
      <button type="button" class="b_viewer__tool" title="Seitenansicht" @click="setView('side')">Seite</button>
      <button type="button" class="b_viewer__tool" title="Untersicht" @click="setView('bottom')">Unten</button>
    </div>
    <div v-if="hovered" class="b_viewer__tooltip" aria-hidden="true">
      <strong>{{ hovered.label }} <small class="b_viewer__tooltip-hint">– klicken zum Bearbeiten</small></strong>
      <span class="b_viewer__tooltip-role"><AppIcon :name="hovered.role === 'locked' ? 'lock' : 'edit'" /> {{ hovered.role === 'locked' ? 'Schnittstelle – unveränderbar' : 'Designteil – gestaltbar' }}</span>
    </div>
    <div v-if="busy" class="b_viewer__busy" role="status">Berechne Geometrie …</div>
    <p class="b_viewer__hint">Klick auf ein Teil: bearbeiten · Ziehen: drehen · Rechte Maustaste / Shift: verschieben · Mausrad: zoomen</p>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onBeforeUnmount, watch, ref } from 'vue'
import * as THREE from 'three'
import AppIcon from './AppIcon.vue'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps({
  kit: { type: Object, required: true },
  heights: { type: Object, default: null },
  locked: { type: Object, default: null },
  design: { type: Object, default: null },
  type: { type: String, default: 'balance' },
  dark: { type: Boolean, default: false },
  exploded: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  visibility: { type: Object, default: () => ({}) },
  selected: { type: String, default: '' },
  panelOpen: { type: Boolean, default: true }
})

const emit = defineEmits(['select', 'visibility', 'update:exploded'])
const partsOpen = ref(false)

const ACCENT = { attack: 0xef4444, defense: 0x22c55e, stamina: 0x8b5cf6, balance: 0xfacc15 }
const container = ref(null)
const spin = ref(false)
const showLocks = ref(false)
const hovered = ref(null)

let scene, camera, renderer, controls, root, ground, animationId, resizeObserver
let panelSpace = 0
const meshes = new Map()
const materials = {}
let explodeT = 0
let firstFit = true
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function createMaterials() {
  materials.accent = new THREE.MeshStandardMaterial({ color: ACCENT[props.type] ?? ACCENT.balance, roughness: 0.45, metalness: 0.05, flatShading: true })
  materials.metal = new THREE.MeshStandardMaterial({ color: 0xa8b0bd, roughness: 0.28, metalness: 0.85, flatShading: true })
  materials.white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6, flatShading: true })
  materials.clear = new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.15, transmission: 0.6, transparent: true, opacity: 0.62, thickness: 1.5, flatShading: true })
  materials.lock = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, transparent: true, opacity: 0.45, flatShading: true })
  materials.selected = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.35 })
}

function isVisible(part) {
  const v = props.visibility[part.id]
  return v === undefined ? !part.hidden || props.exploded : v
}

function toggle(part, value) {
  emit('visibility', { ...props.visibility, [part.id]: value })
}

function solo(part) {
  emit('visibility', Object.fromEntries(props.kit.parts.map(p => [p.id, p.id === part.id])))
  setTimeout(() => fit(), 50)
}

function onlyDesign() {
  emit('visibility', Object.fromEntries(props.kit.parts.map(p => [p.id, p.role !== 'locked'])))
}

let downAt = null
function onDown(event) {
  downAt = { x: event.clientX, y: event.clientY }
}

function onUp(event) {
  if (!downAt || event.button !== 0) return
  const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y)
  downAt = null
  if (moved > 4) return
  const hit = pick(event)
  if (hit) emit('select', hit.object.userData.part)
}

function geometryFrom(data) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
  g.setIndex(new THREE.BufferAttribute(data.indices, 1))
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

function materialFor(part) {
  if (showLocks.value && part.role === 'locked') return materials.lock
  return materials[part.material] ?? materials.accent
}

function ensurePart(part, data) {
  if (!data) return
  let entry = meshes.get(part.id)
  const geometry = geometryFrom(data)
  if (entry) {
    entry.mesh.geometry.dispose()
    entry.mesh.geometry = geometry
    entry.mesh.children[0].geometry = geometry
    return
  }
  const mesh = new THREE.Mesh(geometry, materialFor(part))
  mesh.userData.part = part
  const outline = new THREE.Mesh(geometry, materials.selected)
  outline.visible = false
  outline.raycast = () => {}
  mesh.add(outline)
  const pivot = new THREE.Group()
  pivot.rotation.order = 'ZYX'
  pivot.rotation.z = THREE.MathUtils.degToRad(part.rot)
  pivot.rotation.x = part.flip ? Math.PI : 0
  pivot.add(mesh)
  root.add(pivot)
  entry = { pivot, mesh, part }
  meshes.set(part.id, entry)
  placePart(entry)
}

function placePart(entry) {
  const h = props.heights?.[entry.part.id] ?? 0
  entry.pivot.position.z = entry.part.z + (entry.part.flip ? h : 0) + entry.part.explode * explodeT
  const v = props.visibility[entry.part.id]
  entry.pivot.visible = v === undefined ? !entry.part.hidden || explodeT > 0.08 : v
  entry.mesh.children[0].visible = props.selected === entry.part.id
}

function syncParts() {
  if (!root) return
  for (const part of props.kit.parts) {
    const data = part.role === 'locked' ? props.locked?.[part.id] : props.design?.[part.id]
    if (part.role === 'locked' && meshes.has(part.id)) continue
    ensurePart(part, data)
  }
  if (firstFit && meshes.size === props.kit.parts.length) {
    firstFit = false
    setView('iso')
  }
}

function bounds() {
  const box = new THREE.Box3()
  for (const { pivot } of meshes.values()) if (pivot.visible) box.expandByObject(pivot)
  return box
}

function fit(direction) {
  const box = bounds()
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const dir = direction ?? camera.position.clone().sub(controls.target).normalize()
  const fov = THREE.MathUtils.degToRad(camera.fov / 2)
  const visibleAspect = (renderer.domElement.clientWidth - panelSpace) / Math.max(1, renderer.domElement.clientHeight)
  const fovH = Math.atan(Math.tan(fov) * Math.max(0.2, visibleAspect))
  const distance = (sphere.radius * 0.92) / Math.sin(Math.min(fov, fovH))
  controls.target.copy(sphere.center)
  camera.position.copy(sphere.center).add(dir.multiplyScalar(distance))
  camera.near = Math.max(0.1, distance / 100)
  camera.far = distance * 20
  camera.updateProjectionMatrix()
  controls.minDistance = sphere.radius * 0.4
  controls.maxDistance = distance * 5
  controls.update()
}

function setView(name) {
  const dirs = {
    iso: new THREE.Vector3(1, 0.75, 1.15),
    top: new THREE.Vector3(0, 1, 0.0001),
    bottom: new THREE.Vector3(0, -1, 0.0001),
    side: new THREE.Vector3(0, 0.08, 1)
  }
  fit(dirs[name].normalize())
}

function refreshMaterials() {
  for (const { mesh, part } of meshes.values()) mesh.material = materialFor(part)
}

function pick(event) {
  if (!renderer) return null
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  return raycaster.intersectObjects([...meshes.values()].filter(e => e.pivot.visible).map(e => e.mesh), false)[0] ?? null
}

function onHover(event) {
  const hit = pick(event)
  hovered.value = hit ? hit.object.userData.part : null
  if (renderer) renderer.domElement.style.cursor = hit ? 'pointer' : ''
}

function resize() {
  if (!container.value || !renderer) return
  const width = Math.max(1, container.value.clientWidth)
  const height = Math.max(1, container.value.clientHeight)
  panelSpace = parseFloat(getComputedStyle(container.value).getPropertyValue('--panel-space')) || 0
  camera.aspect = width / height
  if (panelSpace > 0 && panelSpace < width * 0.7) camera.setViewOffset(width, height, panelSpace / 2, 0, width, height)
  else camera.clearViewOffset()
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function background() {
  return new THREE.Color(cssColor('--theme-viewer-background'))
}

function init() {
  scene = new THREE.Scene()
  scene.background = background()
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000)
  camera.position.set(80, 60, 90)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.value.appendChild(renderer.domElement)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  pmrem.dispose()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.zoomToCursor = true
  controls.autoRotateSpeed = 2.5

  scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 1.6))
  const key = new THREE.DirectionalLight(0xffffff, 2.6)
  key.position.set(60, 120, 80)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xc7d2fe, 1.2)
  rim.position.set(-80, 40, -60)
  scene.add(rim)
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(0, -80, 40)
  scene.add(fill)

  root = new THREE.Group()
  root.rotation.x = -Math.PI / 2
  scene.add(root)

  ground = new THREE.Mesh(new THREE.CircleGeometry(70, 96), new THREE.MeshStandardMaterial({ color: new THREE.Color(cssColor('--theme-viewer-ground')), roughness: 0.95 }))
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)
  const grid = new THREE.PolarGridHelper(70, 12, 6, 96, new THREE.Color(cssColor('--color-slate-400')), new THREE.Color(cssColor('--color-slate-400')))
  grid.material.transparent = true
  grid.material.opacity = 0.25
  ground.add(grid)
  grid.rotation.x = Math.PI / 2
  grid.position.z = 0.01

  createMaterials()
  syncParts()
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container.value)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    const target = props.exploded ? 1 : 0
    if (Math.abs(explodeT - target) > 0.001) {
      explodeT += (target - explodeT) * 0.14
      for (const entry of meshes.values()) placePart(entry)
    }
    const minZ = Math.min(...[...meshes.values()].map(e => e.pivot.position.z - (e.part.flip ? (props.heights?.[e.part.id] ?? 0) : 0)), 0)
    ground.position.y = minZ - 0.6
    controls.autoRotate = spin.value
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}

watch(() => props.locked, syncParts)
watch(() => props.heights, () => { for (const entry of meshes.values()) placePart(entry) })
watch(() => props.design, syncParts)
watch(showLocks, refreshMaterials)
watch(() => props.panelOpen, async () => {
  await nextTick()
  resize()
  fit()
})
watch(() => [props.visibility, props.selected], () => { for (const entry of meshes.values()) placePart(entry) })
watch(() => props.type, type => materials.accent?.color.setHex(ACCENT[type] ?? ACCENT.balance))
watch(() => props.dark, async () => {
  await nextTick()
  if (!scene) return
  scene.background = background()
  ground.material.color.set(cssColor('--theme-viewer-ground'))
})
watch(() => props.exploded, () => setTimeout(() => fit(), 900))

onMounted(init)
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()
  for (const { mesh } of meshes.values()) mesh.geometry.dispose()
  Object.values(materials).forEach(m => m.dispose())
  renderer?.dispose()
})

function snapshot({ title = '', subtitle = '' } = {}) {
  return new Promise(resolve => {
    renderer.render(scene, camera)
    const source = renderer.domElement
    const width = 1080
    const height = Math.round(width * (source.height / source.width))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height + 140
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = cssColor('--theme-viewer-background')
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0, width, height)
    ctx.fillStyle = cssColor('--theme-heading')
    ctx.font = '700 48px Inter, system-ui, sans-serif'
    ctx.fillText(title, 40, height + 68)
    ctx.fillStyle = cssColor('--color-indigo-500')
    ctx.font = '600 26px Inter, system-ui, sans-serif'
    ctx.fillText(subtitle, 40, height + 112)
    canvas.toBlob(resolve, 'image/png')
  })
}

defineExpose({ fit, setView, snapshot })
</script>
