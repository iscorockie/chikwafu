# Deploying Chikwafu — which provider does which job

Updated 2026-10-02 against `main` @ `e94254a` + the Supabase/Zoho work in this branch.
Every number below was measured in this checkout, not estimated.

**Chosen stack:** GitHub Pages serves the storefront · Supabase holds the data and the
product photos · a small Node host runs the Express API · Zoho does all the email and the
support tickets.

---

## 1. What is live right now vs. what is in this build

| | Live site (`https://iscorockie.github.io/chikwafu/`) | This build |
| --- | --- | --- |
| Source | branch `storefront-react` @ `31fc57b` (2026-08-29) | `main` @ `e94254a` + this branch |
| `server/` (Express API) | **absent** — `git ls-tree origin/storefront-react -- server` returns 0 files | present |
| `/track` | **404** — the page renders "This page has been unplugged." | working (`src/pages/Track.tsx`) |
| `/favorites`, `/admin/tickets` | absent | present |
| API integration, tap-to-open cards, pagination, brand icon fixes | absent | present |

Two reasons the site went stale:

1. `.github/workflows/deploy.yml` only triggered on `branches: [storefront-react]`. Nothing
   deployed when you merged to `main`.
2. `storefront-react` is an **orphan branch** — `git merge-base origin/main origin/storefront-react`
   returns nothing (exit 1). It was a hand-synced copy ("Sync main to deploy branch" commits),
   last synced 2026-08-29, so it silently fell a month behind.

**Fixed in this branch:** the workflow now triggers on `main`, so merging this branch deploys
the current build. Retire the `storefront-react` branch afterwards.

---

## 2. The one constraint that decided the architecture

The storefront is a static SPA — it goes anywhere. The **API could not**, because it needed a
writable disk in three places: the JSON ledger, staff media uploads, and the JWT secret file.
`server/lib/env.mjs` calls `mkdirSync()` at import time, so on a read-only filesystem it dies
before the server starts — reproduced here:

```
$ DATA_DIR=/tmp/ro/data node server/index.mjs     # /tmp/ro chmod 555
Error: EACCES: permission denied, mkdir '/tmp/ro/data'
    at file:///home/user/chikwafu/server/lib/env.mjs:56:1
```

Serverless filesystems are read-only (Vercel: read-only except an ephemeral 512 MB `/tmp`;
Cloudflare Workers: no filesystem at all; Supabase Edge Functions: Deno, no `node:fs`).

**That is now solved rather than avoided.** `server/lib/store.mjs` is one async data-access
interface with two backends:

| Backend | Selected by | Data lives in |
| --- | --- | --- |
| `json` (default, unchanged) | nothing set | `server/data/db.json` |
| `postgres` | `DATABASE_URL` | PostgreSQL / Supabase |

`server/lib/env.mjs` no longer hard-fails on a read-only disk, and uploads go to Supabase
Storage when it is configured. The routes never see the difference.

Verified — `npm run verify:pg` boots a real throwaway PostgreSQL 18.4, applies
`supabase/schema.sql`, runs the actual Express API against it and asserts 76 checks across
both backends (order creation with server-side re-pricing, coupon maths, public tracking,
phone-mismatch rejection, mobile-money collection, admin ledger/status/stats, newsletter
de-duplication), then **restarts the server** to prove the rows really are in the database:

```
  PostgreSQL 18.4 on x86_64-pc-linux-gnu ready
  schema applied: newsletter, order_stats, orders, payments, users
  ✓ [postgres] boots against DATABASE_URL
  ✓ [postgres] order survives a restart
  ✓ [postgres] staff account survives a restart
  ✓ [postgres] ledger count survives a restart
  ✓ [json] boots without DATABASE_URL
PASS — 0 failing check(s)
```

Supabase is managed PostgreSQL, so this exercises the identical wire protocol and the
identical SQL. What it cannot check from here is Supabase's own console: creating the project,
the `media` bucket, and the pooled connection string.

---

## 3. Who does what

