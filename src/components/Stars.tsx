import { cx } from '../lib/format'

export function Stars({
  rating,
  size = 14,
  className = '',
}: {
  rating: number
  size?: number
  className?: string
}) {
  return (
    <span
      className={cx('inline-flex items-center gap-[2px]', className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      role="img"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={`s${i}-${Math.round(rating * 10)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#B4643A" />
                <stop offset={`${fill * 100}%`} stopColor="#DDD5CA" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L10 14.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
              fill={`url(#s${i}-${Math.round(rating * 10)})`}
            />
          </svg>
        )
      })}
    </span>
  )
}
