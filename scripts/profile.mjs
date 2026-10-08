import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'
const wasm = await Module(); wasm.setup()
const { Manifold, Mesh } = wasm
const id = process.argv[2]; const step = +(process.argv[3] || 0.5)
const { verts, tris } = weld(readStl(`public/kits/iron-forest/${id}.stl`))
const m = new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris }))
const bb = m.boundingBox()
console.log(id, 'z', bb.min[2].toFixed(2), '..', bb.max[2].toFixed(2))
for (let z = bb.min[2] + step / 2; z < bb.max[2]; z += step) {
  const polys = m.slice(z).toPolygons()
  let rmin = Infinity, rmax = 0, area = m.slice(z).area()
  for (const poly of polys) for (const [x, y] of poly) { const r = Math.hypot(x, y); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r) }
  console.log(`z=${z.toFixed(2)} rIn=${rmin.toFixed(2)} rOut=${rmax.toFixed(2)} area=${area.toFixed(0)} loops=${polys.length}`)
}
