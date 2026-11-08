// Storage can be unavailable (private mode, blocked site data); settings then
// just don't persist.
export function readStored (key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored (key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function removeStored (key) {
  try {
    localStorage.removeItem(key)
  } catch {}
}
