#!/usr/bin/env node
// Reads every Markdown file in data/, writes docs/data/index.json, and generates
// one static page per entry under docs/procedures/<slug>.html.
// No dependencies on purpose, the dataset is small enough that hand-rolled
// parsing and templating are fine.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { iconFor } from "./icons.mjs";
import { specIconFor } from "./spec-icons.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const docsDir = join(__dirname, "..", "docs");
const outPath = join(docsDir, "data", "index.json");
const pagesDir = join(docsDir, "procedures");

function listMd(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

function slugify(filename) {
  return filename.replace(/\.md$/, "");
}

// --- Markdown parsing -------------------------------------------------

function parseReferenceMd(text) {
  const lines = text.trim().split("\n");
  const titleLine = lines.find((l) => l.startsWith("# ")) || lines[0] || "";
  const title = titleLine.replace(/^#\s*/, "").trim();
  const body = lines.filter((l) => l !== titleLine).join("\n").trim();
  return { title, body };
}

function parseProcedureMd(text) {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled procedure";

  const sections = {};
  const sectionRegex = /^##\s+(.+)$/gm;
  const matches = [...text.matchAll(sectionRegex)];
  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1].trim().toLowerCase().replace(/\s+/g, "_");
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections[key] = text.slice(start, end).trim();
  }
  return { title, sections };
}

