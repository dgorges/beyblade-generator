import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { createBladeGeometry, createBitGeometry } from '../geometry/createBeyGeometry.js'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeName(name) {
  return (name || 'beyblade').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'beyblade'
}

export function exportPartStl(bey, part) {
  const exporter = new STLExporter()
  let object
  let geometry
  if (part === 'blade') {
    geometry = createBladeGeometry(bey.blade)
    object = new THREE.Mesh(geometry)
  } else if (part === 'bit') {
    object = createBitGeometry(bey.bit)
  } else {
    throw new Error('Dieser Bestandteil ist nicht exportierbar.')
  }
  const data = exporter.parse(object, { binary: true })
  geometry?.dispose()
  const blob = new Blob([data], { type: 'application/octet-stream' })
  downloadBlob(blob, `${safeName(bey.name)}-${part}.stl`)
}
