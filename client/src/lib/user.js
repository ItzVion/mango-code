const KEY = 'mangocode-guest-id'
const ACCOUNT_KEY = 'mangocode-account'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '')
  const bytes = new Uint8Array(24)
  if (crypto?.getRandomValues) crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getGuestId() {
  if (typeof window === 'undefined') return null
  let id = window.localStorage.getItem(KEY)
  if (!id) { id = makeId(); window.localStorage.setItem(KEY, id) }
  return id
}

export function getUserId() { return getGuestId() }

export function getAccount() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) || 'null') } catch { return null }
}

export function setAccount(account) {
  if (typeof window === 'undefined') return
  if (account) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  else window.localStorage.removeItem(ACCOUNT_KEY)
  window.dispatchEvent(new Event('mangocode-auth-change'))
}

export function apiHeaders(extra = {}) {
  const id = getGuestId()
  return id ? { ...extra, 'X-Mango-User': id } : extra
}
