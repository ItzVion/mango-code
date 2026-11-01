# Security

## Reporting a vulnerability

Please do not publish credentials, tokens, passwords, database URLs, or exploit details in a public issue.

For a private report, contact the repository owner through GitHub's private security reporting flow when available.

## Secret handling

- Production secrets belong in Vercel/environment secrets, never in Git.
- Treat any secret found in Git history as compromised and rotate it first.
- Never use the client-side `X-Mango-User` value as an authentication or authorization boundary.
- Code execution is treated as untrusted input and must remain behind strict size, rate, timeout, and sandbox limits.

## Production emergency controls

- Configure `SECURITY_BREAK_GLASS_TOKEN` as a unique, high-entropy Vercel production secret; keep it in a password manager and never commit it.
- Configure at least one private alert destination (`SECURITY_DISCORD_WEBHOOK_URL`, or `RESEND_API_KEY` with `SECURITY_ALERT_EMAIL` and `SECURITY_EMAIL_FROM`).
- Verify the emergency lockdown and recovery procedures in a non-production environment before relying on them.
