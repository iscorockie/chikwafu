/**
 * Zoho integrations.
 *
 *   · ZeptoMail   — transactional mail: the order receipt and status updates.
 *                   https://www.zoho.com/zeptomail/help/api/
 *   · Campaigns   — forwards newsletter sign-ups to a mailing list, which is
 *                   the only way you can actually email them.
 *   · Desk        — files a support ticket when the Agent delivers an order the
 *                   Admin was offline for, so it lands back with the Admin.
 *
 * Every function is deliberately inert without its key and never throws into a
 * request: a Zoho outage must not cost you an order. Failures are logged and
 * returned so callers can persist them if they want to.
 *
 * Prerequisites: verify the sending domain in ZeptoMail (SPF + DKIM records in
 * your DNS) and generate self-client OAuth tokens for Campaigns/Desk — those
 * two APIs reject static API keys.
 */
import { config } from './env.mjs'

const region = config.campaignsRegion || 'com'
const zohoHost = (prefix) =>
  region === 'com' ? `${prefix}.zoho.com` : `${prefix}.zoho.${region}`

export const zoho = {
  mail: !!config.zeptomailKey,
  campaigns: !!(config.campaignsToken && config.campaignsListKey),
  desk: !!(config.deskToken && config.deskOrgId),
}

const money = (n) => `UGX ${Number(n || 0).toLocaleString('en-UG')}`

const log = (what, res) => {
  if (res.ok) console.log(`[zoho] ${what} ok`)
  else console.warn(`[zoho] ${what} failed: ${res.error}`)
  return res
}

async function postJson(url, headers, body, what) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const text = await res.text()
    if (!res.ok) return { ok: false, error: `${res.status} ${text.slice(0, 200)}` }
    return { ok: true, body: text ? JSON.parse(text) : null }
  } catch (err) {
    return { ok: false, error: `${what}: ${err.message}` }
  }
}

/* ─────────────────────────────── ZeptoMail ──────────────────────────────── */

const PAY_LABEL = { mtn: 'MTN Mobile Money', airtel: 'Airtel Money', card: 'Card', cod: 'Cash on delivery' }
const STATUS_LABEL = {
  pending: 'Order placed', processing: 'Processing at Ntinda',
  shipped: 'With our rider', delivered: 'Delivered', cancelled: 'Cancelled',
}

