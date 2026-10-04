#!/usr/bin/env node
/**
 * End-to-end check for the persistence layer.
 *
 *   npm run verify:pg
 *
 * Boots a real, throwaway PostgreSQL server (embedded-postgres), applies
 * supabase/schema.sql, runs the actual Express API against it over TCP, and
 * exercises the endpoints the storefront uses — order creation with
 * server-side re-pricing, tracking, status changes, payments, newsletter and
 * the admin ledger. Then it restarts the server to prove the data really is in
 * the database and not in process memory, and re-runs the same checks against
 * the JSON backend so that path can't silently regress.
 *
 * Requires no Supabase account: Supabase is managed PostgreSQL, so this runs
 * the identical wire protocol and the identical SQL.
 *
 * Dev-only dependency:  npm i --no-save embedded-postgres
 */
import { spawn } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.VERIFY_PORT ?? 5399)
const PG_PORT = Number(process.env.VERIFY_PG_PORT ?? 55432)
const BASE = `http://127.0.0.1:${PORT}`

let failures = 0
const ok = (name, cond, extra = '') => {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`)
  }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON */ }
  return { status: res.status, json, text }
}

/** Spawn the real server and wait until it answers /api/health. */
function startServer(env) {
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: ROOT,
    env: { ...process.env, ...env, PORT: String(PORT), HOST: '127.0.0.1', SERVE_STATIC: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const logs = []
  child.stdout.on('data', (d) => logs.push(String(d)))
  child.stderr.on('data', (d) => logs.push(String(d)))
  return { child, logs }
}

async function waitForHealth(handle, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return res.json()
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250))
  }
  console.error('--- server output ---')
  console.error(handle.logs.join('') || '(none)')
  throw new Error('server did not become healthy in time')
}

const ADMIN = { email: 'verify@chikwafu.ug', password: 'verify-pass-123' }

/** The checks that must hold on either backend. */
async function exercise(label) {
  console.log(`\n── ${label} ──`)

  const health = await api('/api/health')
  ok('GET /api/health is 200', health.status === 200, `got ${health.status}`)
  ok('reports itself as chikwafu-api', health.json?.name === 'chikwafu-api')
  ok('catalogue loaded', health.json?.products > 1000, `${health.json?.products} products`)

  /* admin auth */
  const bad = await api('/api/auth/login', { method: 'POST', body: { email: ADMIN.email, password: 'nope' } })
  ok('wrong password is rejected', bad.status === 401, `got ${bad.status}`)
  const login = await api('/api/auth/login', { method: 'POST', body: ADMIN })
  ok('admin can sign in', login.status === 200 && !!login.json?.token, `got ${login.status}`)
  const token = login.json?.token
  const me = await api('/api/auth/me', { token })
  ok('GET /api/auth/me returns the staff member', me.json?.email === ADMIN.email)
  const gate = await api('/api/orders')
  ok('admin ledger is closed without a token', gate.status === 401, `got ${gate.status}`)

  /* products */
  const list = await api('/api/products?limit=2')
  const product = list.json?.items?.[0]
  ok('GET /api/products returns the catalogue', !!product, `status ${list.status}`)
  const facets = await api('/api/products/facets')
  ok('facets expose categories', Array.isArray(facets.json?.categories) && facets.json.categories.length > 0)

  /* place an order — the server must re-price it */
  const qty = 2
  const expectedSubtotal = product.price * qty
  const placed = await api('/api/orders', {
    method: 'POST',
    body: {
      items: [{ productId: product.id, qty }],
      coupon: 'KARIBU10',
      payment: 'cod',
      handledBy: 'agent',
      delivery: {
        fullName: 'Verify Nakato', phone: '0772123456', email: 'verify-customer@example.com',
        region: 'Kampala', town: 'Ntinda', address: 'Plot 12, Verification Road',
      },
    },
  })
  ok('POST /api/orders is 201', placed.status === 201, `got ${placed.status}: ${placed.text.slice(0, 120)}`)
  const order = placed.json
  const expectedTotalWithCoupon = Math.round(expectedSubtotal * 0.9) + 15000
  ok('server applied the coupon', order?.discount === Math.round(expectedSubtotal * 0.1), `discount ${order?.discount}`)
  ok('server computed the total', order?.totalPrice === expectedTotalWithCoupon,
    `expected ${expectedTotalWithCoupon}, got ${order?.totalPrice}`)
  ok('order starts pending + unpaid', order?.status === 'pending' && order?.isPaid === false)
  ok('handledBy was recorded', order?.handledBy === 'agent', `got ${order?.handledBy}`)
  ok('ref follows the CHK- shape', /^CHK-/.test(order?.ref ?? ''), `got ${order?.ref}`)

  /* validation */
  const rejected = await api('/api/orders', {
    method: 'POST',
    body: { items: [{ productId: 'no-such-product', qty: 1 }], payment: 'cod', delivery: { fullName: 'X Y', phone: '0772123456', address: 'Somewhere long enough', region: 'Kampala' } },
  })
  ok('unknown product is rejected', rejected.status === 400, `got ${rejected.status}`)

  /* public tracking */
  const track = await api(`/api/orders/track?ref=${order.ref}&phone=0772123456`)
  ok('tracking finds the order', track.status === 200 && track.json?.ref === order.ref, `got ${track.status}`)
  ok('tracking exposes a timeline', Array.isArray(track.json?.timeline) && track.json.timeline.length === 4)
  const wrongPhone = await api(`/api/orders/track?ref=${order.ref}&phone=0770000000`)
  ok('tracking refuses a mismatched phone', wrongPhone.status === 404, `got ${wrongPhone.status}`)

  /* payment → paid + processing */
  const pay = await api('/api/payments/zengapay/collections', {
    method: 'POST',
    body: { amount: order.totalPrice, currency: 'UGX', phone: '0772123456', network: 'MTN', transactionReference: order.ref },
  })
  ok('mobile-money collection succeeds', pay.status === 200 && pay.json?.status === 'SUCCESS', `got ${pay.status} ${pay.json?.status}`)
  ok('collection flips the order to processing', pay.json?.orderStatus === 'processing', `got ${pay.json?.orderStatus}`)
  const wrongAmount = await api('/api/payments/zengapay/collections', {
    method: 'POST',
    body: { amount: 500, currency: 'UGX', phone: '0772123456', network: 'MTN', transactionReference: order.ref },
  })
  ok('a mismatched amount is rejected', wrongAmount.status === 400, `got ${wrongAmount.status}`)

  /* admin: ledger, status, stats */
  const ledger = await api('/api/orders', { token })
  ok('admin ledger contains the order', ledger.json?.some((o) => o.ref === order.ref), `${ledger.json?.length} orders`)
  ok('ledger rows keep the API shape', Array.isArray(ledger.json?.[0]?.items) && !!ledger.json?.[0]?.shippingAddress?.region)
  const advance = await api(`/api/orders/${order._id}/status`, { method: 'PUT', body: { status: 'delivered' }, token })
  ok('status can be advanced', advance.json?.status === 'delivered', `got ${advance.json?.status}`)
  ok('history is appended', (advance.json?.history ?? []).length >= 3, `${advance.json?.history?.length} entries`)
  const again = await api(`/api/orders/${order._id}/status`, { method: 'PUT', body: { status: 'delivered' }, token })
  ok('a delivered agent order does not re-file a ticket', again.status === 200)
  const stats = await api('/api/orders/stats', { token })
  ok('stats report revenue', stats.json?.totalRevenue > 0, `revenue ${stats.json?.totalRevenue}`)
  ok('stats report the catalogue size', stats.json?.totalProducts === health.json?.products)
  const payments = await api('/api/payments/zengapay/collections', { token })
  ok('payment attempts are listed', Array.isArray(payments.json) && payments.json.length > 0)

  /* newsletter */
  const sub1 = await api('/api/newsletter', { method: 'POST', body: { email: 'verify-list@example.com' } })
  ok('newsletter sign-up is 201', sub1.status === 201, `got ${sub1.status}`)
  const sub2 = await api('/api/newsletter', { method: 'POST', body: { email: 'verify-list@example.com' } })
  ok('a repeat sign-up is de-duplicated', sub2.status === 200 && sub2.json?.alreadySubscribed === true, `got ${sub2.status}`)
  const badEmail = await api('/api/newsletter', { method: 'POST', body: { email: 'not-an-email' } })
  ok('a bad email is rejected', badEmail.status === 400, `got ${badEmail.status}`)
  const list2 = await api('/api/newsletter', { token })
  ok('admin can read the sign-up list', list2.json?.some((n) => n.email === 'verify-list@example.com'))

  /* media upload needs a real file; assert the gate instead */
  const upload = await api('/api/media/upload', { method: 'POST' })
  ok('media upload is admin-only', upload.status === 401, `got ${upload.status}`)

  return order
}

/* ─────────────────────────────── run ─────────────────────────────────────── */

console.log('Chikwafu persistence check')
console.log(`  PostgreSQL on :${PG_PORT}, API on :${PORT}`)

/* ── 1. Postgres (Supabase-compatible) ─────────────────────────────────── */
rmSync('/tmp/chikwafu-verify-pg', { recursive: true, force: true })
let EmbeddedPostgres
try {
  ;({ default: EmbeddedPostgres } = await import('embedded-postgres'))
} catch {
  console.error(`
embedded-postgres is not installed. It ships ~59 MB of PostgreSQL binaries, so
it is deliberately not a dependency of this project — install it on demand:

    npm i --no-save embedded-postgres && npm run verify:pg
`)
  process.exit(2)
}
const pg = new EmbeddedPostgres({
  databaseDir: '/tmp/chikwafu-verify-pg',
  user: 'postgres', password: 'postgres',
  port: PG_PORT, persistent: false,
})
await pg.initialise()
await pg.start()
await pg.createDatabase('chikwafu')
const probe = pg.getPgClient()
await probe.connect()
const version = (await probe.query('select version() as v')).rows[0].v.split(',')[0]
await probe.end()
console.log(`  ${version.replace('PostgreSQL ', 'PostgreSQL ')} ready`)

// Apply the same schema Supabase will run.
const admin = await pg.getPgClient()
await admin.connect()
await admin.query(`select pg_terminate_backend(pid) from pg_stat_activity where datname='chikwafu' and pid <> pg_backend_pid()`)
await admin.end()
const schemaClient = await pg.getPgClient('chikwafu')
await schemaClient.connect()
await schemaClient.query(readFileSync(join(ROOT, 'supabase/schema.sql'), 'utf8'))
const tables = await schemaClient.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`)
await schemaClient.end()
console.log(`  schema applied: ${tables.rows.map((r) => r.table_name).join(', ')}`)

const DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PG_PORT}/chikwafu`
const pgEnv = {
  DATABASE_URL, PG_SSL: 'false',
  JWT_SECRET: 'verify-secret-verify-secret-verify-secret',
  ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password,
  DATA_DIR: '/tmp/chikwafu-verify-data', UPLOAD_DIR: '/tmp/chikwafu-verify-uploads',
}

let server = startServer(pgEnv)
let health = await waitForHealth(server)
ok('\n[postgres] boots against DATABASE_URL', health.store === 'postgres', `store=${health.store}`)
const pgOrder = await exercise('PostgreSQL / Supabase backend')

// Restart: anything still readable afterwards was really persisted.
server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 600))
server = startServer(pgEnv)
health = await waitForHealth(server)
const after = await api(`/api/orders/track?ref=${pgOrder.ref}&phone=0772123456`)
console.log('')
ok('[postgres] order survives a restart', after.status === 200 && after.json?.status === 'delivered',
  `got ${after.status} ${after.json?.status}`)
const loginAfter = await api('/api/auth/login', { method: 'POST', body: ADMIN })
ok('[postgres] staff account survives a restart', loginAfter.status === 200)
const statsAfter = await api('/api/orders/stats', { token: loginAfter.json?.token })
ok('[postgres] ledger count survives a restart', statsAfter.json?.totalOrders >= 1, `${statsAfter.json?.totalOrders} orders`)
server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 600))
await pg.stop()

/* ── 2. JSON backend (regression) ──────────────────────────────────────── */
rmSync('/tmp/chikwafu-verify-json', { recursive: true, force: true })
server = startServer({
  ...pgEnv,
  DATABASE_URL: '',
  DATA_DIR: '/tmp/chikwafu-verify-json',
  UPLOAD_DIR: '/tmp/chikwafu-verify-json-uploads',
})
health = await waitForHealth(server)
console.log('')
ok('[json] boots without DATABASE_URL', health.store === 'json', `store=${health.store}`)
ok('[json] seeds the demo ledger', health.orders > 0, `${health.orders} orders`)
await exercise('JSON file backend (unchanged behaviour)')
server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 400))

/* ── 3. No Supabase + no writable disk: uploads must fail loudly, not 500 ── */
console.log('\n── Serverless media gate ──')
server = startServer({
  ...pgEnv,
  DATABASE_URL: '',
  DATA_DIR: '/tmp/chikwafu-verify-ro-data',
  // A path through a *file* can never be created — the read-only-disk case.
  UPLOAD_DIR: join(ROOT, 'package.json', 'uploads'),
})
health = await waitForHealth(server)
const roLogin = await api('/api/auth/login', { method: 'POST', body: ADMIN })
const roUpload = await api('/api/media/upload', { method: 'POST', token: roLogin.json?.token })
ok('[no-disk] upload without a destination is a clean 503', roUpload.status === 503,
  `got ${roUpload.status}`)
ok('[no-disk] the 503 explains both remedies',
  /SUPABASE_URL/.test(roUpload.json?.error ?? '') && /UPLOAD_DIR/.test(roUpload.json?.error ?? ''),
  roUpload.json?.error ?? '(no body)')
server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 400))

/* ── 4. Cross-origin storefront (Vercel/Pages → API on another host) ──────
 * The storefront is deployed separately from the API, so the browser sends an
 * `Origin` header and CORS decides whether the response is readable. Unset
 * CORS_ORIGINS keeps the old `*`; a list must allow those origins and only
 * those. (Same-origin calls — a proxy/rewrite — send no Origin at all.) ──── */
console.log('\n── Cross-origin storefront ──')
const ORIGIN = 'https://chikwafu.vercel.app'
server = startServer({
  ...pgEnv,
  DATABASE_URL: '',
  DATA_DIR: '/tmp/chikwafu-verify-cors',
  UPLOAD_DIR: '/tmp/chikwafu-verify-cors-uploads',
})
await waitForHealth(server)

const withOrigin = (origin, extra = {}) =>
  fetch(`${BASE}/api/health`, { headers: { Origin: origin, ...extra } })

let res = await withOrigin(ORIGIN)
ok('[cors] no CORS_ORIGINS set → any origin is allowed (development default)',
  res.headers.get('access-control-allow-origin') === '*',
  `allow-origin=${res.headers.get('access-control-allow-origin')}`)
server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 400))

server = startServer({
  ...pgEnv,
  DATABASE_URL: '',
  DATA_DIR: '/tmp/chikwafu-verify-cors',
  UPLOAD_DIR: '/tmp/chikwafu-verify-cors-uploads',
  CORS_ORIGINS: `${ORIGIN}, https://iscorockie.github.io/chikwafu/`,
})
await waitForHealth(server)

