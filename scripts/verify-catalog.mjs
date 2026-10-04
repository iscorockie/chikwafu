#!/usr/bin/env node
/**
 * Integrity checks for the product catalogue.
 *
 *   npm run verify:catalog
 *
 * `src/lib/catalog.ts` is 67k lines of hand-merged supplier data — the full
 * Ayne Kampala range plus the Jumia core appliances — so it drifts. Every check
 * here exists because that drift reached real screens at least once:
 *
 *   · a duplicate slug (two Galaxy Tab A9 listings, one URL) left the A9+
 *     unreachable — `getProduct` returns the first match;
 *   · nine products carried the importer's placeholder image URL
 *     (`https://static.wixstatic.com/media/file.jpg`, a hard 403), so their
 *     grid tiles and product pages showed a broken image;
 *   · 1,254 HTML entities (`&amp;`, `&quot;`, `&lt;`, `&gt;`) sat in names and
 *     copy and rendered literally, e.g. `Samsung 43&quot; T5300`;
 *   · stray mojibake (`Itâ€™s`) slipped in with a supplier export.
 *
 * Runs on plain Node — no dev-only packages required.
 */
import { existsSync } from 'node:fs'
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
const summarise = (problems, shown = 6) =>
  problems.slice(0, shown).join('; ') + (problems.length > shown ? ` (+${problems.length - shown} more)` : '')

const { products, brands, CATEGORIES } = await import('../src/lib/catalog.ts')

console.log('Catalogue checks')
console.log(`  catalogue: ${products.length} products, ${brands.length} brands`)

/* ── product URLs must be unique: getProduct resolves by slug ───────────── */
const slugCounts = new Map()
for (const p of products) slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1)
const dupes = [...slugCounts].filter(([, n]) => n > 1)
ok('every product slug is unique',
  dupes.length === 0,
  summarise(dupes.map(([slug, n]) => `"${slug}" ×${n}`)))

const ids = new Set(products.map((p) => p.id))
ok('every product id is unique', ids.size === products.length,
  `${products.length - ids.size} duplicate id(s)`)

/* ── photos must load: a local file, or a CDN URL the importer verified ── */
const placeholderHosts = /static\.wixstatic\.com\/media\/file\./
const unresolved = []
const brokenLocal = []
for (const p of products) {
  for (const src of [p.image, ...(p.gallery ?? []).map((g) => g.image)]) {
    if (!src) continue
    if (/^https?:\/\//.test(src)) {
      if (placeholderHosts.test(src)) unresolved.push(`${p.slug} → ${src}`)
      continue
    }
    const rel = src.replace(/^.*\/chikwafu\//, '').replace(/^\//, '')
    if (!existsSync(join(ROOT, 'public', rel))) brokenLocal.push(`${p.slug} → ${src}`)
  }
}
ok('no product points at the importer\'s placeholder image URL',
  unresolved.length === 0, summarise(unresolved))
ok('every local product photo exists in public/',
  brokenLocal.length === 0, summarise(brokenLocal))

/* ── copy must be plain text: React escapes whatever we hand it ─────────── */
const ENTITY = /&(?:amp|quot|apos|lt|gt|nbsp|#\d+);/
const MOJIBAKE = /Â|â€|Ã[\u0080-\u00bf]|\uFFFD/
const entityHits = []
const mojibakeHits = []
for (const p of products) {
  const fields = [p.name, p.tagline, p.description, ...(p.highlights ?? []), ...(p.specs ?? []).map((s) => s.value), ...(p.reviews ?? []).map((r) => `${r.title} ${r.body}`)]
  for (const field of fields) {
    if (!field) continue
    if (ENTITY.test(field)) { entityHits.push(`${p.slug}: ${field.match(ENTITY)[0]}`); break }
    if (MOJIBAKE.test(field)) { mojibakeHits.push(p.slug); break }
  }
}
ok('no HTML entities in catalogue copy', entityHits.length === 0, summarise(entityHits))
ok('no mojibake in catalogue copy', mojibakeHits.length === 0, summarise(mojibakeHits))

/* ── the numbers a shopper is charged ──────────────────────────────────── */
const badPrices = products.filter((p) => !Number.isFinite(p.price) || p.price <= 0)
ok('every product has a real price', badPrices.length === 0, summarise(badPrices.map((p) => p.slug)))

const badCompare = products.filter((p) => p.compareAt != null && p.compareAt < p.price)
ok('no "was" price is below the price on sale',
  badCompare.length === 0, summarise(badCompare.map((p) => `${p.slug} ${p.compareAt} < ${p.price}`)))

const badStock = products.filter((p) => !Number.isInteger(p.stock) || p.stock < 0)
ok('stock counts are whole and never negative',
  badStock.length === 0, summarise(badStock.map((p) => `${p.slug} ${p.stock}`)))

const badRating = products.filter((p) => !(p.rating >= 1 && p.rating <= 5))
ok('ratings sit between 1 and 5', badRating.length === 0, summarise(badRating.map((p) => `${p.slug} ${p.rating}`)))

const badReviewRating = products.filter((p) => (p.reviews ?? []).some((r) => !(r.rating >= 1 && r.rating <= 5)))
ok('review ratings sit between 1 and 5', badReviewRating.length === 0,
  summarise(badReviewRating.map((p) => p.slug)))

const badDates = []
for (const p of products) {
  for (const r of p.reviews ?? []) {
    const at = Date.parse(r.date)
    if (Number.isNaN(at)) badDates.push(`${p.slug}: ${r.date}`)
    else if (at > Date.now() + 7 * 86_400_000) badDates.push(`${p.slug}: ${r.date} is in the future`)
  }
}
ok('review dates parse and are not in the future', badDates.length === 0, summarise(badDates))

/* ── the facets the shop filters by ─────────────────────────────────────── */
const strayCategory = products.filter((p) => !CATEGORIES.includes(p.category))
ok('every product sits in a known category',
  strayCategory.length === 0, summarise(strayCategory.map((p) => `${p.slug} → ${p.category}`)))

const noBrand = products.filter((p) => !p.brand?.trim())
ok('every product has a brand', noBrand.length === 0, summarise(noBrand.map((p) => p.slug)))

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s)`)
process.exit(failures === 0 ? 0 : 1)
