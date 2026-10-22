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
