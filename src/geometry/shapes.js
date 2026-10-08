const TAU = Math.PI * 2

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function wingProfile(u, width, sweep) {
  if (u >= width) return 0
  const t = u / width
  const peak = Math.min(0.9, Math.max(0.1, 0.5 + sweep * 0.4))
  if (t < peak) return smoothstep(t / peak)
  return Math.pow(1 - (t - peak) / (1 - peak), 0.8)
}

export function polarOutline({ radius, wings, wingLength, wingWidth, sweep = 0, phase = 0, direction = 1, samples = 360 }) {
  const points = []
  const n = Math.max(1, Math.round(wings))
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * TAU
    const local = ((direction * theta - phase) / TAU) * n
    const u = local - Math.floor(local)
    const r = radius + wingLength * wingProfile(u, wingWidth, sweep)
    points.push([Math.cos(theta) * r, Math.sin(theta) * r])
  }
  return points
}

export function sectorPolygon(rIn, rOut, centerDeg, widthDeg, steps = 16) {
  const pts = []
  const a0 = ((centerDeg - widthDeg / 2) * Math.PI) / 180
  const a1 = ((centerDeg + widthDeg / 2) * Math.PI) / 180
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([Math.cos(a) * rOut, Math.sin(a) * rOut])
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([Math.cos(a) * rIn, Math.sin(a) * rIn])
  }
  return pts
}

export function holePolygon(shape, size) {
  const s = size / 2
  if (shape === 'triangle') {
    return [0, 1, 2].map(i => {
      const a = Math.PI / 2 + (i * TAU) / 3
      return [Math.cos(a) * s * 1.15, Math.sin(a) * s * 1.15]
    })
  }
  if (shape === 'slot') {
    const pts = []
    const half = s * 1.4
    const r = s * 0.55
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 12
      pts.push([half + Math.cos(a) * r, Math.sin(a) * r])
    }
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / 12
      pts.push([-half + Math.cos(a) * r, Math.sin(a) * r])
    }
    return pts
  }
  return Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * TAU
    return [Math.cos(a) * s, Math.sin(a) * s]
  })
}

export function holeExtent(hole) {
  const s = hole.size / 2
  if (hole.shape === 'slot') return s * 1.4 + s * 0.55
  if (hole.shape === 'triangle') return s * 1.15
  return s
}

export function placedHoles(hole) {
  const count = Math.max(1, Math.round(hole.count))
  const base = holePolygon(hole.shape, hole.size)
  const list = []
  for (let i = 0; i < count; i++) {
    const a = ((hole.angle + (i * 360) / count) * Math.PI) / 180
    const rot = hole.shape === 'slot' ? a + Math.PI / 2 : a
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    const cx = Math.cos(a) * hole.radius
    const cy = Math.sin(a) * hole.radius
    list.push(base.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]))
  }
  return list
}

export function bitTipProfile(bit, zStart) {
  const bodyR = bit.bodyRadius
  const z1 = zStart + bit.bodyLength
  const tipR = Math.min(bit.tipRadius, bodyR)
  const z2 = z1 + bit.tipLength
  const pts = [[0, zStart - 0.3], [bodyR, zStart - 0.3], [bodyR, z1]]
  switch (bit.shape) {
    case 'needle':
      pts.push([tipR, z1 + 0.4], [0.35, z2 - 0.15], [0, z2])
      break
    case 'flat':
      pts.push([tipR, z1 + 0.6], [tipR, z2 - 0.5], [tipR - 0.5, z2], [0, z2])
      break
    case 'ball': {
      const neck = Math.max(0, bit.tipLength - tipR)
      pts.push([tipR, z1 + neck])
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * (Math.PI / 2)
        pts.push([Math.cos(a) * tipR, z1 + neck + Math.sin(a) * tipR])
      }
      break
    }
    case 'rush':
      pts.push([tipR, z1 + 0.6], [tipR, z2], [tipR * 0.55, z2], [0, z2 - Math.min(0.8, bit.tipLength * 0.3)])
      break
    default:
      pts.push([tipR, z1 + 0.3], [0.9, z2 - 0.35], [0.45, z2 - 0.05], [0, z2])
  }
  return pts
}
