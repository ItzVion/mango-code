import { Router } from 'express'
import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { resolvePublicSmtpHost } from '../lib/smtpSecurity.js'
import { db } from '../db.js'
import { requireOwner } from '../middleware/auth.js'
import { checkRateLimit, clientIp } from '../rateLimit.js'

export const adminRouter = Router()
adminRouter.use(requireOwner)

async function audit(req, action, targetType = null, targetId = null, metadata = null) {
  await db.execute({sql:'INSERT INTO admin_audit_logs (actor_user_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?)',args:[req.userId,action,targetType,targetId,metadata ? JSON.stringify(metadata) : null]})
}
function smtpEncryptionKey() {
  const secret = String(process.env.SESSION_SECRET || '')
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters before SMTP credentials can be stored.')
  return crypto.createHash('sha256').update(secret).digest()
}
function encrypt(value) {
  const key = smtpEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.')
}
function decrypt(value) {
  const parts = String(value).split('.')
  if (parts.length !== 3 || parts.some(part => !part)) throw new Error('Stored SMTP credentials are invalid.')
  const [iv, tag, data] = parts
  const decipher = crypto.createDecipheriv('aes-256-gcm', smtpEncryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
}
function hashPassword(password) {
  return new Promise((resolve,reject)=>{
    const salt=crypto.randomBytes(16)
    crypto.scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:128*1024*1024},(err,key)=>{
      if(err)return reject(err)
      resolve('scrypt$'+salt.toString('base64url')+'$'+Buffer.from(key).toString('base64url'))
    })
  })
}
async function getSetting(key, fallback = '') {
  const r=await db.execute({sql:'SELECT value FROM admin_settings WHERE key = ?',args:[key]})
  return r.rows[0]?.value ?? fallback
}
async function setSetting(key,value,userId) {
  await db.execute({sql:'INSERT INTO admin_settings (key,value,updated_by) VALUES (?,?,?) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP',args:[key,value,userId]})
}
adminRouter.get('/overview',async(req,res,next)=>{
 try {
  const [users,courses,lessons,reports,progress,tests,exercises,maintenance]=await Promise.all([
   db.execute('SELECT COUNT(*)::int AS total FROM users'),
   db.execute('SELECT COUNT(*)::int AS total FROM courses'),
   db.execute('SELECT COUNT(*)::int AS total FROM lessons'),
   db.execute("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='OPEN')::int AS open FROM bug_reports"),
   db.execute('SELECT COUNT(*)::int AS total FROM progress'),
   db.execute('SELECT COUNT(*)::int AS total FROM test_attempts'),
   db.execute('SELECT COUNT(*)::int AS total FROM exercise_attempts'),
   getSetting('maintenance_mode','false')
  ])
  res.json({users:users.rows[0].total,courses:courses.rows[0].total,lessons:lessons.rows[0].total,reports:reports.rows[0],completedLessons:progress.rows[0].total,testAttempts:tests.rows[0].total,exerciseAttempts:exercises.rows[0].total,maintenanceMode:maintenance==='true'})
 } catch(e){next(e)}
})
adminRouter.get('/users',async(req,res,next)=>{
 try {
  const q=String(req.query.q||'').trim().slice(0,100)
  const r=await db.execute({sql:"SELECT u.id,u.name,u.email,u.role,u.auth_provider,u.email_verified_at,u.has_donated,u.created_at,COALESCE(p.completed,0)::int AS completed,COALESCE(e.attempts,0)::int AS attempts FROM users u LEFT JOIN (SELECT user_id,COUNT(*) AS completed FROM progress GROUP BY user_id) p ON p.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) AS attempts FROM exercise_attempts GROUP BY user_id) e ON e.user_id=u.id WHERE ($1='' OR u.name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%' OR u.id ILIKE '%'||$1||'%') ORDER BY u.created_at DESC LIMIT 250",args:[q]})
  res.json(r.rows)
 } catch(e){next(e)}
})
adminRouter.post('/users',async(req,res,next)=>{
 try {
  const email=String(req.body?.email||'').trim().toLowerCase(),name=String(req.body?.name||'').trim(),password=req.body?.password
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return res.status(400).json({error:'Enter a valid email address.'})
  if(!name||name.length>60)return res.status(400).json({error:'Name must be 1–60 characters.'})
  if(typeof password!=='string'||password.length<8||password.length>128)return res.status(400).json({error:'Password must be 8–128 characters.'})
  const hash=await hashPassword(password),id=crypto.randomUUID()
  const r=await db.execute({sql:"INSERT INTO users (id,email,name,password_hash,auth_provider,role,email_verified_at,legal_accepted_at) VALUES (?,?,?,?,'password','USER',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING id,email,name,role,created_at",args:[id,email,name,hash]})
  await audit(req,'ADMIN_USER_CREATE','user',id,{email})
  res.status(201).json(r.rows[0])
 } catch(e){if(e.code==='23505')return res.status(409).json({error:'An account with this email already exists.'});next(e)}
})
adminRouter.delete('/users/:id',async(req,res,next)=>{
 try {
  const target=await db.execute({sql:'SELECT id,role,email FROM users WHERE id=?',args:[req.params.id]})
  if(!target.rows[0])return res.status(404).json({error:'User not found.'})
  if(target.rows[0].role==='OWNER'||target.rows[0].id===req.userId)return res.status(403).json({error:'Owner accounts and your own account cannot be deleted here.'})
  await db.execute({sql:'DELETE FROM users WHERE id=?',args:[req.params.id]})
  await audit(req,'ADMIN_USER_DELETE','user',req.params.id,{email:target.rows[0].email})
  res.json({success:true})
 }catch(e){next(e)}
})
adminRouter.get('/reports',async(req,res,next)=>{
 try {const r=await db.execute('SELECT b.id,b.category,b.page,b.description,b.status,b.created_at,u.name,u.email FROM bug_reports b LEFT JOIN users u ON u.id=b.user_id ORDER BY CASE b.status WHEN \'OPEN\' THEN 0 WHEN \'IN_PROGRESS\' THEN 1 ELSE 2 END,b.created_at DESC LIMIT 250');res.json(r.rows)}catch(e){next(e)}
})
adminRouter.patch('/reports/:id',async(req,res,next)=>{
 try {
  const status=String(req.body?.status||'')
  if(!['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].includes(status))return res.status(400).json({error:'Invalid report status.'})
  const r=await db.execute({sql:'UPDATE bug_reports SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING id,status',args:[status,req.params.id]})
  if(!r.rows[0])return res.status(404).json({error:'Report not found.'})
  await audit(req,'ADMIN_REPORT_STATUS','bug_report',String(req.params.id),{status})
  res.json(r.rows[0])
 }catch(e){next(e)}
})
adminRouter.get('/settings',async(req,res,next)=>{
 try {
  const keys=['maintenance_mode','support_email','smtp_config','razorpay_key_id','razorpay_key_secret','qr_mode','upi_vpa','donation_message']
  const result=await db.execute({sql:'SELECT key,value FROM admin_settings WHERE key = ANY(?)',args:[keys]})
  const values=Object.fromEntries(result.rows.map(row=>[row.key,row.value]))
  let smtpConfigured=false
  let smtp={}
  if(values.smtp_config){try{const v=JSON.parse(decrypt(values.smtp_config));smtpConfigured=Boolean(v.host&&v.user&&v.pass);smtp={host:v.host||'',port:v.port||587,secure:Boolean(v.secure),user:v.user||'',from:v.from||''}}catch{}}
  res.json({
   maintenanceMode:values.maintenance_mode==='true',
   supportEmail:values.support_email??process.env.SUPPORT_EMAIL??'',
   smtpConfigured,
   smtp,
   razorpayKeyId:values.razorpay_key_id||'',
   razorpayKeySecretPresent:Boolean(values.razorpay_key_secret),
   qrMode:values.qr_mode==='true',
   upiVpa:values.upi_vpa||'',
   donationMessage:values.donation_message||'MangoCode is free to use. Contributions help cover hosting and keep learning resources available.',
  })
 }catch(e){next(e)}
})
adminRouter.put('/settings',async(req,res,next)=>{
 try {
  const body=req.body||{}
  if(typeof body.maintenanceMode==='boolean')await setSetting('maintenance_mode',String(body.maintenanceMode),req.userId)
  if(typeof body.supportEmail==='string'){
   const email=body.supportEmail.trim().slice(0,254)
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid support email.'})
   await setSetting('support_email',email,req.userId)
  }
  if(typeof body.donationMessage==='string'){
   if(body.donationMessage.length>4000)return res.status(400).json({error:'Donation message must be 4,000 characters or fewer.'})
   await setSetting('donation_message',body.donationMessage.trim(),req.userId)
  }
  if(body.qrMode!==undefined){
   if(typeof body.qrMode!=='boolean')return res.status(400).json({error:'Invalid UPI QR mode.'})
   await setSetting('qr_mode',String(body.qrMode),req.userId)
  }
  if(body.upiVpa!==undefined){
   const vpa=String(body.upiVpa||'').trim()
   if(vpa&&!/^[A-Z0-9._-]{2,64}@[A-Z0-9.-]{2,64}$/i.test(vpa))return res.status(400).json({error:'Enter a valid UPI ID (for example, name@bank).'})
   await setSetting('upi_vpa',vpa,req.userId)
  }
  if(body.razorpayKeyId!==undefined){
   const keyId=String(body.razorpayKeyId||'').trim()
   if(keyId.length>100)return res.status(400).json({error:'Razorpay Key ID is too long.'})
   await setSetting('razorpay_key_id',keyId,req.userId)
  }
  if(body.razorpayKeySecret!==undefined){
   const secret=String(body.razorpayKeySecret||'')
   if(secret&&secret!=='••••••••'){
    if(secret.length>500)return res.status(400).json({error:'Razorpay secret is too long.'})
    await setSetting('razorpay_key_secret',encrypt(secret),req.userId)
   }
  }
  await audit(req,'ADMIN_SETTINGS_UPDATE','settings')
  res.json({success:true})
 }catch(e){next(e)}
})
adminRouter.put('/smtp',async(req,res,next)=>{
 try {
  const host=String(req.body?.host||'').trim()
  const user=String(req.body?.user||'').trim()
  const from=String(req.body?.from||user).trim()
  const port=Number(req.body?.port||587)
  const secure=req.body?.secure===true
  if(req.body?.secure!==undefined&&typeof req.body.secure!=='boolean')return res.status(400).json({error:'Invalid SMTP security option.'})
  if(!host||host.length>253||!user||user.length>320||/[\r\n]/.test(user)||!Number.isInteger(port)||port<1||port>65535||!from||from.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from))return res.status(400).json({error:'Enter valid SMTP host, username, port and sender address.'})
  try { await resolvePublicSmtpHost(host) } catch { return res.status(400).json({error:'SMTP host must resolve only to public IP addresses.'}) }
  const previous=await getSetting('smtp_config','')
  let previousConfig={}
  if(previous){try{previousConfig=JSON.parse(decrypt(previous))}catch{return res.status(500).json({error:'Saved SMTP settings cannot be decrypted. Check SESSION_SECRET.'})}}
  const providedPass=typeof req.body?.pass==='string'?req.body.pass:''
  const pass=providedPass||previousConfig.pass||''
  if(!pass||pass.length>1024||/[\r\n]/.test(pass))return res.status(400).json({error:'Enter an SMTP password to configure this connection.'})
  await setSetting('smtp_config',encrypt(JSON.stringify({host,user,pass,from,port,secure})),req.userId)
  await audit(req,'ADMIN_SMTP_UPDATE','settings')
  res.json({success:true})
 }catch(e){next(e)}
})
adminRouter.post('/smtp/test',async(req,res,next)=>{
 try {
  const allowed=await checkRateLimit('admin-smtp-test:'+clientIp(req),5,600000)
  if(!allowed)return res.status(429).json({error:'Too many SMTP tests. Please wait and try again.'})
  const raw=await getSetting('smtp_config','')
  if(!raw)return res.status(400).json({error:'Save SMTP settings first.'})
  const config=JSON.parse(decrypt(raw))
  try { await resolvePublicSmtpHost(config.host) } catch { return res.status(400).json({error:'SMTP host must resolve only to public IP addresses.'}) }
  const to=String(req.body?.to||'').trim()
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))return res.status(400).json({error:'Enter a valid test recipient.'})
  const transporter=nodemailer.createTransport({host:config.host,port:config.port,secure:config.secure,auth:{user:config.user,pass:config.pass},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:10000})
  await transporter.verify()
  await transporter.sendMail({from:config.from,to,subject:'MangoCode SMTP test',text:'Your MangoCode SMTP configuration is working.'})
  await audit(req,'ADMIN_SMTP_TEST','settings',null,{to})
  res.json({success:true})
 }catch(e){res.status(400).json({error:'SMTP test failed: '+String(e.message||'connection error').slice(0,180)})}
})
const legalDefaults={refund:'# Refund Policy\n\nMangoCode contributions are voluntary. For duplicate or incorrectly processed payments, contact support with the provider transaction reference. UPI claims are checked against the exact amount and UTR before supporter status is granted.',privacy:'# Privacy Policy\n\nMangoCode stores account details and learning progress to provide its services. Contact support for privacy requests.',terms:'# Terms of Service\n\nUse MangoCode lawfully and do not misuse its code execution or learning services.',about:'# About MangoCode\n\nMangoCode helps learners understand programming through practical lessons.'}
adminRouter.get('/legal/:slug',async(req,res,next)=>{
 try {if(!legalDefaults[req.params.slug])return res.status(404).json({error:'Unknown page.'});const r=await db.execute({sql:'SELECT content,updated_at FROM legal_pages WHERE slug=?',args:[req.params.slug]});res.json({slug:req.params.slug,content:r.rows[0]?.content??legalDefaults[req.params.slug],updatedAt:r.rows[0]?.updated_at||null})}catch(e){next(e)}
})
adminRouter.put('/legal/:slug',async(req,res,next)=>{
 try {if(!legalDefaults[req.params.slug])return res.status(404).json({error:'Unknown page.'});const content=req.body?.content;if(typeof content!=='string'||content.length>100000)return res.status(400).json({error:'Content must be text under 100 KB.'});await db.execute({sql:'INSERT INTO legal_pages (slug,content,updated_by) VALUES (?,?,?) ON CONFLICT (slug) DO UPDATE SET content=EXCLUDED.content,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP',args:[req.params.slug,content,req.userId]});await audit(req,'ADMIN_LEGAL_UPDATE','legal_page',req.params.slug);res.json({success:true})}catch(e){next(e)}
})
adminRouter.get('/audit',async(req,res,next)=>{
 try {const r=await db.execute('SELECT a.id,a.action,a.target_type,a.target_id,a.metadata,a.created_at,u.name AS actor FROM admin_audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 100');res.json(r.rows)}catch(e){next(e)}
})

