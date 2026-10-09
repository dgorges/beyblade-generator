import Module from 'manifold-3d'
import wasmUrl from 'manifold-3d/manifold.wasm?url'
import { createEngine } from '../geometry/engine.js'
import { kits } from '../kits/index.js'

let engine = null
let ready = null

async function init(kitId) {
  const wasm = await Module({ locateFile: () => wasmUrl })
  wasm.setup()
  engine = createEngine(wasm)
  const kit = kits[kitId]
  const entries = await Promise.all(kit.parts.map(async part => {
    const res = await fetch(`${import.meta.env.BASE_URL}${kit.base}${part.id}.stl`)
    if (!res.ok) throw new Error(`Kit-Datei ${part.id}.stl fehlt (${res.status})`)
    return [part.id, await res.arrayBuffer()]
  }))
  engine.loadKit(kit, Object.fromEntries(entries))
  return { parts: engine.lockedMeshes(), heights: engine.heights() }
}

function transferables(parts) {
  return Object.values(parts).flatMap(p => [p.positions.buffer, p.indices.buffer])
}

let next = null
let busy = false

async function drain() {
  busy = true
  while (next) {
    const data = next
    next = null
    try {
      await ready
      const result = engine.build(data.bey)
      self.postMessage({ type: 'result', id: data.id, ...result }, transferables(result.parts))
    } catch (error) {
      self.postMessage({ type: 'error', id: data.id, message: error.message || String(error) })
    }
  }
  busy = false
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      ready = init(data.kit)
      const { parts, heights } = await ready
      self.postMessage({ type: 'kit', id: data.id, parts, heights }, transferables(parts))
    } catch (error) {
      self.postMessage({ type: 'error', id: data.id, message: error.message || String(error) })
    }
    return
  }
  if (data.type === 'build') {
    if (next) self.postMessage({ type: 'skipped', id: next.id })
    next = data
    if (!busy) drain()
  }
}
