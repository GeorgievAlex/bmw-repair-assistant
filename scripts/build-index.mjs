#!/usr/bin/env node
// Reads every Markdown file in data/, turns each into a search entry, writes docs/data/index.json.
// No dependencies on purpose, the dataset is small enough that hand-rolled parsing is fine.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const outPath = join(__dirname, "..", "docs", "data", "index.json");

function listMd(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

// Plain reference docs: a leading "# Title" then prose. No "## " sections expected.
function parseReferenceMd(text) {
  const lines = text.trim().split("\n");
  const titleLine = lines.find((l) => l.startsWith("# ")) || lines[0] || "";
  const title = titleLine.replace(/^#\s*/, "").trim();
  const body = lines.filter((l) => l !== titleLine).join("\n").trim();
  return { title, body };
}

// Structured procedure docs: "# Title" then "## Section" blocks.
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

let entries = [];
let id = 0;

for (const file of listMd(join(dataDir, "general"))) {
  const text = readFileSync(join(dataDir, "general", file), "utf8");
  const { title, body } = parseReferenceMd(text);
  entries.push({
    id: id++,
    type: "reference",
    source_file: `general/${file}`,
    procedure_name: title,
    chassis: "E90",
    engine_code: "N52B25",
    category: "General",
    body,
    source: "written for this project, not extracted from any manual",
    search_text: `${title} ${body}`.toLowerCase(),
  });
}

for (const file of listMd(join(dataDir, "procedures"))) {
  const text = readFileSync(join(dataDir, "procedures", file), "utf8");
  const { title, sections } = parseProcedureMd(text);
  const get = (k) => sections[k] || "";

  const entry = {
    id: id++,
    type: "procedure",
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
}

writeFileSync(outPath, JSON.stringify({ built_at: new Date().toISOString(), entries }, null, 2));
console.log(`Wrote ${entries.length} entries to ${outPath}`);