adminRouter.get('/donations',async(req,res,next)=>{
 try {
  const r=await db.execute("SELECT d.id,d.amount_rupees,d.status,d.created_at,u.name AS username,u.email FROM donations d LEFT JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 250")
  res.json(r.rows.map(row=>({...row,anonymous:!row.email})))
 }catch(e){next(e)}
})
adminRouter.get('/upi-claims',async(req,res,next)=>{
 try {
  const r=await db.execute("SELECT c.id,c.amount_rupees,c.utr_number,c.status,c.created_at,c.reviewed_at,c.review_note,u.name AS username,u.email,u.has_donated FROM upi_donation_claims c JOIN users u ON u.id=c.user_id ORDER BY CASE c.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,c.created_at DESC LIMIT 300")
  res.json(r.rows)
 }catch(e){next(e)}
})
adminRouter.patch('/upi-claims/:id/review',async(req,res,next)=>{
 try {
  const action=String(req.body?.action||'')
  const note=typeof req.body?.note==='string'?req.body.note.trim().slice(0,500):''
  if(!['approve','reject'].includes(action))return res.status(400).json({error:'Choose approve or reject.'})
  const result=await db.transaction(async tx=>{
   const current=await tx.execute({sql:'SELECT id,user_id,status FROM upi_donation_claims WHERE id=? FOR UPDATE',args:[req.params.id]})
   const claim=current.rows[0]
   if(!claim)return {status:'NOT_FOUND'}
   if(claim.status!=='PENDING')return {status:'ALREADY_REVIEWED'}
   const nextStatus=action==='approve'?'APPROVED':'REJECTED'
   const updated=await tx.execute({sql:"UPDATE upi_donation_claims SET status=?,reviewed_at=CURRENT_TIMESTAMP,reviewed_by=?,review_note=? WHERE id=? AND status='PENDING'",args:[nextStatus,req.userId,note||null,req.params.id]})
   if(updated.rowsAffected!==1)return {status:'ALREADY_REVIEWED'}
   if(action==='approve')await tx.execute({sql:'UPDATE users SET has_donated=TRUE WHERE id=?',args:[claim.user_id]})
   return {status:nextStatus,userId:claim.user_id}
  })
  if(result.status==='NOT_FOUND')return res.status(404).json({error:'UPI claim not found.'})
  if(result.status==='ALREADY_REVIEWED')return res.status(409).json({error:'This UPI claim has already been reviewed.'})
  await audit(req,'ADMIN_UPI_CLAIM_'+result.status,'upi_claim',String(req.params.id),{note})
  res.json({success:true,status:result.status})
 }catch(e){next(e)}
})
