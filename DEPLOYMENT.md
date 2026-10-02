# Deploying Chikwafu — which provider does which job

Written 2026-10-02 against `main` @ `e94254a`. Every number below was measured in this
checkout, not estimated.

---

## 1. What is live right now vs. what is in this build

| | Live site (`https://iscorockie.github.io/chikwafu/`) | This build (`main` @ `e94254a`) |
| --- | --- | --- |
| Source | branch `storefront-react` @ `31fc57b` (2026-08-29) | branch `main` @ `e94254a` (2026-10-03) |
| `server/` (Express API) | **absent** — `git ls-tree origin/storefront-react -- server` returns 0 files | present (12 files) |
| `/track` | **404** — the page renders "This page has been unplugged." | working page (`src/pages/Track.tsx`) |
| `/favorites`, `/admin/tickets` | absent | present |
| Same-origin API detection, tap-to-open cards, pagination, brand icon fixes | absent | present |

Two reasons the site went stale:

1. `.github/workflows/deploy.yml` only triggers on `branches: [storefront-react]`. Nothing
   deploys when you merge to `main`.
2. `storefront-react` is an **orphan branch** — `git merge-base origin/main origin/storefront-react`
   returns nothing (exit 1). It is a hand-synced copy ("Sync main to deploy branch" commits),
   last synced 2026-08-29, so it silently fell a month behind.

**Fix applied in this branch:** the workflow now triggers on `main`, so merging this branch
deploys the current build. That orphan-branch pattern should be retired.

---

## 2. The one constraint that decides everything

The storefront is a static SPA — it can go anywhere. The **API cannot**, because it needs a
writable disk in three places:

* `server/data/db.json` — the whole ledger (`server/lib/db.mjs`)
* `server/uploads/` — staff media uploads (`server/routes/media.mjs`, multer `diskStorage`)
* `server/data/.jwt-secret` — staff session secret (`server/lib/env.mjs:resolveJwtSecret`)

`server/lib/env.mjs` calls `mkdirSync()` at import time. Point it at a directory it cannot
write and it dies before the server starts — reproduced here:

```
$ DATA_DIR=/tmp/ro/data node server/index.mjs     # /tmp/ro chmod 555
Error: EACCES: permission denied, mkdir '/tmp/ro/data'
    at file:///home/user/chikwafu/server/lib/env.mjs:56:1
```

Serverless filesystems are read-only (Vercel: read-only except an ephemeral 512 MB `/tmp`;
Cloudflare Workers: no filesystem at all; Supabase Edge Functions: Deno, no `node:fs`).
**So the API only becomes deployable once those three things move to a managed service.**
That is the whole migration, and it is small: `db.mjs` is 5 functions and its own header
comment says so.

What the API does look like once running (verified locally):

```
$ PORT=5055 node server/index.mjs
[db] first boot — seeding admin account and demo ledger…
Chikwafu API listening on http://0.0.0.0:5055
  · API      /api/health (1797 products loaded)
  · Store    serving dist/
$ curl /api/health  → {"status":"ok","name":"chikwafu-api","products":1797,"orders":34,...}
```

---

## 3. Verdict: who does what

| Provider | Use it for | Skip it for |
| --- | --- | --- |
| **Cloudflare** | ✅ Storefront hosting + CDN + DNS, product images later (R2) | Running the Express API |
| **Supabase** | ✅ The data layer: orders/users/payments/newsletter (Postgres), uploads (Storage), optional staff auth, realtime dashboard | Hosting the SPA |
| **Vercel** | ⚖️ Fine alternative to Cloudflare for the SPA — pick **one** of the two | The API, until persistence is off disk |
| **MongoDB Atlas** | ⚖️ Only if you prefer documents over tables — smallest code change, weakest features | Anything Supabase already covers |
| **Zoho** | ✅ Email only: ZeptoMail for receipts, Campaigns for the newsletter list | Hosting — nothing in this app runs on Zoho |

**Recommended stack (all free tier):**

```
Cloudflare Workers static assets   → the SPA (3,202 files, 84 MB) — wrangler.jsonc already correct
Supabase                           → Postgres + Storage (+ Auth/Realtime later)
Vercel (optional)                  → only if you prefer its dashboard/preview URLs over Cloudflare
Zoho ZeptoMail + Campaigns         → order receipts + newsletter
```

