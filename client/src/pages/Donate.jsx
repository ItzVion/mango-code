import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Heart } from 'lucide-react'
import { getAccount, setAccount } from '../lib/user'

let checkoutPromise
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  if (!checkoutPromise) checkoutPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => window.Razorpay ? resolve() : reject(new Error('Razorpay checkout could not be initialized.'))
    script.onerror = () => { script.remove(); checkoutPromise = null; reject(new Error('Could not load Razorpay checkout.')) }
    document.head.appendChild(script)
  })
  return checkoutPromise
}
async function request(path, options = {}) {
  const response = await fetch('/api/donations' + path, {
    credentials: 'include', cache: 'no-store', ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) { const error = new Error(data.error || 'Request failed.'); error.status = response.status; throw error }
  return data
}

const field = 'w-full rounded-lg border border-ink/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-mango-deep focus:ring-2 focus:ring-mango/20'
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

export default function Donate() {
  const [account, setCurrentAccount] = useState(getAccount())
  const [settings, setSettings] = useState(null)
  const [amount, setAmount] = useState('49')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  const numericAmount = Number(amount)
  const validAmount = Number.isSafeInteger(numericAmount) && numericAmount >= 1 && numericAmount <= (settings?.maxAmountRupees || 100000)
  useEffect(() => {
    let active = true
    Promise.all([
      request('/public'),
      fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    ]).then(([publicSettings, me]) => {
      if (!active) return
      setSettings(publicSettings)
      const user = me?.user || null
      setCurrentAccount(user)
      setAccount(user)
    }).catch(e => { if (active) setError(e.message || 'Could not load contribution options.') })
    const sync = () => setCurrentAccount(getAccount())
    window.addEventListener('mangocode-auth-change', sync)
    return () => { active = false; window.removeEventListener('mangocode-auth-change', sync) }
  }, [])

  async function startDonation() {
    setError('')
    if (!validAmount) { setError('Enter a whole amount between ₹1 and ₹' + (settings?.maxAmountRupees || 100000).toLocaleString('en-IN') + '.'); return }
    setBusy(true)
    try {
      await loadRazorpay()
      const order = await request('/create-order', { method: 'POST', body: JSON.stringify({ amountRupees: numericAmount }) })
      let resolved = false
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'MangoCode',
        description: 'Support MangoCode',
        theme: { color: '#f5a623' },
        handler: async response => {
          resolved = true
          setBusy(true)
          setError('')
          try {
            await request('/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            if (account) {
              const updated = { ...account, hasDonated: true }
              setCurrentAccount(updated)
              setAccount(updated)
            }
            setComplete(true)
          } catch (e) {
            setError(e.message || 'Payment was received but could not yet be confirmed. Contact support with your transaction reference.')
          } finally { setBusy(false) }
        },
      })
      checkout.on('payment.failed', () => { resolved = true; setError('Payment failed. You have not been marked as a supporter.') })
      checkout.on('modal.ondismiss', () => { if (!resolved) setError('Checkout was cancelled.') })
      checkout.open()
    } catch (e) { setError(e.message || 'Could not start payment.') }
    finally { setBusy(false) }
  }

  return <main className="mx-auto max-w-6xl space-y-7 pb-12">
    <div className="flex items-center gap-2 text-xs text-ink-soft"><Link to="/" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={14}/> Learning workspace</Link><span>/</span><span>Community support</span></div>
    <header className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-mango-deep">MANGOCODE / COMMUNITY</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Help keep learning free.</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">{settings?.donationMessage || 'Contributions help cover hosting and keep MangoCode available to learners.'}</p>
    </header>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
      <section className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-mango/30 bg-mango/10 text-mango-deep"><Heart size={21}/></span><div><p className="text-[11px] font-bold uppercase tracking-wider text-mango-deep">Community powered</p><h2 className="mt-0.5 text-xl font-semibold">Make a contribution</h2></div></div>
        <p className="text-sm leading-6 text-ink-soft">Choose any whole amount. There is no subscription, and donating is always optional.</p>
        {complete ? <div className="rounded-xl border border-leaf/20 bg-leaf/5 p-5"><CheckCircle2 size={25} className="text-leaf"/><h3 className="mt-3 font-semibold">Thank you for supporting MangoCode.</h3><p className="mt-1 text-sm text-ink-soft">Your Razorpay payment was independently verified with the payment provider.</p></div>
        : <div className="space-y-4">
          <label className="block text-sm font-medium" htmlFor="donation-amount">Contribution amount (INR)</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-ink/15"><span className="border-r border-ink/10 bg-paper-dim px-4 py-3 text-sm font-semibold text-ink-soft">₹</span><input id="donation-amount" type="number" inputMode="numeric" min="1" max={settings?.maxAmountRupees || 100000} step="1" value={amount} onChange={e => { setAmount(e.target.value); setError('') }} className="min-w-0 flex-1 px-4 py-3 text-lg font-semibold outline-none"/></div>
          <div className="grid grid-cols-4 gap-2">{[49,99,199,499].map(value => <button key={value} type="button" onClick={() => setAmount(String(value))} className={'inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold ' + (amount === String(value) ? 'border-mango bg-mango/10 text-ink' : 'border-ink/10 bg-white text-ink-soft hover:bg-paper-dim')}>₹{value}</button>)}</div>
          <button type="button" onClick={startDonation} disabled={busy || !settings} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50">{busy ? 'Opening secure checkout…' : 'Continue to secure checkout'}</button>
        </div>}
        {error && <p role="alert" className="rounded-lg border border-rose/20 bg-rose/5 px-3 py-2.5 text-sm text-rose">{error}</p>}
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-ink/10 bg-[#fbfaf7] p-6"><h2 className="font-semibold">What your support does</h2><div className="mt-4 space-y-3 text-sm text-ink-soft"><p>• Helps keep the website and learning materials available.</p><p>• Supports hosting, domain and maintenance costs.</p><p>• Makes continued course improvements possible.</p></div></div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6"><div className="flex items-center gap-2 text-ink"><h2 className="font-semibold">Payment and supporter status</h2></div><p className="mt-3 text-sm leading-6 text-ink-soft">Razorpay confirms each contribution against its captured-payment record. UPI and other enabled payment methods remain available only inside Razorpay Checkout. Supporter status is granted only after server-side payment verification.</p><p className="mt-3 text-xs text-ink-soft"><Link to="/refund" className="font-semibold underline">Read the refund policy</Link></p></div>
        {!account && <div className="rounded-2xl border border-ink/10 bg-white p-6"><p className="text-sm text-ink-soft">Sign in to associate a contribution with your account and receive the supporter star.</p><Link to="/auth" state={{from:'/donations'}} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white">Sign in</Link></div>}
      </aside>
    </div>
  </main>
}
