let worker = null
let seq = 0
const pending = new Map()

function ensureWorker() {
  if (worker) return worker
  worker = new Worker(new URL('../workers/geometry.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    if (data.type === 'error') entry.reject(new Error(data.message))
    else entry.resolve(data.type === 'skipped' ? null : data)
  }
  return worker
}

function request(message) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ensureWorker().postMessage({ ...message, id })
  })
}

export function loadKit(kit) {
  return request({ type: 'init', kit })
}

export function buildBey(bey) {
  return request({ type: 'build', bey: JSON.parse(JSON.stringify(bey)) })
}
