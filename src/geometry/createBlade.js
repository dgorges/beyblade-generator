import * as THREE from 'three'

/**
 * Creates a deliberately simple prototype blade.
 * This is NOT yet Beyblade-X-compatible geometry.
 * The compatibility layer will replace the center and profile later.
 */
export function createBladeGeometry(parameters) {
  const {
    diameter,
    bladeCount,
    wingLength,
    wingWidth,
    wingAngle
  } = parameters

  const radius = diameter / 2
  const shape = new THREE.Shape()
  const steps = 64

  // Base radial contour with a small repeating modulation.
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const sector = ((a + Math.PI) % (Math.PI * 2)) / (Math.PI * 2) * bladeCount
    const local = Math.cos((sector - Math.round(sector)) * Math.PI)

    const attack = Math.max(0, local)
    const r = radius + attack * wingLength * 0.18

    const x = Math.cos(a) * r
    const y = Math.sin(a) * r

    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 6,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: Math.min(1.2, wingWidth / 5),
    bevelThickness: 0.8,
    curveSegments: 4
  })

  geometry.center()

  // Slight visual rotation to make the parameter immediately visible.
  geometry.rotateZ(THREE.MathUtils.degToRad(wingAngle * 0.12))

  return geometry
}

export function createBladeMaterial(type = 'attack') {
  const colors = {
    attack: 0xef4444,
    defense: 0x3b82f6,
    stamina: 0x22c55e,
    balance: 0xa855f7
  }

  return new THREE.MeshStandardMaterial({
    color: colors[type] ?? colors.attack,
    metalness: 0.65,
    roughness: 0.28
  })
}