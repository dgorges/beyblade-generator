import Module from 'manifold-3d'
import { readStl, weld } from './stl-io.mjs'
const wasm = await Module(); wasm.setup()
const { Manifold, Mesh, CrossSection } = wasm
const id = process.argv[2]; const zs = process.argv[3].split(',').map(Number)
const { verts, tris } = weld(readStl(`${process.env.KIT || 'public/kits/iron-forest'}/${id}.stl`))
const m = new Manifold(new Mesh({ numProp: 3, vertProperties: verts, triVerts: tris }))
for (const z of zs) {
  const s = m.slice(z)
  const row = []
  for (let r = 0; r < 27; r += 1) {
    const ann = CrossSection.circle(r + 1, 128).subtract(CrossSection.circle(r, 128))
    const frac = s.intersect(ann).area() / ann.area()
    row.push(frac < 0.005 ? '  .' : String(Math.round(frac * 100)).padStart(3))
  }
  console.log(`z=${z}`.padEnd(7), row.join(''))
}
console.log('r=     ', Array.from({ length: 27 }, (_, i) => String(i).padStart(3)).join(''))
