import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { SocialIcons } from './SocialIcons'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-cream/70 grain">
      <div className="container-x relative z-10 grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed">
            Chikwafu supplies genuine, warranty-backed electric appliances to homes and businesses
            across Uganda. Showroom in Ntinda, delivery countrywide.
          </p>
          <div className="mt-6 flex gap-2.5">
            {SocialIcons.map(({ name, href, path }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={name}
                className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 transition hover:border-copper hover:bg-copper hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream">Shop</h4>
          <ul className="mt-5 space-y-2.5 text-[13.5px]">
            {['Kitchen', 'Cooling', 'Laundry', 'Home Entertainment', 'Small Appliances'].map((c) => (
              <li key={c}>
                <Link
                  to={`/shop?category=${encodeURIComponent(c)}`}
                  className="transition hover:text-copper-light"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream">Support</h4>
          <ul className="mt-5 space-y-2.5 text-[13.5px]">
            {[
              'Delivery & Installation',
              'Warranty Claims',
              'Returns Policy',
              'Spare Parts',
              'Track My Order',
            ].map((c) => (
              <li key={c}>
                <a href="#" className="transition hover:text-copper-light">
                  {c}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream">
            Visit or call
          </h4>
          <ul className="mt-5 space-y-3.5 text-[13.5px]">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-copper" />
              <span>Plot 42, Ntinda Road<br />Kampala, Uganda</span>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-copper" />
              <a href="tel:+256780844098" className="transition hover:text-copper-light">
                0780 844 098
              </a>
            </li>
            <li className="flex gap-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-copper" />
              <a href="mailto:sales@chikwafu.ug" className="transition hover:text-copper-light">
                sales@chikwafu.ug
              </a>
            </li>
          </ul>
          <p className="mt-5 text-[12.5px] text-cream/50">Mon–Sat, 8:30am – 7pm</p>
        </div>
      </div>

      <div className="container-x relative z-10 flex flex-col items-center justify-between gap-4 border-t border-cream/10 py-6 text-[12px] text-cream/45 sm:flex-row">
        <p>© {new Date().getFullYear()} Chikwafu Appliances Ltd. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="rounded-md border border-cream/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            MTN MoMo
          </span>
          <span className="rounded-md border border-cream/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            Airtel Money
          </span>
          <span className="rounded-md border border-cream/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            Visa
          </span>
        </div>
      </div>
    </footer>
  )
}
