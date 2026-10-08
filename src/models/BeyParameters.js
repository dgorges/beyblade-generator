export function createDefaultBey() {
  return {
    version: 2,
    system: 'BX',
    name: 'Dragon Fury',
    type: 'attack',
    rotation: 'right',
    activeStep: 1,
    blade: {
      diameter: 47,
      bladeCount: 6,
      wingLength: 8.5,
      wingWidth: 5.2,
      wingAngle: 27,
      outerWeight: 0.85,
      thickness: 6,
      bevel: 1.0,
      innerRadius: 8.5
    },
    ratchet: {
      id: '4-60',
      label: '4-60',
      height: 6.0,
      lugs: 4
    },
    bit: {
      id: 'Point',
      height: 7.0,
      tipType: 'point',
      tipRadius: 2.6,
      tipHeight: 2.5,
      contactAngle: 35,
      contactRadius: 3.2
    }
  }
}

export function cloneBey(bey) {
  return JSON.parse(JSON.stringify(bey))
}
