import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate'

const PARAM = 'bey'

function toBase64Url(bytes) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

export function shareUrl(bey) {
  const { activeStep, ...data } = bey
  const encoded = toBase64Url(deflateSync(strToU8(JSON.stringify(data)), { level: 9 }))
  return `${location.origin}${location.pathname}#${PARAM}=${encoded}`
}

export function readSharedProject() {
  const match = location.hash.match(new RegExp(`[#&]${PARAM}=([A-Za-z0-9_-]+)`))
  if (!match) return null
  try {
    return JSON.parse(strFromU8(inflateSync(fromBase64Url(match[1]))))
  } catch {
    return null
  }
}

export function clearSharedProject() {
  history.replaceState(null, '', location.pathname + location.search)
}

export function shareText(bey, url) {
  return `Schau dir mein Beyblade „${bey.name}“ an: ${url}`
}

export function whatsappUrl(bey, url) {
  return `https://wa.me/?text=${encodeURIComponent(shareText(bey, url))}`
}

export function mailUrl(bey, url) {
  const subject = `Mein Beyblade „${bey.name}“`
  const body = `${shareText(bey, url)}\n\nÜber den Link öffnest du das Beyblade direkt im Beyblade Creator.`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function fileName(bey, ext) {
  const safe = (bey.name || 'beyblade').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'beyblade'
  return `${safe}.${ext}`
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
