import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Clock3, CreditCard, Gift, RefreshCw, Save, ShieldCheck, Star, X } from 'lucide-react'

const input='w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-mango-deep'
const btn='inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50'
function Panel({title,description,children,action}) {
  return <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{title}</h2>{description&&<p className="mt-1 text-sm text-ink-soft">{description}</p>}</div>{action}</div>{children}</section>
}
function Pill({status}) {
  const tone=status==='APPROVED'||status==='paid'?'border-leaf/20 bg-leaf/5 text-leaf':status==='PENDING'||status==='created'?'border-mango/30 bg-mango/10 text-mango-deep':status==='REJECTED'||status==='failed'?'border-rose/20 bg-rose/5 text-rose':'border-ink/10 bg-paper text-ink-soft'
  return <span className={'inline-flex rounded-md border px-2 py-1 text-[10px] font-bold '+tone}>{status}</span>
}
function Stat({label,value,icon:Icon}) {
  return <div className="rounded-xl border border-ink/10 bg-white p-4"><div className="flex items-center justify-between text-ink-soft"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span><Icon size={17}/></div><p className="mt-3 text-2xl font-semibold tabular-nums">{value??'—'}</p></div>
}

export function DonationsPanel({request}) {
  const [claims,setClaims]=useState([])
  const [donations,setDonations]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [note,setNote]=useState({})
  const [busy,setBusy]=useState('')
  const load=()=>{setLoading(true);setError('');Promise.all([request('/upi-claims'),request('/donations')]).then(([c,d])=>{setClaims(c);setDonations(d)}).catch(e=>setError(e.message||'Could not load contributions.')).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])
  async function review(id,action) {
    setBusy(id);setError('')
    try { await request('/upi-claims/'+encodeURIComponent(id)+'/review',{method:'PATCH',body:JSON.stringify({action,note:note[id]||''})}); await load() }
    catch(e){setError(e.message||'Could not review claim.')}
    finally{setBusy('')}
  }
  const pending=claims.filter(x=>x.status==='PENDING')
  const reviewed=claims.filter(x=>x.status!=='PENDING')
  const total=donations.filter(x=>x.status==='paid').reduce((n,x)=>n+Number(x.amount_rupees),0)+reviewed.filter(x=>x.status==='APPROVED').reduce((n,x)=>n+Number(x.amount_rupees),0)
  if(loading)return <div className="py-16 text-center text-sm text-ink-soft">Loading contribution records…</div>
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-mango-deep">WORKSPACE / CONTRIBUTIONS</p><h2 className="mt-1 text-2xl font-semibold">Donations</h2><p className="mt-1 text-sm text-ink-soft">Review UPI transfers separately from provider-verified Razorpay payments.</p></div><button className={btn+' border border-ink/10 bg-white'} onClick={load}><RefreshCw size={14}/> Refresh</button></header>
    {error&&<p role="alert" className="rounded-lg bg-rose/5 px-3 py-2.5 text-sm text-rose">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-3"><Stat label="UPI awaiting review" value={pending.length} icon={Clock3}/><Stat label="Approved / captured" value={reviewed.filter(x=>x.status==='APPROVED').length+donations.filter(x=>x.status==='paid').length} icon={CheckCircle2}/><Stat label="Confirmed contributions" value={'₹'+total.toLocaleString('en-IN')} icon={Gift}/></div>
    <Panel title="Pending UPI payment claims" description="Compare the exact amount and UTR with your bank or UPI application before approving." action={<Pill status={pending.length+' pending'}/>}>
      {!pending.length?<div className="py-8 text-center text-sm text-ink-soft"><CheckCircle2 className="mx-auto mb-2 text-leaf"/>There are no pending UPI claims.</div>
      :<div className="space-y-3">{pending.map(c=><article key={c.id} className="grid gap-4 rounded-xl border border-ink/10 p-4 lg:grid-cols-[minmax(0,1fr)_150px_minmax(170px,1fr)_auto] lg:items-center">
        <div className="min-w-0"><p className="font-semibold">{c.username||'Unknown user'}</p><p className="text-xs text-ink-soft">{c.email}</p><p className="mt-1 text-xs text-ink-soft">Submitted {new Date(c.created_at).toLocaleString('en-IN')}</p><p className="mt-2 font-mono text-sm font-semibold tracking-wide">UTR · {c.utr_number}</p></div>
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Claimed amount</p><p className="mt-1 text-xl font-semibold">₹{Number(c.amount_rupees).toLocaleString('en-IN')}</p><Pill status={c.status}/></div>
        <label className="block text-xs font-medium text-ink-soft">Verification note<input maxLength={500} className={input+' mt-1'} value={note[c.id]||''} onChange={e=>setNote(v=>({...v,[c.id]:e.target.value}))} placeholder="Optional transaction note"/></label>
        <div className="flex gap-2"><button disabled={busy===c.id} onClick={()=>review(c.id,'approve')} className={btn+' bg-leaf text-white'}><Check size={14}/> Approve</button><button disabled={busy===c.id} onClick={()=>review(c.id,'reject')} className={btn+' border border-rose/20 text-rose'}><X size={14}/> Reject</button></div>
      </article>)}</div>}
    </Panel>
    <Panel title="Reviewed UPI claims" description="Approved claims grant the account supporter star; rejected claims remain in the record.">
      {!reviewed.length?<p className="py-7 text-center text-sm text-ink-soft">No reviewed claims yet.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-[10px] font-bold tracking-wider text-ink-soft"><tr>{['ACCOUNT','AMOUNT','UTR','SUBMITTED','REVIEWED','STATUS'].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{reviewed.map(c=><tr key={c.id} className="border-t border-ink/5"><td className="px-3 py-3"><b>{c.username}</b><p className="text-xs text-ink-soft">{c.email}</p></td><td className="px-3 py-3">₹{Number(c.amount_rupees).toLocaleString('en-IN')}</td><td className="px-3 py-3 font-mono text-xs">{c.utr_number}</td><td className="px-3 py-3 text-xs">{new Date(c.created_at).toLocaleString('en-IN')}</td><td className="px-3 py-3 text-xs">{c.reviewed_at?new Date(c.reviewed_at).toLocaleString('en-IN'):'—'}</td><td className="px-3 py-3"><Pill status={c.status}/>{c.review_note&&<p className="mt-1 max-w-48 text-xs text-ink-soft">{c.review_note}</p>}</td></tr>)}</tbody></table></div>}
    </Panel>
    <Panel title="Razorpay transactions" description="Only payments independently confirmed as captured by Razorpay are counted as verified.">
      {!donations.length?<p className="py-7 text-center text-sm text-ink-soft">No Razorpay donations recorded.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-[10px] font-bold tracking-wider text-ink-soft"><tr>{['CONTRIBUTOR','AMOUNT','DATE','STATUS'].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{donations.map(d=><tr key={d.id} className="border-t border-ink/5"><td className="px-3 py-3"><b>{d.anonymous?'Anonymous':d.username}</b><p className="text-xs text-ink-soft">{d.email||'No account attached'}</p></td><td className="px-3 py-3">₹{Number(d.amount_rupees).toLocaleString('en-IN')}</td><td className="px-3 py-3 text-xs">{new Date(d.created_at).toLocaleString('en-IN')}</td><td className="px-3 py-3"><Pill status={d.status}/></td></tr>)}</tbody></table></div>}
    </Panel>
  </div>
}

export function PaymentsPanel({request,onSaved}) {
  const [form,setForm]=useState({qrMode:false,upiVpa:'',donationMessage:'',razorpayKeyId:'',razorpayKeySecret:''})
  const [secretSaved,setSecretSaved]=useState(false)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [status,setStatus]=useState('')
  const load=()=>{setLoading(true);request('/settings').then(s=>{setForm({qrMode:s.qrMode,upiVpa:s.upiVpa||'',donationMessage:s.donationMessage||'',razorpayKeyId:s.razorpayKeyId||'',razorpayKeySecret:''});setSecretSaved(s.razorpayKeySecretPresent)}).catch(e=>setStatus(e.message||'Could not load payment settings.')).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])
  async function save() {
    setSaving(true);setStatus('')
    try { await request('/settings',{method:'PUT',body:JSON.stringify(form)});setSecretSaved(Boolean(form.razorpayKeySecret)||secretSaved);setForm(v=>({...v,razorpayKeySecret:''}));setStatus('Payment settings saved.');onSaved?.() }
    catch(e){setStatus(e.message||'Could not save payment settings.')}
    finally{setSaving(false)}
  }
  if(loading)return <div className="py-16 text-center text-sm text-ink-soft">Loading payment configuration…</div>
  return <div className="space-y-5">
    <header><p className="text-[11px] font-bold uppercase tracking-[.16em] text-mango-deep">CONFIGURATION / PAYMENTS</p><h2 className="mt-1 text-2xl font-semibold">Payment methods</h2><p className="mt-1 text-sm text-ink-soft">Choose the payment flow visitors see. Switching methods keeps the other method’s configuration.</p></header>
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={()=>setForm(f=>({...f,qrMode:false}))} className={'rounded-xl border p-4 text-left transition '+(!form.qrMode?'border-mango bg-mango/5':'border-ink/10 bg-white')}><div className="flex items-center justify-between"><CreditCard size={20}/><Pill status={!form.qrMode?'Selected':'Available'}/></div><h3 className="mt-3 font-semibold">Razorpay checkout</h3><p className="mt-1 text-xs leading-5 text-ink-soft">Provider-hosted checkout with server-side order and captured-payment verification.</p></button>
      <button type="button" onClick={()=>setForm(f=>({...f,qrMode:true}))} className={'rounded-xl border p-4 text-left transition '+(form.qrMode?'border-mango bg-mango/5':'border-ink/10 bg-white')}><div className="flex items-center justify-between"><Gift size={20}/><Pill status={form.qrMode?'Selected':'Available'}/></div><h3 className="mt-3 font-semibold">UPI QR payment</h3><p className="mt-1 text-xs leading-5 text-ink-soft">Amount first, then QR, then UTR submission for owner verification.</p></button>
    </div>
    <Panel title="UPI QR configuration" description="Use a UPI ID that you control. The ID is shown publicly when QR mode is enabled."><label className="block text-sm font-medium">UPI ID / VPA<input className={input+' mt-1'} value={form.upiVpa} onChange={e=>setForm({...form,upiVpa:e.target.value.trim()})} placeholder="yourname@bank"/></label><p className="mt-2 text-xs text-ink-soft">The QR code is generated for the selected amount and this VPA. No banking PIN or password is requested.</p></Panel>
    <Panel title="Razorpay credentials" description="The Key Secret is encrypted on the server and never returned to the browser after saving."><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Key ID<input className={input+' mt-1'} value={form.razorpayKeyId} onChange={e=>setForm({...form,razorpayKeyId:e.target.value})} autoComplete="off" placeholder="rzp_live_…"/></label><label className="block text-sm font-medium">Key Secret<input className={input+' mt-1'} type="password" value={form.razorpayKeySecret} onChange={e=>setForm({...form,razorpayKeySecret:e.target.value})} autoComplete="new-password" placeholder={secretSaved?'Saved — enter to replace':'Enter Razorpay Key Secret'}/></label></div>{secretSaved&&<p className="mt-2 text-xs text-leaf">A Razorpay secret is already saved. Leave the password field empty to keep it.</p>}</Panel>
    <Panel title="Public contribution message" description="This message is displayed above the donation form."><textarea className={input+' min-h-32'} maxLength={4000} value={form.donationMessage} onChange={e=>setForm({...form,donationMessage:e.target.value})}/></Panel>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-ink-soft">{status}</p><button type="button" disabled={saving} onClick={save} className={btn+' bg-ink text-white'}><Save size={14}/>{saving?'Saving…':'Save payment settings'}</button></div>
  </div>
}
