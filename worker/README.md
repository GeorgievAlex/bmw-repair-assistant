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

`wrangler secret put` takes the secret's **name** as its argument and prompts
separately for the value. Pass `DO_INFERENCE_KEY`, not the key itself, it's an
easy slip and it fails confusingly: the worker returns a 500 saying the secret
is missing, because the key got stored under the wrong name. Check with
`npx wrangler secret list`, the name column should read `DO_INFERENCE_KEY`.

The value is stored encrypted with Cloudflare and never written to this repo.

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

Each question sends the whole corpus (~11k tokens), so it costs roughly $0.002
at Gemma's rate. Cloudflare's free tier covers 100k worker requests/day, so
Cloudflare itself is not where a bill would come from. The inference is.

### The actual spend ceiling (do this)

DigitalOcean Serverless Inference runs on a **prepaid balance**. When it hits
zero, DigitalOcean suspends inference access rather than continuing to bill.
That makes it a genuine hard ceiling, but only if you set it up deliberately:

1. Fund the **Inference & Agents balance**, not the account prepayment balance.
   The Inference & Agents balance is ring-fenced, only inference and managed
   agents draw from it, so a runaway here can never consume funds intended for
   droplets or databases.
2. **Turn auto-reload off.** It is ON by default on the add-funds page. Left on,
   the balance refills itself and stops being a ceiling at all.
3. Keep the amount small. At $5, the worst realistic case is losing $5 and the
   Ask box going quiet until you choose to top it up.

### What the worker does and does not protect

| Control | What it actually stops |
|---|---|
| `ALLOWED_ORIGIN` CORS header | Another *website* calling this worker from browser JavaScript. It does **not** stop `curl` or any script. CORS is enforced by browsers, not by servers. |
| 500 character question cap | Oversized prompts inflating per-request cost. |
| `max_tokens: 700` | Runaway generation length. |
| Per-IP rate limit (8/min) | One actor draining the balance quickly. Buys you time to notice, doesn't cap the total. |

None of those is a spend ceiling. The prepaid balance is the spend ceiling.
Treat the worker-side limits as what they are: friction that makes abuse slow
and visible rather than instant.

### If you want to go further

Worth considering only if this ever gets real traffic: Cloudflare Turnstile in
front of the endpoint, a shared-secret header the site sends, or moving the
daily cap into a KV counter so there's a true per-day request ceiling rather
than a per-IP-per-minute one.
