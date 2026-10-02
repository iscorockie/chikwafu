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

Everything lives in `server/data/db.json` (gitignored): users, orders,
payments, newsletter. Writes are debounced and flushed atomically. Media
uploads land in `server/uploads/` and are served from `/uploads/*`. Swap
`server/lib/db.mjs` for a real database driver when you outgrow a single node.

On first boot the server seeds:

* one admin account — `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  (defaults `admin@chikwafu.ug` / `chikwafu2026` — **change these**),
* a deterministic 34-order demo ledger so the dashboard is meaningful
  immediately.

## Payments

`POST /api/payments/zengapay/collections` is the single place gateway secrets
may exist. Default `ZENGAPAY_MODE=sandbox` simulates the prompt (a phone
number ending `0000` declines, so the failure path is testable). The marked
block in `server/routes/payments.mjs` shows where the real ZengaPay call goes;
on success the order flips to `processing` and `isPaid: true`.

## Security notes

* Passwords are bcrypt-hashed; staff routes require a valid JWT with
  `role: "admin"`; the secret persists in `server/data/.jwt-secret` unless
  `JWT_SECRET` is set.
* Public write endpoints (login, orders, payments, newsletter) are
  rate-limited per IP.
* Order totals are always computed server-side from the catalogue — amounts
  posted by the browser are ignored.
