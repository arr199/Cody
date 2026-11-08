import { SNIPPETS_API } from '../utils/API'

export function sharedSnippetId (pathname) {
  return pathname.match(/^\/s\/([0-9A-Za-z]{8})\/?$/)?.[1] ?? null
}

export function isSharedPath (pathname) {
  return pathname.startsWith('/s/')
}

export function snippetUrl (id, origin = window.location.origin) {
  return `${origin}/s/${id}`
}

export async function fetchSnippet (id) {
  const response = await fetch(`${SNIPPETS_API}/${id}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Loading the shared code failed (${response.status})`)
  const { html, css, js } = await response.json()
  return { html, css, js }
}

export async function saveSnippet ({ html, css, js }) {
  const response = await fetch(SNIPPETS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, css, js })
  })
  if (!response.ok) throw new Error(`Saving the code failed (${response.status})`)
  const { id } = await response.json()
  return id
}
