/**
 * Chikwafu API — entry point.
 *
 *   node server/index.mjs          (or: npm run server / npm run dev:all)
 *
 * Serves the JSON API under /api/* and, when present, the built storefront
 * from dist/ on the same origin — so the deployed app and the backend share
 * one port and need no CORS configuration.
 */
import express from 'express'
import cors from 'cors'
import { config, ROOT_DIR } from './lib/env.mjs'
import { openStore } from './lib/store.mjs'
import { attachUser } from './lib/auth.mjs'
import { staticHandler, notBuiltHandler } from './lib/static.mjs'
import { productCount } from './lib/catalog.mjs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

async function main() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  /*
   * CORS. Unset CORS_ORIGINS keeps the development default (`*`). In production
   * the storefront usually sits on a different host (Vercel, GitHub Pages), so
   * either list its origin here or proxy /api through that host's own rewrites —
   * a same-origin fetch needs no CORS at all.
   */
  const allowAll = config.corsOrigins.length === 0 || config.corsOrigins.includes('*')
  if (allowAll) {
    app.use(cors())
  } else {
    const warned = new Set()
    app.use(
      cors({
        origin(origin, cb) {
          // No Origin header: curl, health checks, server-to-server.
          if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
          if (!warned.has(origin)) {
            warned.add(origin)
            console.warn(`[cors] blocked ${origin} — add it to CORS_ORIGINS to allow it`)
          }
          // Serve without the CORS headers rather than erroring: the browser
          // blocks the response and the request is logged server-side.
          return cb(null, false)
        },
        credentials: false,
      }),
    )
  }
  app.use(express.json({ limit: '256kb' }))
  app.use(attachUser)

  // Request log — one line per request, quiet for static assets.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const t = Date.now()
      res.on('finish', () => {
        console.log(`${res.statusCode} ${req.method} ${req.originalUrl} ${Date.now() - t}ms`)
      })
    }
    next()
  })

  const store = await openStore()

  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'ok',
      name: 'chikwafu-api',
      products: productCount(),
      orders: await store.orders.count(),
      store: store.kind,
      version: 1,
      time: new Date().toISOString(),
    })
  })

  const { authRoutes } = await import('./routes/auth.mjs')
  const { productRoutes } = await import('./routes/products.mjs')
  const { orderRoutes } = await import('./routes/orders.mjs')
  const { paymentRoutes } = await import('./routes/payments.mjs')
  const { mediaRoutes } = await import('./routes/media.mjs')
  const { newsletterRoutes } = await import('./routes/newsletter.mjs')

  app.use('/api/auth', authRoutes(store))
  app.use('/api/products', productRoutes())
  app.use('/api/orders', orderRoutes(store))
  app.use('/api/payments', paymentRoutes(store))
  app.use('/api/media', mediaRoutes())
  app.use('/api/newsletter', newsletterRoutes(store))

  app.use('/api', (_req, res) => res.status(404).json({ message: 'Unknown API endpoint.' }))

  // Storefront (and its media) on the same origin.
  app.use(staticHandler)
  app.use(notBuiltHandler)

  // Central error handler: HttpError status, Multer codes, else 500.
  app.use((err, _req, res, _next) => {
    let status = err.status ?? 500
    if (err.name === 'MulterError') status = 400
    if (err.type === 'entity.parse.failed') status = 400
    if (status >= 500) console.error('[error]', err)
    res.status(status).json({ message: status >= 500 ? 'Server error.' : err.message })
  })

  app.listen(config.port, config.host, () => {
    console.log(`Chikwafu API listening on http://${config.host}:${config.port}`)
    console.log(`  · API      /api/health (${productCount()} products loaded)`)
    console.log(`  · Store    ${config.serveStatic && existsSync(join(ROOT_DIR, 'dist', 'index.html')) ? 'serving dist/' : 'dist/ not built yet'}`)
    console.log(`  · Data     ${store.kind === 'postgres' ? config.pgLabel + ' (Postgres)' : join(config.dataDir, 'db.json')}`)
  })

  // Release the pool cleanly on platform shutdown.
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      await store.close()
      process.exit(0)
    })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
