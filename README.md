# Cadence — AI Music Studio (MVP)

A minimal Next.js frontend where an end user describes a song and gets AI-generated
tracks back, powered by the [Suno API](https://docs.sunoapi.org/). No database.

## How it works (architecture)

```
Browser (form)  ──▶  /api/generate  ──▶  Suno /generate         → taskId
Browser (poll)  ──▶  /api/status    ──▶  Suno /generate/record-info → status + 2 tracks
```

- The **Suno API key is used only server-side** in the `app/api/*` route handlers.
  It is **never** sent to the browser (no `NEXT_PUBLIC_` prefix), so it can't leak
  from the client.
- Generation is asynchronous. We **poll** `record-info` every 5s (no callbacks, no DB).
  Streaming audio appears in ~30–40s; full downloadable MP3s in ~2–3 min. Each request
  returns **2 songs**.

## Local development

> Requires Node.js 18.18+ (this repo builds fine on Netlify's cloud even if you don't
> have Node locally).

```bash
npm install
# .env already contains the key for local dev (it is gitignored)
npm run dev
# open http://localhost:3000
```

## Environment variables

| Name | Purpose |
|------|---------|
| `SUNO_API_KEY` | Your sunoapi.org key. **Server-side only.** |
| `SUNO_CALLBACK_URL` | Required by the Suno API; unused since we poll. A placeholder is fine. |

Local values live in `.env` (gitignored). See `.env.example`.

## Deploy to Netlify

1. Push this repo to GitHub (see below).
2. In Netlify: **Add new site → Import from Git →** pick the repo.
3. Netlify auto-detects Next.js. Build command `npm run build`, publish `.next`
   (already set in `netlify.toml`).
4. **⚠️ Set the environment variable in Netlify** — the `.env` file is NOT committed,
   so the deployed site won't have the key until you add it:
   **Site configuration → Environment variables →** add
   `SUNO_API_KEY = 87f56749c88278478e7a67dcfeaba273`
   (and optionally `SUNO_CALLBACK_URL`). Then **redeploy**.

## Push to GitHub

```bash
git init            # (already done)
git add -A
git commit -m "Cadence music MVP"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Security notes

- The API key was shared in chat; treat it as sensitive. You can rotate it anytime at
  https://sunoapi.org/api-key and update `.env` + Netlify.
- `.env` is gitignored — verify it is **not** in `git status` before pushing.
