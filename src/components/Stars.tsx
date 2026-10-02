import { useId } from 'react'
import { cx } from '../lib/format'

/**
 * Five-star rating meter with fractional fill.
 *
 * Each instance scopes its <linearGradient> ids with useId(): the previous
 * shared id scheme (`s0-45`, …) collided between every card on a page, so
 * browsers resolved all stars to the first gradient in the document and the
 * half-star fills rendered wrong.
 */
export function Stars({
  rating,
  size = 14,
  className = '',
}: {
  rating: number
  size?: number
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <span
      className={cx('inline-flex items-center gap-[2px]', className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      role="img"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        const gid = `${uid}-s${i}`
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={gid}>
                <stop offset={`${fill * 100}%`} stopColor="#00e5a0" />
                <stop offset={`${fill * 100}%`} stopColor="#33333f" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L10 14.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
              fill={`url(#${gid})`}
            />
          </svg>
        )
      })}
    </span>
  )
}
