#!/usr/bin/env node
/**
 * Rendered-DOM checks for the storefront UI.
 *
 *   npm run verify:ui
 *
 * Mounts the real components in a jsdom window and asserts on the resulting
 * DOM, so the fixes are checked where they actually live:
 *
 *   · Header  — NavLink used to match on pathname only, so all six "/shop…"
 *               items lit their underline at once on any /shop page.
 *   · ProductCard — an out-of-stock product (518 of them) offered a live
 *               "Add to cart" button and claimed "Only 0 left"; a photo that
 *               fails to load left the browser's broken-image icon on the tile.
 *
 * Dev-only dependency:  npm i --no-save jsdom
 */

let JSDOM
try {
  ;({ JSDOM } = await import('jsdom'))
} catch {
  console.error('\njsdom is not installed — it is not a project dependency.\n\n    npm i --no-save jsdom && npm run verify:ui\n')
  process.exit(2)
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
})
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], writable: true, configurable: true })
}
/* framer-motion resolves these as bare globals at call time, so they have to
   exist on globalThis and not merely on the jsdom window. */
const matchMedia = (q) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
})
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
class IntersectionObserverStub {
  constructor(cb) { this.cb = cb }
  observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this) }
  unobserve() {} disconnect() {} takeRecords() { return [] }
}
for (const [key, value] of [
  ['matchMedia', dom.window.matchMedia ?? matchMedia],
  ['ResizeObserver', dom.window.ResizeObserver ?? ResizeObserverStub],
  ['IntersectionObserver', dom.window.IntersectionObserver ?? IntersectionObserverStub],
]) {
  Object.defineProperty(globalThis, key, { value, writable: true, configurable: true })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { createElement } = await import('react')
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { MemoryRouter } = await import('react-router-dom')
const { Header } = await import('../src/components/Header.tsx')
const { ProductCard } = await import('../src/components/ProductCard.tsx')
const { products } = await import('../src/lib/catalog.ts')
const { useCart } = await import('../src/store/cart.ts')

let failures = 0
const ok = (name, cond, extra = '') => {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`)
  }
}

/** MemoryRouter only reads `initialEntries` on first mount, so every route
    gets its own container and root. */
let container = null
let root = null
const render = async (element) => {
  if (root) {
    await act(async () => root.unmount())
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(element))
}
const text = () => container.textContent ?? ''

console.log('Rendered UI checks')

/* ── Header navigation: exactly one active item per route ──────────────── */
const counts = {}
for (const route of ['/shop', '/shop?category=Kitchen', '/shop?category=Home+Entertainment', '/express']) {
  await render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(Header)))
  const active = container.querySelectorAll('[aria-current="page"]').length
  counts[route] = active
  ok(`"${route}" marks exactly one nav item active`, active === 1, `${active} marked`)
}
ok('the plain /shop route highlights "Shop All"',
  counts['/shop'] === 1 && text().includes('Shop All'))

await render(createElement(MemoryRouter, { initialEntries: ['/shop?category=Kitchen'] }, createElement(Header)))
const activeLabel = container.querySelector('[aria-current="page"]')?.textContent ?? ''
ok('a category route highlights its own item, not "Shop All"',
  activeLabel === 'Kitchen', `highlighted "${activeLabel}"`)

/* The drawer must be a dialog that Escape closes. */
const menuButton = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Open menu')
ok('the mobile menu button exists', !!menuButton)
await act(async () => menuButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })))
ok('it opens a dialog', !!container.querySelector('[role="dialog"][aria-modal="true"]'),
  container.querySelector('[role="dialog"]') ? 'dialog without aria-modal' : 'no dialog')
ok('…and the button reports it as expanded', menuButton.getAttribute('aria-expanded') === 'true',
  `aria-expanded="${menuButton.getAttribute('aria-expanded')}"`)
await act(async () =>
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
)
/* AnimatePresence keeps the node mounted while it animates out in jsdom, so
   assert on the React state (aria-expanded) rather than node removal. */
ok('Escape closes it', menuButton.getAttribute('aria-expanded') === 'false',
  `aria-expanded="${menuButton.getAttribute('aria-expanded')}"`)

/* ── ProductCard: an out-of-stock product must not be buyable ──────────── */
const soldOut = products.find((p) => p.stock <= 0)
const inStock = products.find((p) => p.stock >= 11)

useCart.getState().clear()
useCart.getState().close()
await render(createElement(MemoryRouter, null, createElement(ProductCard, { product: soldOut })))
const cta = [...container.querySelectorAll('button')].find((b) => /add to cart|out of stock/i.test(b.textContent ?? ''))
ok('a sold-out card says "Out of stock"', /out of stock/i.test(cta?.textContent ?? ''), `"${cta?.textContent}"`)
ok('…its call to action is disabled', cta?.disabled === true)
ok('…it never claims "Only 0 left"', !/only 0 left/i.test(text()), text().match(/only \d+ left/i)?.[0] ?? '')
await act(async () => cta.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })))
ok('…clicking it adds nothing to the cart', useCart.getState().lines.length === 0,
  `${useCart.getState().lines.length} line(s)`)

useCart.getState().clear()
await render(createElement(MemoryRouter, null, createElement(ProductCard, { product: inStock })))
const liveCta = [...container.querySelectorAll('button')].find((b) => /add to cart/i.test(b.textContent ?? ''))
ok('an in-stock card still offers "Add to cart"', !!liveCta && liveCta.disabled === false)
await act(async () => liveCta.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })))
ok('…and clicking it adds the product', useCart.getState().lines[0]?.productId === inStock.id)

/* ── A photo that will not load must not leave a broken image behind ───── */
const { PHOTO_PLACEHOLDER } = await import('../src/lib/format.ts')
useCart.getState().clear()
await render(createElement(MemoryRouter, null, createElement(ProductCard, { product: inStock })))
const photo = container.querySelector('img')
ok('a card renders the catalogue photo',
  photo?.getAttribute('src') === inStock.image, `src="${photo?.getAttribute('src')}"`)
await act(async () => photo.dispatchEvent(new dom.window.Event('error')))
ok('…a photo that fails to load swaps to the local placeholder',
  photo.getAttribute('src') === PHOTO_PLACEHOLDER, `src="${photo.getAttribute('src')}"`)
await act(async () => photo.dispatchEvent(new dom.window.Event('error')))
ok('…and the fallback cannot loop back into itself',
  photo.getAttribute('src') === PHOTO_PLACEHOLDER && photo.dataset.placeholder === 'true')

/* ── API detection must survive a sleeping free-tier host ──────────────── */
/* `/api/health` is probed once at boot (see main.tsx). A Render free instance
   takes up to a minute to wake, so the boot probe has to answer immediately and
   keep retrying in the background — otherwise the first visit of the day leaves
   the storefront in demo mode for the whole session. This drives the real
   module: the stub is installed *before* the import, because detection starts
   the moment `lib/api.ts` is evaluated. */
const realFetch = globalThis.fetch
let probes = 0
globalThis.fetch = async (input, init) => {
  const url = String(input)
  if (!url.includes('/api/health')) return realFetch(input, init)
  probes += 1
  if (probes < 2) throw new TypeError('Failed to fetch') // instance asleep, or offline
  return new Response(JSON.stringify({ status: 'ok', name: 'chikwafu-api' }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}

/* Read `API_ENABLED` off the namespace: it is an exported `let`, and
   destructuring would snapshot the value instead of following the live binding. */
const apiModule = await import('../src/lib/api.ts')
const { apiReady } = apiModule
const settled = await Promise.race([
  apiReady.then(() => 'settled'),
  new Promise((resolve) => setTimeout(() => resolve('timeout'), 500)),
])
ok('the boot probe answers without blocking the app', settled === 'settled',
  'apiReady did not resolve within 500 ms — a slow host must not delay first paint')

const waitFor = async (predicate, ms) => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return predicate()
}
ok('…a failed probe schedules a retry',
  await waitFor(() => probes >= 2, 12_000),
  `${probes} probe(s) in 12 s — a sleeping instance would mean demo mode all session`)
ok('…and the storefront goes live when the host wakes',
  apiModule.API_ENABLED === true && probes >= 2, `API_ENABLED=${apiModule.API_ENABLED}`)
globalThis.fetch = realFetch

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s)`)
process.exit(failures === 0 ? 0 : 1)
