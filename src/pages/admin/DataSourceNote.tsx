import { AlertTriangle, Database, Loader2, RefreshCw, Server } from 'lucide-react'
import { API_URL } from '../../lib/api'

/**
 * Tells the operator, unambiguously, whether they are looking at live API data
 * or the local demo seed. Without this it is very easy to believe you are
 * managing real orders when you are not.
 */
export function DataSourceNote({
  source, loading, error, onRetry,
}: {
  source: 'api' | 'demo'
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-3.5 py-1.5 text-[12px] text-text-muted">
        <Loader2 size={13} className="animate-spin" />
        Loading from the API…
      </p>
    )
  }

  if (error) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5">
        <AlertTriangle size={15} className="shrink-0 text-amber-300" />
        <span className="text-[12.5px] text-amber-100">
          {error} — showing demo data instead.
        </span>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 px-3 py-1 text-[11.5px] font-bold text-amber-200 transition hover:bg-amber-400/15"
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    )
  }

  if (source === 'api') {
    return (
      <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[12px] font-bold text-accent">
        <Server size={13} />
        Live data from {API_URL.replace(/^https?:\/\//, '')}
      </p>
    )
  }

  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-card px-3.5 py-1.5 text-[12px] text-text-muted">
      <Database size={13} />
      Demo data — set <code className="font-mono text-text">VITE_API_URL</code> to use the live API
    </p>
  )
}
