/**
 * POST /api/media/upload — staff product-media upload.
 *
 * Two destinations behind the same response shape:
 *
 *   · Supabase Storage — used when SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
 *     Required anywhere without a writable disk (serverless), and it puts the
 *     photos on a CDN instead of the API box.
 *   · `server/uploads/` — the local default, served back from `/uploads/*`.
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

const safeName = (original) => {
  const base = (original || 'media').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  const stem = base.replace(/\.[a-z0-9]+$/i, '') || 'media'
  return `${stem}-${Date.now().toString(36)}`
}

const useStorage = !!(config.supabaseUrl && config.supabaseServiceKey)

const upload = multer({
  storage: useStorage
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, config.uploadDir),
        filename: (_req, file, cb) => cb(null, `${safeName(file.originalname)}${ALLOWED.get(file.mimetype)}`),
      }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(badRequest('Only PNG, JPG, WebP or SVG images are allowed.'))
    cb(null, true)
  },
})

/** PUT the bytes into the Supabase bucket and return its public URL. */
async function putToSupabase(file) {
  const key = `uploads/${safeName(file.originalname)}${ALLOWED.get(file.mimetype)}`
  const res = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${key}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': file.mimetype,
        'x-upsert': 'true',
      },
      body: file.buffer,
      signal: AbortSignal.timeout(30_000),
    },
  )
  if (!res.ok) throw badRequest(`Storage rejected the upload (${res.status}).`)
  return `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${key}`
}

export function mediaRoutes() {
  const r = Router()

  r.post('/upload', requireAdmin, (req, res, next) => {
    upload.single('file')(req, res, (err) => (err ? next(err) : next()))
  }, ah(async (req, res) => {
    if (!req.file) throw badRequest('Attach a file in the "file" field.')

    const url = useStorage
      ? await putToSupabase(req.file)
      : `${config.publicUrl || `${req.protocol}://${req.get('host')}`}/uploads/${req.file.filename}`

    res.status(201).json({ url, size: req.file.size, type: req.file.mimetype })
  }))

  return r
}
