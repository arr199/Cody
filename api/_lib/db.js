import postgres from 'postgres'
import { newSnippetId, snippetHash } from './snippets.js'

// postgres.js sends unknown URL parameters to the server, which rejects channel_binding
export function connectionUrl (url) {
  const parsed = new URL(url)
  if (!parsed.searchParams.has('channel_binding')) return url
  parsed.searchParams.delete('channel_binding')
  return parsed.toString()
}

let sql
export function getSql () {
  sql ??= postgres(connectionUrl(process.env.DATABASE_URL), { max: 3, idle_timeout: 20 })
  return sql
}

export async function saveSnippet (db, code) {
  const hash = snippetHash(code)
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newSnippetId()
    try {
      const inserted = await db`
        insert into snippets (id, hash, html, css, js)
        values (${id}, ${hash}, ${code.html}, ${code.css}, ${code.js})
        on conflict (hash) do nothing
        returning id`
      if (inserted.length) return { id: inserted[0].id, created: true }
      const [existing] = await db`select id from snippets where hash = ${hash}`
      if (existing) return { id: existing.id, created: false }
    } catch (error) {
      if (error.code !== '23505') throw error
    }
  }
  throw new Error('Could not find a free snippet id')
}

export async function findSnippet (db, id) {
  const [row] = await db`select html, css, js from snippets where id = ${id}`
  return row ? { html: row.html, css: row.css, js: row.js } : null
}
