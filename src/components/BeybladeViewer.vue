<template><div ref="container" class="viewer"></div></template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createBladeGeometry, createBladeMaterial, createRatchetGeometry, createBitGeometry } from '../geometry/createBeyGeometry.js'

const props = defineProps({
  bey: { type: Object, required: true },
  dark: { type: Boolean, default: false },
  exploded: { type: Boolean, default: false }
})

const container = ref(null)
let scene, camera, renderer, controls, assembly, animationId

function clearAssembly() {
  if (!assembly) return
  scene.remove(assembly)
  assembly.traverse(object => {
    if (object.geometry) object.geometry.dispose()
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach(m => m.dispose())
      else object.material.dispose()
    }
  })
  assembly = null
}

function buildModel() {
  if (!scene) return
  clearAssembly()
  assembly = new THREE.Group()

  const blade = new THREE.Mesh(createBladeGeometry(props.bey.blade), createBladeMaterial(props.bey.type))
  blade.rotation.x = Math.PI / 2
  blade.position.y = props.exploded ? 12 : 0
  assembly.add(blade)

  const ratchet = createRatchetGeometry(props.bey.ratchet)
  ratchet.rotation.x = Math.PI / 2
  ratchet.position.y = props.exploded ? 0 : -3.5
  assembly.add(ratchet)

  const bit = createBitGeometry(props.bey.bit)
  bit.rotation.x = Math.PI / 2
  bit.position.y = props.exploded ? -14 : -10
  assembly.add(bit)

  scene.add(assembly)
}

function resize() {
  if (!container.value || !renderer) return
  const width = Math.max(1, container.value.clientWidth)
  const height = Math.max(1, container.value.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(props.dark ? 0x111827 : 0xf3f4f6)
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500)
  camera.position.set(48, 48, 62)
  camera.lookAt(0, 0, -2)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 35
  controls.maxDistance = 130

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.5))
  const key = new THREE.DirectionalLight(0xffffff, 3.5)
  key.position.set(35, 60, 40)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffffff, 1.4)
  rim.position.set(-40, 20, -35)
  scene.add(rim)

  const grid = new THREE.GridHelper(90, 18, 0x64748b, 0x334155)
  grid.rotation.x = Math.PI / 2
  grid.position.z = -22
  grid.material.opacity = 0.18
  grid.material.transparent = true
  scene.add(grid)

  buildModel()
  resize()
  window.addEventListener('resize', resize)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls?.update()
    if (assembly) assembly.rotation.y += 0.004
    renderer.render(scene, camera)
  }
  animate()
}

watch(() => props.bey, buildModel, { deep: true })
watch(() => props.exploded, buildModel)
watch(() => props.dark, dark => { if (scene) scene.background = new THREE.Color(dark ? 0x111827 : 0xf3f4f6) })
onMounted(init)
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
  controls?.dispose()
  renderer?.dispose()
})
</script>
