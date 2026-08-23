import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useCatalogue } from '../lib/productSource'

/**
 * Operator-facing alarm for when the shop is serving its built-in catalogue
 * instead of live data.
 *
 * Deliberately NOT shown to shoppers. A customer can do nothing about a CORS
 * misconfiguration, and a banner mentioning CLIENT_URL on a public storefront
 * looks broken and leaks internals. They still get a working shop — possibly
 * with slightly stale prices, which beats a blank page.
 *
 * It appears for staff only:
 *   • anyone with an admin session in this browser, or
 *   • anyone who adds ?debug=1 to the URL (persists for the tab)
 *
 * It is a smoke alarm, so it is loud, fixed to the viewport, and says what to
 * do. It can be dismissed for the session, since staring at it does not fix it.
 */

const DEBUG_KEY = 'chikwafu-debug'
const DISMISS_KEY = 'chikwafu-stale-dismissed'

/** Is the person looking at this page staff, rather than a shopper? */
function useIsOperator() {
  const [operator, setOperator] = useState(false)

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('debug') === '1') {
        sessionStorage.setItem(DEBUG_KEY, '1')
      }
      if (sessionStorage.getItem(DEBUG_KEY) === '1') return setOperator(true)

      // An unexpired admin session in this browser means staff.
      const raw = localStorage.getItem('chikwafu-admin-session-v2')
      if (raw) {
        const expiresAt = JSON.parse(raw)?.state?.expiresAt ?? 0
        if (expiresAt > Date.now()) return setOperator(true)
      }
    } catch {
      /* storage unavailable — treat as a shopper */
    }
  }, [])

  return operator
}

export function StaleDataBanner() {
  const { reason } = useCatalogue()
  const isOperator = useIsOperator()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  )

  if (!reason || reason === 'not-configured') return null
  if (!isOperator || dismissed) return null

  const message: Record<string, string> = {
    cors: `The API is refusing requests from ${window.location.origin}. Add this origin to CLIENT_URL on the API service and redeploy.`,
    unreachable: 'The API could not be reached. It may be asleep, down, or blocked by DNS.',
    'http-error': 'The API returned an error.',
    empty: 'The API returned no products. The database may need seeding.',
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-[100] border-t-2 border-danger bg-danger/95 px-5 py-3 text-white shadow-lift"
    >
      <div className="container-x flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1 text-[13px] leading-relaxed">
          <strong className="font-black uppercase tracking-wide">Serving stale data</strong>
          {' — '}
          {message[reason]}
          <span className="block text-white/80">
            Customers see the built-in catalogue. Prices and stock may be wrong, and admin
            changes will not appear until this is fixed.
          </span>
        </div>
        <button
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, '1')
            setDismissed(true)
          }}
          aria-label="Dismiss for this session"
          className="shrink-0 rounded-full p-1.5 transition hover:bg-white/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
