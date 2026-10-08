import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { readStl, weld, components, bbox } from './stl-io.mjs'

const dir = process.argv[2] || 'reference'
const out = process.argv[3] || 'reference/renders'
mkdirSync(out, { recursive: true })
const PX = 12

function png(w, h, gray) {
  const raw = Buffer.alloc((w + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w + 1)] = 0; for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = gray[y * w + x] }
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
  const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

function render(c, b, ax, ay, az, flip) {
  const w = Math.ceil(b.size[ax] * PX) + 4, h = Math.ceil(b.size[ay] * PX) + 4
  const depth = new Float32Array(w * h).fill(-Infinity)
  const shade = new Uint8Array(w * h).fill(255)
  const v = c.verts
  for (let t = 0; t < c.tris.length; t += 3) {
    const p = [0, 1, 2].map(k => { const i = c.tris[t + k] * 3; return [(v[i + ax] - b.min[ax]) * PX + 2, (b.max[ay] - v[i + ay]) * PX + 2, flip * v[i + az]] })
    const e1 = [0, 1, 2].map(k => v[c.tris[t + 1] * 3 + k] - v[c.tris[t] * 3 + k])
    const e2 = [0, 1, 2].map(k => v[c.tris[t + 2] * 3 + k] - v[c.tris[t] * 3 + k])
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const len = Math.hypot(...n) || 1
    const lum = Math.round(40 + 200 * Math.abs(n[az] / len))
    const minX = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0]))), maxX = Math.min(w - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])))
    const minY = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1]))), maxY = Math.min(h - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])))
    const area = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1])
    if (Math.abs(area) < 1e-9) continue
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5
      const w0 = ((p[1][0] - px) * (p[2][1] - py) - (p[2][0] - px) * (p[1][1] - py)) / area
      const w1 = ((p[2][0] - px) * (p[0][1] - py) - (p[0][0] - px) * (p[2][1] - py)) / area
      const w2 = 1 - w0 - w1
      if (w0 < 0 || w1 < 0 || w2 < 0) continue
      const z = w0 * p[0][2] + w1 * p[1][2] + w2 * p[2][2]
      if (z > depth[y * w + x]) { depth[y * w + x] = z; shade[y * w + x] = lum }
    }
  }
  return png(w, h, shade)
}

for (const f of readdirSync(dir).filter(f => f.endsWith('.stl'))) {
  const tag = f.match(/Pt (\d)/)[1]
  components(weld(readStl(`${dir}/${f}`))).forEach((c, i) => {
    const b = bbox(c.verts)
    writeFileSync(`${out}/p${tag}-${i}-top.png`, render(c, b, 0, 1, 2, 1))
    writeFileSync(`${out}/p${tag}-${i}-bottom.png`, render(c, b, 0, 1, 2, -1))
    writeFileSync(`${out}/p${tag}-${i}-side.png`, render(c, b, 0, 2, 1, -1))
  })
}
