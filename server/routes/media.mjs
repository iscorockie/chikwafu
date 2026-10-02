/**
 * POST /api/media/upload — staff product-media upload.
 *
 * Files land in `server/uploads/` and are served back from `/uploads/*` by the
 * same server. To move to Cloudflare R2/S3 later, replace the storage block
 * below with a signed PUT and return the public URL — the API shape stays.
 */
import { Router } from 'express'
import multer from 'multer'
import { config } from '../lib/env.mjs'
import { ah, badRequest } from '../lib/http.mjs'
import { requireAdmin } from '../lib/auth.mjs'

const ALLOWED = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
])

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadDir),
    filename: (_req, file, cb) => {
      const base = (file.originalname || 'media')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
      const stem = base.replace(/\.[a-z0-9]+$/i, '') || 'media'
      cb(null, `${stem}-${Date.now().toString(36)}${ALLOWED.get(file.mimetype)}`)
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(badRequest('Only PNG, JPG, WebP or SVG images are allowed.'))
    cb(null, true)
  },
})

export function mediaRoutes() {
  const r = Router()

  r.post('/upload', requireAdmin, (req, res, next) => {
    upload.single('file')(req, res, (err) => (err ? next(err) : next()))
  }, ah(async (req, res) => {
    if (!req.file) throw badRequest('Attach a file in the "file" field.')
    const base = config.publicUrl || `${req.protocol}://${req.get('host')}`
    res.status(201).json({
      url: `${base}/uploads/${req.file.filename}`,
      size: req.file.size,
      type: req.file.mimetype,
    })
  }))

  return r
}
