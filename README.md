# MangoCode

MangoCode is an animated coding-learning platform for HTML & CSS, JavaScript, Python, C, and C++. Learners move from lessons to quizzes and runnable code exercises with immediate feedback.

## Stack

- Frontend: React + Vite + Tailwind CSS v4 + Motion
- Production hosting: Vercel
- Production API: Vercel serverless handler at `api/index.js`, backed by the PostgreSQL server implementation in `server/index.js`
- Database: Neon/PostgreSQL, configured through `DATABASE_URL`
- Code execution: Piston API for Python, JavaScript, C, and C++ exercises

## Local development

Run the API and client separately:

```sh
cd server
npm install
# Create server/.env from server/.env.example and set DATABASE_URL.
npm run dev
```

In another terminal:

```sh
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`.

## Database

The production API expects the PostgreSQL schema to exist and checks for the required tables at startup/request time. `server/schema.sql` and `server/seed.sql` are available for database setup and catalog seeding. Avoid running schema resets against production; back up data and review migrations before applying changes.

## Vercel

The Vercel project uses the repository root as its Root Directory. The root `vercel.json` installs server and client dependencies, builds the client into `client/dist`, serves the SPA, and routes `/api/*` to `api/index.js`. The handler delegates API requests to the PostgreSQL-backed server.

Required Production environment variables:

- `DATABASE_URL` — Neon/PostgreSQL connection string
- `PISTON_URL` — optional; defaults to `https://emkc.org/api/v2/piston`

Never commit `.env` files or credentials.


## Production setup: accounts, saved results, and reports

The learning app uses Neon PostgreSQL. The additive migration at `server/migrations/20261101_auth_roles_results.sql` adds email-verification fields, a `USER` / `OWNER` role, and short-lived OTP storage. It preserves existing accounts and learning records. The migration has been applied to the current production Neon branch.

### Required Vercel environment variables

- `DATABASE_URL`: the existing Neon connection string.
- `SESSION_SECRET`: a random secret of at least 32 characters. It is used to HMAC one-time email codes. `OTP_SECRET` is optional; when omitted, `SESSION_SECRET` is used.
- `OWNER_EMAIL`: the exact email address that should receive the `OWNER` role when that account signs in.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`: mail delivery for registration verification and password-reset codes.
- `GOOGLE_CLIENT_ID`: Google Identity Services Web OAuth client ID used by the API to verify Google ID tokens.
- `VITE_GOOGLE_CLIENT_ID`: the same Web OAuth client ID, exposed to the frontend for the official Google sign-in button. This is a public client ID, never a client secret.
- `DISCORD_BUG_WEBHOOK`: a newly rotated Discord webhook used by the server-side bug-report endpoint. Never place a webhook URL in frontend code.
- `SUPPORT_EMAIL` and `VITE_SUPPORT_EMAIL`: the monitored support address shown in legal pages and the footer.
- `PISTON_URL`: optional code-runner URL; defaults to the public Piston endpoint.

For Google Identity Services, add the public site's exact HTTPS origin in the Web OAuth client's Authorized JavaScript origins. The current implementation uses a JavaScript callback, so it does not require an OAuth redirect URI. Keep the OAuth app in Testing until the public domain is verified and the branding review is complete.

### Saved learning results

Signed-in learners have lesson completion, exercise attempts, checkpoint attempts and learning streaks stored against their account. Guest code runs are not attached to an account. The account's Saved results page is available at `/results`.

Bug reports are rate-limited and forwarded from the server to Discord. Reports contain the category, page path and description; the webhook secret is read only from the server environment.
