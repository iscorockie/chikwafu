/**
 * Backfill orders written before the UGX pricing change.
 *
 *   node scripts/migrate-ugx.js              # dry run — reports, changes nothing
 *   node scripts/migrate-ugx.js --apply      # commit the backfill
 *   node scripts/migrate-ugx.js --apply --recompute-legacy   # see the warning below
 *
 * WHAT IT BACKFILLS (safe, additive — no figure is altered):
 *   currency    -> "UGX"
 *   discount    -> 0
 *   couponCode  -> ""
 *   shippingAddress.address  <- line1 (+ line2)
 *   shippingAddress.region   <- inferred from city where the district is known
 *   shippingAddress.country  -> "Uganda" where blank
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH:
 *   itemsPrice / shippingPrice / taxPrice / totalPrice on existing orders.
 *
 *   Orders created before the fix were priced with USD logic ($9.99 shipping,
 *   8% tax added on top). Those totals are what the customer was actually
 *   quoted and, in many cases, actually paid. Rewriting them would falsify
 *   the financial record and break reconciliation against MoMo statements.
 *
 *   Instead they are DETECTED and listed so you can decide. --recompute-legacy
 *   exists for the case where those orders were never paid (e.g. abandoned
 *   test data), and it writes the original figures to `legacyPricing` so the
 *   change is always reversible.
 *
 * Safe to run repeatedly: every step is idempotent.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import { priceOrder, CENTRAL_REGIONS } from "../config/pricing.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const RECOMPUTE = process.argv.includes("--recompute-legacy");

/** Ugandan districts we can safely infer a region from a city/town name. */
const DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Entebbe", "Mbarara", "Gulu",
  "Mbale", "Masaka", "Lira", "Fort Portal", "Arua", "Soroti", "Kabale",
  "Iganga", "Bushenyi", "Tororo", "Hoima", "Kasese", "Mityana", "Mubende",
];

/** Well-known Kampala/Wakiso suburbs, so "Ntinda" resolves to Kampala. */
const SUBURBS = {
  Kampala: ["ntinda", "bugolobi", "nakawa", "makindye", "kabalagala", "rubaga",
    "kawempe", "kansanga", "muyenga", "munyonyo", "kireka", "naguru", "kololo",
    "bukoto", "kyanja", "najjera", "luzira", "nsambya", "kamwokya"],
  Wakiso: ["kira", "naalya", "seguku", "kawuku", "nansana", "kyaliwajjala",
    "bweyogerere", "namugongo", "gayaza", "matugga", "entebbe road"],
  Mukono: ["seeta", "namataba", "lugazi", "goma"],
};

function inferRegion(addr = {}) {
  const city = String(addr.city || "").trim();
  if (!city) return null;
  const lower = city.toLowerCase();

  const exact = DISTRICTS.find((d) => d.toLowerCase() === lower);
  if (exact) return exact;

  for (const [district, towns] of Object.entries(SUBURBS)) {
    if (towns.some((t) => lower === t || lower.includes(t))) return district;
  }
  return null;
}

/** Did this order come from the old USD pricing logic? */
function looksLegacyUsd(o) {
  if (o.shippingPrice === 9.99 || o.shippingPrice === 0) {
    // 9.99 is unmistakable; 0 could be legitimate (free delivery) so also
    // check the tax shape before calling it.
  }
  const eightPercent = Math.abs(o.taxPrice - o.itemsPrice * 0.08) < 1;
  const usdShipping = Math.abs(o.shippingPrice - 9.99) < 0.01;
  const addedOnTop = Math.abs(o.totalPrice - (o.itemsPrice + o.shippingPrice + o.taxPrice)) < 1;
  return usdShipping || (eightPercent && addedOnTop && o.taxPrice > 0);
}

