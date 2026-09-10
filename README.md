# MangoCode

MangoCode is an animated coding-learning platform for HTML & CSS, JavaScript, Python, C, and C++. Learners move from lessons to quizzes and runnable code exercises with immediate feedback.

## Stack

- Frontend: React + Vite + Tailwind CSS v4 + Motion, deployed on Vercel
- Backend: Express serverless function on Vercel
- Database: Turso / libSQL
- Code execution: Piston API for Python, JavaScript, C, and C++ exercises

## Local development

```text
cd server && npm install
# create server/.env from .env.example
npm run dev

cd ../client && npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`.

## Database

Apply `server/schema.sql` first, then `server/seed.sql` to create the learning catalog and starter exercises.

## Vercel

The repository root is the Vercel project root. `vercel.json` builds `client` and rewrites `/api/*` to the Vercel serverless Express entrypoint in `api/index.js`.

Required server environment variables in Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `PISTON_URL` (normally `https://emkc.org/api/v2/piston`)

Never commit `.env` or credentials.
