import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, BadgeCheck, Check, CreditCard, Lock, Smartphone, Tag, Truck, Wallet,
} from 'lucide-react'
import { COUPONS, deliveryFeeFor, useCart, useCartDetails } from '../store/cart'
import { UGX, cx } from '../lib/format'
import type { DeliveryDetails, PaymentMethod } from '../lib/types'

const REGIONS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Mbarara', 'Gulu',
  'Mbale', 'Masaka', 'Lira', 'Fort Portal', 'Arua', 'Soroti', 'Kabale',
]

const STEPS = ['Delivery', 'Payment', 'Review'] as const

const PAYMENTS: { id: PaymentMethod; label: string; sub: string; icon: typeof Smartphone }[] = [
  { id: 'mtn', label: 'MTN Mobile Money', sub: 'Approve the prompt on your phone', icon: Smartphone },
  { id: 'airtel', label: 'Airtel Money', sub: 'Approve the prompt on your phone', icon: Smartphone },
  { id: 'card', label: 'Visa / Mastercard', sub: 'Secured by 3-D Secure', icon: CreditCard },
  { id: 'cod', label: 'Cash on delivery', sub: 'Pay our rider on arrival (Kampala only)', icon: Wallet },
]

export default function Checkout() {
  const nav = useNavigate()
  const { detailed, subtotal, discount, coupon, count } = useCartDetails()
  const applyCoupon = useCart((s) => s.applyCoupon)
  const clearCoupon = useCart((s) => s.clearCoupon)
  const clear = useCart((s) => s.clear)

  const [step, setStep] = useState(0)
  const [placing, setPlacing] = useState(false)
  const [couponDraft, setCouponDraft] = useState('')
  const [couponError, setCouponError] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('mtn')
  const [momoNumber, setMomoNumber] = useState('')
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [d, setD] = useState<DeliveryDetails>({
    fullName: '', phone: '', email: '', region: 'Kampala', town: '', address: '', notes: '',
  })

  const delivery = useMemo(
    () => deliveryFeeFor(d.region, subtotal - discount),
    [d.region, subtotal, discount],
  )
  const total = subtotal - discount + delivery

  if (count === 0 && !placing) return <Navigate to="/shop" replace />

  const validateDelivery = () => {
    const e: Record<string, string> = {}
    if (d.fullName.trim().length < 3) e.fullName = 'Enter your full name'
    if (!/^(\+?256|0)7\d{8}$/.test(d.phone.replace(/\s/g, ''))) e.phone = 'Use format 07XX XXX XXX'
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Enter a valid email'
    if (d.town.trim().length < 2) e.town = 'Which town or suburb?'
    if (d.address.trim().length < 6) e.address = 'Add a landmark or plot number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validatePayment = () => {
    const e: Record<string, string> = {}
    if (payment === 'mtn' || payment === 'airtel') {
      if (!/^(\+?256|0)7\d{8}$/.test(momoNumber.replace(/\s/g, ''))) e.momo = 'Enter the number to charge'
    }
    if (payment === 'card') {
      if (card.number.replace(/\s/g, '').length < 15) e.cardNumber = 'Enter a valid card number'
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) e.cardExp = 'MM/YY'
      if (card.cvc.length < 3) e.cardCvc = '3 digits'
      if (card.name.trim().length < 3) e.cardName = 'Name on card'
    }
    if (payment === 'cod' && !['Kampala', 'Wakiso', 'Mukono'].includes(d.region)) {
      e.cod = 'Cash on delivery is only available in Kampala, Wakiso and Mukono'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 0 && !validateDelivery()) return
    if (step === 1 && !validatePayment()) return
    setErrors({})
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const placeOrder = () => {
    setPlacing(true)
    const order = {
      ref: 'CHK-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      items: detailed.map((l) => ({ name: l.product.name, qty: l.qty, total: l.lineTotal })),
      subtotal, discount, delivery, total, payment, delivery_details: d,
      placedAt: new Date().toISOString(),
    }
    sessionStorage.setItem('chikwafu-last-order', JSON.stringify(order))
    setTimeout(() => {
      clear()
      nav('/order-confirmed')
    }, 1900)
  }

  const field = (
    key: keyof DeliveryDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">{label}</label>
      <input
        value={d[key]}
        onChange={(e) => setD({ ...d, [key]: e.target.value })}
        className={cx('input', errors[key] && 'border-accent ring-4 ring-accent/10')}
        {...props}
      />
      {errors[key] && <p className="mt-1 text-[11.5px] text-accent">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="container-x py-10 lg:py-14">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-[13px] text-text-muted transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Continue shopping
      </Link>

      <h1 className="mt-5 font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold leading-tight">
        Checkout
      </h1>

      <ol className="mt-8 flex items-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cx(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12.5px] font-bold transition-all duration-300',
                i < step ? 'bg-accent text-bg' : i === step ? 'bg-bg-2 text-text' : 'bg-bg-3 text-text-dim',
              )}
            >
              {i < step ? <Check size={15} /> : i + 1}
            </span>
            <span className={cx('text-[13px] font-medium', i <= step ? 'text-text' : 'text-text-dim')}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <span className="hidden h-px flex-1 bg-bg-2/12 sm:block">
                <motion.span
                  className="block h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: i < step ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <section className="rounded-2xl bg-card p-6 sm:p-8">
                  <h2 className="font-display text-xl font-semibold">Where should we deliver?</h2>
                  <p className="mt-1.5 text-[13px] text-text-muted">
                    Our rider will call before arriving. Landmarks help more than street names.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {field('fullName', 'Full name', { placeholder: 'Namukasa Sarah', autoComplete: 'name' })}
                    {field('phone', 'Phone number', { placeholder: '0780 000 000', inputMode: 'tel', autoComplete: 'tel' })}
                    <div className="sm:col-span-2">
                      {field('email', 'Email (optional)', { placeholder: 'you@example.com', type: 'email', autoComplete: 'email' })}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">District</label>
                      <select
                        value={d.region}
                        onChange={(e) => setD({ ...d, region: e.target.value })}
                        className="input cursor-pointer"
                      >
                        {REGIONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    {field('town', 'Town / suburb', { placeholder: 'Ntinda' })}
                    <div className="sm:col-span-2">
                      {field('address', 'Street, plot or landmark', { placeholder: 'Plot 12, off Kigowa Road, near Capital Shoppers' })}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
                        Delivery notes (optional)
                      </label>
                      <textarea
                        value={d.notes}
                        onChange={(e) => setD({ ...d, notes: e.target.value })}
                        rows={3}
                        placeholder="Gate is green, call when you reach the junction."
                        className="input resize-none"
                      />
                    </div>
                  </div>
                  <button onClick={next} className="btn-primary mt-7 w-full sm:w-auto">
                    Continue to payment
                  </button>
                </section>
              )}

              {step === 1 && (
                <section className="rounded-2xl bg-card p-6 sm:p-8">
                  <h2 className="font-display text-xl font-semibold">How would you like to pay?</h2>
                  <div className="mt-6 space-y-3">
                    {PAYMENTS.map((p) => (
                      <label
                        key={p.id}
                        className={cx(
                          'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200',
                          payment === p.id
                            ? 'border-accent bg-accent/8 ring-4 ring-accent/8'
                            : 'border-white/12 hover:border-white/30',
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={payment === p.id}
                          onChange={() => { setPayment(p.id); setErrors({}) }}
                          className="sr-only"
                        />
                        <span
                          className={cx(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-full transition',
                            payment === p.id ? 'bg-accent text-bg' : 'bg-bg-3 text-text-muted',
                          )}
                        >
                          <p.icon size={18} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[14px] font-semibold">{p.label}</span>
                          <span className="block text-[12.5px] text-text-muted">{p.sub}</span>
                        </span>
                        <span
                          className={cx(
                            'grid h-5 w-5 place-items-center rounded-full border-2 transition',
                            payment === p.id ? 'border-accent bg-accent' : 'border-white/20',
                          )}
                        >
                          {payment === p.id && <Check size={12} className="text-bg" />}
                        </span>
                      </label>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {(payment === 'mtn' || payment === 'airtel') && (
                      <motion.div
                        key="momo"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 rounded-xl bg-bg p-5">
                          <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
                            {payment === 'mtn' ? 'MTN' : 'Airtel'} number to charge
                          </label>
                          <input
                            value={momoNumber}
                            onChange={(e) => setMomoNumber(e.target.value)}
                            placeholder={payment === 'mtn' ? '0780 000 000' : '0750 000 000'}
                            inputMode="tel"
                            className={cx('input bg-card', errors.momo && 'border-accent ring-4 ring-accent/10')}
                          />
                          {errors.momo && <p className="mt-1 text-[11.5px] text-accent">{errors.momo}</p>}
                          <p className="mt-3 text-[12px] leading-relaxed text-text-muted">
                            You&apos;ll receive a prompt to enter your PIN. Keep this page open until the
                            payment confirms.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {payment === 'card' && (
                      <motion.div
                        key="card"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 grid gap-4 rounded-xl bg-bg p-5 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Card number</label>
                            <input
                              value={card.number}
                              onChange={(e) =>
                                setCard({
                                  ...card,
                                  number: e.target.value.replace(/\D/g, '').slice(0, 16)
                                    .replace(/(.{4})/g, '$1 ').trim(),
                                })
                              }
                              placeholder="4242 4242 4242 4242"
                              inputMode="numeric"
                              className={cx('input bg-card', errors.cardNumber && 'border-accent')}
                            />
                            {errors.cardNumber && <p className="mt-1 text-[11.5px] text-accent">{errors.cardNumber}</p>}
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Expiry</label>
                            <input
                              value={card.exp}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                                setCard({ ...card, exp: v })
                              }}
                              placeholder="09/28"
                              inputMode="numeric"
                              className={cx('input bg-card', errors.cardExp && 'border-accent')}
                            />
                            {errors.cardExp && <p className="mt-1 text-[11.5px] text-accent">{errors.cardExp}</p>}
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">CVC</label>
                            <input
                              value={card.cvc}
                              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                              placeholder="123"
                              inputMode="numeric"
                              className={cx('input bg-card', errors.cardCvc && 'border-accent')}
                            />
                            {errors.cardCvc && <p className="mt-1 text-[11.5px] text-accent">{errors.cardCvc}</p>}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Name on card</label>
                            <input
                              value={card.name}
                              onChange={(e) => setCard({ ...card, name: e.target.value })}
                              placeholder="S NAMUKASA"
                              className={cx('input bg-card', errors.cardName && 'border-accent')}
                            />
                            {errors.cardName && <p className="mt-1 text-[11.5px] text-accent">{errors.cardName}</p>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.cod && (
                    <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-[12.5px] text-accent">
                      {errors.cod}
                    </p>
                  )}

                  <p className="mt-5 flex items-center gap-2 text-[12px] text-text-muted">
                    <Lock size={13} className="text-accent" />
                    This is a demo storefront — no real payment is processed.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button onClick={() => setStep(0)} className="btn-ghost">Back</button>
                    <button onClick={next} className="btn-primary flex-1 sm:flex-none">
                      Review order
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-4">
                  <div className="rounded-2xl bg-card p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-display text-xl font-semibold">Delivering to</h2>
                      <button
                        onClick={() => setStep(0)}
                        className="text-[12.5px] text-accent underline underline-offset-4"
                      >
                        Edit
                      </button>
                    </div>
                    <address className="mt-3 text-[13.5px] not-italic leading-relaxed text-text-muted">
                      <strong className="text-text">{d.fullName}</strong><br />
                      {d.address}<br />
                      {d.town}, {d.region}<br />
                      {d.phone}{d.email && <> · {d.email}</>}
                      {d.notes && <><br /><span className="text-text-dim">“{d.notes}”</span></>}
                    </address>
                  </div>

                  <div className="rounded-2xl bg-card p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-display text-xl font-semibold">Paying with</h2>
                      <button
                        onClick={() => setStep(1)}
                        className="text-[12.5px] text-accent underline underline-offset-4"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-3 text-[13.5px] text-text-muted">
                      {PAYMENTS.find((p) => p.id === payment)!.label}
                      {(payment === 'mtn' || payment === 'airtel') && <> · {momoNumber}</>}
                      {payment === 'card' && <> · •••• {card.number.slice(-4)}</>}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-card p-6 sm:p-8">
                    <h2 className="font-display text-xl font-semibold">
                      {count} {count === 1 ? 'item' : 'items'}
                    </h2>
                    <ul className="mt-4 divide-y divide-white/10">
                      {detailed.map((l) => (
                        <li key={l.product.id} className="flex items-center gap-4 py-3.5">
                          <img
                            src={l.product.image}
                            alt=""
                            className="h-14 w-14 rounded-lg bg-card object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium">{l.product.name}</p>
                            <p className="text-[12px] text-text-dim">Qty {l.qty}</p>
                          </div>
                          <span className="text-[13.5px] font-semibold tabular-nums">
                            {UGX(l.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setStep(1)} className="btn-ghost" disabled={placing}>
                      Back
                    </button>
                    <button onClick={placeOrder} disabled={placing} className="btn-primary flex-1">
                      {placing ? (
                        <span className="flex items-center gap-2.5">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Confirming payment…
                        </span>
                      ) : (
                        <>
                          <Lock size={15} /> Place order — {UGX(total)}
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-[92px] lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>

            <ul className="mt-4 space-y-3">
              {detailed.map((l) => (
                <li key={l.product.id} className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <img
                      src={l.product.image}
                      alt=""
                      className="h-12 w-12 rounded-lg bg-card object-cover"
                    />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-bg-2 px-1 text-[10.5px] font-bold text-text">
                      {l.qty}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{l.product.name}</span>
                  <span className="text-[12.5px] font-semibold tabular-nums">{UGX(l.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-white/10 pt-5">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-accent/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] font-medium text-accent">
                    <Tag size={14} /> {coupon}
                  </span>
                  <button
                    onClick={() => clearCoupon()}
                    className="text-[11.5px] text-text-muted underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (applyCoupon(couponDraft)) { setCouponDraft(''); setCouponError('') }
                    else setCouponError('That code isn\u2019t valid')
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={couponDraft}
                    onChange={(e) => { setCouponDraft(e.target.value); setCouponError('') }}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    className="input py-2.5 text-[13px] uppercase"
                  />
                  <button type="submit" className="btn-ghost shrink-0 px-4 py-2.5 text-[12.5px]">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="mt-1.5 text-[11.5px] text-accent">{couponError}</p>}
              {!coupon && (
                <p className="mt-2 text-[11.5px] text-text-dim">
                  Try <button
                    onClick={() => { applyCoupon('KARIBU10'); setCouponError('') }}
                    className="font-semibold text-accent underline underline-offset-2"
                  >KARIBU10</button> for 10% off
                </p>
              )}
            </div>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-text-muted">Subtotal</dt>
                <dd className="font-medium tabular-nums">{UGX(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Discount ({COUPONS[coupon!].label})</dt>
                  <dd className="font-medium tabular-nums">−{UGX(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-text-muted">
                  <Truck size={14} /> Delivery to {d.region}
                </dt>
                <dd className="font-medium tabular-nums">
                  {delivery === 0 ? <span className="text-accent">Free</span> : UGX(delivery)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
              <span className="font-display text-base font-semibold">Total</span>
              <span className="font-display text-2xl font-semibold tabular-nums">{UGX(total)}</span>
            </div>

            <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
              {['Genuine warranty on every unit', 'Free installation on large appliances', '7-day returns'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[12px] text-text-muted">
                  <BadgeCheck size={13} className="shrink-0 text-accent" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
