import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import Module from 'manifold-3d'
import { readStl, weld, components, bbox } from './stl-io.mjs'

const dir = process.argv[2] || 'reference'
const out = process.argv[3] || 'public/kits/iron-forest'
const merges = JSON.parse(process.argv[4] || '{}')
mkdirSync(out, { recursive: true })
const wasm = await Module()
wasm.setup()
const { Manifold, Mesh } = wasm

function writeStl(path, verts, tris) {
  const n = tris.length / 3
  const buf = Buffer.alloc(84 + n * 50)
  buf.writeUInt32LE(n, 80)
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) buf.writeFloatLE(verts[tris[i * 3 + k] * 3 + j], o + k * 12 + j * 4)
  }
  writeFileSync(path, buf)
}

function concat(list) {
  let offset = 0
  const verts = []
  const tris = []
  for (const c of list) {
    verts.push(...c.verts)
    for (const t of c.tris) tris.push(t + offset)
    offset += c.verts.length / 3
  }
  return { verts: new Float32Array(verts), tris: new Uint32Array(tris) }
}

const bodies = []
readdirSync(dir).filter(f => f.endsWith('.stl')).sort().forEach((f, fileIndex) => {
  const tag = f.match(/Pt (\d)/)?.[1] ?? String(fileIndex + 1)
  const color = f.match(/\(([^)]+)\)\.stl$/)?.[1] ?? 'default'
  components(weld(readStl(`${dir}/${f}`))).forEach((c, i) => bodies.push({ id: `p${tag}-${i}`, color, ...c }))
})
const merged = new Set(Object.values(merges).flat())
for (const [name, ids] of Object.entries(merges)) {
  const parts = ids.map(id => bodies.find(b => b.id === id))
  bodies.push({ id: name, color: parts[0].color, ...concat(parts) })
}

const manifest = []
for (const c of bodies.filter(b => !merged.has(b.id))) {
  {
    const b = bbox(c.verts)
    const verts = c.verts.map((v, k) => v - (k % 3 === 2 ? b.min[2] : b.center[k % 3]))
    const { id, color } = c
    let status = 'ok', volume = 0
    try {
      const m = new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: c.tris }))
      status = m.status()
      volume = m.volume()
      m.delete()
    } catch (e) { status = String(e.message || e) }
    writeStl(`${out}/${id}.stl`, verts, c.tris)
    manifest.push({ id, color, size: b.size.map(v => +v.toFixed(3)), status, volume: +volume.toFixed(1) })
  }
}
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2))
console.table(manifest.map(m => ({ ...m, size: m.size.join(' x ') })))
