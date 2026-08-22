import { Zap } from 'lucide-react'
import { cx } from '../lib/format'

/** The Chikwafu Express mark — shown only on items eligible for fast delivery. */
export function ExpressBadge({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-accent font-black uppercase tracking-wider text-bg',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
        className,
      )}
      title="Eligible for Chikwafu Express delivery"
    >
      <Zap size={size === 'sm' ? 9 : 11} className="fill-bg" strokeWidth={3} />
      Express
    </span>
  )
}
