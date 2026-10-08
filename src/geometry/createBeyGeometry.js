import * as THREE from 'three'

export const RATCHETS = [
  { id: '3-60', label: '3-60', height: 6.0, lugs: 3 },
  { id: '4-60', label: '4-60', height: 6.0, lugs: 4 },
  { id: '5-60', label: '5-60', height: 6.0, lugs: 5 },
  { id: '3-70', label: '3-70', height: 7.0, lugs: 3 },
  { id: '4-80', label: '4-80', height: 8.0, lugs: 4 }
]

export const BIT_TYPES = [
  { id: 'point', label: 'Point', description: 'Spitze mit kleiner Kontaktfläche' },
  { id: 'needle', label: 'Needle', description: 'Schmale, nadelartige Spitze' },
  { id: 'flat', label: 'Flat', description: 'Flache Kontaktfläche' },
  { id: 'ball', label: 'Ball', description: 'Runde Kontaktfläche' }
]

export function createBladeGeometry(p) {
  const radius = p.diameter / 2
  const steps = Math.max(128, p.bladeCount * 32)
  const shape = new THREE.Shape()

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const sectorAngle = (Math.PI * 2) / p.bladeCount
    let local = ((a + sectorAngle / 2) % sectorAngle) - sectorAngle / 2
    const normalized = Math.abs(local) / (sectorAngle / 2)
    const attack = Math.pow(Math.max(0, 1 - normalized), 2)
    const sweep = THREE.MathUtils.degToRad(p.wingAngle) * Math.sin((local / (sectorAngle / 2)) * Math.PI / 2)
    const directional = Math.max(0, Math.cos((local + sweep) / (sectorAngle / 2) * Math.PI / 2))
    const extension = p.wingLength * (0.12 + 0.88 * attack * directional)
    const widthBias = 1 + (p.wingWidth / 20) * attack
    const r = Math.min(radius + extension, radius + p.wingLength) * widthBias

    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: p.thickness,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: Math.min(p.bevel, p.thickness / 3),
    bevelThickness: Math.min(p.bevel * 0.8, p.thickness / 3),
    curveSegments: 4
  })
  geometry.translate(0, 0, -p.thickness / 2)
  return geometry
}

export function createBladeMaterial(type = 'attack') {
  const colors = { attack: 0xef4444, defense: 0x3b82f6, stamina: 0x22c55e, balance: 0xa855f7 }
  return new THREE.MeshStandardMaterial({ color: colors[type] ?? colors.attack, metalness: 0.72, roughness: 0.24 })
}

export function createRatchetGeometry(r) {
  const group = new THREE.Group()
  const base = new THREE.CylinderGeometry(9.8, 9.2, r.height, 48)
  const baseMesh = new THREE.Mesh(base, new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.2 }))
  baseMesh.position.y = -r.height / 2 - 0.5
  group.add(baseMesh)

  const lugGeometry = new THREE.BoxGeometry(3.1, 2.8, 5.5)
  for (let i = 0; i < r.lugs; i++) {
    const lug = new THREE.Mesh(lugGeometry, baseMesh.material)
    const angle = (i / r.lugs) * Math.PI * 2
    lug.position.set(Math.cos(angle) * 9.2, -r.height / 2 - 0.5, Math.sin(angle) * 9.2)
    lug.rotation.y = -angle
    group.add(lug)
  }
  return group
}

export function createBitGeometry(p) {
  const group = new THREE.Group()
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.75, roughness: 0.28 })
  const tipMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.15, roughness: 0.35 })

  const stem = new THREE.CylinderGeometry(4.2, 4.2, Math.max(2.5, p.height - p.tipHeight), 40)
  const stemMesh = new THREE.Mesh(stem, coreMaterial)
  stemMesh.position.y = -p.height / 2
  group.add(stemMesh)

  let tip
  const h = Math.max(1, p.tipHeight)
  if (p.tipType === 'needle') {
    tip = new THREE.ConeGeometry(Math.max(0.7, p.tipRadius * 0.35), h, 32)
  } else if (p.tipType === 'flat') {
    tip = new THREE.CylinderGeometry(p.tipRadius, p.tipRadius, h, 48)
  } else if (p.tipType === 'ball') {
    tip = new THREE.SphereGeometry(p.tipRadius, 40, 20)
  } else {
    tip = new THREE.ConeGeometry(p.tipRadius, h, 40)
  }
  const tipMesh = new THREE.Mesh(tip, tipMaterial)
  tipMesh.position.y = -p.height - h / 2 + 1
  group.add(tipMesh)

  return group
}
