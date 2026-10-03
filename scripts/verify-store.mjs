#!/usr/bin/env node
/**
 * Regression check for the cart store and its selector.
 *
 *   npm run verify:store
 *
 * 518 of the 1,797 catalogue lines have `stock: 0`. Adding one used to push a
 * qty-0 line, which opened a cart that looked occupied, totalled UGX 0, and was
 * then rejected by the API with "Invalid quantity" — or, on the storefront,
 * bounced the shopper back to /shop with no explanation.
 *
 * This drives the real `useCart` store and renders the real `useCartDetails`
 * selector through React in a jsdom window, so the assertions cover the shipped
 * code path rather than a copy of it.
 *
 * Dev-only dependency:  npm i --no-save jsdom
 */

/* ── a window has to exist before the store is imported: zustand/persist
      reads localStorage while the store is being created ─────────────────── */
let JSDOM
try {
  ;({ JSDOM } = await import('jsdom'))
} catch {
  console.error('\njsdom is not installed — it is not a project dependency.\n\n    npm i --no-save jsdom && npm run verify:store\n')
  process.exit(2)
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
})
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node']) {
  // Node 22 exposes some of these as getter-only, so assign through defineProperty.
  Object.defineProperty(globalThis, key, {
    value: dom.window[key], writable: true, configurable: true,
  })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { createElement } = await import('react')
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { useCart, useCartDetails } = await import('../src/store/cart.ts')
const { products } = await import('../src/lib/catalog.ts')

let failures = 0
const ok = (name, cond, extra = '') => {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`)
  }
}

/* Render the real hook into the real DOM so we read what the cart drawer, the
   header badge and checkout would actually see. */
const container = document.getElementById('root')
const root = createRoot(container)
const Probe = () => createElement('pre', null, JSON.stringify(useCartDetails()))
/** What the selector returns, read back out of the rendered DOM. */
const read = async () => {
  await act(async () => root.render(createElement(Probe)))
  return JSON.parse(container.textContent)
}
/** Store writes must happen inside act() too, or React warns about them. */
const mutate = async (fn) => {
  await act(async () => fn())
}
const cart = () => useCart.getState()

/** applyCoupon returns a boolean, so capture it from inside act(). */
const applied = async (code) => {
  let result = null
  await mutate(() => { result = cart().applyCoupon(code) })
  return result
}

const soldOut = products.filter((p) => p.stock <= 0)
const inStock = products.find((p) => p.stock >= 5)
const scarce = products.find((p) => p.stock >= 2 && p.stock < 5)

console.log('Cart store checks')
console.log(`  catalogue: ${products.length} products, ${soldOut.length} out of stock`)

/* ── out-of-stock must be refused outright ─────────────────────────────── */
await mutate(() => cart().clear())
await mutate(() => cart().close())
await mutate(() => cart().add(soldOut[0].id))
ok('adding an out-of-stock product adds nothing', cart().lines.length === 0,
  `${cart().lines.length} line(s)`)
ok('…and does not yank the cart drawer open', cart().isOpen === false)
let d = await read()
ok('…so the cart still reads empty', d.count === 0 && d.detailed.length === 0,
  `${d.detailed.length} lines, total ${d.subtotal}`)

/* ── in-stock behaves exactly as before ────────────────────────────────── */
await mutate(() => cart().add(inStock.id))
ok('an in-stock product is added', cart().lines.length === 1)
ok('…the drawer opens', cart().isOpen === true)
d = await read()
ok('…qty 1 at the catalogue price', d.detailed[0]?.qty === 1 && d.detailed[0]?.lineTotal === inStock.price,
  `qty ${d.detailed[0]?.qty}, line ${d.detailed[0]?.lineTotal}`)

await mutate(() => cart().add(inStock.id, 2))
d = await read()
ok('adding again accumulates to 3', d.detailed[0]?.qty === 3, `qty ${d.detailed[0]?.qty}`)
ok('the header badge counts units, not lines', d.count === 3, `count ${d.count}`)

/* ── stock is a hard ceiling ───────────────────────────────────────────── */
await mutate(() => cart().add(scarce.id, 1))
await mutate(() => cart().setQty(scarce.id, 99))
const scarceLine = cart().lines.find((l) => l.productId === scarce.id)
ok('setQty clamps to available stock', scarceLine.qty <= scarce.stock,
  `asked 99, stock ${scarce.stock}, got ${scarceLine.qty}`)
await mutate(() => cart().setQty(scarce.id, 0))
ok('setQty(0) removes the line', cart().lines.every((l) => l.productId !== scarce.id))

/* ── a line persisted by an older build must not come back as UGX 0 ────── */
await mutate(() => cart().clear())
localStorage.setItem(
  'chikwafu-cart-v1',
  JSON.stringify({ state: { lines: [{ productId: soldOut[0].id, qty: 2 }], coupon: null }, version: 0 }),
)
const revived = cart().lines.find((l) => l.productId === soldOut[0].id)
d = await read()
ok('a rehydrated line for a sold-out product totals nothing and shows nothing',
  !revived || d.detailed.every((l) => l.qty > 0),
  `line qty ${revived?.qty}, visible lines ${d.detailed.length}`)

/* ── coupons ───────────────────────────────────────────────────────────── */
await mutate(() => cart().clear())
await mutate(() => cart().add(inStock.id, 2))
ok('an unknown coupon is rejected', await applied('NOPE') === false)
ok('a lowercase KARIBU10 is accepted', await applied('karibu10') === true)
d = await read()
ok('…and discounts by exactly 10%', d.discount === Math.round(d.subtotal * 0.1),
  `${d.discount} of ${d.subtotal}`)
await mutate(() => cart().clearCoupon())
d = await read()
ok('removing the coupon restores the subtotal', d.discount === 0)

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s)`)
process.exit(failures === 0 ? 0 : 1)
