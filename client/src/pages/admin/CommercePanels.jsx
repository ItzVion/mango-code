import { useEffect, useState } from 'react'
import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, Gift, RefreshCw, Save } from 'lucide-react'

const input='w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-mango-deep'
const btn='inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50'
function Panel({title,description,children,action}) {
  return <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{title}</h2>{description&&<p className="mt-1 text-sm text-ink-soft">{description}</p>}</div>{action}</div>{children}</section>
}
function Pill({status}) {
  const tone=status==='paid'?'border-leaf/20 bg-leaf/5 text-leaf':status==='created'?'border-mango/30 bg-mango/10 text-mango-deep':status==='failed'?'border-rose/20 bg-rose/5 text-rose':'border-ink/10 bg-paper text-ink-soft'
  return <span className={'inline-flex rounded-md border px-2 py-1 text-[10px] font-bold '+tone}>{status}</span>
}
function Stat({label,value,icon:Icon}) {
  return <div className="rounded-xl border border-ink/10 bg-white p-4"><div className="flex items-center justify-between text-ink-soft"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span><Icon size={17}/></div><p className="mt-3 text-2xl font-semibold tabular-nums">{value??'—'}</p></div>
}

export function DonationsPanel({request}) {
  const [donations,setDonations]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const load=()=>{setLoading(true);setError('');request('/donations').then(setDonations).catch(e=>setError(e.message||'Could not load donations.')).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])
  const confirmed=donations.filter(x=>x.status==='paid')
  const total=confirmed.reduce((n,x)=>n+Number(x.amount_rupees),0)
  if(loading)return <div className="py-16 text-center text-sm text-ink-soft">Loading Razorpay contribution records…</div>
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-mango-deep">WORKSPACE / CONTRIBUTIONS</p><h2 className="mt-1 text-2xl font-semibold">Donations</h2><p className="mt-1 text-sm text-ink-soft">Razorpay transactions verified against captured-payment records.</p></div><button className={btn+' border border-ink/10 bg-white'} onClick={load}><RefreshCw size={14}/> Refresh</button></header>
    {error&&<p role="alert" className="rounded-lg bg-rose/5 px-3 py-2.5 text-sm text-rose">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-3"><Stat label="Total records" value={donations.length} icon={Gift}/><Stat label="Captured payments" value={confirmed.length} icon={CheckCircle2}/><Stat label="Confirmed contributions" value={'₹'+total.toLocaleString('en-IN')} icon={CreditCard}/></div>
    <Panel title="Razorpay transactions" description="Only payments independently confirmed as captured by Razorpay are counted as verified.">
      {!donations.length?<p className="py-7 text-center text-sm text-ink-soft">No Razorpay donations recorded.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-[10px] font-bold tracking-wider text-ink-soft"><tr>{['CONTRIBUTOR','AMOUNT','DATE','STATUS'].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{donations.map(d=><tr key={d.id} className="border-t border-ink/5"><td className="px-3 py-3"><b>{d.anonymous?'Anonymous':d.username}</b><p className="text-xs text-ink-soft">{d.email||'No account attached'}</p></td><td className="px-3 py-3">₹{Number(d.amount_rupees).toLocaleString('en-IN')}</td><td className="px-3 py-3 text-xs">{new Date(d.created_at).toLocaleString('en-IN')}</td><td className="px-3 py-3"><Pill status={d.status}/></td></tr>)}</tbody></table></div>}
    </Panel>
  </div>
}

export function PaymentsPanel({request,onSaved}) {
  const [form,setForm]=useState({donationMessage:'',razorpayKeyId:'',razorpayKeySecret:''})
  const [secretSaved,setSecretSaved]=useState(false)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [status,setStatus]=useState('')
  const load=()=>{setLoading(true);request('/settings').then(s=>{setForm({donationMessage:s.donationMessage||'',razorpayKeyId:s.razorpayKeyId||'',razorpayKeySecret:''});setSecretSaved(s.razorpayKeySecretPresent)}).catch(e=>setStatus(e.message||'Could not load payment settings.')).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])
  async function save() {
    setSaving(true);setStatus('')
    try { await request('/settings',{method:'PUT',body:JSON.stringify(form)});setSecretSaved(Boolean(form.razorpayKeySecret)||secretSaved);setForm(v=>({...v,razorpayKeySecret:''}));setStatus('Payment settings saved.');onSaved?.() }
    catch(e){setStatus(e.message||'Could not save payment settings.')}
    finally{setSaving(false)}
  }
  if(loading)return <div className="py-16 text-center text-sm text-ink-soft">Loading payment configuration…</div>
  return <div className="space-y-5">
    <header><p className="text-[11px] font-bold uppercase tracking-[.16em] text-mango-deep">CONFIGURATION / PAYMENTS</p><h2 className="mt-1 text-2xl font-semibold">Razorpay checkout</h2><p className="mt-1 text-sm text-ink-soft">All contribution methods are presented through Razorpay Checkout. The Key Secret is encrypted on the server.</p></header>
    <Panel title="Razorpay credentials" description="The Key Secret is encrypted on the server and never returned to the browser after saving."><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Key ID<input className={input+' mt-1'} value={form.razorpayKeyId} onChange={e=>setForm({...form,razorpayKeyId:e.target.value})} autoComplete="off" placeholder="rzp_live_…"/></label><label className="block text-sm font-medium">Key Secret<input className={input+' mt-1'} type="password" value={form.razorpayKeySecret} onChange={e=>setForm({...form,razorpayKeySecret:e.target.value})} autoComplete="new-password" placeholder={secretSaved?'Saved — enter to replace':'Enter Razorpay Key Secret'}/></label></div>{secretSaved&&<p className="mt-2 text-xs text-leaf">A Razorpay secret is already saved. Leave the password field empty to keep it.</p>}</Panel>
    <Panel title="Public contribution message" description="This message is displayed above the donation form."><textarea className={input+' min-h-32'} maxLength={4000} value={form.donationMessage} onChange={e=>setForm({...form,donationMessage:e.target.value})}/></Panel>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-ink-soft">{status}</p><button type="button" disabled={saving} onClick={save} className={btn+' bg-ink text-white'}><Save size={14}/>{saving?'Saving…':'Save payment settings'}</button></div>
  </div>
}
