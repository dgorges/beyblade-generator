import { readFileSync } from 'node:fs'

export function readStl(path) {
  const d = readFileSync(path)
  const n = d.readUInt32LE(80)
  const pos = new Float32Array(n * 9)
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12
    for (let k = 0; k < 9; k++) pos[i * 9 + k] = d.readFloatLE(o + k * 4)
  }
  return pos
}

export function weld(pos, eps = 1e-4) {
  const map = new Map()
  const verts = []
  const tris = new Uint32Array(pos.length / 3)
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]
    const key = `${Math.round(x / eps)},${Math.round(y / eps)},${Math.round(z / eps)}`
    let id = map.get(key)
    if (id === undefined) { id = verts.length / 3; map.set(key, id); verts.push(x, y, z) }
    tris[i] = id
  }
  return { verts: new Float32Array(verts), tris }
}

export function components({ verts, tris }) {
  const parent = new Int32Array(verts.length / 3).map((_, i) => i)
  const find = a => { while (parent[a] !== a) a = parent[a] = parent[parent[a]]; return a }
  for (let t = 0; t < tris.length; t += 3) {
    const a = find(tris[t]), b = find(tris[t + 1]), c = find(tris[t + 2])
    parent[b] = a; parent[c] = a
  }
  const groups = new Map()
  for (let t = 0; t < tris.length; t += 3) {
    const r = find(tris[t])
    if (!groups.has(r)) groups.set(r, [])
    groups.get(r).push(tris[t], tris[t + 1], tris[t + 2])
  }
  return [...groups.values()].map(list => {
    const remap = new Map(); const v = []; const t = []
    for (const id of list) {
      if (!remap.has(id)) { remap.set(id, v.length / 3); v.push(verts[id * 3], verts[id * 3 + 1], verts[id * 3 + 2]) }
      t.push(remap.get(id))
    }
    return { verts: new Float32Array(v), tris: new Uint32Array(t) }
  })
}

export function bbox(verts) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < verts.length; i += 3) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], verts[i + k]); max[k] = Math.max(max[k], verts[i + k])
  }
  return { min, max, size: max.map((m, k) => m - min[k]), center: max.map((m, k) => (m + min[k]) / 2) }
}
