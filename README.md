# MangoCode

MangoCode is an animated coding-learning platform for HTML & CSS, JavaScript, Python, C, and C++. Learners move from lessons to quizzes and runnable code exercises with immediate feedback.

## Stack

- Frontend: React + Vite + Tailwind CSS v4 + Motion
- Production hosting: Vercel
- Production API: Vercel serverless function in `client/api/index.js`
- Database: Turso / libSQL
- Code execution: Piston API for Python, JavaScript, C, and C++ exercises

## Local development

Run the API and client separately:

```text
cd server && npm install
# create server/.env from .env.example
npm run dev

cd ../client && npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`.

## Database

The production API creates the required tables on first request and seeds the learning catalog when the database is empty or missing catalog rows. `server/schema.sql` and `server/seed.sql` remain useful for manual/local database setup.

## Vercel

The MangoCode Vercel project currently uses `client` as its Root Directory. The client contains the Vite app and `client/api/index.js`, which handles `/api/*` through `client/vercel.json`.

Required Production environment variables:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `PISTON_URL` (normally `https://emkc.org/api/v2/piston`)

Never commit `.env` files or credentials.
