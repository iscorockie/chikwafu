# Chikwafu API (`server/`)

A dependency-light Express backend for the Chikwafu storefront: staff auth,
the order ledger, server-side pricing, mobile-money collections, media
uploads, newsletter sign-ups and customer order tracking. It also hosts the
built storefront (`dist/`) on the same port, so a single process is a complete
deployment.

```bash
npm install            # at repo root (also installs server deps)
npm run build          # build the storefront into dist/
npm run server         # → http://localhost:5000  (API + storefront)
```

For development with hot reload:

```bash
npm run dev:all        # Vite :5173 (proxies /api) + API :5000
```

Requires **Node ≥ 22.6** — the API imports the product catalogue straight from
`src/lib/catalog.ts` using Node's native TypeScript type-stripping, so prices
and stock can never drift between UI and backend.

## Endpoints

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | – | Liveness + catalogue size (used for same-origin auto-detection) |
| `POST /api/auth/login` | – | Staff sign-in → JWT (rate-limited) |
| `GET /api/auth/me` | Bearer | Current staff member |
| `GET /api/products` | – | Filter/sort/paginate the catalogue (`q, category, brand, sort, rating, max, deals, stock, express, page, limit`) |
| `GET /api/products/facets` | – | Categories, brands, price bounds, collections |
| `GET /api/products/:slug` | – | Full product document |
| `POST /api/orders` | – | Place an order — **the server re-prices the basket**, validates stock/coupons/delivery and returns the authoritative totals |
| `GET /api/orders/track?ref=&phone=` | – | Customer tracking view (reference + phone must match) |
| `GET /api/orders` | admin | Order ledger |
| `GET /api/orders/:id` | admin | Single order |
| `PUT /api/orders/:id/status` | admin | `pending → processing → shipped → delivered` / `cancelled` |
| `GET /api/orders/stats` | admin | Dashboard aggregates |
| `POST /api/payments/zengapay/collections` | – | Mobile-money collection (rate-limited, must reference a real order and match its total) |
| `GET /api/payments/zengapay/collections` | admin | Recent payment attempts |
| `POST /api/media/upload` | admin | Product media (`multipart/form-data`, field `file`) → `{ url }` |
| `POST /api/newsletter` | – | Newsletter sign-up (de-duplicated) |
| `GET /api/newsletter` | admin | Sign-up list |

## Storage

`server/lib/store.mjs` is a single async data-access interface with two
interchangeable backends:

| Backend | Selected by | Where the data lives |
| --- | --- | --- |
| `json` (default) | nothing set | `server/data/db.json` (gitignored), debounced atomic writes |
| `postgres` | `DATABASE_URL` | Any managed Postgres (Neon, Railway, Supabase) — apply [`supabase/schema.sql`](../supabase/schema.sql) once |

The routes never see the difference: they mutate a plain order object and call
`store.orders.save(order)`. `GET /api/health` reports which one is live in its
`store` field.

Media uploads go to `server/uploads/` (served from `/uploads/*`) by default, or
to a Supabase Storage bucket when `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` are
set — which is what you need on any host without a writable disk.

Check either backend end to end, against a real throwaway PostgreSQL server:

```bash
npm run verify:pg      # 78 passing checks: orders, tracking, payments, admin, restart
```

On first boot the server seeds:

* one admin account — `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  (defaults `admin@chikwafu.ug` / `chikwafu2026` — **change these**),
* a deterministic 34-order demo ledger so the dashboard is meaningful
  immediately (Postgres: only with `SEED_DEMO_LEDGER=true`).

## Payments

`POST /api/payments/zengapay/collections` is the single place gateway secrets
may exist. Default `ZENGAPAY_MODE=sandbox` simulates the prompt (a phone
number ending `0000` declines, so the failure path is testable). The marked
block in `server/routes/payments.mjs` shows where the real ZengaPay call goes;
on success the order flips to `processing` and `isPaid: true`.

## Zoho

`server/lib/zoho.mjs` holds three independent integrations, each inert until its
key is set and none of which can fail a request:

| Integration | Trigger | Key |
| --- | --- | --- |
| ZeptoMail | order receipt on `POST /api/orders`, email on every status change | `ZEPTOMAIL_API_KEY` |
| Campaigns | newsletter sign-up forwarded to the mailing list | `ZOHO_CAMPAIGNS_TOKEN` + `ZOHO_CAMPAIGNS_LIST_KEY` |
| Desk | ticket filed when an Agent-handled order is marked delivered | `ZOHO_DESK_TOKEN` + `ZOHO_DESK_ORG_ID` |

Campaigns and Desk need self-client **OAuth** tokens — the v1.1 APIs reject
static keys. ZeptoMail needs the sending domain verified (SPF + DKIM in DNS)
before it will deliver.

## Security notes

* Passwords are bcrypt-hashed; staff routes require a valid JWT with
  `role: "admin"`; the secret persists in `server/data/.jwt-secret` unless
  `JWT_SECRET` is set.
* Public write endpoints (login, orders, payments, newsletter) are
  rate-limited per IP.
* Order totals are always computed server-side from the catalogue — amounts
  posted by the browser are ignored.
* `JWT_SECRET` must be set in production. Without it the generated secret is
  written to `server/data/.jwt-secret`, which a read-only (serverless)
  filesystem cannot keep — every deploy would sign staff out.
* If you add Supabase Storage, the connection needs the **service-role** key; that key
  bypasses row-level security and must never reach the browser.