Why this split: Cloudflare is already wired up (`wrangler.jsonc`), gives unlimited bandwidth on
the free plan — which matters when 79 MB of the deploy is product photos for a Ugandan
audience — and Workers static assets allow 20,000 files / 25 MiB per file on free, so our
3,202 files with a 4.5 MB max fit with room to spare. Supabase gives transactions (you need
"insert order + record payment + mark paid" to be atomic), row-level security for the admin
routes, and realtime so the dashboard updates without polling — none of which MongoDB M0 does.
MongoDB Atlas M0 is 512 MB free and its Data API reached EOL in Sept 2025, so from an edge
runtime you'd need a driver anyway.

### Cost & caveats (free tiers, verified 2026)

* Cloudflare Workers free: 20,000 static files/version, 25 MiB/file.
* Supabase free: 500 MB database, 1 GB storage, 5 GB egress, 500k Edge Function invocations,
  50k MAU. **Free projects pause after ~7 days of inactivity** — fine for a shop that gets
  daily traffic, annoying for a staging project.
* MongoDB Atlas M0: 512 MB, shared RAM, no automated backups.
* GitHub Pages: unchanged, $0, still a perfectly good home for the static build.

---

## 4. Phase 0 — ship the current build today (no backend, ~5 minutes)

This gets the tracking page, favourites, tickets UI, pagination and icon fixes live. The app
auto-detects that no API answers and stays in demo mode (that fallback is already built and is
what the admin panel's `DataSourceNote` reports).

**Option A — Cloudflare (recommended).** `wrangler.jsonc` is already configured for static
assets with SPA fallback:

```bash
npm ci && npm run build              # plain base '/', 3,201 files → dist/
npx wrangler login                   # browser auth, once
npx wrangler deploy                  # → https://chikwafu.<your-subdomain>.workers.dev
```

Then in the Cloudflare dashboard: **Workers & Pages → chikwafu → Settings → Domains & Routes →
Custom domain** → `chikwafu.ug` (or `www.`). Cloudflare manages DNS + TLS if the domain is on
Cloudflare nameservers.

**Option B — Vercel.** `vercel.json` is in this branch (SPA rewrite + long-cache headers):

```bash
npm i -g vercel && vercel login
vercel link            # or import the GitHub repo in the dashboard
vercel --prod
```

Dashboard: **Project → Settings → Domains** → add the custom domain, follow the CNAME.

**Option C — GitHub Pages (zero new accounts).** Already fixed in this branch — merge to
`main` and Actions deploys it. Or force it now:

```bash
gh workflow run "Deploy storefront to GitHub Pages" --ref main
```

> `build:pages` sets `BASE=/chikwafu/` and copies `index.html` → `404.html`; verified output:
> `src="/chikwafu/assets/index-B8hk-gmO.js"`, `dist/404.html` present. Do **not** use that
> script for Cloudflare/Vercel — those serve from the root, so use `npm run build`.

---

## 5. Phase 1 — make orders real (the DB swap)

### 5a. Supabase (recommended)

Create a project, then run this in the SQL editor — it mirrors the exact document shapes the
server writes today:

```sql
create table users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'admin',
  created_at    timestamptz not null default now()
);

create table orders (
  id               text primary key,
  ref              text not null unique,
  customer         jsonb not null,          -- { _id, name, email }
  items            jsonb not null,          -- [{ product, name, image, price, qty, express }]
  shipping_address jsonb not null,          -- { fullName, phone, address, city, region, country, notes }
  payment_method   text not null check (payment_method in ('mtn','airtel','card','cod')),
  coupon           text,
  items_price      integer not null,
  discount         integer not null default 0,
  shipping_price   integer not null default 0,
  tax_price        integer not null default 0,
  total_price      integer not null,
  status           text not null default 'pending'
                   check (status in ('pending','processing','shipped','delivered','cancelled')),
  is_paid          boolean not null default false,
  history          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);
create index orders_created_idx on orders (created_at desc);
create index orders_status_idx  on orders (status);

create table payments (
  id            text primary key,
  "order"       text not null references orders(id),
  reference     text not null,
  provider_ref  text,
  network       text check (network in ('MTN','AIRTEL')),
  phone         text not null,
  amount        integer not null,
  status        text not null,
  created_at    timestamptz not null default now()
);

create table newsletter (
  id  text primary key,
  email text not null unique,
  at    timestamptz not null default now()
);
```

Storage: **Storage → New bucket → `media`**, make it public (product photos only).

Code changes (all small, all confined to `server/`):

| File | Change |
| --- | --- |
| `server/lib/db.mjs` | Replace the JSON store with `@supabase/supabase-js` (or `pg`). Keep the same call shape (`db.state.*` → async queries) — this is the only substantive edit. |
| `server/routes/media.mjs` | `multer.memoryStorage()` → `supabase.storage.from('media').upload()`; return the public URL instead of `/uploads/…`. |
| `server/lib/env.mjs` | Drop the `mkdirSync` calls when `DATABASE_URL`/`SUPABASE_URL` is set; require `JWT_SECRET`. |
| `server/lib/seed.mjs` | Run once from a laptop (`node server/lib/seed.mjs`), not on boot. |

Then the API can run anywhere — including **Supabase Edge Functions** (Deno) if you want to drop
the extra host entirely. Note the one thing that must change first for that: `server/lib/catalog.mjs`
imports `../../src/lib/catalog.ts` using Node's native type-stripping (works on Node ≥ 22.18 —
that's how it booted here). Deno and most bundlers won't resolve it the same way, so **precompile
the catalogue** to `server/data/catalog.json` in the build step and import that instead. Doing
that also lets you stop shipping the catalogue to the browser — see §7.

### 5b. MongoDB Atlas (if you prefer documents)

The JSON store maps 1:1 onto collections, so the diff is smaller:

```bash
npm i --prefix server mongodb
```

```js
// server/lib/db.mjs — shape-preserving replacement
import { MongoClient } from 'mongodb'
const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()
const db = client.db('chikwafu')
export const collections = {
  users: db.collection('users'),
  orders: db.collection('orders'),
  payments: db.collection('payments'),
  newsletter: db.collection('newsletter'),
}
```

Call sites change from `db.state.orders.unshift(o); db.save()` to
`await collections.orders.insertOne(o)`. Add indexes on `orders.ref`, `orders.status`,
`orders.createdAt`, `newsletter.email`. Uploads still need object storage — Cloudflare R2 or
Vercel Blob — because no serverless runtime has a disk.

### 5c. Where the API itself runs

| Host | Works today? | Notes |
| --- | --- | --- |
| Render / Railway / Fly / a $5 VPS | ✅ as-is | The only option that runs this code unchanged (real disk, `npm run server`). Cheapest path to "real orders this week". |
| Supabase Edge Functions | after the swap | Fewest moving parts; needs the catalogue precompiled and Express → Deno handler (or Hono). |
| Vercel serverless | after the swap | Read-only FS, 512 MB ephemeral `/tmp`; needs memory-storage multer + Blob, `JWT_SECRET` set, and the `.ts` import replaced. Long-lived sockets aren't available. |
| Cloudflare Workers | needs a rewrite | Express 4 + multer + bcryptjs don't run on `workerd`; you'd move to Hono + D1/KV/R2. Don't do this unless you want to. |

---

## 6. Zoho — where it actually fits

Nothing in this repo touches Zoho today. Three clean insertion points:

1. **Order receipts → ZeptoMail** (transactional; do *not* use it for the newsletter).
   Hook it in `server/routes/orders.mjs` right after the order is inserted, and in
   `server/routes/payments.mjs` after a successful collection:

   ```js
   await fetch('https://api.zeptomail.com/v1.1/email', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Zoho-enczapikey ${process.env.ZEPTOMAIL_API_KEY}`,
     },
     body: JSON.stringify({
       from: { address: 'orders@chikwafu.ug', name: 'Chikwafu Appliances' },
       to: [{ email_address: { address: order.user.email } }],
       subject: `Chikwafu order ${order.ref}`,
       htmlbody: receiptHtml(order),
     }),
   })
   ```

   Prerequisite: the domain must be verified in ZeptoMail (SPF + DKIM records — these go in
   Cloudflare DNS, which is another reason to put DNS there). Send failures must never fail the
   order: wrap in try/catch and log.

2. **Newsletter → Zoho Campaigns.** `POST /api/newsletter` currently only appends to the ledger.
   Keep that (it's your own record) *and* forward to Campaigns so you can actually send:

   ```
   POST https://campaigns.zoho.com/api/v1.1/json/listsubscribe
        ?resfmt=JSON&listkey=<LIST_KEY>&contactinfo={"Contact Email":"…"}
   Authorization: Zoho-oauthtoken <token>
   ```

   Use a self-client OAuth token (Campaigns API v1.1 requires OAuth, not a static key).

3. **Tickets / CRM (optional).** `/admin/tickets` is client-side only right now —
   `src/store/tickets.ts` persists acknowledged refs to `localStorage`, so two staff members on
   two devices see different things. If you want tickets to survive that, they belong in the
   database from §5, or in Zoho Desk. Don't do both.

---

## 7. Two things worth fixing while you're in here

1. **The browser downloads the whole catalogue.** `npm run build` emits
   `dist/assets/index-*.js` at **4.5 MB (948.68 kB gzipped)** because `src/lib/catalog.ts`
   (67,638 lines, 1,797 products) is bundled into the app. On a Ugandan mobile connection that
   is the single biggest thing standing between a visitor and the shop page. Once the API is
   live, have the client fetch from `/api/products` and keep only a small seed for demo mode.
2. **79 MB of product photos ship with every deploy** (`public/ayne` 63 MB / 2,515 files,
   `public/jbl` 13 MB / 517, `public/jumia` 3.2 MB / 118). They're immutable and cacheable —
   ideal for **Cloudflare R2** behind a public hostname: zero egress fees, and the app deploy
   drops to ~5 MB. `server/routes/media.mjs` already flags R2/S3 as the intended destination.

---

## 8. Environment variables by target

**Cloudflare Workers static / Vercel static (storefront only)**

| Var | Value | Where |
| --- | --- | --- |
| `VITE_API_URL` | *leave unset* for same-origin; set to `https://api.chikwafu.ug` if the API is a separate host | build-time (must be prefixed `VITE_`) |

