#!/usr/bin/env node
/**
 * Rendered-DOM smoke for every routed page.
 *
 *   npm run verify:pages
 *
 * Mounts each page (plus Header/Footer) in a jsdom window the way a real
 * visit does and fails on any console.error/warning, empty render, or thrown
 * error — so a broken hook chain, bad import, or render-time crash on any
 * route is caught without opening a browser.
 *
 * Dev-only dependency:  npm i --no-save esbuild jsdom
 */

let JSDOM
try {
  ;({ JSDOM } = await import('jsdom'))
  await import('esbuild')
} catch {
  console.error('\nesbuild/jsdom are not installed — they are not project dependencies.\n\n    npm i --no-save esbuild jsdom && npm run verify:pages\n')
  process.exit(2)
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
})
/* jsdom has no scrollTo; the pages legitimately call it (browsers do implement it). */
dom.window.scrollTo = () => {}
for (const key of ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'scrollTo']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], writable: true, configurable: true })
}
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

/* Keep /api calls off the network — a 503 reads as "no API here" and the
   pages fall back to demo data, the same as a static build. */
const realFetch = globalThis.fetch
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : String(input?.url ?? '')
  if (url.includes('/api/')) return Promise.resolve(new Response('offline', { status: 503 }))
  return realFetch(input, init)
}

const { createElement: h, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { MemoryRouter } = await import('react-router-dom')

const pages = {
  Home: (await import('../src/pages/Home.tsx')).default,
  Shop: (await import('../src/pages/Shop.tsx')).default,
  Express: (await import('../src/pages/Express.tsx')).default,
  Track: (await import('../src/pages/Track.tsx')).default,
  Favorites: (await import('../src/pages/Favorites.tsx')).default,
  Checkout: (await import('../src/pages/Checkout.tsx')).default,
  OrderConfirmed: (await import('../src/pages/OrderConfirmed.tsx')).default,
  NotFound: (await import('../src/pages/NotFound.tsx')).default,
}
const { Header } = await import('../src/components/Header.tsx')
const { Footer } = await import('../src/components/Footer.tsx')
const { useCart } = await import('../src/store/cart.ts')
const { products } = await import('../src/lib/catalog.ts')
/* Seed a cart so Checkout renders its form instead of the empty-cart redirect. */
useCart.getState().add(products[0].id)

const noise = []
const orig = { error: console.error, warn: console.warn }
console.error = (...a) => { noise.push(a.map(String).join(' ')) }
console.warn = (...a) => { noise.push(a.map(String).join(' ')) }

let failures = 0
for (const [name, Comp] of [...Object.entries(pages), ['Header', Header], ['Footer', Footer]]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  noise.length = 0
  try {
    await act(async () => {
      root.render(h(MemoryRouter, { initialEntries: ['/'] }, h(Comp)))
    })
    const html = container.innerHTML
    const bad = noise.filter((n) => !/not wrapped in act|Download the React DevTools/.test(n))
    if (html.length < 200) {
      failures += 1
      console.log(`  ✗ ${name} — rendered empty (${html.length} chars)`)
    } else if (bad.length) {
      failures += 1
      console.log(`  ✗ ${name} — console noise:`)
      bad.slice(0, 4).forEach((n) => console.log(`      ${n.slice(0, 220)}`))
    } else {
      console.log(`  ✓ ${name} renders clean (${html.length} chars)`)
    }
  } catch (e) {
    failures += 1
    console.log(`  ✗ ${name} — threw: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`)
  }
  await act(async () => root.unmount())
  container.remove()
}

console.error = orig.error
console.warn = orig.warn
console.log(failures ? `\nFAIL — ${failures} page(s) with problems` : '\nPASS — all pages render clean')
process.exit(failures ? 1 : 0)
