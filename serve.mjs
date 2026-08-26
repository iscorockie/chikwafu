import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const ROOT = join(process.cwd(), 'dist')
const PORT = Number(process.env.PORT ?? 5173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  res.end(body)
}

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0])
    const safe = normalize(url).replace(/^(\.\.[/\\])+/, '')
    let filePath = join(ROOT, safe)

    let info = await stat(filePath).catch(() => null)
    if (info?.isDirectory()) {
      filePath = join(filePath, 'index.html')
      info = await stat(filePath).catch(() => null)
    }

    // SPA fallback: unknown non-asset routes serve index.html
    if (!info) {
      if (extname(safe)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' })
      filePath = join(ROOT, 'index.html')
    }

    const ext = extname(filePath).toLowerCase()
    const body = await readFile(filePath)
    const immutable = filePath.includes(`${'assets'}/`) || ext === '.webp'
    send(res, 200, body, {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    })
  } catch (err) {
    send(res, 500, 'Server error', { 'Content-Type': 'text/plain' })
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Chikwafu storefront serving dist/ on http://0.0.0.0:${PORT}`)
})
