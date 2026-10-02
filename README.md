# E9X Garage

A repair reference for the BMW E90 325i (N52B25), built for a friend who actually works on these cars.

Static site, no backend, no AI (yet). All content is either written for this project from general public automotive knowledge, or comes directly from the friend's own hands-on experience, nothing is extracted from any copyrighted service manual or PDF.

## Structure

```
data/
  general/              # prose reference docs (chassis/engine overview), written for this project
  general-reference.csv # procedures from general public knowledge (serpentine belt, alternator, radiator)
  repair-template.csv   # procedures from the friend's own notes
  INSTRUCTIONS_FOR_FRIEND.md

scripts/
  build-index.mjs        # reads data/, writes docs/data/index.json

docs/
  index.html, style.css, app.js  # static frontend, client-side keyword search over index.json
  data/index.json         # generated, do not edit by hand
```

`docs/` is served directly by GitHub Pages, no build action needed, just run the index builder locally and commit the result.

## Building the index

```
node scripts/build-index.mjs
```

Re-run this any time a CSV or Markdown file in `data/` changes, then commit the updated `docs/data/index.json`.

## Running locally

```
cd docs && python3 -m http.server 8000
```

## Status

- [x] Structured data pipeline (CSV + Markdown -> index.json)
- [x] Client-side keyword search
- [x] Static frontend
- [ ] Friend's full set of procedures (waiting on his input)
- [ ] AI-assisted answers (deferred, see discussion in project history, needs its own data-source decision)
- [ ] VIN decode (deferred)