**API host (Phase 1)**

| Var | Value |
| --- | --- |
| `PORT`, `HOST` | `5000`, `0.0.0.0` (or the platform's injected `PORT`) |
| `PUBLIC_URL` | `https://api.chikwafu.ug` — used to build absolute upload URLs |
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` *(or `MONGODB_URI`)* | from the project's API settings — **service key, never the anon key** |
| `JWT_SECRET` | 48+ random bytes. **Mandatory in production** — without it the secret is written to a file that serverless can't keep |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | change from the `chikwafu2026` default before first boot |
| `ZENGAPAY_MODE` | `sandbox` until real gateway code exists in `server/routes/payments.mjs` (live mode currently throws by design) |
| `ZEPTOMAIL_API_KEY`, `ZOHO_CAMPAIGNS_TOKEN`, `ZOHO_CAMPAIGNS_LIST_KEY` | from the Zoho consoles |
| `SERVE_STATIC` | `false` if the API is a separate host from the SPA |

Secrets live in the platform's dashboard (Cloudflare: Worker → Settings → Variables, mark
**Secret**; Vercel: Project → Settings → Environment Variables; Supabase: Project → Settings →
API). Never in the repo — `.gitignore` already covers `.env` and `server/data/`.

---

## 9. Order of operations

1. Merge this branch → the GitHub Pages workflow now deploys `main`, so today's build goes live.
2. `npx wrangler deploy` (or `vercel --prod`) and put the custom domain on Cloudflare.
3. Supabase project → run the SQL → create the `media` bucket.
4. Swap `server/lib/db.mjs` + media storage; precompile the catalogue; set `JWT_SECRET` and the
   admin credentials; deploy the API; point `VITE_API_URL` at it and redeploy the SPA.
5. Verify: `curl https://api…/api/health` → `"name":"chikwafu-api"`; the admin panel should
   flip from "Demo data" to "Live data from …".
6. ZeptoMail + Campaigns wiring; then move images to R2 and the catalogue out of the bundle.
