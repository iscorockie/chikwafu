import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Server, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { API_ENABLED, API_URL } from '../../lib/api'
import { Logo } from '../../components/Logo'
import { cx } from '../../lib/format'

export default function AdminLogin() {
  const signInDemo = useAuth((s) => s.signInDemo)
  const signInApi = useAuth((s) => s.signInApi)

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(0)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => { first.current?.focus() }, [])

  const fail = (msg: string) => {
    setError(msg)
    setShake((n) => n + 1)
    setPass('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (API_ENABLED) {
      setBusy(true)
      const r = await signInApi(email.trim(), pass)
      setBusy(false)
      if (!r.ok) fail(r.error ?? 'Sign in failed.')
    } else {
      const r = signInDemo(pass)
      if (!r.ok) fail(r.error ?? 'Incorrect passcode.')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5 py-12">
      <div className="pointer-events-none fixed -top-40 right-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />

      <motion.div
        key={shake}
        initial={shake ? { x: -8 } : false}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 900, damping: 12 }}
        className="relative w-full max-w-[400px]"
      >
        <div className="mb-8 flex justify-center">
          <Logo className="h-10" />
        </div>

        <div className="rounded-[22px] border border-white/10 bg-card p-7 shadow-lift">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/12 text-accent">
            <Lock size={19} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-black leading-tight">Staff sign in</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
            The Chikwafu admin dashboard is restricted to staff.
          </p>

          <form onSubmit={submit} className="mt-6">
            {API_ENABLED && (
              <div className="mb-4">
                <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-bold text-text-muted">
                  Email
                </label>
                <input
                  id="email"
                  ref={first}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  autoComplete="username"
                  placeholder="admin@chikwafu.ug"
                  className={cx('input', error && 'border-danger')}
                />
              </div>
            )}

            <label htmlFor="passcode" className="mb-1.5 block text-[12.5px] font-bold text-text-muted">
              {API_ENABLED ? 'Password' : 'Passcode'}
            </label>
            <div className="relative">
              <input
                id="passcode"
                ref={API_ENABLED ? undefined : first}
                type={show ? 'text' : 'password'}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError('') }}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={cx('input pr-12', error && 'border-danger ring-4 ring-danger/10')}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-dim transition hover:bg-white/10 hover:text-text"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="mt-2.5 flex items-start gap-2 text-[12.5px] text-danger">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !pass || (API_ENABLED && !email)}
              className="btn-primary mt-5 w-full"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {API_ENABLED ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 text-[12px] leading-relaxed text-text-muted">
              <Server size={14} className="mt-0.5 shrink-0 text-accent" />
              <span>
                Authenticating against{' '}
                <strong className="text-text">{API_URL.replace(/^https?:\/\//, '')}</strong>.
                The server verifies your password and admin role on every request.
              </span>
            </p>
          ) : (
            <p className="mt-5 rounded-xl border border-white/10 bg-bg-2 px-4 py-3 text-[12px] leading-relaxed text-text-muted">
              <strong className="text-text">Demo passcode:</strong>{' '}
              <code className="font-mono text-accent">chikwafu2026</code>
              <br />
              No API is configured, so this gate runs in the browser. It deters
              casual access but is not real security — set{' '}
              <code className="font-mono text-text">VITE_API_URL</code> to
              authenticate against the server instead.
            </p>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-[13px] font-bold text-text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to storefront
        </Link>
      </motion.div>
    </div>
  )
}
