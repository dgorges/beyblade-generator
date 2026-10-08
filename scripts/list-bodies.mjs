import { readdirSync } from 'node:fs'
import { readStl, weld, components, bbox } from './stl-io.mjs'
const dir = process.argv[2] || 'reference'
for (const f of readdirSync(dir).filter(f => f.endsWith('.stl'))) {
  const comps = components(weld(readStl(`${dir}/${f}`)))
  console.log(`\n${f}: ${comps.length} Körper`)
  comps.forEach((c, i) => {
    const b = bbox(c.verts)
    console.log(` #${i} tris=${c.tris.length / 3} size=${b.size.map(v => v.toFixed(2)).join(' x ')} center=${b.center.map(v => v.toFixed(2)).join(',')}`)
  })
}
