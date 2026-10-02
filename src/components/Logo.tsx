import { asset } from '../lib/format'

/**
 * Official Chikwafu Technology Ltd. wordmark (from chikwafu.com).
 *
 * Two pre-coloured assets ship in `public/brand/`: the white wordmark for the
 * dark storefront surfaces (default) and a near-black one for any light
 * surface (print, emails, embedded widgets). The prop was previously accepted
 * but silently ignored.
 */
export function Logo({
  light = true,
  className = 'h-9',
}: {
  /** true = white wordmark (dark surfaces), false = dark wordmark (light surfaces) */
  light?: boolean
  className?: string
}) {
  return (
    <img
      src={asset(light ? '/brand/chikwafu-logo.svg' : '/brand/chikwafu-logo-dark.svg')}
      alt="Chikwafu Technology Ltd."
      className={`${className} w-auto shrink-0`}
      width={251}
      height={68}
    />
  )
}
