/**
 * Data access layer.
 *
 * Two interchangeable backends behind one async interface:
 *
 *   json     — `server/data/db.json`. Zero configuration, single node.
 *              Still the default for `npm run dev:all` / `npm run server`.
 *   postgres — any Postgres, including Supabase. Selected by setting
 *              DATABASE_URL (or SUPABASE_URL + SUPABASE_SERVICE_KEY).
 *              This is what makes the API deployable somewhere with no disk.
 *
 * The routes never touch SQL or the JSON file: they mutate a plain order
 * object and call `store.orders.save(order)`. Both backends honour that.
 *
 * Column names are snake_case in Postgres; the JSON shapes below are exactly
 * what the API already returns, so nothing on the client changes.
 */
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from './env.mjs'
import { oid } from './oid.mjs'
import { seedDatabase } from './seed.mjs'

export { oid }

/* ─────────────────────────── JSON backend (unchanged behaviour) ─────────── */

function jsonBackend(file, state) {
  let timer = null
  const flush = () => {
    timer = null
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(state, null, 2))
    renameSync(tmp, file)
  }
  const save = () => {
    if (timer) return
    timer = setTimeout(flush, 250)
    timer.unref?.()
  }

  return {
    kind: 'json',
    async close() {
      if (timer) flush()
    },
    users: {
      async byEmail(email) {
        return state.users.find((u) => u.email === email) ?? null
      },
      async byId(id) {
        return state.users.find((u) => u._id === id) ?? null
      },
      async create(user) {
        state.users.push(user)
        save()
        return user
      },
    },
    orders: {
      async insert(order) {
        state.orders.unshift(order)
        save()
        return order
      },
      async save(order) {
        const i = state.orders.findIndex((o) => o._id === order._id)
        if (i === -1) state.orders.unshift(order)
        else state.orders[i] = order
        save()
        return order
      },
      async byIdOrRef(x) {
        return state.orders.find((o) => o._id === x || o.ref === x) ?? null
      },
      async byRefAndPhone(ref, phone) {
        return (
          state.orders.find(
            (o) =>
              o.ref.toUpperCase() === ref.toUpperCase() &&
              String(o.shippingAddress?.phone ?? '') === phone,
          ) ?? null
        )
      },
      async list({ status = '', limit = 200 } = {}) {
        let list = state.orders
        if (status) list = list.filter((o) => o.status === status)
        return list.slice(0, limit)
      },
      async count() {
        return state.orders.length
      },
      async stats(statuses) {
        const orders = state.orders
        const live = orders.filter((o) => o.status !== 'cancelled')
        return {
          totalOrders: orders.length,
          totalRevenue: live.reduce((s, o) => s + o.totalPrice, 0),
          statusCounts: statuses.map((s) => ({
            _id: s,
            count: orders.filter((o) => o.status === s).length,
          })),
        }
      },
    },
    payments: {
      async insert(payment) {
        state.payments.unshift(payment)
        save()
        return payment
      },
      async recent(limit = 100) {
        return state.payments.slice(0, limit)
      },
    },
    newsletter: {
      async byEmail(email) {
        return state.newsletter.find((n) => n.email === email) ?? null
      },
      async insert(entry) {
        state.newsletter.unshift(entry)
        save()
        return entry
      },
      async list(limit = 500) {
        return state.newsletter.slice(0, limit)
      },
      async markSynced(id) {
        const row = state.newsletter.find((n) => n._id === id)
        if (row) {
          row.syncedAt = new Date().toISOString()
          save()
        }
      },
    },
  }
}

/* ───────────────────────────── Postgres backend ─────────────────────────── */

const ORDER_COLUMNS = [
  'id', 'ref', 'customer', 'items', 'shipping_address', 'payment_method',
  'coupon', 'handled_by', 'items_price', 'discount', 'shipping_price',
  'tax_price', 'total_price', 'status', 'is_paid', 'desk_ticket_id',
  'history', 'created_at',
]