res = await withOrigin(ORIGIN)
ok('[cors] a listed origin is allowed', res.headers.get('access-control-allow-origin') === ORIGIN,
  `allow-origin=${res.headers.get('access-control-allow-origin')}`)

/* The list holds a full site URL here (a path and a trailing slash). The Origin
   header never has a path, so the entry has to be reduced to its origin or it
   would match nothing. */
res = await withOrigin('https://iscorockie.github.io')
ok('[cors] a pasted site URL in the list is reduced to its origin',
  res.headers.get('access-control-allow-origin') === 'https://iscorockie.github.io',
  `allow-origin=${res.headers.get('access-control-allow-origin')}`)

res = await withOrigin('https://not-chikwafu.example')
ok('[cors] an unlisted origin gets no CORS headers',
  res.headers.get('access-control-allow-origin') === null,
  `allow-origin=${res.headers.get('access-control-allow-origin')}`)

res = await fetch(`${BASE}/api/health`, {
  method: 'OPTIONS',
  headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'GET' },
})
ok('[cors] preflight answers for a listed origin',
  res.status < 400 && res.headers.get('access-control-allow-origin') === ORIGIN,
  `status=${res.status} allow-origin=${res.headers.get('access-control-allow-origin')}`)

res = await fetch(`${BASE}/api/health`)
ok('[cors] a request without an Origin still works (curl, health checks, proxies)',
  res.ok, `status=${res.status}`)

ok('[cors] the blocked origin is named in the server log',
  server.logs.join('').includes('not-chikwafu.example'),
  'an operator debugging a CORS rejection should find it in the logs')

server.child.kill('SIGTERM')
await new Promise((r) => setTimeout(r, 400))

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s)`)
process.exit(failures === 0 ? 0 : 1)
