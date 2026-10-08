import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'
const wasm = await Module(); wasm.setup()
const { Manifold, Mesh } = wasm
const load = id => { const { verts, tris } = weld(readStl(`public/kits/iron-forest/${id}.stl`)); return new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris })) }
const orient = (m, flip, rot, h) => { let r = flip ? m.rotate([180, 0, 0]) : m; r = r.rotate([0, 0, rot]); return flip ? r.translate([0, 0, h]) : r }
const fixed = JSON.parse(process.argv[2])
const target = JSON.parse(process.argv[3])
let stack = null
for (const f of fixed) { const m = load(f.id); const h = m.boundingBox().max[2]; const p = orient(m, f.flip, f.rot, h).translate([0, 0, f.z]); stack = stack ? stack.add(p) : p }
const raw = load(target.id); const h = raw.boundingBox().max[2]
const tol = target.tol ?? 0.3
const sb = stack.boundingBox()
let results = []
for (const flip of target.flip === undefined ? [false, true] : [target.flip]) {
  const rots = []
  for (let r = 0; r < 360; r += target.rs ?? 5) rots.push(r)
  const poses = rots.map(r => ({ r, m: orient(raw, flip, r, h) }))
  let best = null
  for (let z = target.zMax ?? sb.max[2]; z >= (target.zMin ?? sb.min[2] - h); z -= target.zs ?? 0.25) {
    for (const { r, m } of poses) {
      const moved = m.translate([0, 0, z])
      const inter = stack.intersect(moved)
      const v = inter.volume()
      moved.delete(); inter.delete()
      if (v < tol) { best = { flip, rot: r, z: +z.toFixed(2), overlap: +v.toFixed(2) }; break }
    }
  }
  results.push(best)
}
console.log(JSON.stringify(results))
