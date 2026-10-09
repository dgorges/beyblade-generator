import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'
const wasm = await Module(); wasm.setup()
const { Manifold, Mesh } = wasm
const load = id => { const { verts, tris } = weld(readStl(`${process.env.KIT || 'public/kits/iron-forest'}/${id}.stl`)); return new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris })) }
const orient = (m, flip, rot) => { let r = flip ? m.rotate([180, 0, 0]) : m; r = r.rotate([0, 0, rot]); const b = r.boundingBox(); return r.translate([0, 0, -b.min[2]]) }

const seq = JSON.parse(process.argv[2])
let stack = null
const placed = {}
for (const step of seq) {
  const raw = load(step.id)
  if (!stack) { const m = orient(raw, step.flip, 0); stack = m; placed[step.id] = { flip: step.flip, rot: 0, z: 0 }; continue }
  const sb = stack.boundingBox()
  let best = null
  for (const flip of step.flip === undefined ? [false, true] : [step.flip]) {
    for (let rot = step.r0 ?? 0; rot <= (step.r1 ?? 0); rot += step.rs ?? 5) {
      const m = orient(raw, flip, rot); const h = m.boundingBox().max[2]
      const free = z => stack.intersect(m.translate([0, 0, z])).volume() < (step.tol ?? 0.5)
      let z
      if (step.from === 'below') { z = sb.min[2] - h; while (z < sb.max[2] && free(z + 0.1)) z += 0.1 }
      else { z = sb.max[2]; while (z > sb.min[2] - h && free(z - 0.1)) z -= 0.1 }
      const score = step.from === 'below' ? z + h : -z
      if (!best || score > best.score) best = { flip, rot, z: +z.toFixed(2), score, m }
    }
  }
  stack = stack.add(best.m.translate([0, 0, best.z]))
  placed[step.id] = { flip: best.flip, rot: best.rot, z: best.z, top: +(best.z + best.m.boundingBox().max[2]).toFixed(2) }
  console.log(step.id, JSON.stringify(placed[step.id]))
}
console.log(JSON.stringify(placed))
