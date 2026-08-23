import { AlertTriangle } from 'lucide-react'
import { useCatalogue } from '../lib/productSource'

/**
 * Warns when the shop is serving its built-in catalogue instead of live data.
 *
 * The fallback is deliberate — shoppers should never see a blank shop — but it
 * is dangerous to leave unannounced: the site looks completely normal while
 * every price and stock level may be stale and nothing done in the admin has
 * any effect.
 *
 * Only shown for states that indicate a misconfiguration worth fixing. A build
 * with no API configured at all (GitHub Pages) is a deliberate choice, not a
 * fault, so it stays silent.
 */
export function StaleDataBanner() {
  const { reason } = useCatalogue()

  if (!reason || reason === 'not-configured') return null

  const message: Record<string, string> = {
    cors: 'This storefront is showing its built-in catalogue: the API refused requests from this domain. Add it to CLIENT_URL on the API service.',
    unreachable: 'This storefront is showing its built-in catalogue: the API could not be reached. Prices and stock may be out of date.',
    'http-error': 'This storefront is showing its built-in catalogue: the API returned an error. Prices and stock may be out of date.',
    empty: 'This storefront is showing its built-in catalogue: the API returned no products. The database may need seeding.',
  }

  return (
    <div
      role="status"
      className="border-b border-amber-400/30 bg-amber-400/10 px-5 py-2.5 text-center text-[12.5px] text-amber-200"
    >
      <span className="inline-flex items-center gap-2">
        <AlertTriangle size={14} className="shrink-0" />
        {message[reason]}
      </span>
    </div>
  )
}
