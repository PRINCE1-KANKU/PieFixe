# Pie Fixe — Server

A small Express API that powers two things on the Pie Fixe website:

1. **Blog publishing** — the author workspace (`blog-admin.html`) signs in, writes a
   post, and it appears immediately on the public journal (`blog.html`) for every
   visitor — no more posts trapped in one browser's `localStorage`.
2. **Enquiries + automated email** — the booking form and contact form on the site
   POST to this server, which saves the enquiry and automatically emails it to your
   business inbox, plus (optionally) sends the customer a confirmation email.

Posts and enquiries are stored as JSON files under `data/`. That's intentionally
simple — enough for a business site like this — with no database to manage. It can
be swapped for a real database later without changing the website code, since the
website only ever talks to the API.

## 1. Install

```bash
cd server
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Open `.env` and fill in:

- **`JWT_SECRET`** — any long random string. Generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- **`ADMIN_PASSPHRASE_HASH`** — don't put a plain passphrase in `.env`. Instead run:
  ```bash
  npm run hash-password -- "the-passphrase-you-want"
  ```
  and paste the printed hash into `.env`. This replaces the old hardcoded
  `PIE-FIX-AUTHOR-2026` passphrase that used to live directly in the website's JS.
- **`CORS_ORIGIN`** — comma-separated list of the exact origins allowed to call this
  API (e.g. `https://piefix.co.za`, plus `http://127.0.0.1:5500` while developing
  locally with a static file server).
- **`SMTP_*` and `BUSINESS_EMAIL`** — your outgoing email provider. For Gmail: host
  `smtp.gmail.com`, port `465`, `SMTP_SECURE=true`, `SMTP_USER` = your Gmail
  address, `SMTP_PASS` = a 16-character **App Password** (Google Account → Security
  → 2-Step Verification → App passwords). A normal Gmail password will not work.

## 3. Run

```bash
npm start          # production
npm run dev         # auto-restarts on file changes (Node 18+)
```

The API listens on `http://localhost:4000` by default (`PORT` in `.env`).
Check it's alive: `curl http://localhost:4000/api/health`.

## 4. Point the website at it

In `website/config.js`, set:

```js
window.PIE_FIXE_API = 'http://localhost:4000/api'; // or your deployed API URL
```

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | Basic status check |
| POST | `/api/admin/login` | — | `{ passphrase }` → `{ token }` |
| GET | `/api/posts` | — | Published posts (public blog) |
| GET | `/api/posts?all=true` | Bearer token | All posts incl. drafts (admin list) |
| GET | `/api/posts/:slug` | — | Single published post |
| POST | `/api/posts` | Bearer token | Create a post (multipart form, optional `image`) |
| PUT | `/api/posts/:id` | Bearer token | Edit a post |
| DELETE | `/api/posts/:id` | Bearer token | Delete a post |
| POST | `/api/enquiries` | — | Submit an enquiry → saved + emailed |
| GET | `/api/enquiries` | Bearer token | Review past enquiries |

The admin workspace authenticates with a secure, `HttpOnly` cookie. The JWT is
never returned to or stored by website JavaScript. Browser requests must include
credentials, as the admin workspace does automatically after sign-in.

## Deploying

This is a plain Node/Express app, so it runs on Render, Railway, Fly.io, a small
VPS, etc. Whatever you choose:

- Set all the `.env` values as environment variables on the host.
- Make sure `data/` and `uploads/` are on **persistent** storage (some platforms
  wipe the filesystem on redeploy — use a mounted volume, or migrate to a database
  later if you outgrow JSON files).
- Update `website/config.js` to the deployed API URL, and `CORS_ORIGIN` in the
  server env to your live website domain.

## Pie Fixe GitHub Pages frontend

The corresponding static website is now in the repository root. GitHub Pages hosts the frontend only; deploy this `server/` directory separately on a Node-compatible host and keep its environment variables private.
