import { zipSync } from 'fflate'

function safeName(name) {
  return (name || 'beyblade').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'beyblade'
}

function fileLabel(label) {
  return label.replace(/\(.*?\)/g, '').trim().replace(/[^a-z0-9äöüß-]+/gi, '-').replace(/^-+|-+$/g, '')
}

export function writeStl(chunks) {
  const total = chunks.reduce((n, c) => n + c.indices.length / 3, 0)
  const buffer = new ArrayBuffer(84 + total * 50)
  const view = new DataView(buffer)
  view.setUint32(80, total, true)
  let offset = 84
  for (const { positions, indices, transform } of chunks) {
    const p = i => transform ? transform(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]) : [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]
    for (let t = 0; t < indices.length; t += 3) {
      const a = p(indices[t]), b = p(indices[t + 1]), c = p(indices[t + 2])
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len; ny /= len; nz /= len
      for (const v of [nx, ny, nz, ...a, ...b, ...c]) { view.setFloat32(offset, v, true); offset += 4 }
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}

export function assemblyTransform(part, height) {
  const a = (part.rot * Math.PI) / 180
  const cos = Math.cos(a), sin = Math.sin(a)
  const dz = part.z + (part.flip ? height : 0)
  return (x, y, z) => {
    const fy = part.flip ? -y : y
    const fz = part.flip ? -z : z
    return [x * cos - fy * sin, x * sin + fy * cos, fz + dz]
  }
}

export function exportZip({ bey, kit, locked, design, heights }) {
  const files = {}
  const meshFor = part => (part.role === 'locked' ? locked[part.id] : design[part.id])
  kit.parts.forEach((part, index) => {
    const mesh = meshFor(part)
    if (!mesh) return
    const prefix = part.role === 'locked' ? 'kit' : 'design'
    files[`${String(index + 1).padStart(2, '0')}-${prefix}-${fileLabel(part.label)}.stl`] = writeStl([mesh])
  })
  files['Assembly-nur-Vorschau.stl'] = writeStl(kit.parts.filter(p => meshFor(p)).map(part => ({ ...meshFor(part), transform: assemblyTransform(part, heights[part.id]) })))
  files['projekt.json'] = new TextEncoder().encode(JSON.stringify(bey, null, 2))
  const zip = zipSync(files, { level: 6 })
  const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName(bey.name)}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
