import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || '').trim()

function SupportContact() {
  const [supportEmail, setSupportEmail] = useState(SUPPORT_EMAIL)
  useEffect(() => {
    let active = true
    fetch('/api/status', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
      if (active && typeof data?.supportEmail === 'string' && data.supportEmail.trim()) setSupportEmail(data.supportEmail.trim())
    }).catch(() => {})
    return () => { active = false }
  }, [])
  return supportEmail
    ? <a className="font-semibold underline underline-offset-4" href={'mailto:' + supportEmail}>{supportEmail}</a>
    : <span className="font-semibold">A support email has not been published for this deployment yet.</span>
}

function LegalLayout({ label, title, updated, slug, children }) {
  const [override, setOverride] = useState(null)
  useEffect(() => { let active=true; fetch('/api/legal/'+slug,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(active&&d?.content)setOverride(d.content)}).catch(()=>{}); return ()=>{active=false} },[slug])
  return <main className="mx-auto max-w-4xl space-y-6 pb-12">
    <p className="text-xs font-bold uppercase tracking-widest text-mango-deep">{label}</p>
    <header className="border-b border-ink/10 pb-5"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-xs text-ink-soft">Last updated: {updated}</p></header>
    <article className="space-y-6 rounded-xl border border-ink/10 bg-card p-5 text-sm leading-7 text-ink-soft sm:p-8">{override !== null ? <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-ink-soft">{override}</pre> : children}</article>
    <p className="text-xs text-ink-soft">Questions or requests: <SupportContact /></p>
    <div className="flex flex-wrap gap-4 text-xs font-semibold"><Link to="/about" className="underline">About MangoCode</Link><Link to="/privacy" className="underline">Privacy</Link><Link to="/terms" className="underline">Terms</Link><Link to="/refund" className="underline">Refunds</Link><Link to="/third-party-notice" className="underline">Third-party services</Link></div>
  </main>
}

function Section({ title, children }) {
  return <section><h2 className="mb-2 text-base font-bold text-ink">{title}</h2>{children}</section>
}

export function AboutPage() {
  return <LegalLayout label="ABOUT" title="About MangoCode" updated="November 1, 2026" slug="about">
    <p className="text-base text-ink">MangoCode is a self-paced programming learning site built around understanding concepts and practising them with code.</p>
    <Section title="What you can learn"><p>Learning paths cover HTML and CSS, JavaScript, Python, C, and C++. Each path is organised from beginner foundations through more advanced topics, with worked examples, quick checks, practical exercises and checkpoint assessments.</p></Section>
    <Section title="How the lessons work"><p>Lessons introduce an idea in plain language, show an example, highlight what matters, and give you a chance to write and run code. Signed-in learners can keep completed lessons, practical attempts and assessment scores in their account.</p></Section>
    <Section title="Independent project"><p>MangoCode is an independent project. It is not owned by, sponsored by, or officially affiliated with Google, Neon, Vercel, Piston, Discord, or any other third-party provider mentioned on this site.</p></Section>
    <Section title="Contact"><p>For a technical issue, use the Report a bug control in the site. For general or privacy questions, use the support contact configured for this deployment: <SupportContact /></p></Section>
  </LegalLayout>
}

