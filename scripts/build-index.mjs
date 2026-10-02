#!/usr/bin/env node
// Reads every CSV/Markdown file in data/, turns each into a search entry, writes docs/data/index.json.
// No dependencies on purpose, the dataset is small enough that a hand-rolled CSV parser is fine.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const outPath = join(__dirname, "..", "docs", "data", "index.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = (r[i] || "").trim()));
    return obj;
  });
}

function parseMarkdown(text) {
  const lines = text.trim().split("\n");
  const titleLine = lines.find((l) => l.startsWith("# ")) || lines[0] || "";
  const title = titleLine.replace(/^#\s*/, "").trim();
  const body = lines.filter((l) => l !== titleLine).join("\n").trim();
  const firstParagraph = body.split(/\n\s*\n/)[0] || "";
  return { title, body, summary: firstParagraph };
}

const csvFiles = readdirSync(dataDir).filter((f) => f.endsWith(".csv"));
let entries = [];
let id = 0;

const generalDir = join(dataDir, "general");
let mdFiles = [];
try {
  mdFiles = readdirSync(generalDir).filter((f) => f.endsWith(".md"));
} catch {
  // no general/ folder yet, that's fine
}

for (const file of mdFiles) {
  const text = readFileSync(join(generalDir, file), "utf8");
  const { title, body, summary } = parseMarkdown(text);
  entries.push({
    id: id++,
    type: "reference",
    source_file: `general/${file}`,
    procedure_name: title,
    chassis: "E90",
    engine_code: "N52B25",
    category: "General",
    summary,
    body,
    steps: "",
    torque_specs: "",
    part_numbers: "",
    tools_needed: "",
    difficulty: "",
    time_estimate: "",
    notes_warnings: "",
    source: "written for this project, not extracted from any manual",
    search_text: `${title} ${body}`.toLowerCase(),
  });
}

for (const file of csvFiles) {
  const text = readFileSync(join(dataDir, file), "utf8");
  const rows = csvToObjects(text);
  for (const row of rows) {
    const searchText = [
      row.procedure_name,
      row.category,
      row.chassis,
      row.engine_code,
      row.summary,
      row.steps,
      row.torque_specs,
      row.part_numbers,
      row.notes_warnings,
    ]
      .join(" ")
      .toLowerCase();

    entries.push({
      id: id++,
      type: "procedure",
      source_file: file,
      procedure_name: row.procedure_name,
      chassis: row.chassis,
      engine_code: row.engine_code,
      category: row.category,
      summary: row.summary,
      steps: row.steps,
      torque_specs: row.torque_specs,
      part_numbers: row.part_numbers,
      tools_needed: row.tools_needed,
      difficulty: row.difficulty,
      time_estimate: row.time_estimate,
      notes_warnings: row.notes_warnings,
      source: row.source,
      search_text: searchText,
    });
  }
}

writeFileSync(outPath, JSON.stringify({ built_at: new Date().toISOString(), entries }, null, 2));
console.log(`Wrote ${entries.length} entries from ${csvFiles.length} CSV file(s) to ${outPath}`);
