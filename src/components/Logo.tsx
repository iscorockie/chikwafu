export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="14" fill={light ? '#F7F4EF' : '#14110F'} />
        <path d="M36 12 22 35h9l-4 17 18-25h-10l5-15z" fill="#B4643A" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[19px] font-semibold tracking-tight ${
            light ? 'text-cream' : 'text-ink'
          }`}
        >
          Chikwafu
        </span>
        <span
          className={`mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.28em] ${
            light ? 'text-cream/50' : 'text-ink-300'
          }`}
        >
          Appliances
        </span>
      </span>
    </span>
  )
}
