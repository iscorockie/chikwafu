import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-tight">
        This page has been unplugged.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-500">
        The link may be old or mistyped. Our catalogue is still fully stocked.
      </p>
      <Link to="/shop" className="btn-primary mt-8">Browse appliances</Link>
    </div>
  )
}