const rowToOrder = (r) => ({
  _id: r.id,
  ref: r.ref,
  user: r.customer,
  items: r.items,
  shippingAddress: r.shipping_address,
  paymentMethod: r.payment_method,
  coupon: r.coupon ?? null,
  handledBy: r.handled_by ?? undefined,
  itemsPrice: r.items_price,
  discount: r.discount,
  shippingPrice: r.shipping_price,
  taxPrice: r.tax_price,
  totalPrice: r.total_price,
  status: r.status,
  isPaid: r.is_paid,
  deskTicketId: r.desk_ticket_id ?? undefined,
  history: r.history ?? [],
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
})

const orderValues = (o) => [
  o._id,
  o.ref,
  JSON.stringify(o.user ?? { _id: 'guest', name: 'Guest' }),
  JSON.stringify(o.items ?? []),
  JSON.stringify(o.shippingAddress ?? {}),
  o.paymentMethod,
  o.coupon ?? null,
  o.handledBy ?? null,
  o.itemsPrice,
  o.discount ?? 0,
  o.shippingPrice ?? 0,
  o.taxPrice ?? 0,
  o.totalPrice,
  o.status,
  !!o.isPaid,
  o.deskTicketId ?? null,
  JSON.stringify(o.history ?? []),
  o.createdAt,
]

