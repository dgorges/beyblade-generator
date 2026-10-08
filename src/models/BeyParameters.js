export const PRESETS = {
  attack: {
    metal: { diameter: 42, wings: 3, wingLength: 4.5, wingWidth: 0.42, sweep: 0.6, height: 7.6, wallHeight: 2.5, twist: 12, bevel: 0.6 },
    base: { diameter: 44, spikes: 6, spikeLength: 2.5, spikeWidth: 0.35, spikeDepth: 4, spikeHeight: 5, sweep: 0.5 }
  },
  defense: {
    metal: { diameter: 46, wings: 6, wingLength: 1.5, wingWidth: 0.7, sweep: 0, height: 7.9, wallHeight: 0, twist: 0, bevel: 1 },
    base: { diameter: 46, spikes: 12, spikeLength: 1, spikeWidth: 0.5, spikeDepth: 3, spikeHeight: 3, sweep: 0 }
  },
  stamina: {
    metal: { diameter: 47, wings: 4, wingLength: 1, wingWidth: 0.85, sweep: -0.2, height: 6, wallHeight: 0, twist: 0, bevel: 1.2 },
    base: { diameter: 45, spikes: 9, spikeLength: 0.5, spikeWidth: 0.6, spikeDepth: 2.5, spikeHeight: 1.5, sweep: 0 }
  },
  balance: {
    metal: { diameter: 43, wings: 9, wingLength: 1.2, wingWidth: 0.55, sweep: 0.2, height: 7.9, wallHeight: 0, twist: 0, bevel: 0.6 },
    base: { diameter: 45.5, spikes: 9, spikeLength: 1.2, spikeWidth: 0.3, spikeDepth: 4.5, spikeHeight: 5.4, sweep: 0.1 }
  }
}

export const BIT_SHAPES = [
  { id: 'needle', label: 'Needle', description: 'Sehr spitz, Ausdauer' },
  { id: 'point', label: 'Point', description: 'Spitz mit runder Kuppe' },
  { id: 'ball', label: 'Ball', description: 'Kugelspitze, Balance' },
  { id: 'flat', label: 'Flat', description: 'Flach, aggressiver Angriff' },
  { id: 'rush', label: 'Rush', description: 'Flach mit Mulde, kontrollierter Angriff' }
]

export const HOLE_SHAPES = [
  { id: 'circle', label: 'Kreis' },
  { id: 'slot', label: 'Langloch' },
  { id: 'triangle', label: 'Dreieck' }
]

export function createDefaultBey() {
  return {
    version: 3,
    kit: 'iron-forest',
    name: 'Mein Beyblade',
    type: '',
    rotation: 'right',
    activeStep: 1,
    metal: { diameter: 42, wings: 1, wingLength: 0, wingWidth: 0.5, sweep: 0, height: 7.9, wallHeight: 0, twist: 0, bevel: 0.4 },
    base: { diameter: 42, spikes: 1, spikeLength: 0, spikeWidth: 0.3, spikeDepth: 3, spikeHeight: 0, sweep: 0 },
    holes: [],
    bit: { shape: 'flat', bodyRadius: 5.6, bodyLength: 4, tipRadius: 4, tipLength: 2, ribs: 0 },
    print: { material: 'PLA' }
  }
}

export function createHole(target = 'metal') {
  return { id: Math.random().toString(36).slice(2, 9), target, shape: 'circle', radius: target === 'metal' ? 18.8 : 20.5, size: 1.6, count: 3, angle: 0 }
}

export function normalizeProject(value) {
  const base = createDefaultBey()
  if (!value || typeof value !== 'object') return base
  if (value.version !== 3) return { ...base, name: value.name || base.name, type: value.type || base.type, rotation: value.rotation || base.rotation }
  return {
    ...base,
    ...value,
    metal: { ...base.metal, ...(value.metal || {}) },
    base: { ...base.base, ...(value.base || {}) },
    bit: { ...base.bit, ...(value.bit || {}) },
    print: { ...base.print, ...(value.print || {}) },
    holes: Array.isArray(value.holes) ? value.holes.map(h => ({ ...createHole(h.target), ...h })) : []
  }
}
