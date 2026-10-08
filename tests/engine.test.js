import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import Module from 'manifold-3d'
import { createEngine, parseStl } from '../src/geometry/engine.js'
import { writeStl } from '../src/utils/stl.js'
import { ironForest } from '../src/kits/ironForest.js'
import { createDefaultBey, createHole, PRESETS } from '../src/models/BeyParameters.js'

const dir = 'public/kits/iron-forest/'
const hasKit = existsSync(`${dir}p2-3.stl`)
let engine

describe.skipIf(!hasKit)('geometry engine', () => {
  let wasm
  beforeAll(async () => {
    wasm = await Module()
    wasm.setup()
    engine = createEngine(wasm)
    const buffers = Object.fromEntries(ironForest.parts.map(p => {
      const b = readFileSync(`${dir}${p.id}.stl`)
      return [p.id, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)]
    }))
    engine.loadKit(ironForest, buffers)
  })

  it('builds valid design parts for every preset', () => {
    for (const [type, preset] of Object.entries(PRESETS)) {
      for (const rotation of ['right', 'left']) {
        const bey = { ...createDefaultBey(), type, rotation, metal: { ...preset.metal }, base: { ...preset.base } }
        const result = engine.build(bey)
        expect(result.warnings.filter(w => w.level === 'error')).toEqual([])
        for (const id of ['p1-0', 'p2-3', 'p2-2']) expect(result.parts[id].volume).toBeGreaterThan(100)
      }
    }
  })

  it('does not collide with locked interface parts', () => {
    const result = engine.build(createDefaultBey())
    expect(result.warnings).toEqual([])
  })

  it('never cuts holes into the interface zone', () => {
    const plain = engine.build(createDefaultBey(), { checkFit: false })
    const inside = { ...createDefaultBey(), holes: [{ ...createHole('metal'), radius: 15, size: 3 }] }
    const result = engine.build(inside, { checkFit: false })
    expect(result.parts['p1-0'].volume).toBeCloseTo(plain.parts['p1-0'].volume, 3)
    const outside = { ...createDefaultBey(), holes: [{ ...createHole('metal'), radius: 18.8, size: 1.6 }] }
    expect(engine.build(outside, { checkFit: false }).parts['p1-0'].volume).toBeLessThan(plain.parts['p1-0'].volume - 5)
  })
  it('exports watertight STL files', () => {
    const bey = { ...createDefaultBey(), holes: [{ ...createHole('metal'), radius: 18.8, size: 1.6, count: 6 }] }
    const result = engine.build(bey, { checkFit: false })
    for (const id of ['p1-0', 'p2-3', 'p2-2']) {
      const bytes = writeStl([result.parts[id]])
      const m = new wasm.Manifold(new wasm.Mesh({ numProp: 3, ...parseStl(bytes.buffer) }))
      expect(m.status()).toBe('NoError')
      expect(m.volume()).toBeCloseTo(result.parts[id].volume, 0)
    }
  })
})
