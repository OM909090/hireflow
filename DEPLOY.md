# Deploying HireFlow

The web app is a static Next.js build. It has **no runtime dependency** on the
LLM proxy — the screening run is bundled at `web/src/data/run.json` (real model
output, verified). So it deploys anywhere with zero environment variables.

The repo is a single git repo at the project root. On Vercel, set the
**Root Directory to `web`**.

---

## Option A — Vercel dashboard (no CLI, recommended)

1. Push this repo to GitHub:
   ```bash
   # create an empty repo on github.com first, then:
   git remote add origin https://github.com/<you>/hireflow.git
   git branch -M main
   git push -u origin main
   ```
2. On vercel.com → **Add New → Project → Import** the repo.
3. **Set Root Directory to `web`.** Framework auto-detects as Next.js.
4. Deploy. No environment variables are required.

Optional: set `NEXT_PUBLIC_SITE_URL` to the final domain so Open Graph image
URLs are absolute to the right host. Not required for the site to work.

## Option B — Vercel CLI

```bash
cd web
npx vercel login      # interactive: email / GitHub
npx vercel --prod     # first run asks a few setup questions, then deploys
```

## Option C — token (hands-off)

Create a token at vercel.com → Account Settings → Tokens, then:
```bash
cd web
npx vercel --prod --yes --token=YOUR_TOKEN
```

---

## Notes

- **Secret safety:** `api/.env` (the API key) is gitignored and was verified
  absent from the commit. Never deploy the `api/` folder to a public host with
  the key in it.
- **The deployed site does not call the model.** That is deliberate: the proxy
  is localhost-only and each call takes ~30 s. The site replays the recorded run
  and the "Run screening" animation streams that real trace. To regenerate the
  data: `cd api && uv run python -m hireflow.run`, then redeploy.
- **Build command:** `next build` · **Output:** static + SSG · **Node:** 18+.
