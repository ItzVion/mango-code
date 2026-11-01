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
