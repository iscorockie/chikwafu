/**
 * Static hosting for the built storefront.
 *
 * The Express server doubles as the web host: it serves `dist/` (produced by
 * `npm run build`), falls back to `public/` for media that isn't in the bundle,
 * exposes staff uploads from `/uploads/*`, and answers unknown non-asset paths
 * with `index.html` so React Router owns client-side routing.
 */
import { existsSync, statSync, createReadStream } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { ROOT_DIR, config } from './env.mjs'

const DIST = join(ROOT_DIR, 'dist')
const PUBLIC = join(ROOT_DIR, 'public')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

const safeJoin = (root, urlPath) => {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  return join(root, clean)
}

function sendFile(res, filePath, { immutable = false } = {}) {
  const ext = extname(filePath).toLowerCase()
  res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream')
  res.setHeader(
    'Cache-Control',
    ext === '.html'
      ? 'no-cache'
      : immutable || ext === '.webp'
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
  )
  createReadStream(filePath).pipe(res)
}

export function staticHandler(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const urlPath = (req.path || '/').replace(/\/+$/, '') || '/'

  // Staff uploads live outside dist/.
  if (urlPath.startsWith('/uploads/')) {
    const p = safeJoin(config.uploadDir, urlPath.slice('/uploads'.length))
    if (existsSync(p) && statSync(p).isFile()) return sendFile(res, p)
    return next()
  }

  if (!config.serveStatic) return next()

  const ext = extname(urlPath)
  if (ext) {
    const inDist = safeJoin(DIST, urlPath)
    if (existsSync(inDist) && statSync(inDist).isFile()) return sendFile(res, inDist, { immutable: urlPath.startsWith('/assets/') })
    const inPublic = safeJoin(PUBLIC, urlPath)
    if (existsSync(inPublic) && statSync(inPublic).isFile()) return sendFile(res, inPublic)
    return next()
  }

  // Directory or route → index.html (SPA fallback).
  const dirIndex = join(safeJoin(DIST, urlPath), 'index.html')
  if (existsSync(dirIndex)) return sendFile(res, dirIndex)
  const spa = join(DIST, 'index.html')
  if (existsSync(spa)) return sendFile(res, spa)
  next()
}

/** Friendly notice when the bundle hasn't been built yet. */
export function notBuiltHandler(_req, res) {
  res.status(404).send(`<!doctype html><meta charset="utf-8"><title>Chikwafu API</title>
  <body style="font:15px/1.6 system-ui,sans-serif;background:#0a0a0f;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0">
  <main style="max-width:34rem;padding:2rem">
    <h1 style="color:#e08a4e">Chikwafu API is running</h1>
    <p>The storefront bundle (<code>dist/</code>) hasn't been built yet, so there is no UI to serve on this port.</p>
    <pre style="background:#151210;padding:1rem;border-radius:.6rem;overflow:auto">npm run build      # build the storefront
npm run dev:all    # or run Vite + this API together</pre>
    <p>API health: <a style="color:#e08a4e" href="/api/health">/api/health</a></p>
  </main></body>`)
}
