import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import Module from 'manifold-3d'
import { createEngine, parseStl } from '../src/geometry/engine.js'
import { writeStl } from '../src/utils/stl.js'
import { kits } from '../src/kits/index.js'
import { createDefaultBey, createHole, presetFor, PRESETS } from '../src/models/BeyParameters.js'

let wasm
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
})

for (const kit of Object.values(kits)) {
  const dir = `public/${kit.base}`
  const hasKit = kit.parts.every(p => existsSync(`${dir}${p.id}.stl`))

  describe.skipIf(!hasKit)(`geometry engine · ${kit.name}`, () => {
    let engine
    beforeAll(() => {
      engine = createEngine(wasm)
      const buffers = Object.fromEntries(kit.parts.map(p => {
        const b = readFileSync(`${dir}${p.id}.stl`)
        return [p.id, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)]
      }))
      engine.loadKit(kit, buffers)
    })

    const design = () => kit.parts.filter(p => p.role !== 'locked').map(p => p.id)

    it('builds valid design parts for every preset without collisions', () => {
      for (const type of Object.keys(PRESETS)) {
        for (const rotation of ['right', 'left']) {
          const bey = { ...createDefaultBey(kit.id), type, rotation, ...presetFor(type, kit) }
          const result = engine.build(bey)
          expect(result.warnings).toEqual([])
          for (const id of design()) expect(result.parts[id].volume).toBeGreaterThan(100)
        }
      }
    })

    it('keeps the minimal default free of collisions', () => {
      expect(engine.build(createDefaultBey(kit.id)).warnings).toEqual([])
    })

    it('never cuts holes into the interface zone', () => {
      const metal = kit.parts.find(p => p.role === 'metal').id
      const plain = engine.build(createDefaultBey(kit.id), { checkFit: false })
      const inside = { ...createDefaultBey(kit.id), holes: [{ ...createHole('metal', kit), radius: kit.zones.metal.rKeep - 1, size: 3 }] }
      expect(engine.build(inside, { checkFit: false }).parts[metal].volume).toBeCloseTo(plain.parts[metal].volume, 3)
      const outside = { ...createDefaultBey(kit.id), holes: [createHole('metal', kit)] }
      expect(engine.build(outside, { checkFit: false }).parts[metal].volume).toBeLessThan(plain.parts[metal].volume - 5)
    })

    it('exports watertight STL files', () => {
      const bey = { ...createDefaultBey(kit.id), holes: [{ ...createHole('metal', kit), count: 6 }] }
      const result = engine.build(bey, { checkFit: false })
      for (const id of design()) {
        const bytes = writeStl([result.parts[id]])
        const m = new wasm.Manifold(new wasm.Mesh({ numProp: 3, ...parseStl(bytes.buffer) }))
        expect(m.status()).toBe('NoError')
        expect(m.volume()).toBeCloseTo(result.parts[id].volume, 0)
      }
    })
  })
}
