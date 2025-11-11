import Store from 'electron-store'

const store = new Store({ name: 'window-state' })

export function loadWindowState(defaults = { width: 960, height: 640 }) {
  const s = store.get('bounds')
  if (!s) return { ...defaults }
  return { ...defaults, ...s }
}

export function saveWindowState(bounds) {
  store.set('bounds', bounds)
}

export function saveAlwaysOnTop(flag) {
  store.set('alwaysOnTop', !!flag)
}

export function loadAlwaysOnTop() {
  return !!store.get('alwaysOnTop')
}

export function saveSession(session) {
  store.set('session', session)
}

export function loadSession() {
  return store.get('session') || null
}

export function loadQuicklinks() {
  return store.get('quicklinks') || []
}

export function saveQuicklinks(list) {
  store.set('quicklinks', Array.isArray(list) ? list : [])
}

export function loadOpacity() {
  const v = store.get('opacity')
  if (typeof v === 'number' && v >= 0.2 && v <= 1) return v
  return 1
}

export function saveOpacity(v) {
  const n = Math.max(0.2, Math.min(1, Number(v) || 1))
  store.set('opacity', n)
  return n
}
