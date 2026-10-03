# Chikwafu — Electric Appliances Storefront

A production-ready e-commerce storefront for **Chikwafu Appliances**, a Ugandan retailer of
electric home appliances. Built with React, TypeScript, Vite and Tailwind CSS.

![Chikwafu](public/products/kettle.webp)

## Features

- **Striking home page** — editorial hero, featured collections by room, promo block, bestsellers,
  customer testimonials and newsletter capture.
- **Product grid with filters & sorting** — filter by category, brand, max price (range slider),
  minimum rating, on-offer and in-stock toggles; sort by featured, price, rating or name.
  All filter state lives in the URL, so any view is shareable and back-button friendly.
- **Rich product detail pages** — real multi-angle image galleries (actual store/brand
  photos from the Ayne and JBL listings where available, with simulated detail/angle crops
  as fallback), spec tables, highlight lists, a rating-distribution histogram and
  filterable verified reviews.
- **Slide-out cart** — spring-animated drawer with quantity controls, free-delivery progress bar,
  coupon display and live totals.
- **Streamlined checkout** — three steps (delivery → payment → review) with per-field validation,
  Ugandan district selection, and dynamic delivery pricing.
- **Ugandan market fit** — UGX pricing throughout, MTN Mobile Money / Airtel Money / card /
  cash-on-delivery, district-based delivery fees, and locally-grounded copy and reviews.
- **Order tracking** — customers enter their reference + phone on `/track` and get a live
  status timeline with ETA, straight from the API (or the local ledger in demo mode).
- **Persistent state** — cart and wishlist survive reloads via `zustand/persist` (localStorage).
- **Fully responsive** — bottom-sheet filters and a slide-in nav drawer on mobile. Every
  product card is a single tap target: tapping anywhere opens the product page.
- **Paginated catalogue** — shop results and the admin inventory table page through
  ~1,800 lines instead of rendering them all at once.
- **Accessible** — semantic landmarks, ARIA labels, keyboard-dismissable overlays,
  visible focus rings and a `prefers-reduced-motion` fallback.

## Backend

`server/` is an Express API (Node ≥ 22.6) that also hosts the built storefront on one
port: staff JWT auth, the order ledger with **server-side pricing**, ZengaPay
mobile-money collections, media uploads, newsletter sign-ups and public order tracking.
See [server/README.md](server/README.md) for the endpoint table.

```bash
npm run dev:all     # Vite :5173 (proxies /api) + API :5000
npm run server      # API + built storefront on :5000
```

The storefront auto-detects the API: with `VITE_API_URL` unset it probes the same origin,
so an Express-hosted build runs live and the static GitHub Pages build transparently falls
back to seeded demo data (the admin dashboard says which mode you are in).

Orders, payments, staff accounts and newsletter sign-ups live in
`server/data/db.json` by default, or in **any managed Postgres (Neon by default)** when
`DATABASE_URL` is set — apply [`supabase/schema.sql`](supabase/schema.sql) once and the same
API runs on a host with no disk. Staff photos are served from the host's disk, or from
Supabase Storage if you ever configure it.
`npm run verify:pg` boots a real throwaway PostgreSQL server and checks both backends end to
end. On the client side, `npm run verify:store` and `npm run verify:ui` run the real cart store
and the real components in a jsdom window — 34 checks covering the sold-out, nav-highlight,
cart-maths and broken-photo paths — while `npm run verify:catalog` audits the 1,797-product
data file itself (unique slugs, photos that resolve, no HTML entities leaking into copy).
The browser-side checks use dev-only packages, installed with `npm i --no-save`; see
[DEPLOYMENT.md](DEPLOYMENT.md) §9. Outgoing mail (ZeptoMail), the mailing list (Campaigns) and agent-handled delivery
tickets (Desk) are wired in `server/lib/zoho.mjs` and stay inert until their keys are set.

Deployment: which provider does which job, and the exact configuration for each, is in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 (custom design tokens) |
| State | Zustand with `persist` middleware |
| Animation | Framer Motion |
| Icons | Lucide |
| Routing | React Router 7 |
| Backend | Express 4 (JSON-file **or** Postgres store — Neon, Supabase, … — JWT, bcrypt, multer) |
| Deploy | GitHub Pages (storefront) + any Node host for the API — see [DEPLOYMENT.md](DEPLOYMENT.md) |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 (UI only; /api proxied to :5000 if running)
npm run dev:all  # UI + backend together
npm run build    # production bundle to dist/
npm run server   # backend + serves dist/ on http://localhost:5000
npm run preview  # serve the production build (Vite)
```

## Catalog

The catalogue in `src/lib/catalog.ts` combines:

- **Core appliances** — 134 appliances across eight categories (incl. Home & Office) with realistic UGX pricing,
  specifications, warranty terms, stock levels and hand-written customer reviews from
  locations around Uganda.
- **Ayne Kampala range (Aug 2026)** — 1,500+ gadgets imported from the Ayne Kampala store
  (ayne.ug, Aponye Complex): wearables, audio, cables & chargers, power banks, gaming,
  cameras, fans, grooming, car accessories and more. Real store/brand product photos live in
  `public/ayne/` (square webp, 800px). Listings carry Ayne's UGX prices, feature bullets and
  12-month warranty terms.

**Promo codes:** `KARIBU10` (10% off) · `CHIKWAFU5` (5% off)

Delivery is free on orders above UGX 1,500,000; otherwise UGX 15,000 within
Kampala/Wakiso/Mukono and UGX 45,000 upcountry.

## Project structure

```
src/
├── components/   Header, Footer, CartDrawer, ProductCard, Stars, Logo
├── pages/        Home, Shop, ProductDetail, Checkout, Track, OrderConfirmed, NotFound
│   └── admin/    Login, Dashboard, Orders, Products
├── store/        cart.ts (persisted), wishlist.ts (persisted), orders.ts, auth.ts
└── lib/          catalog.ts (seed data), api.ts (API client), types.ts, format.ts
server/
├── index.mjs     Express app: /api/* + static dist/ on one port
├── routes/       auth, products, orders, payments, media, newsletter
└── lib/          env, db (JSON store), catalog loader, auth middleware, seed
```

## Note

Checkout creates the order on the API and initiates a ZengaPay mobile-money collection
server-side; in the default `sandbox` mode the prompt is simulated and no real transaction
occurs. The marked block in `server/routes/payments.mjs` is where the live gateway call
goes. With no API reachable (e.g. GitHub Pages) checkout falls back to the local ledger.

## Licence

MIT
