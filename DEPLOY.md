# Deploying Chikwafu

Three services: the API, the shop, and the admin dashboard. Database on
MongoDB Atlas, everything else on Render.

---

## 1. MongoDB Atlas

1. **Create a free M0 cluster.** Pick the region closest to your users —
   `AWS / eu-central-1 (Frankfurt)` pairs well with Render's Frankfurt region.
2. **Database Access → Add New Database User.** Give it a strong password and
   the `readWrite` role on the `chikwafu` database. Copy the password now; you
   cannot read it back later.
3. **Network Access → Add IP Address.**
   Render's free tier does not offer static outbound IPs, so allow
   `0.0.0.0/0`. The database is still protected by username, password and TLS —
   but if you later move to a paid Render plan, restrict this to its static IPs.
4. **Connect → Drivers** and copy the SRV string. It looks like:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/chikwafu?retryWrites=true&w=majority
   ```

   Substitute your real password and make sure `/chikwafu` appears before the
   `?`. Without a database name Mongo writes to `test`.

---

## 2. Render

The repo has a `render.yaml` blueprint, so all three services deploy together.

1. **Render → New → Blueprint**, point it at this repo, choose the branch.
2. Render reads `render.yaml` and proposes **chikwafu-api**, **chikwafu-shop**
   and **chikwafu-admin**. Approve.
3. It will ask for the one secret that is not in the file:

   | Service | Variable | Value |
   | --- | --- | --- |
   | chikwafu-api | `MONGO_URI` | your Atlas SRV string |

   `JWT_SECRET` is generated for you. `CLIENT_URL`, `ADMIN_URL` and both
   `VITE_API_URL`s are wired between the services automatically, so CORS and
   the API base URL need no manual editing.

4. First deploy takes a few minutes. Check the API is alive:

   ```
   https://chikwafu-api.onrender.com/api/health
   → {"status":"ok","database":{"state":"connected",...}}
   ```

   The health check reports the **database** state, not just that the process
   is running:

   | Response | Meaning |
   | --- | --- |
   | `200 ok` | connected and serving |
   | `503 degraded` | process up, database unreachable — `database.lastError` says why |

   `/api/health/live` is liveness only, and stays `200` whatever the database
   is doing. Use it if you ever need to tell "restart me" apart from "my
   dependency is down".

---

## 3. Seed the catalogue

Once the API is live and connected, load the products and the admin user.
Render Dashboard → **chikwafu-api → Shell**:

```bash
npm run seed
```

This writes 78 products across 7 categories and creates:

```
admin@chikwafu.com / admin123
```

**Change that password immediately** — it is published in this repo.
Sign in to the admin, or update the user directly in Atlas.

### Product images

The seed points image URLs at `/jumia/*.webp`, which the shop serves from its
own `public/` folder. If you host images elsewhere (S3, Cloudinary), set
`ASSET_BASE` before seeding:

```bash
ASSET_BASE=https://cdn.example.com npm run seed
```

### Migrating existing orders

If the database already holds orders written before the UGX pricing fix:

```bash
npm run migrate:ugx          # dry run — reports, changes nothing
npm run migrate:ugx:apply    # commit the backfill
```

---

## 4. Custom domain

Render → service → **Settings → Custom Domains**. Point `chikwafu.com` at the
shop and something like `admin.chikwafu.com` at the admin.

The API's allowed origins come from `CLIENT_URL` and `ADMIN_URL`. Both accept a
**comma-separated list**, so keep the Render URL alongside the custom domain
while you cut over:

```
CLIENT_URL=https://chikwafu.com,https://chikwafu-shop.onrender.com
```

Then redeploy the API so it picks up the change.

---

## Things that will bite you

**The free API sleeps.** Render's free web services spin down after 15 minutes
idle, and the next request takes 30–60 seconds to wake them. Fine for a demo,
not for customers. The Starter plan removes it.

**Free Atlas has no backups.** M0 clusters do not include automated backups.
Before you hold real orders, either upgrade to M10+ or schedule your own
`mongodump`.

**`JWT_SECRET` must stay secret and stable.** Rotating it invalidates every
signed-in session. Never commit it.

**CORS failures look like nothing happening.** If the shop loads but no data
appears, open the browser console. `blocked by CORS policy` means `CLIENT_URL`
does not exactly match the site's origin — check for a trailing slash or
`http` versus `https`.

**Check the region.** Both Atlas and Render default to US regions. For Ugandan
users, Frankfurt roughly halves the round trip.
