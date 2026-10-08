import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'
const wasm = await Module(); wasm.setup()
const { Manifold, Mesh } = wasm
const load = id => { const { verts, tris } = weld(readStl(`public/kits/iron-forest/${id}.stl`)); return new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris })) }
const [aId, bId] = process.argv.slice(2)
const A = load(aId), B0 = load(bId)
const results = []
for (const flipB of [false, true]) {
  let B = flipB ? B0.rotate([180, 0, 0]) : B0
  const bb = B.boundingBox(); B = B.translate([0, 0, -bb.min[2]])
  const hB = B.boundingBox().max[2], hA = A.boundingBox().max[2]
  for (const fromTop of (process.env.DIR === "top" ? [true] : process.env.DIR === "bottom" ? [false] : [true, false])) {
    let best = null
    for (let rot = 0; rot < 360; rot += +(process.env.RSTEP || 10)) {
      const Br = B.rotate([0, 0, rot])
      let lo = fromTop ? -hB : -hB, z
      const free = zz => A.intersect(Br.translate([0, 0, zz])).volume() < 1
      if (fromTop) { z = hA; while (z > -hB && free(z - 0.1)) z -= 0.1 }
      else { z = -hB; while (z < hA && free(z + 0.1)) z += 0.1 }
      const depth = fromTop ? hA - z : z + hB
      if (!best || depth > best.depth) best = { rot, z: +z.toFixed(2), depth: +depth.toFixed(2) }
    }
    results.push({ pair: `${aId}<-${bId}`, flipB, fromTop, ...best, hA: +hA.toFixed(2), hB: +hB.toFixed(2) })
  }
}
console.table(results)
