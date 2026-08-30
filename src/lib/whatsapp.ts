import type { Order } from '../store/orders'
import { UGX } from './format'

/**
 * Chikwafu WhatsApp support channels.
 *
 * - The ADMIN number is the primary line. While the Admin is marked online
 *   (toggle in /admin), every client chat goes to the Admin.
 * - The AGENT number is the fallback line. The Agent may ONLY join an order
 *   chat as an agent, and only when the Admin was offline at the moment the
 *   client sent in their order. Orders the Agent handles are ticketed back
 *   to the Admin once delivered.
 */

export interface WhatsAppContact {
  role: 'admin' | 'agent'
  name: string
  /** digits only, international format — used in wa.me links */
  number: string
  display: string
}

export const ADMIN_WA: WhatsAppContact = {
  role: 'admin',
  name: 'Chikwafu Admin',
  number: '256780844098',
  display: '+256 780 844098',
}

export const AGENT_WA: WhatsAppContact = {
  role: 'agent',
  name: 'Chikwafu Agent',
  number: '256786028027',
  display: '+256 786 028027',
}

/** Name of the WhatsApp group every incoming order is posted to. */
export const ORDERS_GROUP_NAME = 'Chikwafu Orders'

export const waLink = (contact: WhatsAppContact, text?: string) =>
  `https://wa.me/${contact.number}${text ? `?text=${encodeURIComponent(text)}` : ''}`

const PAY_LABEL: Record<string, string> = {
  mtn: 'MTN Mobile Money',
  airtel: 'Airtel Money',
  card: 'Card',
  cod: 'Cash on delivery',
}

/** Format an order the way a client posts it into the orders group chat. */
export function orderGroupMessage(o: Order): string {
  return [
    `🛒 ${ORDERS_GROUP_NAME} — new order ${o.ref}`,
    `👤 ${o.customer.name} · ${o.customer.phone}`,
    `📍 ${o.destination.address}, ${o.destination.town}, ${o.destination.region}`,
    ...o.items.map((l) => `• ${l.qty}× ${l.name} — ${UGX(l.lineTotal)}`),
    `💰 Total: ${UGX(o.total)} (${PAY_LABEL[o.payment] ?? o.payment})`,
  ].join('\n')
}

/** Format the ticket an Agent files to the Admin after delivering an order. */
export function ticketMessage(ticket: {
  id: string
  orderRef: string
  customer: string
  destination: string
  total: number
}): string {
  return [
    `🎫 Ticket ${ticket.id} — order ${ticket.orderRef} DELIVERED`,
    `👤 ${ticket.customer}`,
    `📍 ${ticket.destination}`,
    `💰 ${UGX(ticket.total)}`,
    `Handled by ${AGENT_WA.name} (${AGENT_WA.display}) while Admin was offline.`,
  ].join('\n')
}