// --- HTML rendering (server-side, same safety rules as docs/app.js) ---

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// pathPrefix: generated pages live one level deeper than the source data
// (docs/procedures/*.html vs docs/*.md-derived paths), so a plain relative
// image path like "images/x.jpg" needs "../" prepended to resolve correctly.
function renderMarkdownLine(line, pathPrefix = "") {
  // (!)? distinguishes an image (![alt](src)) from a plain link ([text](url)).
  const linkRegex = /(!)?\[([^\]]*)\]\(([^)\s]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = linkRegex.exec(line)) !== null) {
    if (m.index > lastIndex) parts.push({ type: "text", value: line.slice(lastIndex, m.index) });
    parts.push({ type: m[1] ? "image" : "link", label: m[2], target: m[3] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) parts.push({ type: "text", value: line.slice(lastIndex) });

  return parts
    .map((p) => {
      if (p.type === "image") {
        const isRelative = /^[\w-]+\//.test(p.target);
        const isSafe = /^(https?:|\.\.?\/|[\w-]+\/)/.test(p.target);
        const safeSrc = !isSafe ? "#" : isRelative ? pathPrefix + p.target : p.target;
        return `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(p.label)}" loading="lazy" style="max-width:100%;border-radius:8px;border:1px solid var(--border)" />`;
      }
      if (p.type === "link") {
        const safeHref = /^https?:/.test(p.target) ? p.target : "#";
        return `<a href="${escapeAttr(safeHref)}" target="_blank" rel="noopener">${escapeHtml(p.label)}</a>`;
      }
      return escapeHtml(p.value).replace(/\*([^*]+)\*/g, "<em>$1</em>");
    })
    .join("");
}

function renderNumberedList(text) {
  const steps = text.split(/\d+\.\s/).map((s) => s.trim()).filter(Boolean);
  if (steps.length < 2) return `<p>${escapeHtml(text)}</p>`;
  return `<ol>${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
}

function renderSteps(stepsText) {
  if (!stepsText) return "";
  if (stepsText.includes("### ")) {
    const parts = stepsText.split(/^###\s+(.+)$/m);
    let html = "";
    for (let i = 1; i < parts.length; i += 2) {
      html += `<p class="stage-title">${escapeHtml(parts[i].trim())}</p>${renderNumberedList(parts[i + 1] || "")}`;
    }
    return html;
  }
  return renderNumberedList(stepsText);
}

function pageShell({ title, description, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
  <title>${escapeHtml(title)} — BMW Repair Workshop</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
  <link rel="stylesheet" href="../style.css" />
</head>
<body>
  <header class="nav">
    <div class="nav-left">
      <div class="nav-brand">
        <span class="brand-mark">◉</span>
        <span>BMW Repair Workshop</span>
      </div>
      <ul class="nav-menu">
        <li><a href="../index.html"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>Home</a></li>
        <li><a href="../index.html#category-grid"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Browse</a></li>
        <li><a href="https://github.com/GeorgievAlex/bmw-repair-assistant" target="_blank" rel="noopener"><svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.27 9.27 0 015.01 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0022 12.26C22 6.58 17.52 2 12 2z"/></svg>GitHub</a></li>
      </ul>
    </div>
    <div class="nav-sub">E90 325i · N52B25</div>
  </header>
  <main>
    ${bodyHtml}
    <a class="back-link" href="../index.html">&larr; back to all procedures</a>
  </main>
  <footer class="site-footer">
    <p>Built for Hacktoberfest's "Build for a Friend" weekend challenge. Data written for this
    project from general knowledge or sourced directly from an owner's own experience, not
    scraped from any manual.</p>
  </footer>
</body>
</html>
`;
}

function renderSpecTable(entry) {
  const rows = [
    ["Torque", entry.torque_specs],
    ["Parts", entry.part_numbers],
    ["Tools", entry.tools_needed],
    ["Time", entry.time_estimate],
    ["Difficulty", entry.difficulty],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<table class="spec-table">${rows
    .map(([label, value]) => `<tr><th>${specIconFor(label)}${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</table>`;
}

function renderProcedurePage(entry) {
  const icon = iconFor(entry.category);

  const body = `
    <section class="procedure-banner">
      ${icon.svg}
      <div>
        <p class="cat-label">${escapeHtml(entry.category)} · ${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)}</p>
        <h1 style="margin:4px 0 0">${escapeHtml(entry.procedure_name)}</h1>
      </div>
    </section>
    <section style="padding: 24px 20px; max-width: 880px; margin: 0 auto;">
      <p>${escapeHtml(entry.summary)}</p>
      <div class="result-card">
        ${renderSpecTable(entry)}
        ${entry.steps ? `<p class="section-title">Steps</p>${renderSteps(entry.steps)}` : ""}
        ${entry.notes_warnings ? `<p class="section-title">Notes</p><p class="warning">${escapeHtml(entry.notes_warnings)}</p>` : ""}
        <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
      </div>
    </section>
  `;
  return pageShell({ title: entry.procedure_name, description: entry.summary, bodyHtml: body });
}

function renderReferencePage(entry) {
  const icon = iconFor(entry.category);
  const paragraphs = entry.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const body = `
    <section class="procedure-banner">
      ${icon.svg}
      <div>
        <p class="cat-label">${escapeHtml(entry.category)} · ${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)}</p>
        <h1 style="margin:4px 0 0">${escapeHtml(entry.procedure_name)}</h1>
      </div>
    </section>
    <section style="padding: 24px 20px; max-width: 880px; margin: 0 auto;">
      <div class="result-card">
        ${paragraphs.map((p) => `<p>${renderMarkdownLine(p, "../")}</p>`).join("")}
        <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
      </div>
    </section>
  `;
  return pageShell({ title: entry.procedure_name, description: entry.procedure_name, bodyHtml: body });
}

// --- Build ---------------------------------------------------------------

let entries = [];
let id = 0;
mkdirSync(pagesDir, { recursive: true });

for (const file of listMd(join(dataDir, "general"))) {
  const text = readFileSync(join(dataDir, "general", file), "utf8");
  const { title, body } = parseReferenceMd(text);
  const slug = slugify(file);
  const entry = {
    id: id++,
    type: "reference",
    slug,
    source_file: `general/${file}`,
    procedure_name: title,
    chassis: "E90",
    engine_code: "N52B25",
    category: "General",
    body,
    source: "written for this project, not extracted from any manual",
  };
  entry.search_text = `${title} ${body}`.toLowerCase();
  entries.push(entry);
  writeFileSync(join(pagesDir, `${slug}.html`), renderReferencePage(entry));
}

for (const file of listMd(join(dataDir, "procedures"))) {
  const text = readFileSync(join(dataDir, "procedures", file), "utf8");
  const { title, sections } = parseProcedureMd(text);
  const get = (k) => sections[k] || "";
  const slug = slugify(file);

  const entry = {
    id: id++,
    type: "procedure",
    slug,
    source_file: `procedures/${file}`,
    procedure_name: title,
    chassis: "E90",
    engine_code: "N52B25",
    category: get("category") || "General",
    summary: get("summary"),
    steps: get("steps"),
    torque_specs: get("torque_specs"),
    part_numbers: get("part_numbers"),
    tools_needed: get("tools"),
    difficulty: get("difficulty"),
    time_estimate: get("time_estimate"),
    notes_warnings: get("notes"),
    source: get("source"),
  };
  entry.search_text = Object.values(entry)
    .filter((v) => typeof v === "string")
    .join(" ")
    .toLowerCase();
  entries.push(entry);
  writeFileSync(join(pagesDir, `${slug}.html`), renderProcedurePage(entry));
}

writeFileSync(outPath, JSON.stringify({ built_at: new Date().toISOString(), entries }, null, 2));
console.log(`Wrote ${entries.length} entries to ${outPath}`);
console.log(`Generated ${entries.length} pages in ${pagesDir}`);