export function PrivacyPage() {
  return <LegalLayout label="LEGAL" title="Privacy Policy" updated="November 1, 2026" slug="privacy">
    <p className="text-base text-ink">This policy explains what information MangoCode processes when you use its lessons, accounts, code exercises and support features.</p>
    <Section title="Information we process"><ul className="list-disc space-y-2 pl-5">
      <li><strong className="text-ink">Account information:</strong> name, email address, password hash, Google account subject identifier (when Google sign-in is used), account role and account timestamps.</li>
      <li><strong className="text-ink">Authentication information:</strong> hashed session tokens, short-lived hashed email verification/reset codes and timestamps used to maintain secure sign-in.</li>
      <li><strong className="text-ink">Learning records:</strong> lesson completion, streak information, checkpoint scores, whether an assessment was passed, and code-exercise submissions made while signed in.</li>
      <li><strong className="text-ink">Operational and security information:</strong> request metadata such as IP address used for rate limiting, abuse prevention, service operation and troubleshooting.</li>
      <li><strong className="text-ink">Bug reports:</strong> the description, report category, page path and account identifier if signed in. The current report form does not ask for passwords or payment information.</li>
    </ul></Section>
    <Section title="Google sign-in"><p>If you choose Google sign-in, Google provides an identity credential that MangoCode verifies on the server. MangoCode may receive your Google account identifier, verified email and profile name. The current sign-in flow requests identity information only; it does not ask for access to Gmail, Google Drive, contacts or other Google content.</p></Section>
    <Section title="Code execution"><p>When you run a coding practical, the submitted code and exercise input are sent to the configured Piston code-execution service so it can run the program and return output. For signed-in users, the code submitted for an exercise attempt and its pass/fail result may be stored in MangoCode's database so the account can show a result history. Do not submit passwords, API keys, personal information or other secrets in code.</p></Section>
    <Section title="Donations and UPI claims"><p>If you make a contribution, MangoCode stores the amount and payment reference needed to reconcile it. Razorpay processes gateway payment details. If UPI QR mode is enabled, a signed-in contributor may submit an amount and UTR for manual review; the site owner sees those details to match the transfer. A supporter indicator is granted only after Razorpay confirms a captured payment or the owner approves a UPI claim.</p></Section>
    <Section title="How information is used"><p>Information is used to authenticate accounts, verify email addresses, restore access, save learning progress, evaluate exercises and assessments, prevent abuse, maintain the service, and respond to reports or support requests.</p></Section>
    <Section title="Service providers"><p>MangoCode uses third-party infrastructure for database hosting, website hosting, Google sign-in, code execution, email delivery and Discord bug-report delivery. A bug report is forwarded to the project's configured Discord webhook. Provider names and links are listed in the <Link className="font-semibold underline text-ink" to="/third-party-notice">Third-party Services Notice</Link>. Their own terms and privacy policies apply to the services they provide.</p></Section>
    <Section title="Cookies and security"><p>The server uses a Secure, HttpOnly session cookie to keep you signed in. The session token is stored as a hash in the database. Email verification and password reset codes are stored as keyed hashes, expire after a short period and have attempt limits. No internet service can guarantee absolute security.</p></Section>
    <Section title="Retention and control"><p>Account records and learning history are retained while needed to provide the account and its history, protect the service, resolve disputes or meet legal obligations. You can sign out at any time. This deployment does not currently expose a self-service account deletion control; use the configured support contact to request help with account or data questions: <SupportContact /></p></Section>
    <Section title="Children"><p>MangoCode is a general learning website. The current service does not verify a learner's age or implement a verifiable parental-consent workflow. If you are under 18, do not create an account or submit personal information unless a parent or lawful guardian has reviewed the service and agreed to your use. A simple checkbox is not treated as verified parental consent. Do not submit passwords, identity documents, home addresses, school details or other sensitive information in lessons, code or bug reports.</p></Section>
    <Section title="Policy updates"><p>This policy may be updated when features, processors or legal requirements change. The current version and update date will be shown on this page.</p></Section>
  </LegalLayout>
}

export function TermsPage() {
  return <LegalLayout label="LEGAL" title="Terms of Service" updated="November 1, 2026" slug="terms">
    <p className="text-base text-ink">By using MangoCode, you agree to use the service responsibly and follow these terms.</p>
    <Section title="The service"><p>MangoCode provides self-paced programming lessons, worked examples, quizzes, checkpoint assessments and code-execution practicals. Content is educational and may contain mistakes or omissions. It is not a guarantee of a particular learning outcome or qualification.</p></Section>
    <Section title="Accounts"><p>You are responsible for keeping your sign-in details private and for activity carried out through your account. Provide an email address you control so you can complete verification and password recovery. Do not impersonate another person or attempt to access another user's account or results. If you are under 18, use the service only after a parent or lawful guardian has reviewed and agreed to your use.</p></Section>
    <Section title="Acceptable use"><ul className="list-disc space-y-2 pl-5">
      <li>Do not attempt to break into, disrupt, overload or bypass security controls on MangoCode or its providers.</li>
      <li>Do not use code execution to attack systems, exfiltrate data, mine cryptocurrency, or run abusive workloads.</li>
      <li>Do not submit unlawful content, malware, secrets, credentials or another person's private information.</li>
      <li>Do not abuse registration, email verification, code runner, quiz or bug-report endpoints.</li>
    </ul></Section>
    <Section title="Code execution and saved results"><p>Practical code is executed by a third-party runner under resource and time limits. Execution may be unavailable or outputs may differ between environments. Signed-in exercise submissions, assessment results and lesson progress may be stored to provide the account history feature.</p></Section>
    <Section title="Intellectual property"><p>You retain rights in code and other content you create, subject to any third-party licences that apply. You grant MangoCode only the limited permission needed to receive, run, store and display submitted content as part of the service.</p></Section>
    <Section title="Availability and termination"><p>MangoCode may change, suspend or discontinue features to maintain security, reliability or the service itself. Access may be restricted for abuse, fraud, security threats or violations of these terms. The service is provided on an as-available basis to the extent permitted by applicable law.</p></Section>
    <Section title="Third-party services"><p>External providers, including Google, Neon, Vercel, Piston, SMTP/email and Discord, operate under their own terms and policies. MangoCode is not responsible for the availability or operation of those providers.</p></Section>
    <Section title="Contact and updates"><p>For issues, use the in-app Report a bug control. For other service or account questions, use the configured support contact: <SupportContact />. These terms may be updated as the service changes.</p></Section>
  </LegalLayout>
}

