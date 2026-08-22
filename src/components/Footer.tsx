import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { SocialIcons } from './SocialIcons'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-bg-2 text-text-muted grain">
      <div className="container-x relative z-10 grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="h-10" />
          <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed">
            Chikwafu Technology Ltd. supplies genuine, warranty-backed electric appliances across
            Uganda. Order online or on WhatsApp — delivery countrywide.
          </p>
          <div className="mt-6 flex gap-2.5">
            {SocialIcons.map(({ name, href, path }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={name}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 transition hover:border-accent hover:bg-accent hover:text-bg"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text">Shop</h4>
          <ul className="mt-5 space-y-2.5 text-[13.5px]">
            {['Kitchen', 'Cooling', 'Laundry', 'Home Entertainment', 'Small Appliances'].map((c) => (
              <li key={c}>
                <Link
                  to={`/shop?category=${encodeURIComponent(c)}`}
                  className="transition hover:text-accent"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text">Support</h4>
          <ul className="mt-5 space-y-2.5 text-[13.5px]">
            <li>
              <Link to="/express" className="font-bold text-accent transition hover:text-text">
                Chikwafu Express
              </Link>
            </li>
            {[
              'Delivery & Installation',
              'Warranty Claims',
              'Returns Policy',
              'Spare Parts',
              'Track My Order',
            ].map((c) => (
              <li key={c}>
                <a href="#" className="transition hover:text-accent">
                  {c}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text">
            Visit or call
          </h4>
          <ul className="mt-5 space-y-3.5 text-[13.5px]">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>Plot 42, Ntinda Road<br />Kampala, Uganda</span>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-accent" />
              <a href="tel:+256780844098" className="transition hover:text-accent">
                0780 844 098
              </a>
            </li>
            <li className="flex gap-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
              <a href="mailto:sales@chikwafu.ug" className="transition hover:text-accent">
                sales@chikwafu.ug
              </a>
            </li>
          </ul>
          <p className="mt-5 text-[12.5px] text-text-dim">Mon–Sat, 8:30am – 7pm</p>
        </div>
      </div>

      <div className="container-x relative z-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-[12px] text-text-dim sm:flex-row">
        <p>© {new Date().getFullYear()} Chikwafu Appliances Ltd. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="rounded-md border border-white/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            MTN MoMo
          </span>
          <span className="rounded-md border border-white/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            Airtel Money
          </span>
          <span className="rounded-md border border-white/15 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">
            Visa
          </span>
        </div>
      </div>
    </footer>
  )
}