/** Receipt + every status change share one layout. */
export function orderHtml(order, heading, intro) {
  const rows = order.items
    .map(
      (l) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${l.qty}× ${escapeHtml(l.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(l.price * l.qty)}</td>
      </tr>`,
    )
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#f6f5f3;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1b1a19">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0a0a0f;color:#fff;border-radius:14px 14px 0 0;padding:22px 24px">
      <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#e08a4e">Chikwafu Appliances</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px">${escapeHtml(heading)}</div>
      <div style="font-size:13px;color:#a8a4a0;margin-top:4px">Order ${escapeHtml(order.ref)} · ${new Date(order.createdAt).toLocaleString('en-GB')}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px">
      <p style="margin:0 0 16px">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <table style="width:100%;margin-top:14px;font-size:14px">
        <tr><td>Subtotal</td><td style="text-align:right">${money(order.itemsPrice)}</td></tr>
        ${order.discount ? `<tr><td>Discount${order.coupon ? ` (${escapeHtml(order.coupon)})` : ''}</td><td style="text-align:right">−${money(order.discount)}</td></tr>` : ''}
        <tr><td>Delivery</td><td style="text-align:right">${order.shippingPrice ? money(order.shippingPrice) : 'Free'}</td></tr>
        <tr style="font-weight:700;font-size:16px"><td style="padding-top:8px">Total</td><td style="padding-top:8px;text-align:right">${money(order.totalPrice)}</td></tr>
      </table>
      <hr style="border:0;border-top:1px solid #eee;margin:20px 0">
      <p style="margin:0;font-size:14px"><strong>Delivering to</strong><br>
        ${escapeHtml(order.shippingAddress.fullName)} · ${escapeHtml(order.shippingAddress.phone)}<br>
        ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city || '')} ${escapeHtml(order.shippingAddress.region)}</p>
      <p style="margin:12px 0 0;font-size:14px"><strong>Payment</strong><br>
        ${PAY_LABEL[order.paymentMethod] ?? order.paymentMethod} · ${order.isPaid ? 'Paid' : 'Not yet paid'}</p>
      <p style="margin:20px 0 0;font-size:13px;color:#6b6864">
        Track this order any time at
        <a href="${config.storeUrl}/track" style="color:#c9762f">track your order</a>
        with your reference and phone number. Questions? WhatsApp
        <a href="https://wa.me/256780844098" style="color:#c9762f">+256 780 844098</a>.
      </p>
    </div>
  </div></body></html>`
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

async function sendMail({ to, subject, html }) {
  if (!zoho.mail) return { ok: false, error: 'ZEPTOMAIL_API_KEY not set', skipped: true }
  if (!to) return { ok: false, error: 'no recipient email on the order', skipped: true }
  return log(
    `mail → ${to}`,
    await postJson(
      `https://api.zeptomail.${region === 'com' ? 'com' : region}/v1.1/email`,
      { Authorization: `Zoho-enczapikey ${config.zeptomailKey}` },
      {
        from: { address: config.zeptomailFrom, name: config.zeptomailFromName },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: html,
      },
      'zeptomail',
    ),
  )
}

/** The receipt, sent the moment an order is accepted. */
export const sendOrderReceipt = (order) =>
  sendMail({
    to: order.user?.email ?? order.shippingAddress?.email,
    subject: `Chikwafu order ${order.ref} — received`,
    html: orderHtml(
      order,
      'Karibu! Your order is in.',
      `We have your order and it is queued at our Ntinda store. ${
        order.paymentMethod === 'cod' ? 'Pay the rider on delivery.' : 'We will confirm payment shortly.'
      }`,
    ),
  })

/** Sent when staff move an order along the timeline. */
export const sendStatusEmail = (order) =>
  sendMail({
    to: order.user?.email ?? order.shippingAddress?.email,
    subject: `Chikwafu order ${order.ref} — ${STATUS_LABEL[order.status] ?? order.status}`,
    html: orderHtml(
      order,
      STATUS_LABEL[order.status] ?? order.status,
      `Your order ${order.ref} is now marked <strong>${STATUS_LABEL[order.status] ?? order.status}</strong>.`,
    ),
  })

/* ─────────────────────────────── Campaigns ──────────────────────────────── */

/** Add a subscriber to the Chikwafu mailing list. */
export async function subscribeCampaigns(email) {
  if (!zoho.campaigns) return { ok: false, error: 'Zoho Campaigns not configured', skipped: true }
  const params = new URLSearchParams({
    resfmt: 'JSON',
    listkey: config.campaignsListKey,
    contactinfo: JSON.stringify({ 'Contact Email': email }),
    source: 'chikwafu-storefront',
  })
  return log(
    `campaigns ← ${email}`,
    await postJson(
      `https://${zohoHost('campaigns')}/api/v1.1/json/listsubscribe?${params}`,
      { Authorization: `Zoho-oauthtoken ${config.campaignsToken}` },
      {},
      'campaigns',
    ),
  )
}

/* ────────────────────────────────── Desk ────────────────────────────────── */

/**
 * File a ticket for an order the Agent handled while the Admin was offline.
 * Returns the Desk ticket id so the order can record it and never re-file.
 */
export async function createDeskTicket({ order, subject, description }) {
  if (!zoho.desk) return { ok: false, error: 'Zoho Desk not configured', skipped: true }
  const res = await log(
    `desk ticket for ${order.ref}`,
    await postJson(
      `https://${zohoHost('desk')}/api/v1/tickets`,
      { Authorization: `Zoho-oauthtoken ${config.deskToken}`, orgId: config.deskOrgId },
      {
        subject,
        description,
        contact: {
          email: order.shippingAddress?.email || config.zeptomailFrom,
          firstName: order.shippingAddress?.fullName ?? 'Customer',
        },
        classification: { productName: 'Storefront' },
        webUrl: `${config.storeUrl}/track`,
      },
      'desk',
    ),
  )
  if (!res.ok) return res
  return { ok: true, id: String(res.body?.id ?? '') }
}
