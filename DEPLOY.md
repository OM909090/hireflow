# Deploying HireFlow

The repo is a single git repo at the project root. On Vercel, set the
**Root Directory to `web`**.

## Model access (required for the AI Interview Agent)

The screening run is bundled at `web/src/data/run.json` (real, verified model
output), so the pages render without any model. The **AI Interview Agent** is
live, though: it calls the model server-side through `src/app/api/agent/*`, so it
needs these environment variables wherever you deploy.

| Variable | Purpose |
| --- | --- |
| `HIREFLOW_API_KEY` | Key for the chat/completions endpoint (server-side only). |
| `HIREFLOW_BASE_URL` | OpenAI-compatible base URL, e.g. `https://api.example.com/v1`. |
| `HIREFLOW_MODEL` | Model id, e.g. `opencode/muse-spark-1.3-contributor-free`. |

See `web/.env.example`. Locally, copy it to `web/.env.local`.

**Important for hosted deploys:** a `127.0.0.1` endpoint is only reachable from
your own machine. To run the agent on Vercel, point `HIREFLOW_BASE_URL` at an
endpoint reachable from the internet. Without these vars the pages still work and
the agent panel reports "no model configured" instead of pretending to verify.

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
