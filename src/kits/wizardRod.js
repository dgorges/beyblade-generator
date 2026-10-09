export const wizardRod = {
  id: 'wizard-rod',
  name: 'Wizard Rod',
  source: 'Printables #1621988',
  base: 'kits/wizard-rod/',
  bundled: true,
  ratchet: null,
  groups: [
    { id: 'blade', label: 'Blade', order: 0 },
    { id: 'bit', label: 'Bit', order: 2 }
  ],
  parts: [
    { id: 'p1-8', label: 'Chip-Clip', group: 'blade', role: 'locked', material: 'white', flip: false, rot: 90, z: 31, explode: 33 },
    { id: 'p1-5', label: 'Drehrichtungs-Einsatz', group: 'blade', role: 'locked', material: 'white', flip: true, rot: 15, z: 28.5, explode: 27 },
    { id: 'p1-2', label: 'Klauenring', group: 'blade', role: 'locked', material: 'accent', flip: false, rot: 60, z: 21, explode: 20 },
    { id: 'p1-6', label: 'Lock-Chip (Starter-Schnittstelle)', group: 'blade', role: 'locked', material: 'clear', flip: false, rot: 0, z: 13.5, explode: 14 },
    { id: 'p1-1', label: 'Oberring', group: 'blade', role: 'locked', material: 'accent', flip: true, rot: 90, z: 11.5, explode: 9 },
    { id: 'p1-4', label: 'Außenring', group: 'blade', role: 'metal', material: 'metal', flip: true, rot: 6, z: 6, explode: 4 },
    { id: 'p1-7', label: 'Basis', group: 'blade', role: 'base', material: 'accent', flip: false, rot: 0, z: 0, explode: 0 },
    { id: 'bit', label: 'Bit', group: 'bit', role: 'bit', material: 'accent', flip: false, rot: 240, z: -15.1, explode: -16 }
  ],
  zones: {
    metal: {
      pegs: { zMax: 0 },
      rKeep: 19,
      ringZ: 0,
      wallDir: -1,
      underUpperRing: { rMax: 20.7, zMin: 2.4, zMax: 8.2 },
      height: 9.982
    },
    base: {
      hub: { zMax: 4.3, rKeep: 23.5 },
      plate: { zMin: 4.3, zMax: 5.8, rKeep: 19.5 },
      core: { rKeep: 19.5 },
      spikeDir: -1,
      height: 13.988
    },
    bit: {
      plane: 13.485,
      keepSide: 'above',
      maxRadius: 14,
      maxDisk: 15,
      height: 31.5
    }
  },
  limits: {
    metalDiameter: [42, 56],
    baseDiameter: [47, 56],
    metalHeight: [4, 9.98],
    wallHeight: [0, 4],
    bitRadius: 14
  },
  defaults: {
    metal: { diameter: 48, wings: 1, wingLength: 0, wingWidth: 0.5, sweep: 0, height: 9.98, wallHeight: 0, twist: 0, bevel: 0.4 },
    base: { diameter: 47, spikes: 1, spikeLength: 0, spikeWidth: 0.3, spikeDepth: 3, spikeHeight: 0, sweep: 0 },
    bit: { shape: 'ball', bodyRadius: 5.6, bodyLength: 3, tipRadius: 3, tipLength: 4, ribs: 0, diskRadius: 0, diskThickness: 3 }
  }
}
