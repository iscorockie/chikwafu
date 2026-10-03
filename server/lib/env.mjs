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
  /** Where the storefront lives — used for links in outgoing email. */
  storeUrl: (process.env.STORE_URL ?? 'https://iscorockie.github.io/chikwafu').replace(/\/$/, ''),
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

  /* ─── Persistence ────────────────────────────────────────────────────────
   * DATABASE_URL switches the store from server/data/db.json to Postgres
   * (Supabase). Without it nothing about the local dev experience changes. */
  databaseUrl: process.env.DATABASE_URL ?? '',
  /** Hostname only, for the boot log — never log a connection string. */
  pgLabel: (() => {
    try { return new URL(process.env.DATABASE_URL ?? '').host || 'postgres' } catch { return 'postgres' }
  })(),
  pgPoolMax: Number(process.env.PG_POOL_MAX ?? 5),
  /** Supabase requires TLS; a local/embedded Postgres does not. */
  pgSsl: bool(process.env.PG_SSL, /postgres|supabase|neon|railway|render/i.test(process.env.DATABASE_URL ?? '')),
  /** Seed the 34-order demo ledger into a fresh Postgres database. Off by default. */
  seedDemoLedger: bool(process.env.SEED_DEMO_LEDGER, false),

  /* ─── Supabase Storage (product media) ─────────────────────────────────── */
  supabaseUrl: (process.env.SUPABASE_URL ?? '').replace(/\/$/, ''),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  supabaseBucket: process.env.SUPABASE_BUCKET ?? 'media',

  /* ─── Zoho ─────────────────────────────────────────────────────────────
   * Each integration is independent and silently disabled without its key,
   * so you can adopt them one at a time. */
  zeptomailKey: process.env.ZEPTOMAIL_API_KEY ?? '',
  zeptomailFrom: process.env.ZEPTOMAIL_FROM ?? 'orders@chikwafu.ug',
  zeptomailFromName: process.env.ZEPTOMAIL_FROM_NAME ?? 'Chikwafu Appliances',
  campaignsToken: process.env.ZOHO_CAMPAIGNS_TOKEN ?? '',
  campaignsListKey: process.env.ZOHO_CAMPAIGNS_LIST_KEY ?? '',
  campaignsRegion: process.env.ZOHO_REGION ?? 'com',
  deskToken: process.env.ZOHO_DESK_TOKEN ?? '',
  deskOrgId: process.env.ZOHO_DESK_ORG_ID ?? '',

  nodeEnv: process.env.NODE_ENV ?? 'development',
}

/**
 * Creating the runtime directories is a convenience, not a requirement: a
 * read-only filesystem (serverless) must not stop the API from booting.
 */
function ensureDir(dir, why) {
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    console.warn(`[env] cannot create ${dir} (${err.code}) — ${why}`)
  }
}
if (!config.databaseUrl) ensureDir(config.dataDir, 'the JSON ledger needs a writable DATA_DIR')
if (!config.supabaseUrl) ensureDir(config.uploadDir, 'local media uploads need a writable UPLOAD_DIR')

/**
 * The JWT secret is persisted the first time the server boots so that staff
 * sessions survive restarts. Override with JWT_SECRET in production.
 */
export function resolveJwtSecret() {
  if (config.jwtSecret) return config.jwtSecret
  const file = join(config.dataDir, '.jwt-secret')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  const secret = randomBytes(48).toString('hex')
  try {
    writeFileSync(file, secret, { mode: 0o600 })
  } catch (err) {
    // Read-only filesystem (serverless). An ephemeral secret still works, it
    // just signs every staff member out on the next deploy.
    console.warn(
      `[env] cannot persist the JWT secret (${err.code}) — using an ephemeral one. ` +
        'Set JWT_SECRET so staff sessions survive a restart.',
    )
  }
  return secret
}
