import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * WhatsApp presence for the Admin line.
 *
 * The Admin toggles this from the admin panel. It decides who a client's
 * order chat is routed to at the moment the order is sent in:
 *
 *  - Admin ONLINE  → the client chats 1-to-1 with the Admin.
 *  - Admin OFFLINE → the order is posted to the "Chikwafu Orders" group
 *    chat and the Agent (+256 786 028027) joins it — strictly as an Agent.
 *    Once such an order is delivered, it is ticketed back to the Admin.
 */
interface PresenceState {
  adminOnline: boolean
  setAdminOnline: (online: boolean) => void
  toggleAdmin: () => void
}

export const usePresence = create<PresenceState>()(
  persist(
    (set, get) => ({
      adminOnline: true,
      setAdminOnline: (online) => set({ adminOnline: online }),
      toggleAdmin: () => set({ adminOnline: !get().adminOnline }),
    }),
    { name: 'chikwafu-wa-presence-v1' },
  ),
)