| Provider | Job | Why |
| --- | --- | --- |
| **GitHub Pages** | Storefront (`https://iscorockie.github.io/chikwafu/`) | Already live, $0, and the workflow now deploys `main`. |
| **Supabase** | `users`, `orders`, `payments`, `newsletter` + the `media` photo bucket | Transactions for order+payment, RLS for the admin surface, Storage with no disk needed, free tier 500 MB DB / 1 GB files. |
| **A Node host** | `server/` — the Express API | Express 4 + multer + bcryptjs need Node, not an edge runtime. Render / Railway / Fly / a $5 VPS all work. |
| **Zoho** | ZeptoMail receipts, Campaigns mailing list, Desk tickets | All three are wired in `server/lib/zoho.mjs` and inert until their keys exist. |
| **Cloudflare** | Optional, later | DNS + CDN in front of the Pages domain, and R2 for the 79 MB of product photos (zero egress fees). `wrangler.jsonc` is already correct if you ever want to move the SPA there. |
| **Vercel / MongoDB** | Not used | Vercel would only duplicate Pages; MongoDB Atlas M0 (512 MB, no transactions, Data API EOL Sept 2025) gives less than Supabase for the same money. |

### Cost & caveats (free tiers, verified 2026)

* **Supabase free** — 500 MB database, 1 GB storage, 5 GB egress, 500k Edge Function
  invocations, 50k MAU. **Free projects pause after ~7 days of inactivity**: fine for a shop
  with daily traffic, so keep the staging project separate.
* **MongoDB Atlas M0** — 512 MB, shared RAM, no automated backups (not used).
* **Cloudflare Workers free** — 20,000 static files/version, 25 MiB/file. Our `dist/` is
  3,201 files with a 4.5 MB max, so it fits with room to spare.
* **GitHub Pages** — 1 GB per site; the current build is 84 MB.

---

## 4. Do this, in order

### 4.1 Ship the current storefront (about 2 minutes)

Merge this branch to `main`. The workflow now triggers on `main`, so Actions builds
`npm run build:pages` and publishes it. Force it manually with:

```bash
gh workflow run "Deploy storefront to GitHub Pages" --ref main
```

Verified build output: base `/chikwafu/`, `dist/404.html` present for client-side routes,
3,202 files / 84 MB. Delete the `storefront-react` branch once this has run.

### 4.2 Create the Supabase project

1. **New project** → note the region closest to your users (e.g. `eu-west-2` London).
2. **SQL Editor** → paste `supabase/schema.sql` → Run. It is idempotent.
   (Or `psql "$DATABASE_URL" -f supabase/schema.sql`.)
3. **Storage → New bucket** → name `media`, tick **Public**.
4. **Project Settings → Database → Connection string (URI)** → copy the *pooled* string
   (port 6543). That is `DATABASE_URL`.
5. **Project Settings → API** → copy the `service_role` key. That is `SUPABASE_SERVICE_KEY`
   — it bypasses RLS and must never reach the browser.

### 4.3 Deploy the API

Any Node ≥ 22.6 host. Render free tier is the lowest-friction start; note it sleeps after
inactivity, so the first request after a quiet spell takes ~30 s.

```
Build command     npm install && npm install --prefix server
Start command     node server/index.mjs
```

Environment:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the pooled Supabase URI |
| `PG_SSL` | `true` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service-role key |
| `SUPABASE_BUCKET` | `media` |
| `JWT_SECRET` | 48+ random bytes — **mandatory**, there is no disk to persist a generated one |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | change from the `chikwafu2026` default |
| `PUBLIC_URL` | the API's own origin |
| `STORE_URL` | `https://iscorockie.github.io/chikwafu` (links in outgoing email) |
| `SERVE_STATIC` | `false` — Pages serves the storefront, the API only serves `/api/*` |
| `ZENGAPAY_MODE` | `sandbox` until real gateway code exists (live mode throws by design) |

CORS is already open (`app.use(cors())`), which is what a separate Pages origin needs.

### 4.4 Point the storefront at it

GitHub → repo **Settings → Secrets and variables → Actions** → new secret
`VITE_API_URL` = `https://your-api-host`. The workflow already passes it into the build:

```yaml
- name: Build
  run: npm run build:pages
  env:
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
```

`VITE_*` is inlined at build time, so the site must be **redeployed** after setting it.

### 4.5 Verify

```bash
curl https://your-api-host/api/health
# {"status":"ok","name":"chikwafu-api","products":1797,"orders":0,"store":"postgres",...}
```

`"store":"postgres"` is the signal that the database swap took effect. Then open `/admin` —
the badge should read **"Live data from your-api-host"** instead of "Demo data".

