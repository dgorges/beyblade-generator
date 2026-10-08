import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const params = new URLSearchParams(location.search)
const only = params.get('only')?.split(',')
const layout = params.get('layout')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1e293b)
const camera = new THREE.PerspectiveCamera(+(params.get('fov') || 35), innerWidth / innerHeight, 0.1, 2000)
camera.position.set(0, 120, 160)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(innerWidth, innerHeight)
renderer.localClippingEnabled = true
document.body.appendChild(renderer.domElement)
const controls = new OrbitControls(camera, renderer.domElement)
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2))
const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(50, 100, 70); scene.add(key)
scene.add(new THREE.AxesHelper(30))
const colors = { Gray_Metal: 0x9ca3af, Yellow: 0xfacc15, White: 0xf8fafc, Transperant_White: 0x7dd3fc }
const manifest = await (await fetch('/kits/iron-forest/manifest.json')).json()
const loader = new STLLoader()
const list = manifest.filter(m => !only || only.includes(m.id))
const placement = layout ? JSON.parse(decodeURIComponent(layout)) : {}
window.meshes = {}
list.forEach((m, i) => {
  loader.load(`/kits/iron-forest/${m.id}.stl`, geo => {
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    const clip = params.get('clip') ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)] : []
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ clippingPlanes: clip, color: colors[m.color], roughness: .5, metalness: .1, transparent: m.color.startsWith('Trans'), opacity: m.color.startsWith('Trans') ? .7 : 1, side: THREE.DoubleSide }))
    const p = placement[m.id]
    if (p) { mesh.position.set(p.x || 0, p.y || 0, p.z || 0); mesh.rotation.order = 'YXZ'; if (p.flip) mesh.rotation.x = Math.PI; if (p.rot) mesh.rotation.y = p.rot * Math.PI / 180 }
    else mesh.position.set((i % 5) * 55 - 110, 0, Math.floor(i / 5) * 60 - 30)
    scene.add(mesh)
    window.meshes[m.id] = mesh
  })
})
document.getElementById('info').textContent = list.map((m, i) => `${m.id} ${m.color} ${m.size.join('x')}`).join('\n')
const cam = params.get('cam')
if (cam) { const [x, y, z, tx, ty, tz] = cam.split(',').map(Number); camera.position.set(x, y, z); controls.target.set(tx || 0, ty || 0, tz || 0) }
function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera) }
loop()
