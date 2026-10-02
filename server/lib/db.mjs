/**
 * Tiny JSON-file persistence layer.
 *
 * The whole dataset (users, orders, payments, newsletter signups) lives in
 * `server/data/db.json`. Reads are served from memory; writes are debounced
 * and flushed atomically (temp file + rename) so a crash can never truncate
 * the ledger. Good enough for a single-node shop; swap for Postgres/Mongo by
 * replacing these five functions.
 */
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'

export const oid = () => randomUUID().replace(/-/g, '').slice(0, 24)

export function createStore(file, seed) {
  mkdirSync(dirname(file), { recursive: true })

  let state
  if (existsSync(file)) {
    try {
      state = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      const backup = `${file}.corrupt-${Date.now()}`
      renameSync(file, backup)
      console.error(`[db] ${file} was unreadable — moved to ${backup} and reseeded.`)
    }
  }
  if (!state) state = seed()

  let timer = null
  const flush = () => {
    timer = null
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(state, null, 2))
    renameSync(tmp, file)
  }

  return {
    get state() {
      return state
    },
    /** Mutate `state` then call save(); writes are coalesced every 250ms. */
    save() {
      if (timer) return
      timer = setTimeout(flush, 250)
      timer.unref?.()
    },
    flush,
  }
}
