// Cloudflare Worker: tiny proxy between the static GitHub Pages site and
// DigitalOcean Serverless Inference. Exists only so the model access key never
// reaches the browser.
//
// Secrets (set with `npx wrangler secret put <NAME>`, never committed):
//   DO_INFERENCE_KEY - a DigitalOcean model access key
//
// Vars (in wrangler.toml, not secret):
//   CORPUS_URL   - where to fetch the published index.json
//   ALLOWED_ORIGIN - the site origin allowed to call this worker
//   MODEL        - serverless inference model id

const INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions";
const MAX_QUESTION_LENGTH = 500;
const CORPUS_TTL_SECONDS = 300;

let corpusCache = { text: null, fetchedAt: 0 };

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

// Flattens the published index.json into plain text for the prompt. The whole
// corpus is only ~11k tokens, so there's no retrieval step, the model sees
// everything and we avoid a whole embeddings pipeline.
function corpusToText(data) {
  return data.entries
    .map((e) => {
      const lines = [`## ${e.procedure_name}`, `Category: ${e.category} (${e.chassis}, ${e.engine_code})`];
      if (e.summary) lines.push(`Summary: ${e.summary}`);
      if (e.body) lines.push(e.body);
      if (e.torque_specs) lines.push(`Torque specs: ${e.torque_specs}`);
      if (e.part_numbers) lines.push(`Part numbers: ${e.part_numbers}`);
      if (e.tools_needed) lines.push(`Tools: ${e.tools_needed}`);
      if (e.difficulty) lines.push(`Difficulty: ${e.difficulty}`);
      if (e.time_estimate) lines.push(`Time estimate: ${e.time_estimate}`);
      if (e.steps) lines.push(`Steps:\n${e.steps}`);
      if (e.notes_warnings) lines.push(`Notes and warnings: ${e.notes_warnings}`);
      if (e.source) lines.push(`Source of this entry: ${e.source}`);
      lines.push(`Page: ${e.slug}.html`);
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

async function getCorpus(env) {
  const now = Date.now();
  if (corpusCache.text && now - corpusCache.fetchedAt < CORPUS_TTL_SECONDS * 1000) {
    return corpusCache.text;
  }
  const res = await fetch(env.CORPUS_URL, { cf: { cacheTtl: CORPUS_TTL_SECONDS } });
  if (!res.ok) throw new Error(`corpus fetch failed: ${res.status}`);
  const text = corpusToText(await res.json());
  corpusCache = { text, fetchedAt: now };
  return text;
}

const SYSTEM_PROMPT = `You are a repair reference assistant for a BMW E90 325i with the N52B25 engine.

Answer ONLY from the reference entries provided in the user message. These entries are the complete knowledge you have.

Rules:
- If the entries don't cover the question, say so plainly and suggest the closest entry that might help. Never invent a torque value, a part number, or a procedure step.
- When you give a torque value or part number, repeat the entry's own caveats about verifying it. These figures come from general knowledge, not from the owner's specific documentation.
- Name the procedure you're drawing from so the person can open that page and read the full steps.
- Safety-critical warnings in an entry (spring compressors, battery disconnection, hot cooling systems, torquing bushings at ride height) must be carried through into your answer, never dropped for brevity.
- Be direct and practical. This person is working on a car, not reading an essay.`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (request.method !== "POST") {
      return json({ error: "POST a JSON body with a question field" }, 405, env);
    }
    if (!env.DO_INFERENCE_KEY) {
      return json({ error: "worker is missing its DO_INFERENCE_KEY secret" }, 500, env);
    }

    let question;
    try {
      ({ question } = await request.json());
    } catch {
      return json({ error: "body must be valid JSON" }, 400, env);
    }

    if (typeof question !== "string" || !question.trim()) {
      return json({ error: "question must be a non-empty string" }, 400, env);
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return json({ error: `question must be ${MAX_QUESTION_LENGTH} characters or fewer` }, 400, env);
    }

    let corpus;
    try {
      corpus = await getCorpus(env);
    } catch (err) {
      return json({ error: "could not load the reference data" }, 502, env);
    }

    const upstream = await fetch(INFERENCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.DO_INFERENCE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.MODEL,
        max_tokens: 700,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Reference entries:\n\n${corpus}\n\n---\n\nQuestion: ${question.trim()}`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      // Deliberately not forwarding the upstream body, it can echo request
      // details back out. Status alone is enough to debug from the dashboard.
      return json({ error: `inference request failed (${upstream.status})` }, 502, env);
    }

    const result = await upstream.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (!answer) {
      return json({ error: "inference returned no answer" }, 502, env);
    }

    return json({ answer }, 200, env);
  },
};
