import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'

const wasm = await Module(); wasm.setup()
const { Manifold, Mesh } = wasm
const dir = process.argv[2] || 'public/kits/iron-forest'
const cache = new Map()
const load = id => {
  if (!cache.has(id)) { const { verts, tris } = weld(readStl(`${dir}/${id}.stl`)); cache.set(id, new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris }))) }
  return cache.get(id)
}

function inside(polys, x, y) {
  let wind = 0
  for (const poly of polys) for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) wind ^= 1
  }
  return wind === 1
}

export function ring(id, z, r, step = 0.5) {
  const polys = load(id).slice(z).toPolygons()
  const occ = []
  for (let a = 0; a < 360; a += step) occ.push(inside(polys, Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r))
  const segs = []
  const start = occ.findIndex((v, i) => v && !occ[(i - 1 + occ.length) % occ.length])
  if (start < 0) return { count: occ[0] ? 0 : 0, full: occ[0], widths: [], centers: [] }
  let i = start, len = 0
  for (let k = 0; k < occ.length; k++) {
    const idx = (start + k) % occ.length
    if (occ[idx]) { if (len === 0) i = idx; len++ } else if (len) { segs.push({ c: (i + len / 2) * step, w: len * step }); len = 0 }
  }
  if (len) segs.push({ c: (i + len / 2) * step, w: len * step })
  return { count: segs.length, widths: segs.map(s => +s.w.toFixed(1)), centers: segs.map(s => +(s.c % 360).toFixed(1)) }
}

export function radii(id, z) {
  const s = load(id).slice(z)
  let rMin = Infinity, rMax = 0
  for (const poly of s.toPolygons()) for (const [x, y] of poly) { const r = Math.hypot(x, y); rMin = Math.min(rMin, r); rMax = Math.max(rMax, r) }
  return { dMin: +(2 * rMin).toFixed(2), dMax: +(2 * rMax).toFixed(2), area: +s.area().toFixed(1) }
}

export function height(id) { const b = load(id).boundingBox(); return +(b.max[2] - b.min[2]).toFixed(2) }

const q = JSON.parse(process.argv[3] || '[]')
for (const item of q) {
  const out = item.kind === 'ring' ? ring(item.id, item.z, item.r) : item.kind === 'radii' ? radii(item.id, item.z) : { h: height(item.id) }
  console.log(JSON.stringify({ ...item, ...out }))
}
