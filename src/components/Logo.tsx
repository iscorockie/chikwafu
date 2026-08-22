import { asset } from '../lib/format'

/** Official Chikwafu Technology Ltd. wordmark (from chikwafu.com). */
export function Logo({ className = 'h-9' }: { light?: boolean; className?: string }) {
  return (
    <img
      src={asset('/brand/chikwafu-logo.svg')}
      alt="Chikwafu Technology Ltd."
      className={`${className} w-auto shrink-0`}
      width={251}
      height={68}
    />
  )
}
