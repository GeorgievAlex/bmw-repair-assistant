# BMW Repair Assistant

A repair reference built to help BMW owners find the right torque spec, part number, and procedure for a job, instead of digging through forum threads. Started as a project for a friend who repairs his own E90 325i (N52B25), structured from the start so other chassis and engines can be added the same way.

Static site, no backend, no AI (yet). All content is either written for this project from general public automotive knowledge, or comes directly from an actual owner's hands-on experience, nothing is extracted from any copyrighted service manual or PDF. See `data/*/` for how each entry is sourced, every file states it plainly.

## Current coverage

E90 325i (N52B25) only, for now. The data structure doesn't assume a single model, each procedure file already declares its own chassis and engine code, so adding another BMW (a different E9X variant, a different generation) means adding more files under `data/procedures/`, not restructuring anything.

## Structure

```
data/
  general/               # prose reference docs (chassis/engine overview), written for this project
  procedures/            # one Markdown file per repair job, structured sections (see below)

scripts/
  build-index.mjs        # reads data/, writes docs/data/index.json

docs/
  index.html, style.css, app.js  # static frontend, client-side keyword search over index.json
  images/                 # photos used in reference docs, each one's license noted at point of use
  data/index.json         # generated, do not edit by hand
```

`docs/` is served directly by GitHub Pages, no build action needed, just run the index builder locally and commit the result.

### Procedure file format

Each file in `data/procedures/` is a Markdown file with a `# Title` and `##` sections: `Summary`, `Steps`, `Torque Specs`, `Part Numbers`, `Tools`, `Difficulty`, `Time Estimate`, `Notes`, `Source`. The build script parses these sections directly, see `scripts/build-index.mjs` if you're adding a new procedure and want to match the expected shape.

## Building the index

```
node scripts/build-index.mjs
```

Re-run this any time a file in `data/` changes, then commit the updated `docs/data/index.json`.

## Running locally

```
cd docs && python3 -m http.server 8000
```

## Status

- [x] Structured data pipeline (Markdown -> index.json)
- [x] Client-side keyword search
- [x] Static frontend
- [x] 10 core E90 325i (N52B25) procedures
- [ ] Real-world verification from an actual E9X mechanic (in progress)
- [ ] AI-assisted answers (deferred, needs its own data-source decision, see project discussion)
- [ ] VIN decode (deferred)
- [ ] Additional BMW models/chassis (structure supports it, content doesn't exist yet)
