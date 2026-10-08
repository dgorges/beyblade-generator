export const ironForest = {
  id: 'iron-forest',
  name: 'Iron Forest 4-80 High Needle',
  source: 'VinCoda (Cults3D)',
  base: '/kits/iron-forest/',
  ratchet: { id: '4-80', label: '4-80', lugs: 4, height: 8.0 },
  groups: [
    { id: 'blade', label: 'Blade', order: 0 },
    { id: 'ratchet', label: 'Ratchet', order: 1 },
    { id: 'bit', label: 'Bit', order: 2 }
  ],
  parts: [
    { id: 'p4-0', label: 'Chip-Deckel', group: 'blade', role: 'locked', material: 'clear', flip: false, rot: 295, z: 28.5, explode: 40 },
    { id: 'p3-0', label: 'Chip-Clip', group: 'blade', role: 'locked', material: 'white', flip: false, rot: 0, z: 26.2, explode: 33, hidden: true },
    { id: 'p3-1', label: 'Drehrichtungs-Einsatz', group: 'blade', role: 'locked', material: 'white', flip: true, rot: 0, z: 19.4, explode: 27, hidden: true },
    { id: 'p4-1', label: 'Lock-Chip (Starter-Schnittstelle)', group: 'blade', role: 'locked', material: 'clear', flip: false, rot: 0, z: 20.3, explode: 20 },
    { id: 'p2-1', label: 'Oberring', group: 'blade', role: 'locked', material: 'accent', flip: false, rot: 225, z: 17.5, explode: 13 },
    { id: 'p1-0', label: 'Gewichtsring', group: 'blade', role: 'metal', material: 'metal', flip: false, rot: -50, z: 8.2, explode: 6 },
    { id: 'p2-3', label: 'Basis', group: 'blade', role: 'base', material: 'accent', flip: true, rot: 0, z: 0, explode: -8 },
    { id: 'p2-0', label: 'Ratchet-Kern 4-80', group: 'ratchet', role: 'locked', material: 'accent', flip: false, rot: 20, z: 12.8, explode: 0 },
    { id: 'p2-2', label: 'Bit High Needle', group: 'bit', role: 'bit', material: 'accent', flip: true, rot: 0, z: -12, explode: -22 }
  ],
  zones: {
    base: {
      hub: { zMax: 4.75, rKeep: 17.5 },
      plate: { zMin: 4.75, zMax: 7.5, rKeep: 19.5 },
      core: { rKeep: 15 },
      height: 12.904
    },
    metal: {
      pegs: { zMax: 1.4 },
      rKeep: 16.8,
      ringZ: 1.4,
      underUpperRing: { rMax: 20.4, zMax: 8.3 },
      height: 9.766
    },
    bit: {
      keepZMax: 20.0,
      flangeR: 7.9,
      height: 31.5
    }
  }
}

export const kits = { [ironForest.id]: ironForest }
