# Ask worker

A single Cloudflare Worker that sits between the static site and DigitalOcean
Serverless Inference. Its only job is to hold the model access key, which can't
live in the browser and can't live on GitHub Pages (no server-side execution).

```
browser → georgievalex.github.io (static)
            ↓ POST /  { question }
          <worker>.workers.dev      ← holds DO_INFERENCE_KEY
            ↓
          inference.do-ai.run  (Gemma, open-weight)
```

## Deploying

From this directory:

```bash
npx wrangler login
npx wrangler secret put DO_INFERENCE_KEY   # paste your model access key when prompted
npx wrangler deploy
```

`wrangler secret put` prompts for the value and stores it encrypted with
Cloudflare. It never gets written to this repo.

Get a model access key from the DigitalOcean Control Panel under Inference →
model access keys. Scope it to just the model you're using.

After deploying, wrangler prints the worker URL. Put that URL in
`docs/app.js` as `ASK_WORKER_URL`, then rebuild and commit.

## Checking the model id

`MODEL` in `wrangler.toml` must match a real serverless inference model id.
Confirm yours with:

```bash
curl -s https://inference.do-ai.run/v1/models \
  -H "Authorization: Bearer $YOUR_KEY" | python3 -m json.tool | grep '"id"'
```

## Cost and limits

The whole corpus (~11k tokens) goes into every request, so each question costs
roughly $0.002 at Gemma's rate. Cloudflare's free tier covers 100k worker
requests/day, far more than this will ever use.

The worker caps questions at 500 characters and only accepts requests from the
origin set in `ALLOWED_ORIGIN`, so a random site can't point at it and burn
through your inference balance.