const money = (n) => new Intl.NumberFormat("en-UG").format(Math.round(n || 0));

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to your .env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const orders = await Order.find({}).lean();
  console.log(`${orders.length} order${orders.length === 1 ? "" : "s"} in the collection\n`);

  if (!orders.length) {
    console.log("Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const plan = [];
  const legacy = [];
  const unresolvedRegion = [];

  for (const o of orders) {
    const set = {};
    const addr = o.shippingAddress || {};

    if (o.currency == null || o.currency === "") set.currency = "UGX";
    if (o.discount == null) set.discount = 0;
    if (o.couponCode == null) set.couponCode = "";

    if (!addr.address) {
      const line = [addr.line1, addr.line2].filter(Boolean).join(", ");
      if (line) set["shippingAddress.address"] = line;
    }
    if (!addr.region) {
      const r = inferRegion(addr);
      if (r) set["shippingAddress.region"] = r;
      else unresolvedRegion.push(o);
    }
    if (!addr.country) set["shippingAddress.country"] = "Uganda";

    if (looksLegacyUsd(o)) legacy.push(o);
    if (Object.keys(set).length) plan.push({ _id: o._id, set });
  }

  /* ── report ─────────────────────────────────────────────────────── */

  console.log(`Backfill needed on ${plan.length} order${plan.length === 1 ? "" : "s"}`);
  const fieldTally = {};
  plan.forEach((p) => Object.keys(p.set).forEach((k) => { fieldTally[k] = (fieldTally[k] || 0) + 1 }));
  Object.entries(fieldTally).forEach(([k, n]) => console.log(`   ${k.padEnd(28)} ${n}`));

  if (unresolvedRegion.length) {
    console.log(`\n${unresolvedRegion.length} order(s) where the region could not be inferred.`);
    console.log("   They keep an empty region — set it by hand if you need it for reporting:");
    unresolvedRegion.slice(0, 10).forEach((o) =>
      console.log(`   ${String(o._id).slice(-8)}  city="${o.shippingAddress?.city || ""}"`));
    if (unresolvedRegion.length > 10) console.log(`   …and ${unresolvedRegion.length - 10} more`);
  }

  if (legacy.length) {
    console.log(`\n⚠  ${legacy.length} order(s) were priced with the old USD logic:`);
    console.log("   ref        items        ship      tax       total      would be");
    legacy.slice(0, 12).forEach((o) => {
      const would = priceOrder({
        itemsPrice: o.itemsPrice,
        region: o.shippingAddress?.region || inferRegion(o.shippingAddress) || "",
        couponCode: o.couponCode,
      });
      console.log(
        `   ${String(o._id).slice(-8)}  ${money(o.itemsPrice).padStart(10)}  ${String(o.shippingPrice).padStart(8)}  ` +
        `${money(o.taxPrice).padStart(8)}  ${money(o.totalPrice).padStart(10)}  ${money(would.totalPrice).padStart(10)}`,
      );
    });
    if (legacy.length > 12) console.log(`   …and ${legacy.length - 12} more`);
    console.log("\n   These totals are what the customer was quoted and may have paid.");
    console.log("   They are NOT rewritten by default — reconcile against your MoMo");
    console.log("   statements first. Use --recompute-legacy only if you are certain");
    console.log("   these orders were never settled.");
  }

  if (!APPLY) {
    console.log("\nDRY RUN — nothing was written. Re-run with --apply to commit.");
    await mongoose.disconnect();
    return;
  }

  /* ── apply ──────────────────────────────────────────────────────── */

  let written = 0;
  for (const { _id, set } of plan) {
    await Order.updateOne({ _id }, { $set: set });
    written++;
  }
  console.log(`\n✓ Backfilled ${written} order(s).`);

  if (RECOMPUTE && legacy.length) {
    let re = 0;
    for (const o of legacy) {
      const region = o.shippingAddress?.region || inferRegion(o.shippingAddress) || "";
      const p = priceOrder({ itemsPrice: o.itemsPrice, region, couponCode: o.couponCode });
      await Order.updateOne(
        { _id: o._id },
        {
          $set: {
            // keep the originals so this is reversible
            legacyPricing: {
              shippingPrice: o.shippingPrice,
              taxPrice: o.taxPrice,
              totalPrice: o.totalPrice,
              migratedAt: new Date(),
            },
            shippingPrice: p.shippingPrice,
            taxPrice: p.taxPrice,
            totalPrice: p.totalPrice,
          },
        },
      );
      re++;
    }
    console.log(`✓ Recomputed ${re} legacy order(s). Originals kept in \`legacyPricing\`.`);
  } else if (legacy.length) {
    console.log(`  ${legacy.length} legacy-priced order(s) left untouched (by design).`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
