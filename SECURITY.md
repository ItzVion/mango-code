# Security

## Reporting a vulnerability

Please do not publish credentials, tokens, passwords, database URLs, or exploit details in a public issue.

For a private report, contact the repository owner through GitHub's private security reporting flow when available.

## Secret handling

- Production secrets belong in Vercel/environment secrets, never in Git.
- Treat any secret found in Git history as compromised and rotate it first.
- Authentication and authorization must rely on server-validated session cookies and database roles, never on client-supplied identity values.
- Code execution is treated as untrusted input and must remain behind strict size, rate, timeout, and sandbox limits.

## Production emergency controls

- Configure `SECURITY_BREAK_GLASS_TOKEN` as a unique, high-entropy Vercel production secret; keep it in a password manager and never commit it.
- Configure a dedicated private alert destination (`SECURITY_DISCORD_WEBHOOK_URL` or `DISCORD_SECURITY_WEBHOOK_URL`). Keep emergency-alert webhooks separate from the in-app bug-report webhook.
- Bug-report delivery uses `DISCORD_BUG_WEBHOOK`. Rotate any webhook pasted into a chat, issue, screenshot or source file before configuring it.
- Verify the emergency lockdown and recovery procedures in a non-production environment before relying on them.

## Database hardening status

- Row-level security is enabled on all 20 production public tables.
- Vercel production now uses the dedicated `mangocode_app` login role. It is `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`, and `NOINHERIT`, with a 10-connection limit. It has DML privileges only; the table-owning `neondb_owner` role is reserved for migrations and database administration.
- RLS policies exist for the application role, but they are currently service-level policies that allow the application role to access all rows. They are **not** per-user row isolation. Server-side authorization and ownership filters remain mandatory.
- Do not enable FORCE ROW LEVEL SECURITY or replace the service policies with user policies until request identity is securely set transaction-locally and all routes, background jobs, OTP flows, public pages, and admin operations have been tested.
- Production startup verifies the schema; schema changes must be applied as reviewed migrations.

## Incident response and log handling

1. Contain the affected endpoint or account; use emergency lockdown only when necessary.
2. Preserve relevant application, hosting, database, authentication, and payment evidence before rotating or deleting anything.
3. Identify the affected data, users, processors, and time window; rotate compromised credentials and invalidate sessions.
4. Assess statutory and contractual notification duties. For incidents covered by CERT-In directions, follow the applicable reporting deadline and evidence requirements; do not wait for a complete forensic report before seeking qualified advice.
5. Record the incident, actions, notifications, and recovery verification. Security-incident rows are retained for 180 days, but this does not by itself establish that all required system logs are retained for the required period.

## Child data and legal readiness

MangoCode currently has no automated, verified parental-consent flow. A child's checkbox or ordinary email confirmation is not verified parental consent. Do not process a child's account data where verifiable parental consent is required until an appropriate adult-verification process is in place. Review the privacy policy and applicable commencement dates with a qualified Indian legal professional before accepting child accounts.
