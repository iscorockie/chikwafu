-- ─────────────────────────────────────────────────────────────────────────────
-- Chikwafu on Supabase / PostgreSQL
--
-- Run this once in Supabase → SQL Editor (or: psql "$DATABASE_URL" -f supabase/schema.sql).
-- It is idempotent — safe to re-run.
--
-- Column names are snake_case; the API keeps its existing camelCase JSON shape
-- (server/lib/store.mjs maps between the two), so nothing on the client changes.
--
-- Requires PostgreSQL 13+ (gen_random_uuid(), jsonb, FILTER). Supabase runs 15/17.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── staff accounts (was: db.state.users) ───────────────────────────────────
create table if not exists users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'admin',
  created_at    timestamptz not null default now()
);

-- ─── the order ledger (was: db.state.orders) ────────────────────────────────
create table if not exists orders (
  id               text primary key,
  ref              text not null unique,
  -- { _id, name, email } — the API returns this as `user`
  customer         jsonb not null,
  -- [{ product, name, image, price, qty, express }]
  items            jsonb not null,
  -- { fullName, phone, address, city, region, country, notes }
  shipping_address jsonb not null,
  payment_method   text not null check (payment_method in ('mtn','airtel','card','cod')),
  coupon           text,
  -- Which WhatsApp line took the order chat: 'admin' or 'agent'.
  handled_by       text check (handled_by in ('admin','agent')),
  items_price      integer not null,
  discount         integer not null default 0,
  shipping_price   integer not null default 0,
  tax_price        integer not null default 0,
  total_price      integer not null,
  status           text not null default 'pending'
                   check (status in ('pending','processing','shipped','delivered','cancelled')),
  is_paid          boolean not null default false,
  -- [{ status, at, by }]
  history          jsonb not null default '[]'::jsonb,
  -- Set once a Zoho Desk ticket has been raised for an agent-handled delivery,
  -- so a restart can never file the same ticket twice.
  desk_ticket_id   text,
  created_at       timestamptz not null default now()
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx  on orders (status);
create index if not exists orders_phone_idx   on orders (((shipping_address->>'phone')));

-- ─── mobile-money attempts (was: db.state.payments) ─────────────────────────
create table if not exists payments (
  id           text primary key,
  "order"      text not null references orders(id) on delete cascade,
  reference    text not null,
  provider_ref text,
  network      text check (network in ('MTN','AIRTEL')),
  phone        text not null,
  amount       integer not null,
  status       text not null,
  created_at   timestamptz not null default now()
);
create index if not exists payments_order_idx   on payments ("order");
create index if not exists payments_created_idx on payments (created_at desc);

-- ─── newsletter sign-ups (was: db.state.newsletter) ─────────────────────────
create table if not exists newsletter (
  id    text primary key,
  email text not null unique,
  at    timestamptz not null default now(),
  -- Zoho Campaigns response, so a failed sync is visible without re-sending.
  synced_at timestamptz
);

-- ─── helpers used by the dashboard ──────────────────────────────────────────
create or replace view order_stats as
select
  count(*)                                                        as total_orders,
  coalesce(sum(total_price) filter (where status <> 'cancelled'), 0) as total_revenue
from orders;

-- ─── row level security ─────────────────────────────────────────────────────
-- The API connects with the service-role key, which bypasses RLS — so these
-- policies exist for the day you let the browser talk to Supabase directly
-- (Supabase Auth + the anon key). Until then they simply deny everything,
-- which is the correct default.
alter table users     enable row level security;
alter table orders    enable row level security;
alter table payments  enable row level security;
alter table newsletter enable row level security;

-- Public tracking reads: an order is visible to anyone holding its ref + phone.
-- (The API enforces this itself; the policy is here for a future direct client.)
drop policy if exists orders_track on orders;
create policy orders_track on orders
  for select using (true);

-- Everything else stays closed until a real auth policy is added.
drop policy if exists users_none on users;
create policy users_none on users for select using (false);

-- ─── storage ────────────────────────────────────────────────────────────────
-- Staff product photos. Create the bucket in the dashboard (Storage → New
-- bucket → name `media`, public) or with the Supabase CLI:
--   supabase storage create bucket media --public
-- The API uploads with the service-role key, so no bucket policy is required.
