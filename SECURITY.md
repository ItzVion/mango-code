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

- Row-level security is enabled on every current public table in the production Neon database.
- The production application still connects with the table-owning Neon role. PostgreSQL table owners normally bypass RLS, and there are currently no RLS policies. Therefore, RLS is **not** a per-user isolation boundary yet; server-side ownership checks remain mandatory.
- Do not enable FORCE ROW LEVEL SECURITY or add permissive policies as a shortcut. A future least-privilege role must be demonstrably NOSUPERUSER, NOCREATEDB, NOCREATEROLE, and NOBYPASSRLS, and the application's authorization model must be tested before switching production credentials.
- Production application startup must verify the schema, not run DDL. Apply schema changes as reviewed migrations.

## Incident response and log handling

1. Contain the affected endpoint or account; use emergency lockdown only when necessary.
2. Preserve relevant application, hosting, database, authentication, and payment evidence before rotating or deleting anything.
3. Identify the affected data, users, processors, and time window; rotate compromised credentials and invalidate sessions.
4. Assess statutory and contractual notification duties. For incidents covered by CERT-In directions, follow the applicable reporting deadline and evidence requirements; do not wait for a complete forensic report before seeking qualified advice.
5. Record the incident, actions, notifications, and recovery verification. Security-incident rows are retained for 180 days, but this does not by itself establish that all required system logs are retained for the required period.

## Child data and legal readiness

MangoCode currently has no automated, verified parental-consent flow. A child's checkbox or ordinary email confirmation is not verified parental consent. Do not process a child's account data where verifiable parental consent is required until an appropriate adult-verification process is in place. Review the privacy policy and applicable commencement dates with a qualified Indian legal professional before accepting child accounts.
