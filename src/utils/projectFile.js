const KEY = 'beyblade-creator-project'

export function downloadJson(bey) {
  const safeName = (bey.name || 'beyblade').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'beyblade'
  const url = URL.createObjectURL(new Blob([JSON.stringify(bey, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const value = JSON.parse(reader.result)
        if (!value || typeof value !== 'object') throw new Error('Ungültiges Beyblade-Projekt.')
        resolve(value)
      } catch (error) { reject(error) }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function saveLocal(bey) {
  try { localStorage.setItem(KEY, JSON.stringify(bey)) } catch {}
}

export function loadLocal() {
  try {
    const value = localStorage.getItem(KEY)
    return value ? JSON.parse(value) : null
  } catch { return null }
}