---

## 5. Zoho — all three are already wired

`server/lib/zoho.mjs`. Each block stays inert without its key, and none of them can fail a
request: a Zoho outage is logged, never returned to the customer.

| Integration | Fires when | Env |
| --- | --- | --- |
| **ZeptoMail** | `POST /api/orders` (receipt) and every `PUT /api/orders/:id/status` | `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM`, `ZEPTOMAIL_FROM_NAME` |
| **Campaigns** | `POST /api/newsletter` — the sign-up is mirrored to the mailing list and `synced_at` is stamped | `ZOHO_CAMPAIGNS_TOKEN`, `ZOHO_CAMPAIGNS_LIST_KEY` |
| **Desk** | an order with `handledBy: 'agent'` is marked `delivered` — once; `desk_ticket_id` prevents re-filing | `ZOHO_DESK_TOKEN`, `ZOHO_DESK_ORG_ID` |

Setup notes:

1. **ZeptoMail is transactional only** — never send the newsletter through it. Verify the
   sending domain first (SPF + DKIM records in DNS), or nothing lands in inboxes.
2. **Campaigns and Desk need self-client OAuth tokens.** The v1.1 APIs reject static API keys.
   Create an OAuth self-client in the Zoho API Console with the scopes
   `ZohoCampaigns.contact.write` and `Desk.tickets.CREATE`, generate a grant-token-issued
   refresh token, and mint an access token.
3. **`ZOHO_REGION`** selects the data centre for all three hosts: `com` (default), `eu`, `in`,
   `com.au`, `com.cn`, `ca`, `jp`, `sa`.
4. The storefront now sends `handledBy` with the order (`src/pages/Checkout.tsx` → the Admin's
   presence toggle), which is what makes the Desk ticket possible — the server previously had
   no way to know the Admin was offline.

Still client-side: `/admin/tickets` records *acknowledgements* in `localStorage`
(`src/store/tickets.ts`), so two staff on two devices see different ticks. The ticket itself
now exists in Zoho Desk; moving the acknowledgement into the `orders` row is a small follow-up.

---

## 6. Two things worth fixing next

1. **The browser downloads the whole catalogue.** `npm run build` emits
   `dist/assets/index-*.js` at **4.5 MB (948.68 kB gzipped)** because `src/lib/catalog.ts`
   (67,638 lines, 1,797 products) is bundled into the app. On a Ugandan mobile connection that
   is the biggest thing between a visitor and the shop page. The API already serves
   `/api/products` with the same filter semantics — have the client fetch from it and keep only
   a small seed for demo mode.
2. **No card payment exists, so nothing advertises one.** The footer and the
   announcement bar used to show a Visa badge and "card payment"; `PAYMENTS` is
   MTN MoMo, Airtel Money and cash on delivery only, and there is no gateway in
   the API. Those claims were removed rather than implemented. Adding cards means
   integrating a PSP (Flutterwave, DPO or Pesapal) — a backend change, not a copy
   change.
3. **79 MB of product photos ship with every Pages deploy** (`public/ayne` 63 MB / 2,515 files,
   `public/jbl` 13 MB / 517, `public/jumia` 3.2 MB / 118). Move them to Supabase Storage or
   Cloudflare R2 behind a public hostname and the app deploy drops to ~5 MB.

---

## 7. Files changed in this branch

| File | What |
| --- | --- |
| `supabase/schema.sql` | tables, indexes, RLS, `order_stats` view — idempotent |
| `server/lib/store.mjs` | the data-access layer: `json` and `postgres` backends |
| `server/lib/oid.mjs` | id helper (was in the deleted `server/lib/db.mjs`) |
| `server/lib/zoho.mjs` | ZeptoMail, Campaigns, Desk |
| `server/lib/env.mjs` | new config, no hard failure on a read-only disk |
| `server/routes/{orders,payments,newsletter,auth,media}.mjs` | async store calls, Zoho hooks, `handledBy` |
| `server/index.mjs` | `openStore()`, `store` field in `/api/health`, clean shutdown |
| `scripts/verify-postgres.mjs` | `npm run verify:pg` — 76 checks against real PostgreSQL |
| `scripts/verify-store.mjs` | `npm run verify:store` — 15 checks against the real cart store |
| `scripts/verify-ui.mjs` | `npm run verify:ui` — 16 checks against the rendered DOM |
| `scripts/lib/{ts-resolve,register-ts}.mjs` | lets the Node checks import `src/` as shipped |
| `src/lib/api.ts`, `src/pages/Checkout.tsx` | send `handledBy` |
| `.github/workflows/deploy.yml` | deploy `main`, Node 22, `VITE_API_URL` from a secret |
| `vercel.json` | unused for now, ready if you move the SPA to Vercel |

