import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Tickets filed to the Admin.
 *
 * A ticket exists for every DELIVERED order that was handled by the Agent
 * (i.e. the Admin was offline when the client sent the order in). The list
 * itself is derived from the orders ledger; this store only tracks which
 * tickets the Admin has acknowledged.
 */
interface TicketState {
  /** order refs whose ticket the Admin has acknowledged */
  acknowledged: string[]
  acknowledge: (orderRef: string) => void
  reopen: (orderRef: string) => void
}

export const useTickets = create<TicketState>()(
  persist(
    (set, get) => ({
      acknowledged: [],
      acknowledge: (ref) =>
        set({ acknowledged: [...new Set([...get().acknowledged, ref])] }),
      reopen: (ref) =>
        set({ acknowledged: get().acknowledged.filter((r) => r !== ref) }),
    }),
    { name: 'chikwafu-tickets-v1' },
  ),
)

/** Deterministic ticket id from the order reference. */
export const ticketIdFor = (orderRef: string) =>
  'TKT-' + orderRef.replace(/^#?CHK-?/, '').replace(/^#/, '')
