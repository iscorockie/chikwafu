/**
 * First-boot seed: one admin account plus a deterministic order ledger so the
 * dashboard is meaningful before the first real sale. The same PRNG seed is
 * used on every boot, so a reseed reproduces identical demo data.
 */
import bcrypt from 'bcryptjs'
import { config } from './env.mjs'
import { oid } from './oid.mjs'
import { productCount, slim } from './catalog.mjs'

/** Products are imported for order lines — lazy to keep boot fast. */
async function loadProducts() {
  const { products } = await import('../../src/lib/catalog.ts')
  return products
}

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const NAMES = [
  ['Sarah Nakato', 'Ntinda', 'Kampala'], ['Emmanuel Okello', 'Layibi', 'Gulu'],
  ['Aisha Namuli', 'Kira', 'Wakiso'], ['Denis Ssebugwawo', 'Nyendo', 'Masaka'],
  ['Grace Atim', 'Bugolobi', 'Kampala'], ['Ronald Kiggundu', 'Kitoro', 'Entebbe'],
  ['Miriam Achieng', 'Walukuba', 'Jinja'], ['Patience Tumusiime', 'Kakoba', 'Mbarara'],
  ['Julius Wanyama', 'Namatala', 'Mbale'], ['Catherine Nabbosa', 'Kyanja', 'Kampala'],
  ['Peter Odhiambo', 'Nakawa', 'Kampala'], ['Sylvia Kemigisha', 'Ishaka', 'Bushenyi'],
  ['Hassan Mubiru', 'Kabalagala', 'Kampala'], ['Josephine Adongo', 'Adyel', 'Lira'],
  ['Tom Byaruhanga', 'Kabundaire', 'Fort Portal'], ['Brenda Kyomuhendo', 'Naalya', 'Wakiso'],
  ['Charles Ojok', 'Ewuata', 'Arua'], ['Winnie Amongin', 'Soroti Central', 'Soroti'],
  ['Ivan Muwanga', 'Kansanga', 'Kampala'], ['Rehema Nassuna', 'Nansana', 'Wakiso'],
  ['Moses Kirya', 'Iganga Central', 'Iganga'], ['Esther Nagawa', 'Kawuku', 'Wakiso'],
  ['Fred Lubega', 'Makindye', 'Kampala'], ['Doreen Kabuye', 'Seeta', 'Mukono'],
]
const PAYMENTS = ['mtn', 'mtn', 'mtn', 'airtel', 'airtel', 'cod']
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export async function seedDatabase() {
  const products = await loadProducts()
  const rand = rng(20260822)
  const now = Date.now()
  const orders = []

  for (let i = 0; i < 34; i++) {
    const [name, town, region] = NAMES[Math.floor(rand() * NAMES.length)]
    const daysAgo = Math.floor(rand() * 45)
    const placed = new Date(now - daysAgo * 86400000 - Math.floor(rand() * 86400000))

    const lineCount = 1 + Math.floor(rand() * 3)
    const items = []
    for (let k = 0; k < lineCount; k++) {
      const p = products[Math.floor(rand() * products.length)]
      if (items.some((x) => x.product === p.id)) continue
      const qty = 1 + (rand() > 0.82 ? 1 : 0)
      const s = slim(p)
      items.push({ product: p.id, name: s.name, image: s.image, price: s.price, qty })
    }
    if (!items.length) continue

    const itemsPrice = items.reduce((s, l) => s + l.price * l.qty, 0)
    const central = ['Kampala', 'Wakiso', 'Mukono'].includes(region)
    const shippingPrice = itemsPrice >= 1_500_000 ? 0 : central ? 15000 : 45000

    let status
    const r = rand()
    if (daysAgo > 14) status = r > 0.08 ? 'delivered' : 'cancelled'
    else if (daysAgo > 7) status = r > 0.25 ? 'delivered' : r > 0.1 ? 'shipped' : 'cancelled'
    else if (daysAgo > 3) status = r > 0.55 ? 'shipped' : r > 0.2 ? 'processing' : 'delivered'
    else status = r > 0.5 ? 'pending' : 'processing'

    const paymentMethod = PAYMENTS[Math.floor(rand() * PAYMENTS.length)]
    orders.push({
      _id: oid(),
      ref: 'CHK-' + placed.getTime().toString(36).slice(-4).toUpperCase() + String(i).padStart(2, '0'),
      user: { _id: 'guest', name, email: rand() > 0.5 ? name.split(' ')[0].toLowerCase() + '@example.com' : undefined },
      items,
      shippingAddress: {
        fullName: name,
        phone: '07' + (Math.floor(rand() * 9) + 1) + Math.floor(rand() * 10000000).toString().padStart(7, '0'),
        address: `Plot ${1 + Math.floor(rand() * 90)}, ${town}`,
        city: town,
        region,
        country: 'Uganda',
      },
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice: 0,
      totalPrice: itemsPrice + shippingPrice,
      status,
      isPaid: status !== 'pending' && status !== 'cancelled',
      createdAt: placed.toISOString(),
    })
  }
  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  const passwordHash = bcrypt.hashSync(config.adminPassword, 10)
  return {
    version: 1,
    users: [
      {
        _id: oid(),
        name: config.adminName,
        email: config.adminEmail,
        passwordHash,
        role: 'admin',
        createdAt: new Date(now - 90 * 86400000).toISOString(),
      },
    ],
    orders,
    payments: [],
    newsletter: [],
    meta: {
      seededAt: new Date().toISOString(),
      productCount: productCount(),
      statusFlow: STATUSES,
    },
  }
}
