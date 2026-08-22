/**
 * Ugandan pricing rules — the single source of truth for order maths.
 *
 * These MUST stay in step with the storefront (src/store/cart.ts) so the
 * total a customer is shown at checkout is the total the server records.
 *
 * Currency is UGX. There are no cents: every figure is a whole shilling.
 */

export const CURRENCY = "UGX";

/* ── Delivery ───────────────────────────────────────────────────────────
 * Flat fee by destination, waived on large orders. Matches the rates
 * quoted on the storefront and the Chikwafu Express page.
 */
export const DELIVERY_CENTRAL = 15000;      // Kampala, Wakiso, Mukono
export const DELIVERY_UPCOUNTRY = 45000;    // everywhere else
export const FREE_DELIVERY_THRESHOLD = 1_500_000;

/** Districts served at the Central rate, and the only ones eligible for COD. */
export const CENTRAL_REGIONS = ["Kampala", "Wakiso", "Mukono"];

/* ── VAT ────────────────────────────────────────────────────────────────
 * Uganda's standard rate is 18% (VAT Act Cap 349).
 *
 * Catalogue prices are quoted VAT-INCLUSIVE — the storefront states
 * "Prices include VAT" on every listing. So VAT is *extracted* from the
 * price for the record, never added on top. Adding it would overcharge
 * every customer by 18%.
 */
export const VAT_RATE = 0.18;

/** The VAT already contained within a VAT-inclusive gross amount. */
export const vatComponent = (grossInclusive) =>
  Math.round(grossInclusive - grossInclusive / (1 + VAT_RATE));

/* ── Coupons ────────────────────────────────────────────────────────── */
export const COUPONS = {
  KARIBU10: { off: 0.1, label: "10% welcome discount" },
  CHIKWAFU5: { off: 0.05, label: "5% loyalty discount" },
};

export const isCentral = (region) =>
  CENTRAL_REGIONS.some((r) => r.toLowerCase() === String(region || "").trim().toLowerCase());

/**
 * Work out delivery for a destination, given the amount actually payable
 * for goods (i.e. after any discount).
 */
export const deliveryFeeFor = (region, goodsPayable) => {
  if (goodsPayable >= FREE_DELIVERY_THRESHOLD) return 0;
  return isCentral(region) ? DELIVERY_CENTRAL : DELIVERY_UPCOUNTRY;
};

/**
 * Price a whole basket.
 *
 *   itemsPrice    gross, VAT-inclusive, before discount
 *   discount      coupon reduction
 *   shippingPrice delivery fee
 *   taxPrice      the VAT contained in the total (NOT added to it)
 *   totalPrice    what the customer actually pays
 */
export const priceOrder = ({ itemsPrice, region, couponCode }) => {
  const coupon = couponCode ? COUPONS[String(couponCode).trim().toUpperCase()] : null;
  const discount = coupon ? Math.round(itemsPrice * coupon.off) : 0;

  const goodsPayable = itemsPrice - discount;
  const shippingPrice = deliveryFeeFor(region, goodsPayable);
  const totalPrice = goodsPayable + shippingPrice;

  return {
    itemsPrice,
    discount,
    couponCode: coupon ? String(couponCode).trim().toUpperCase() : "",
    shippingPrice,
    taxPrice: vatComponent(totalPrice),
    totalPrice,
  };
};
