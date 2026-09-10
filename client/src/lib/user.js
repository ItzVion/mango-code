const KEY = 'mangocode-user-id'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '')
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

export function getUserId() {
  if (typeof window === 'undefined') return null
  let id = window.localStorage.getItem(KEY)
  if (!id) {
    id = makeId()
    window.localStorage.setItem(KEY, id)
  }
  return id
}

export function apiHeaders(extra = {}) {
  const id = getUserId()
  return id ? { ...extra, 'X-Mango-User': id } : extra
}
