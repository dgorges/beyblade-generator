import { polarOutline, sectorPolygon, placedHoles, holeExtent, bitTipProfile } from './shapes.js'

export const DENSITY = { PLA: 1.24, PETG: 1.27, TPU: 1.21 }

export function parseStl(buffer) {
  const view = new DataView(buffer)
  const n = view.getUint32(80, true)
  const map = new Map()
  const verts = []
  const tris = new Uint32Array(n * 3)
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const o = 84 + i * 50 + 12 + k * 12
      const x = view.getFloat32(o, true)
      const y = view.getFloat32(o + 4, true)
      const z = view.getFloat32(o + 8, true)
      const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`
      let id = map.get(key)
      if (id === undefined) {
        id = verts.length / 3
        map.set(key, id)
        verts.push(x, y, z)
      }
      tris[i * 3 + k] = id
    }
  }
  return { vertProperties: new Float32Array(verts), triVerts: tris }
}

export function createEngine(wasm) {
  const { Manifold, Mesh, CrossSection } = wasm
  let trash = []
  const keep = m => { trash.push(m); return m }
  const flush = () => { for (const m of trash) { try { m.delete() } catch {} } trash = [] }

  const refs = new Map()
  let kit = null

  function loadKit(kitDef, buffers) {
    kit = kitDef
    for (const m of refs.values()) m.delete()
    refs.clear()
    for (const part of kitDef.parts) {
      const data = parseStl(buffers[part.id])
      refs.set(part.id, new Manifold(new Mesh({ numProp: 3, ...data })))
    }
  }

  const cyl = (r, z0, z1) => keep(keep(Manifold.cylinder(z1 - z0, r, r, 128)).translate([0, 0, z0]))
  const slab = (z0, z1, size = 200) => keep(keep(Manifold.cube([size, size, z1 - z0], true)).translate([0, 0, (z0 + z1) / 2]))
  const cs = polys => keep(new CrossSection(polys, 'NonZero'))
  const circle = r => keep(CrossSection.circle(r, 128))

  function holeCut(holes, target, rMin, rMax, z0, z1) {
    const list = holes.filter(h => h.target === target)
    if (!list.length) return null
    const polys = []
    for (const h of list) {
      const ext = holeExtent(h)
      if (h.radius - ext < rMin || h.radius + ext > rMax) continue
      polys.push(...placedHoles(h))
    }
    if (!polys.length) return null
    return keep(keep(cs(polys).extrude(z1 - z0 + 2)).translate([0, 0, z0 - 1]))
  }

  function direction(bey) {
    return bey.rotation === 'left' ? -1 : 1
  }

  function buildMetal(bey) {
    const z = kit.zones.metal
    const p = bey.metal
    const ref = refs.get('p1-0')
    const keepZone = keep(ref.intersect(keep(cyl(z.rKeep, -1, 20).add(slab(-1, z.pegs.zMax)))))
    const outline = cs([polarOutline({ radius: p.diameter / 2, wings: p.wings, wingLength: p.wingLength, wingWidth: p.wingWidth, sweep: p.sweep, direction: direction(bey) })])
    const ring = keep(outline.subtract(circle(z.rKeep - 0.6)))
    const lowTop = Math.min(z.underUpperRing.zMax, z.ringZ + p.height)
    const bevel = Math.min(p.bevel, (lowTop - z.ringZ) * 0.45)
    const body = keep(keep(ring.extrude(lowTop - z.ringZ - bevel)).translate([0, 0, z.ringZ]))
    const cap = keep(keep(keep(ring.offset(-bevel, 'Round')).extrude(bevel)).translate([0, 0, lowTop - bevel]))
    let design = keep(body.add(cap))
    const wallTop = z.ringZ + p.height + p.wallHeight
    if (wallTop > lowTop + 0.2) {
      const outer = keep(outline.subtract(circle(z.underUpperRing.rMax + 0.2)))
      if (!outer.isEmpty()) {
        const walls = keep(keep(outer.extrude(wallTop - z.ringZ, 8, p.twist * direction(bey))).translate([0, 0, z.ringZ]))
        design = keep(design.add(walls))
      }
    }
    const cut = holeCut(bey.holes, 'metal', z.rKeep + 0.8, p.diameter / 2 - 0.8, z.ringZ, wallTop)
    if (cut) design = keep(design.subtract(cut))
    return keep(design.add(keepZone))
  }

  function buildBase(bey) {
    const z = kit.zones.base
    const p = bey.base
    const ref = refs.get('p2-3')
    const zone = keep(keep(cyl(z.hub.rKeep, -1, z.hub.zMax)
      .add(cyl(z.plate.rKeep, z.hub.zMax, z.plate.zMax)))
      .add(cyl(z.core.rKeep, z.plate.zMax, z.height + 1)))
    const keepZone = keep(ref.intersect(zone))
    const radius = p.diameter / 2
    const outline = cs([polarOutline({ radius, wings: p.spikes, wingLength: p.spikeLength, wingWidth: p.spikeWidth, sweep: p.sweep, direction: direction(bey) })])
    const plate = keep(keep(keep(outline.subtract(circle(z.plate.rKeep - 0.6))).extrude(z.plate.zMax - z.plate.zMin)).translate([0, 0, z.plate.zMin]))
    let design = plate
    if (p.spikeHeight > 0.2) {
      const n = Math.max(1, Math.round(p.spikes))
      const sectors = []
      const widthDeg = (360 / n) * p.spikeWidth * 0.8
      for (let i = 0; i < n; i++) {
        const center = direction(bey) * ((i + p.spikeWidth * (0.5 + p.sweep * 0.4)) * 360) / n
        sectors.push(sectorPolygon(radius - p.spikeDepth, radius + p.spikeLength + 2, center, widthDeg))
      }
      const mask = cs(sectors)
      const spikes = keep(keep(outline.intersect(mask)).subtract(circle(radius - p.spikeDepth)))
      if (!spikes.isEmpty()) {
        const lower = keep(keep(spikes.extrude(p.spikeHeight * 0.7 + 0.1)).translate([0, 0, z.plate.zMax - 0.1]))
        const tipShape = keep(spikes.offset(-0.35, 'Round'))
        design = keep(design.add(lower))
        if (!tipShape.isEmpty()) design = keep(design.add(keep(keep(tipShape.extrude(p.spikeHeight * 0.3)).translate([0, 0, z.plate.zMax + p.spikeHeight * 0.7]))))
      }
    }
    const cut = holeCut(bey.holes, 'base', z.plate.rKeep + 0.8, radius - 0.8, z.plate.zMin, z.plate.zMax + p.spikeHeight)
    if (cut) design = keep(design.subtract(cut))
    return keep(design.add(keepZone))
  }

  function buildBit(bey) {
    const z = kit.zones.bit
    const b = bey.bit
    const ref = refs.get('p2-2')
    const keepZone = keep(ref.intersect(slab(-1, z.keepZMax)))
    const profile = bitTipProfile({ ...b, bodyRadius: Math.min(b.bodyRadius, z.flangeR - 0.3) }, z.keepZMax)
    let tip = keep(Manifold.revolve(cs([profile]), 96))
    if (b.ribs > 0) {
      const ribs = []
      for (let i = 0; i < b.ribs; i++) {
        const box = keep(Manifold.cube([0.9, 0.7, Math.max(0.5, b.bodyLength - 0.4)], false))
        const moved = keep(box.translate([-0.45, b.bodyRadius - 0.35, z.keepZMax]))
        ribs.push(keep(moved.rotate([0, 0, (i * 360) / b.ribs])))
      }
      tip = keep(tip.add(keep(Manifold.union(ribs))))
    }
    return keep(keepZone.add(tip))
  }

  function refHeight(id) {
    return refs.get(id).boundingBox().max[2]
  }

  function placed(part, m) {
    let r = part.flip ? keep(m.rotate([180, 0, 0])) : m
    r = keep(r.rotate([0, 0, part.rot]))
    return keep(r.translate([0, 0, part.z + (part.flip ? refHeight(part.id) : 0)]))
  }

  function meshOf(m) {
    const mesh = m.getMesh()
    const np = mesh.numProp
    let positions = mesh.vertProperties
    if (np !== 3) {
      positions = new Float32Array((mesh.vertProperties.length / np) * 3)
      for (let i = 0, j = 0; i < mesh.vertProperties.length; i += np, j += 3) {
        positions[j] = mesh.vertProperties[i]
        positions[j + 1] = mesh.vertProperties[i + 1]
        positions[j + 2] = mesh.vertProperties[i + 2]
      }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(mesh.triVerts) }
  }

  function lockedMeshes() {
    const out = {}
    for (const part of kit.parts) if (part.role === 'locked') out[part.id] = { ...meshOf(refs.get(part.id)), volume: refs.get(part.id).volume() }
    return out
  }

  function heights() {
    return Object.fromEntries(kit.parts.map(p => [p.id, refHeight(p.id)]))
  }

  function build(bey, { checkFit = true } = {}) {
    try {
      const design = {
        'p1-0': buildMetal(bey),
        'p2-3': buildBase(bey),
        'p2-2': buildBit(bey)
      }
      const parts = {}
      const warnings = []
      for (const [id, m] of Object.entries(design)) {
        if (m.status() !== 'NoError' || m.isEmpty()) warnings.push({ part: id, level: 'error', text: 'Geometrie ungültig' })
        parts[id] = { ...meshOf(m), volume: m.volume() }
      }
      if (checkFit) {
        const lockedParts = kit.parts.filter(p => p.role === 'locked')
        const locked = keep(Manifold.union(lockedParts.filter(p => !p.hidden).map(p => placed(p, refs.get(p.id)))))
        for (const [id, m] of Object.entries(design)) {
          const part = kit.parts.find(p => p.id === id)
          const overlap = keep(placed(part, m).intersect(locked)).volume()
          const refOverlap = keep(placed(part, refs.get(id)).intersect(locked)).volume()
          if (overlap > refOverlap + 2) warnings.push({ part: id, level: 'warn', text: `Kollidiert mit Schnittstellenteilen (${(overlap - refOverlap).toFixed(1)} mm³)` })
        }
      }
      const volumes = Object.fromEntries(kit.parts.map(p => [p.id, parts[p.id]?.volume ?? refs.get(p.id).volume()]))
      return { parts, volumes, warnings }
    } finally {
      flush()
    }
  }

  return { loadKit, build, lockedMeshes, heights }
}
