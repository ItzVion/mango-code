# Security

## Reporting a vulnerability

Please do not publish credentials, tokens, passwords, database URLs, or exploit details in a public issue.

For a private report, contact the repository owner through GitHub's private security reporting flow when available.

## Secret handling

- Production secrets belong in Vercel/environment secrets, never in Git.
- Treat any secret found in Git history as compromised and rotate it first.
- Never use the client-side `X-Mango-User` value as an authentication or authorization boundary.
- Code execution is treated as untrusted input and must remain behind strict size, rate, timeout, and sandbox limits.
