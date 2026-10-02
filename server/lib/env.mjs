/**
 * Runtime configuration.
 *
 * Values come from the environment, optionally loaded from a `.env` file in
 * the server directory (or the repo root). A tiny parser is used instead of a
 * dependency so the server boots with nothing but Node + express installed.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

export const LIB_DIR = dirname(fileURLToPath(import.meta.url))
export const SERVER_DIR = join(LIB_DIR, '..')
export const ROOT_DIR = join(SERVER_DIR, '..')

function loadDotEnv() {
  for (const p of [join(SERVER_DIR, '.env'), join(ROOT_DIR, '.env')]) {
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m || line.trim().startsWith('#')) continue
      let v = m[2]
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      if (!(m[1] in process.env)) process.env[m[1]] = v
    }
  }
}
loadDotEnv()

const bool = (v, d = false) => (v === undefined ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()))

export const config = {
  port: Number(process.env.PORT ?? 5000),
  host: process.env.HOST ?? '0.0.0.0',
  /** Public origin used when building absolute URLs (uploads, webhooks). */
  publicUrl: (process.env.PUBLIC_URL ?? '').replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  adminEmail: (process.env.ADMIN_EMAIL ?? 'admin@chikwafu.ug').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? 'chikwafu2026',
  adminName: process.env.ADMIN_NAME ?? 'Chikwafu Admin',
  dataDir: process.env.DATA_DIR ?? join(SERVER_DIR, 'data'),
  uploadDir: process.env.UPLOAD_DIR ?? join(SERVER_DIR, 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
  /** Serve the built storefront from ../dist alongside the API. */
  serveStatic: bool(process.env.SERVE_STATIC, true),
  /** Simulated gateway: set to 'live' to POST to the real ZengaPay API. */
  zengaPayMode: process.env.ZENGAPAY_MODE ?? 'sandbox',
  zengaPayApiKey: process.env.ZENGAPAY_API_KEY ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

mkdirSync(config.dataDir, { recursive: true })
mkdirSync(config.uploadDir, { recursive: true })

/**
 * The JWT secret is persisted the first time the server boots so that staff
 * sessions survive restarts. Override with JWT_SECRET in production.
 */
export function resolveJwtSecret() {
  if (config.jwtSecret) return config.jwtSecret
  const file = join(config.dataDir, '.jwt-secret')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  const secret = randomBytes(48).toString('hex')
  writeFileSync(file, secret, { mode: 0o600 })
  return secret
}