export function RefundPage() {
  return <LegalLayout label="LEGAL" title="Refund Policy" updated="November 1, 2026" slug="refund">
    <p className="text-base text-ink">MangoCode contributions are voluntary and help support hosting and continued development.</p>
    <Section title="Razorpay contributions"><p>Razorpay processes card, UPI and other enabled payment methods. MangoCode records the payment amount, order/payment references and confirmation status, not full card numbers, CVV codes or UPI PINs. Contact support promptly with the transaction reference if a contribution was duplicated, charged for the wrong amount or not reflected correctly.</p></Section>
    <Section title="Manual UPI claims"><p>UPI QR claims remain pending until the owner compares the submitted amount and UTR with the bank or UPI transaction record. A supporter indicator is granted only after approval. Submitting a claim does not itself prove that funds were received.</p></Section>
    <Section title="Contact"><p>For help, contact <SupportContact /> and include the date, amount and provider transaction reference. Never send a UPI PIN, card security code or password.</p></Section>
  </LegalLayout>
}

export function ThirdPartyNoticePage() {
  const providers = [
    ['Google Identity Services', 'Optional account authentication. Google supplies an ID token; MangoCode verifies it and uses the verified identity claims to create a session.', 'https://developers.google.com/identity/gsi/web'],
    ['Neon', 'PostgreSQL database hosting for accounts, lessons, progress, assessment attempts and exercise history.', 'https://neon.tech/privacy-policy'],
    ['Vercel', 'Website hosting, deployment and serverless API delivery.', 'https://vercel.com/legal/privacy-policy'],
    ['Razorpay', 'Processes optional contributions and returns transaction identifiers and capture status for server-side verification.', 'https://razorpay.com/privacy/'],
    ['QR Server', 'Generates the scannable UPI QR image from the configured payment URI; the UPI ID and selected amount are included in the QR image request.', 'https://goqr.me/api/'],
    ['Piston', 'Remote execution of code submitted for supported programming practicals.', 'https://github.com/engineer-man/piston'],
    ['Discord', 'Receives bug-report descriptions, category, page path and a user identifier when the reporter is signed in, via the configured project webhook.', 'https://discord.com/privacy'],
    ['Zoho Mail (SMTP, when configured)', 'Sends verification and password-reset messages through the Zoho SMTP server configured by the project. The exact SMTP host depends on the account type and data centre.', 'https://www.zoho.com/mail/help/zoho-smtp.html'],
  ]
  return <LegalLayout label="TRANSPARENCY" title="Third-party Services Notice" updated="November 1, 2026">
    <p className="text-base text-ink">MangoCode is an independent project and may depend on the following third-party services to operate specific features.</p>
    {providers.map(([name,detail,url]) => <Section key={name} title={name}><p>{detail}</p>{url && <p className="mt-2"><a className="font-semibold text-ink underline underline-offset-4" href={url} target="_blank" rel="noreferrer">Provider information</a></p>}</Section>)}
    <Section title="No endorsement"><p>Product names and trademarks belong to their respective owners. Listing a provider does not imply sponsorship, endorsement or partnership. The providers actually used may change as the site evolves.</p></Section>
    <Section title="Contact"><p>For a technical issue, use Report a bug. For privacy or provider questions, use the configured support contact: <SupportContact /></p></Section>
  </LegalLayout>
}
