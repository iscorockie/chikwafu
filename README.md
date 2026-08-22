# Chikwafu — eShop Platform

A full-stack e-commerce platform: a customer-facing shop, an admin dashboard, and a REST API.

- **API** — Node.js, Express, MongoDB (Mongoose), JWT auth — `/server`
- **Shop** — React (Vite), Tailwind CSS — `/shop`
- **Admin** — React (Vite), Tailwind CSS — `/admin`

## Features

**Shop**
- Home page: hero, trust badges, category grid, featured products, flash-sale countdown, collections, new arrivals, newsletter
- Full product catalog with search, category filter, price filter, sort
- Product detail page with image, ratings, reviews (submit + view), related products
- Cart (persisted in localStorage) and checkout flow with shipping + payment method
- Customer auth (register/login), account page with order history
- Wishlist

**Admin**
- Login (admin-only accounts)
- Dashboard: revenue, order count, product count, pending orders, orders-by-status chart, recent orders
- Products: create/edit/delete, feature flags (featured, new arrival, flash sale)
- Categories: create/edit/delete
- Orders: view details, update status (pending → processing → shipped → delivered/cancelled)
- Users: promote/demote admin role, enable/disable accounts, delete

**API**
- JWT auth (register/login/me)
- Products (CRUD, search, filter, sort, pagination, reviews)
- Categories (CRUD)
- Orders (create, my orders, all orders — admin, status update, dashboard stats)
- Users (admin management, wishlist toggle)

## Deploying

See **[DEPLOY.md](DEPLOY.md)** — MongoDB Atlas + Render, via the `render.yaml`
blueprint in this repo.

## Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 2. API Server

```bash
cd server
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # loads the Chikwafu catalogue + an admin user
npm run dev                 # runs on http://localhost:5000
```

Seeded admin login: **admin@chikwafu.com / admin123**

The seed loads the real Chikwafu catalogue — 78 products across 7 categories
(Kitchen, Laundry, Cooling, Home Entertainment, Small Appliances,
Phones & Tablets, Computing), priced in UGX.

Product images are served by the shop from `/jumia/*.webp`. If the front end
is hosted on a different origin, set `ASSET_BASE` before seeding:

```bash
ASSET_BASE=https://your-shop-host npm run seed
```

### 3. Shop (customer site)

```bash
cd shop
cp .env.example .env
npm install
npm run dev                 # runs on http://localhost:5173
```

### 4. Admin Dashboard

```bash
cd admin
cp .env.example .env
npm install
npm run dev                 # runs on http://localhost:5174
```

Log in to the admin with the seeded admin account above.

## Project Structure

```
chikwafu/
├── server/            # Express + MongoDB API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed.js
│   └── server.js
├── shop/               # Customer-facing store (Vite + React + Tailwind)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
└── admin/              # Admin dashboard (Vite + React + Tailwind)
    └── src/
        ├── components/
        ├── context/
        ├── lib/
        └── pages/
```

## Notes

- The shop and admin are separate apps so they can be deployed and scaled independently. Point both `.env` files at your deployed API URL in production.
- Product images in the seed data are left empty; the UI falls back to a placeholder. Add real image URLs via the admin Products form (comma-separated URLs) or extend the API with an upload endpoint (`multer` is already a dependency).
- Update `JWT_SECRET` in `server/.env` before deploying.
- CORS in `server/server.js` is restricted to `CLIENT_URL` and `ADMIN_URL` — update these for your deployed domains.