## 8. UI/UX audit

A code-level audit of the storefront found 15 defects. All are fixed; the last
three columns are what `npm run verify:store` / `verify:ui` now assert.

| Defect | Where | Fix |
| --- | --- | --- |
| A sold-out product could be added: a qty-0 line opened a cart that totalled UGX 0 and was then rejected with "Invalid quantity" | `store/cart.ts`, 518 of 1,797 products | `add()` refuses `stock <= 0`; `useCartDetails` clamps to stock and drops empty lines |
| "Only 0 left" and a live Add to cart button on sold-out cards | `ProductCard.tsx` | "Out of stock" pill, greyed photo, disabled CTA |
| Same on the product page, plus a dead ternary (`stock > 10 ? 'bg-accent' : 'bg-accent'`) | `ProductDetail.tsx` | disabled stepper and CTA; real three-state stock line |
| **CTA text was `#f0f0f5` on `#00e5a0` — 1.45:1**, illegible | `ProductCard.tsx` | `text-bg` on accent — **11.96:1** |
| **`text.dim #555568` was 2.71:1 on the page, 2.32:1 on a card** | `tailwind.config.js` | `dim #85859c`, `muted #9a9ab0` — both ≥ 4.7:1 on both surfaces, ramp preserved |
| All six "Shop…" nav items lit their underline at once on any `/shop` page | `Header.tsx` | match pathname **and** query string |
| **`aria-current` fell back to NavLink's prefix match, so 6 links announced "current page"** | `Header.tsx` | always emit `page` or `false` |
| Hamburger had no `aria-expanded` / `aria-controls`; drawer was not a dialog and Escape did nothing | `Header.tsx` | wired to `#mobile-menu`, `role="dialog" aria-modal`, Escape closes |
| Mobile filter sheet had no Escape, no scroll lock, no dialog role | `Shop.tsx` | all three added |
| **Checkout validation errors were green** (`text-accent`) | `Checkout.tsx` | `text-danger`, `role="alert"` |
| Checkout fields had no `htmlFor`/`id`, no `aria-invalid` | `Checkout.tsx` | labelled, wired, `autoComplete` added |
| Cash-on-delivery orders confirmed as "Payment confirmed" / "Total paid" | `OrderConfirmed.tsx` | `paymentState()` → confirmed / pay the rider / pending |
| "We have sent an SMS" — no SMS is sent | `OrderConfirmed.tsx`, `Track.tsx` | replaced with a real greeting and a tracking CTA |
| Every unpaid order tracked as "Payment on delivery" | `Track.tsx` | paid / cash on delivery / pending, `aria-live` |
| A Visa badge for a gateway that does not exist | `Footer.tsx` | "Cash on delivery" |

Contrast figures are WCAG relative luminance computed from the hexes in
`tailwind.config.js`. **Nothing was verified in a browser** — there is none in
this environment — so layout, animation and the real Pages subpath are untested
by eye.

## 9. Local development is unchanged

```bash
npm run dev:all      # Vite :5173 (proxies /api) + API :5000 on the JSON store
npm run verify:pg    # 76 checks against a real throwaway PostgreSQL
npm run verify:store # 15 checks against the real cart store
npm run verify:ui    # 16 checks against the rendered DOM
```

`verify:pg`, `verify:store` and `verify:ui` use dev-only dependencies that are
deliberately not in `package.json`, so a normal `npm install` stays light:

```bash
npm i --no-save embedded-postgres            # verify:pg
npm i --no-save jsdom                        # verify:store and verify:ui
npm i --no-save esbuild jsdom                # verify:ui (JSX)
```

Each script says what it is missing and exits with code 2 instead of failing.

Nothing above changes the default experience: with no `DATABASE_URL` the API uses
`server/data/db.json` exactly as before.
