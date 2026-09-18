# Going live — coiffeuse-itinerante.ch

The domain currently points at the old host (`195.16.72.22`), which is broken/serving a
stale site — nothing is at risk until the DNS cutover (step 4), and rollback there is
just reverting the DNS records.

## 1. Deploy to Vercel (test URL)

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub
2. Import `GiGi2044/coiffeuse-itinerante` → framework auto-detects Next.js → Deploy
3. In the project → Settings → Environment Variables, add everything from `.env.example`:

   | Variable | Where to get it |
   |---|---|
   | `ADMIN_PASSWORD` | Choose one — this is what Patricia (and you) type in at `/admin` |
   | `ADMIN_SESSION_SECRET` | `openssl rand -hex 24` |
   | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → create a **workspace with a monthly spend cap** (e.g. $5) → API key from that workspace. This is what makes the Assistant tab cost real money — a typical AI-assisted edit is a few cents, but a capped key keeps a mistake or misuse from running up a bill. |
   | `ADMIN_GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens → new token scoped to **only this repo** with **Contents: Read and write** |
   | `ADMIN_REPO` | `GiGi2044/coiffeuse-itinerante` |
   | `ADMIN_VERCEL_TOKEN` | Vercel → Account Settings → Tokens (gates Publish on the preview build) — named with an `ADMIN_` prefix because Vercel reserves the plain `VERCEL_` prefix for its own auto-populated variables and won't accept a custom one there |
   | `ADMIN_VERCEL_PROJECT_ID` | Vercel → project → Settings → General |

4. Redeploy after adding the env vars, then review everything on the `*.vercel.app` URL —
   every section, phone width, the `/admin` login and click-to-edit.

Every `git push` to `main` now deploys automatically (content-only commits skip the
build — see `vercel.json`).

## 2. Admin editor (`/admin`)

Two tabs:

- **Content** (what Patricia uses day to day): click any text on the live page to edit
  it in place, or click a photo to upload a replacement — both save straight to `main`
  and are live within seconds, no rebuild. The Content tab also has a raw-JSON fallback
  for anything not yet wired up as a click-to-edit field.
- **Assistant** (for bigger changes — new sections, layout tweaks, wording rewrites):
  chat with Claude → changes land on a `draft` branch → Vercel builds a preview →
  **Publish** merges to `main`. Nothing goes live until published. Claude cannot touch
  photos here (that's Content-tab only) or anything outside `content/`, `src/`,
  `public/`.

Handing the site to someone else = clone the repo, point the env vars above at their
own repo/keys, done.

## 3. Add the domain in Vercel

Project → Settings → Domains → add `coiffeuse-itinerante.ch` and
`www.coiffeuse-itinerante.ch`. Vercel will show the DNS values it expects (matching
step 4).

## 4. DNS cutover ← the go-live moment

DNS for `coiffeuse-itinerante.ch` is managed on **Swisszonic**. Do this step with
Patricia present — Swisszonic account changes need email confirmation on her address.
In its DNS settings:

- `A` record, host `@` → `76.76.21.21`
- `CNAME` record, host `www` → `cname.vercel-dns.com`

Wait for propagation (minutes to a few hours). Vercel auto-issues SSL once DNS
resolves correctly.

**Rollback:** point the `A`/`CNAME` records back at the old values.

## 5. After cutover

- Check all sections load on https://coiffeuse-itinerante.ch, `www` redirects
- Disable GitHub Pages in the repo settings (Settings → Pages → set source to none) —
  it's not serving anything once DNS points at Vercel, but leaving it configured is
  just confusing
- Sit down with Patricia: log into `/admin` together, have her click-edit a price or
  swap a photo, confirm it's live within seconds — that's the actual deliverable
