import { createClient } from '@libsql/client/http'
import type { Client } from '@libsql/client'

let _client: Client | null = null

export function getDbClient(): Client | null {
  if (!import.meta.env.VITE_TURSO_URL) return null
  if (!_client) {
    _client = createClient({
      url: import.meta.env.VITE_TURSO_URL,
      authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
    })
  }
  return _client
}
