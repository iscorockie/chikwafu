#!/usr/bin/env node
/**
 * Schema sanity for the deploy configs.
 *
 *   npm run verify:config
 *
 * Vercel validates `vercel.json` against a strict JSON schema
 * (`additionalProperties: false`), so any key it does not recognise fails the
 * whole build before a line of TypeScript is compiled. That includes the `"//"`
 * comment idiom — perfectly legal in `tsconfig.json` and `wrangler.jsonc`, which
 * are read as JSONC — and it fails remotely, in a dashboard, minutes after a
 * push:
 *
 *   Build Failed
 *   The `vercel.json` schema validation failed with the following message:
 *     should NOT have additional property `//`
 *
 * `wrangler.jsonc` is exempt: JSONC allows comments, and Wrangler's schema
 * expects them. Runs on plain Node — no dev-only packages required.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
const ok = (name, cond, extra = '') => {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`)
  }
}

console.log('Deploy config checks')

/* ── vercel.json must be strict JSON, and only Vercel's own keys ─────────── */
const raw = readFileSync(join(ROOT, 'vercel.json'), 'utf8')
let config
let parseError = ''
try {
  config = JSON.parse(raw)
} catch (err) {
  parseError = err.message
}
ok('vercel.json parses as strict JSON (no trailing commas, no comments)',
  !parseError, parseError)

if (config) {
  const commentKeys = []
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      if (/^(\/\/|#|_comment|comment)$/i.test(key)) commentKeys.push(`${path}${key}`)
      walk(value, `${path}${key}.`)
    }
  }
  walk(config, '')
  ok('vercel.json carries no comment keys (Vercel rejects unknown properties)',
    commentKeys.length === 0,
    commentKeys.map((k) => `"${k}"`).join(', ') +
      ' — move the note to DEPLOYMENT.md; `wrangler.jsonc` is the file that may keep comments')

  ok('the Vercel schema is pinned',
    typeof config.$schema === 'string' && config.$schema.includes('vercel.json'),
    `$schema="${config.$schema}"`)

  /* ── the build Vercel is told to run is the one CI runs ───────────────── */
  ok('framework is vite', config.framework === 'vite', `framework="${config.framework}"`)
  ok('buildCommand is `npm run build`',
    config.buildCommand === 'npm run build', `buildCommand="${config.buildCommand}"`)
  ok('outputDirectory is `dist`',
    config.outputDirectory === 'dist', `outputDirectory="${config.outputDirectory}"`)

  const shape = (name, entries, required) => {
    const list = config[name]
    const bad = !Array.isArray(list)
      ? `${name} is not an array`
      : list
        .filter((e) => !e || typeof e !== 'object' || required.some((k) => e[k] === undefined))
        .map((e) => JSON.stringify(e))
    return { valid: !bad || bad.length === 0, detail: Array.isArray(bad) ? bad.join(', ') : bad }
  }

  const rewrites = shape('rewrites', config.rewrites, ['source', 'destination'])
  ok('every rewrite has a source and a destination', rewrites.valid, rewrites.detail)

  const headers = Array.isArray(config.headers)
    ? config.headers.filter((h) => !Array.isArray(h?.headers) ||
        h.headers.some((x) => typeof x?.key !== 'string' || typeof x?.value !== 'string'))
    : ['headers is not an array']
  ok('every header rule has a source and key/value pairs',
    headers.length === 0,
    headers.map((h) => JSON.stringify(h)).join(', '))

  /* The SPA depends on this catch-all, and on the API never being rewritten
     into the static build (see DEPLOYMENT.md §2). */
  const spaRewrite = (config.rewrites ?? []).some(
    (r) => (r.source === '/(.*)' && r.destination === '/index.html') ||
           (r.source === '/:path*' && r.destination === '/index.html'),
  )
  ok('the SPA catch-all rewrite is present', spaRewrite,
    'deep links like /shop or /admin/orders would 404 on refresh without it')

  /* /api is proxied to the Express API when it runs somewhere with a database
     (DEPLOYMENT.md §10). Vercel cannot execute it — a rewrite must point off
     this deployment, and must parse as an absolute https origin. */
  const apiRewrites = (config.rewrites ?? []).filter((r) => /^\/api(\/|$)/.test(r.source ?? ''))
  const apiOk = apiRewrites.every((r) => {
    try {
      const dest = new URL(r.destination)
      return dest.protocol === 'https:' && !dest.hostname.endsWith('vercel.app')
    } catch {
      return false
    }
  })
  ok('any /api rewrite proxies to an external https host', apiOk,
    apiRewrites.map((r) => `"${r.source}" → "${r.destination}"`).join(', ') ||
      'no /api rewrite — the storefront will stay in demo mode')

  const apiLast = (() => {
    const list = config.rewrites ?? []
    const spa = list.findIndex((r) => r.destination === '/index.html')
    const api = list.findIndex((r) => /^\/api(\/|$)/.test(r.source ?? ''))
    return api === -1 || spa === -1 ? true : api < spa // rewrites apply in order
  })()
  ok('the /api rewrite is listed before the SPA catch-all', apiLast,
    'reversed, every /api call would be answered with index.html')
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s)`)
process.exit(failures === 0 ? 0 : 1)
