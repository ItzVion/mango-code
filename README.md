# MangoCode

Learn HTML, CSS, JavaScript, Python, C, and C++ — lessons, quizzes, and
code exercises that check your answer and explain mistakes.

## Stack
- Frontend: React + Vite + Tailwind v4, Motion (Motion Primitives-style components), react-router — deployed on Vercel
- Backend: Express + Turso (libSQL) — deployed on Render
- Code execution/checking: Piston API (emkc.org)

## Local dev
```
cd server && npm install && cp .env.example .env   # fill in Turso URL + token
npm run dev                                          # :4000

cd client && npm install
npm run dev                                          # :5173, proxies /api to :4000
```

## Deploy
1. Push to GitHub.
2. Vercel: import repo, set root directory to `client`, framework = Vite.
3. Render: new Web Service, root directory `server`, build `npm install`, start `npm start`, add env vars from `.env.example`.
4. Turso: create a database, paste `server/schema.sql` into the Turso SQL console.
