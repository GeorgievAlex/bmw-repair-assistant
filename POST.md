---
title: "I couldn't legally use the repair manual, so I built my friend something better"
published: false
tags: devchallenge, weekendchallenge, hf26challenge, ai
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

My friend repairs his own BMW E90 325i. Not professionally, not as a hobby exactly, just the way someone does when they'd rather understand their car than hand it to someone who won't explain it back.

Watching him work, the actual bottleneck is never the wrench. It's that the information is scattered. A torque spec lives in a forum post from 2013. A part number lives in a different tab. Half the "guides" are a video where someone talks for four minutes before touching the car. He's lying under a car on jack stands with dirty hands trying to pinch-zoom a phone screen.

So I built him **[BMW Repair Workshop](https://georgievalex.github.io/bmw-repair-assistant/)**: a fast, mobile-first reference for his exact car. Twenty repair procedures, seven reference guides, every torque value and part number laid out in a table instead of buried in prose. And an Ask box where he can describe a problem in his own words and get an answer built only from those procedures.

The interesting part isn't the site. It's what I wasn't allowed to build.

## The constraint that shaped everything

My first plan was obvious: feed the service manual into a RAG pipeline and let an agent answer questions from it.

That plan died about an hour in. The real BMW service documentation (Bentley's manual, BMW's own TIS system) is commercial, copyrighted, and sold for money. It's also mirrored absolutely everywhere, a chapter-split copy is one search away, and there are entire sites dedicated to serving it for free.

Wide availability isn't permission. So I didn't use any of it. Not the PDFs, not the mirrors, not "just extracting the facts" from them, which is the same thing wearing a different hat.

That left me with a harder problem and, it turns out, a better project.

**Where the content actually came from:**

- Procedures and specs written from general public automotive knowledge, with a handful of figures cross-checked against publicly published sources (owner forums, retailer install guides)
- Every single entry states its own provenance in a Source field, visible on the page
- Every torque figure and part number carries an explicit "verify this against RealOEM or your dealer" caveat, because I am not a mechanic and these came from general knowledge, not from his car's documentation

That last point matters more than it sounds. A repair reference that quietly presents an unverified number as fact is worse than no reference, because someone torques a bolt to it.

## Demo

**Live:** https://georgievalex.github.io/bmw-repair-assistant/

Try the Ask box with something vague, the way you'd actually say it:

- *"my coolant keeps disappearing but there is no puddle"*
- *"clunk from the front over bumps, what should I check first"*
- *"how do I rebuild the automatic transmission?"* ← watch it refuse

## Code

{% embed https://github.com/GeorgievAlex/bmw-repair-assistant %}

## How I Built It

**Open-source AI at the core:** [Gemma](https://deepmind.google/models/gemma/) (`gemma-4-31B-it`), an open-weight model, served through DigitalOcean Serverless Inference.

**Architecture, deliberately boring:**

```
browser → GitHub Pages (static site, no backend)
            ↓ POST { question }
          Cloudflare Worker  ← holds the model access key
            ↓
          DigitalOcean Serverless Inference → Gemma
```

The site is 100% static. Content lives as Markdown in the repo, a dependency-free Node script compiles it into a search index plus one static HTML page per procedure. Search runs client-side. There is no database, no framework, no build toolchain.

**The design decision I'm happiest with: there is no RAG pipeline.**

I started to build one, then measured the corpus. The entire knowledge base is about 11,000 tokens. That fits in a single prompt with room to spare.

So every question sends *all twenty-seven entries* to the model. No embeddings, no vector store, no chunking, no retrieval step that can silently fetch the wrong chunk and answer confidently from it. The model sees the complete corpus every time.

This is faster to build, free of an entire category of bug, *and* more accurate than chunked retrieval at this scale. Costs about $0.002 per question. The reflex to reach for a vector database is strong, and measuring first saved me from it.

**Keeping it honest.** The system prompt does real work here:

- Answer only from the provided entries
- Never invent a torque value, part number, or step
- Carry each entry's verification caveats through into the answer
- Keep safety warnings (spring compressors, hot cooling systems, torquing bushings at ride height) rather than trimming them for brevity
- Name the procedure the answer came from

Asked to rebuild an automatic transmission, it says it has no such procedure and points at the nearest relevant entry. That refusal is the single most important behaviour in the whole project.

## Why Does Open Innovation Matter?

Four reasons, in increasing order of how much I actually believe them.

**It's cheap.** $0.002 a question. The whole thing runs on free static hosting with a free worker in front of an open-weight model. A closed frontier model would work too, and cost more for a job that doesn't need it.

**Model choice is a swap, not a migration.** Gemma is one line of config. If something better ships, or Gemma gets cheaper elsewhere, I change a string. Nothing else in the project knows or cares which model answers.

**It's inspectable.** When the model does something strange, I can read the entire input that produced it: 27 Markdown files in a public repo and a system prompt in a 160-line worker. No hidden retrieval step deciding what the model sees. For something that tells people how tight to torque a brake caliper, I want to be able to explain any answer it gives.

**And the one that actually drove the project:** the open approach was the only one I could build honestly.

The closed path here isn't a proprietary model. It's the proprietary *manual*, and the ecosystem of unauthorised mirrors around it. Those mirrors work right up until they don't. They vanish, they get taken down, they're of unknown provenance, and nothing in them tells you where a number came from.

What I built instead is small, honest about its limits, and entirely inspectable. Every entry says where it came from. Every number says to verify it. The model can only speak from content that's sitting in a public repo with its sources stated.

That's a worse product than BMW's actual service manual. It's a far better one than a pirated copy, because you can see exactly what you're trusting.

## What I got wrong on the way

**I guessed a model ID.** `gemma-4` seemed reasonable. The real one is `gemma-4-31B-it`, and a wrong ID fails as a bare `404` from the inference API, nothing that says "check your config." Twenty minutes gone.

**I wrote an XSS bug into the answer renderer.** My escaping helper used the `textContent` → `innerHTML` trick, which escapes `<`, `>`, `&` but *not* quote characters, because quotes aren't special in text nodes. I then dropped that "escaped" output straight into an `alt="..."` attribute. One stray `"` in a caption, even my own typo, would have broken out of the attribute. Fixed with proper attribute-context escaping.

**I told my friend CORS would protect the API budget.** It won't. CORS is enforced by browsers, so it stops another *website* calling the worker from page JavaScript, and does precisely nothing against `curl`. Rate limiting and a capped prepaid balance are the actual controls.

**I shipped reference pages that rendered `## Heading` as literal text** for a day, because my first reference docs were plain prose and never exercised the heading path.

## What I didn't do

No VIN decoding yet, so the site can't narrow specs to an exact build, which matters on a chassis spanning several engine variants. No photos of the actual parts, because the only correctly-licensed one I found was a single public-domain engine shot, and a generic stock photo of *someone else's* brake caliper on a BMW brake page is the kind of small dishonesty this project is supposed to avoid. No testing against a second chassis, though the data structure already carries chassis and engine code per entry so adding one is content work, not a rewrite.

And the big one: **every technical figure on that site needs a mechanic's eye.** The provenance lines say so plainly. Which brings me to the only part of this I couldn't do myself.

## Handing it over

I sent it to him while he was at the garage, with four questions. The most important was the first: *is anything on here actually wrong?*

He went through the jobs he's done himself and nothing contradicted what he knows. I want to be precise about what that is and isn't: it's a working mechanic reading it and nothing jumping out, which is genuine signal. It is not a line-by-line audit against documentation. Those caveats on every number stay exactly where they are.

On the AI, he was more measured than I expected, in a way I liked:

> "The answers it gives are valid, you still need to check them of course, like diagnosis and etc"

He arrived at the project's own position without being told it. That's about the best outcome available for a tool like this: it was useful, and it didn't make him credulous.

Then he corrected an assumption I'd built the whole input design around. I'd been thinking about voice input, on the theory that dirty hands and phone screens don't mix. He doesn't want it:

> "I always prefer text as long answers can be quickly forgotten and I work with gloves so taking them off to ask is not a problem"

Two things I hadn't considered. Gloves come off anyway. And more interesting: a spoken answer *evaporates*, while text stays on screen while you're under the car with your hands busy. The persistence is the feature. I'd have built the wrong thing.

On the look, which I'd worried was too plain:

> "I like the idea it looks simple and old style - no weird images, adds and stuff"

And the one real feature request, which he raised and then talked himself out of:

> "Perhaps it misses like video tutorial itself but this is not possible I guess, like to search in youtube if someone performed this repair on my car/engine"

It is possible, just not the way he assumed. I can't host or embed video. But I can hand off a search already narrowed to his exact chassis and engine, so he gets `BMW E90 N52B25 brake pads and rotors change` rather than generic results for a different car. Every procedure now has a "See it done" link doing that. It shipped before I finished writing this post.

He also asked for exhaust and gearbox procedures. Exhaust is a straightforward driveway job and it's added. The gearbox I partly declined: the card covers fluid and pan service, and then says plainly that internal rebuild is a specialist bench job with no honest driveway version. Writing a rebuild procedure from general knowledge, for a job where a wrong clearance is a destroyed transmission, is exactly the failure mode this whole project was built to avoid. Saying "this isn't something I should write" is part of the same discipline as the model refusing the same question.

The line I didn't expect:

> "You're my go to AI guy and also good mechanic yourself so I would love if you can work on this in the future so me, you and other petrol heads can use it"

I'm not a good mechanic. I just wrote down what I could verify and was careful about what I couldn't. But "so me, you and other petrol heads can use it" is a better description of why this is worth continuing than anything in my own notes.

### What his feedback actually changed

All of this is live on the site now, shipped between his message and this post going up:

| He said | What changed |
|---|---|
| Wanted to find video of the job on *his* engine, assumed impossible | Every procedure has a "See it done" link, a search pre-narrowed to `BMW E90 N52B25 <job>` |
| Asked for an exhaust procedure | Added, full job |
| Asked to "dissamble the gearbox" | Added fluid and pan service; internal rebuild explicitly declined as a specialist bench job |
| Prefers text over voice, with reasons | Voice input dropped from the roadmap entirely |

That last row is the one I'd have got wrong on my own. The feature I was about to build is the feature he actively didn't want, and I'd never have found that out by thinking harder about it.

He had one more request, which I'm not going to be able to ship:

> "it will be good if the site can handle those repairs and changes for myself but AI is not there yet :D"

Correct on both counts. And I think that joke is a decent summary of where this sits. The useful version of AI here isn't the one that does the job. It's the one that tells him the caliper guide bolts are 30 Nm, points at the procedure it got that from, reminds him to check it, and then gets out of the way while he does the work he already knows how to do.

## Prize Categories

**Best Use of DigitalOcean** — Serverless Inference runs the Gemma model behind the Ask feature.

**Best Use of Gemma** — `gemma-4-31B-it` is the open-weight model doing the reasoning, constrained to the site's own content.
