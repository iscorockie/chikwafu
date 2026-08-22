import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_ENABLED, ApiError, api, setToken } from '../lib/api'

/**
 * Admin authentication.
 *
 * Two modes, chosen by whether VITE_API_URL is set:
 *
 *  1. API mode  — real credentials POSTed to /api/auth/login on the Express
 *     server. The JWT is stored and sent as a Bearer token; the server also
 *     enforces `role === 'admin'` on every admin route, so the gate is real.
 *
 *  2. Demo mode — a local passcode. This only keeps the dashboard out of
 *     casual reach: the check runs in the browser and the bundle is public,
 *     so it is NOT security. It exists so the GitHub Pages build (static, no
 *     backend) still has a working demo.
 */

const SESSION_HOURS = 8

/** FNV-1a — keeps the demo passcode out of the bundle as plaintext. */
function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16)
}

/** Demo passcode: chikwafu2026 */
const PASS_HASH = hash('chikwafu2026')

interface AuthState {
  expiresAt: number
  attempts: number
  lockedUntil: number
  /** populated in API mode */
  user: { name: string; email: string; role: string } | null
  mode: 'api' | 'demo'

  signInDemo: (pass: string) => { ok: boolean; error?: string }
  signInApi: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => void
  isValid: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      expiresAt: 0,
      attempts: 0,
      lockedUntil: 0,
      user: null,
      mode: API_ENABLED ? 'api' : 'demo',

      signInDemo: (pass) => {
        const now = Date.now()
        if (get().lockedUntil > now) {
          const secs = Math.ceil((get().lockedUntil - now) / 1000)
          return { ok: false, error: `Too many attempts. Try again in ${secs}s.` }
        }
        if (hash(pass.trim()) === PASS_HASH) {
          set({
            expiresAt: now + SESSION_HOURS * 3600_000,
            attempts: 0, lockedUntil: 0, mode: 'demo',
            user: { name: 'Demo staff', email: 'demo@chikwafu.ug', role: 'admin' },
          })
          return { ok: true }
        }
        const attempts = get().attempts + 1
        const lockedUntil = attempts >= 5 ? now + 30_000 : 0
        set({ attempts: lockedUntil ? 0 : attempts, lockedUntil })
        return {
          ok: false,
          error: lockedUntil
            ? 'Too many attempts. Locked for 30 seconds.'
            : `Incorrect passcode. ${5 - attempts} attempt${5 - attempts === 1 ? '' : 's'} left.`,
        }
      },

      signInApi: async (email, password) => {
        try {
          const u = await api.login(email, password)
          if (u.role !== 'admin') {
            return { ok: false, error: 'That account is not an administrator.' }
          }
          if (u.token) setToken(u.token)
          set({
            expiresAt: Date.now() + SESSION_HOURS * 3600_000,
            attempts: 0, lockedUntil: 0, mode: 'api',
            user: { name: u.name, email: u.email, role: u.role },
          })
          return { ok: true }
        } catch (err) {
          const e = err as ApiError
          if (e.status === 0) return { ok: false, error: e.message }
          if (e.status === 401) return { ok: false, error: 'Wrong email or password.' }
          return { ok: false, error: e.message || 'Sign in failed.' }
        }
      },

      signOut: () => {
        setToken(null)
        set({ expiresAt: 0, attempts: 0, lockedUntil: 0, user: null })
      },

      isValid: () => get().expiresAt > Date.now(),
    }),
    {
      name: 'chikwafu-admin-session-v2',
      partialize: (s) => ({
        expiresAt: s.expiresAt, user: s.user, mode: s.mode,
        attempts: s.attempts, lockedUntil: s.lockedUntil,
      }),
    },
  ),
)