async function pgBackend(connectionString) {
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({
    connectionString,
    max: Number(config.pgPoolMax),
    // Supabase sits behind pgbouncer on the pooled connection string.
    ssl: config.pgSsl ? { rejectUnauthorized: false } : undefined,
  })
  pool.on('error', (err) => console.error('[store:pg] idle client error', err.message))

  const q = (text, params) => pool.query(text, params)

  const upsertOrder = async (o) => {
    const values = orderValues(o)
    const sets = ORDER_COLUMNS.slice(1)
      .map((c, i) => `${c} = $${i + 2}`)
      .join(', ')
    const { rows } = await q(
      `insert into orders (${ORDER_COLUMNS.join(', ')})
       values (${ORDER_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')})
       on conflict (id) do update set ${sets}
       returning *`,
      values,
    )
    return rowToOrder(rows[0])
  }

  return {
    kind: 'postgres',
    async close() {
      await pool.end()
    },
    users: {
      async byEmail(email) {
        const { rows } = await q('select * from users where email = $1', [email])
        return rows[0]
          ? { _id: rows[0].id, name: rows[0].name, email: rows[0].email, passwordHash: rows[0].password_hash, role: rows[0].role, createdAt: rows[0].created_at.toISOString() }
          : null
      },
      async byId(id) {
        const { rows } = await q('select * from users where id = $1', [id])
        return rows[0]
          ? { _id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role }
          : null
      },
      async create(user) {
        await q(
          `insert into users (id, name, email, password_hash, role, created_at)
           values ($1,$2,$3,$4,$5,$6) on conflict (email) do nothing`,
          [user._id, user.name, user.email, user.passwordHash, user.role, user.createdAt],
        )
        return user
      },
    },
    orders: {
      insert: upsertOrder,
      save: upsertOrder,
      async byIdOrRef(x) {
        const { rows } = await q('select * from orders where id = $1 or ref = $1', [x])
        return rows[0] ? rowToOrder(rows[0]) : null
      },
      async byRefAndPhone(ref, phone) {
        const { rows } = await q(
          `select * from orders
           where upper(ref) = upper($1) and shipping_address->>'phone' = $2
           limit 1`,
          [ref, phone],
        )
        return rows[0] ? rowToOrder(rows[0]) : null
      },
      async list({ status = '', limit = 200 } = {}) {
        const { rows } = status
          ? await q('select * from orders where status = $1 order by created_at desc limit $2', [status, limit])
          : await q('select * from orders order by created_at desc limit $1', [limit])
        return rows.map(rowToOrder)
      },
      async count() {
        const { rows } = await q('select count(*)::int as n from orders')
        return rows[0].n
      },
      async stats(statuses) {
        const [totals, byStatus] = await Promise.all([
          q(`select count(*)::int as total_orders,
                    coalesce(sum(total_price) filter (where status <> 'cancelled'), 0)::bigint as total_revenue
             from orders`),
          q('select status, count(*)::int as n from orders group by status'),
        ])
        const counts = new Map(byStatus.rows.map((r) => [r.status, r.n]))
        return {
          totalOrders: totals.rows[0].total_orders,
          totalRevenue: Number(totals.rows[0].total_revenue),
          statusCounts: statuses.map((s) => ({ _id: s, count: counts.get(s) ?? 0 })),
        }
      },
    },
    payments: {
      async insert(p) {
        await q(
          `insert into payments (id, "order", reference, provider_ref, network, phone, amount, status, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [p._id, p.order, p.reference, p.providerRef, p.network, p.phone, p.amount, p.status, p.createdAt],
        )
        return p
      },
      async recent(limit = 100) {
        const { rows } = await q(
          `select id, "order", reference, provider_ref, network, phone, amount, status, created_at
           from payments order by created_at desc limit $1`,
          [limit],
        )
        return rows.map((r) => ({
          _id: r.id, order: r.order, reference: r.reference, providerRef: r.provider_ref,
          network: r.network, phone: r.phone, amount: r.amount, status: r.status,
          createdAt: r.created_at.toISOString(),
        }))
      },
    },
    newsletter: {
      async byEmail(email) {
        const { rows } = await q('select * from newsletter where email = $1', [email])
        return rows[0] ? { _id: rows[0].id, email: rows[0].email, at: rows[0].at.toISOString() } : null
      },
      async insert(entry) {
        await q(
          `insert into newsletter (id, email, at) values ($1,$2,$3) on conflict (email) do nothing`,
          [entry._id, entry.email, entry.at],
        )
        return entry
      },
      async list(limit = 500) {
        const { rows } = await q('select * from newsletter order by at desc limit $1', [limit])
        return rows.map((r) => ({ _id: r.id, email: r.email, at: r.at.toISOString() }))
      },
      async markSynced(id) {
        await q('update newsletter set synced_at = now() where id = $1', [id])
      },
    },
  }
}

/* ────────────────────────────────── opening ─────────────────────────────── */

/**
 * Opens whichever backend the environment asks for and makes sure it holds an
 * admin account. With Postgres the schema must already exist — apply it with
 * `supabase/schema.sql`.
 */
export async function openStore() {
  const conn = config.databaseUrl
  if (!conn) {
    const file = `${config.dataDir}/db.json`
    mkdirSync(dirname(file), { recursive: true })
    let state
    if (existsSync(file)) {
      try {
        state = JSON.parse(readFileSync(file, 'utf8'))
      } catch {
        const backup = `${file}.corrupt-${Date.now()}`
        renameSync(file, backup)
        console.error(`[store] ${file} was unreadable — moved to ${backup} and reseeded.`)
      }
    }
    if (!state) {
      console.log('[store] first boot — seeding admin account and demo ledger…')
      state = await seedDatabase()
      // Persist the seed before the first request lands.
      writeFileSync(file, JSON.stringify(state, null, 2))
    }
    return jsonBackend(file, state)
  }

  console.log(`[store] using Postgres (${config.pgLabel})`)
  const backend = await pgBackend(conn)
  await ensureAdmin(backend)
  return backend
}

/** Seeds the staff account if the table is empty (never overwrites). */
async function ensureAdmin(store) {
  const existing = await store.users.byEmail(config.adminEmail)
  if (existing) return
  const { default: bcrypt } = await import('bcryptjs')
  const user = {
    _id: oid(),
    name: config.adminName,
    email: config.adminEmail,
    passwordHash: await bcrypt.hash(config.adminPassword, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  }
  await store.users.create(user)
  console.log(`[store] created admin account ${user.email}`)
}
