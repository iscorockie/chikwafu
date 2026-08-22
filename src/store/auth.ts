import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Client-side gate for the admin area.
 *
 * IMPORTANT: this keeps the dashboard out of casual reach, but it is NOT real
 * security — the check runs in the browser and the bundle is public, so a
 * determined visitor can bypass it. Before this handles live customer data it
 * must be replaced with a server-side session against the /server API.
 */

const SESSION_HOURS = 8

/** FNV-1a — obfuscates the passcode so it isn't sitting in the bundle as plaintext. */
function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16)
}

/** Passcode: chikwafu2026 */
const PASS_HASH = hash('chikwafu2026')

interface AuthState {
  /** epoch ms when the current session expires; 0 = signed out */
  expiresAt: number
  attempts: number
  lockedUntil: number
  signIn: (pass: string) => { ok: boolean; error?: string }
  signOut: () => void
  isValid: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      expiresAt: 0,
      attempts: 0,
      lockedUntil: 0,

      signIn: (pass) => {
        const now = Date.now()
        if (get().lockedUntil > now) {
          const secs = Math.ceil((get().lockedUntil - now) / 1000)
          return { ok: false, error: `Too many attempts. Try again in ${secs}s.` }
        }
        if (hash(pass.trim()) === PASS_HASH) {
          set({ expiresAt: now + SESSION_HOURS * 3600_000, attempts: 0, lockedUntil: 0 })
          return { ok: true }
        }
        const attempts = get().attempts + 1
        // Back off after 5 wrong tries to blunt brute forcing.
        const lockedUntil = attempts >= 5 ? now + 30_000 : 0
        set({ attempts: lockedUntil ? 0 : attempts, lockedUntil })
        return {
          ok: false,
          error: lockedUntil
            ? 'Too many attempts. Locked for 30 seconds.'
            : `Incorrect passcode. ${5 - attempts} attempt${5 - attempts === 1 ? '' : 's'} left.`,
        }
      },

      signOut: () => set({ expiresAt: 0, attempts: 0, lockedUntil: 0 }),
      isValid: () => get().expiresAt > Date.now(),
    }),
    { name: 'chikwafu-admin-session-v1' },
  ),
)
