// Mirrors scripts/icons.mjs. Duplicated here because this is a plain static
// site with no build/bundle step, pulling in a bundler just to share this
// small object isn't worth it for a dataset this size.
const CATEGORY_ICONS = {
  Engine: '<svg class="cat-icon icon-engine" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  Brakes: '<svg class="cat-icon icon-brakes" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
  Electrical: '<svg class="cat-icon icon-electrical" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  Cooling: '<svg class="cat-icon icon-cooling" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3c4 5 7 8.5 7 12a7 7 0 01-14 0c0-3.5 3-7 7-12z"/></svg>',
  Maintenance: '<svg class="cat-icon icon-maintenance" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z"/></svg>',
  Suspension: '<svg class="cat-icon icon-suspension" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14M5 21h14"/><path d="M8 3v2l8 3-8 3 8 3-8 3v2"/></svg>',
  Steering: '<svg class="cat-icon icon-steering" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V3M9.8 13.2l-5.6 3.3M14.2 13.2l5.6 3.3"/></svg>',
  General: '<svg class="cat-icon icon-general" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg>',
};

function iconFor(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.General;
}

// Mirrors scripts/spec-icons.mjs, same duplication reasoning as above.
const SPEC_ICONS = {
  Torque: '<svg class="spec-icon icon-torque" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M7.76 7.76L6.34 6.34M17.66 17.66l-1.42-1.42M7.76 16.24l-1.42 1.42M17.66 6.34l-1.42 1.42"/><circle cx="12" cy="12" r="4"/></svg>',
  Parts: '<svg class="spec-icon icon-parts" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  Tools: '<svg class="spec-icon icon-tools" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z"/></svg>',
  Time: '<svg class="spec-icon icon-time" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  Difficulty: '<svg class="spec-icon icon-difficulty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15a8 8 0 0116 0"/><path d="M12 15l3-4"/><circle cx="12" cy="15" r="1"/></svg>',
};

function specIconFor(label) {
  return SPEC_ICONS[label] || "";
}

let entries = [];

async function loadIndex() {
  const res = await fetch("data/index.json");
  const data = await res.json();
  entries = data.entries;
  renderCategoryGrid();
}

function score(entry, queryWords) {
  let s = 0;
  for (const w of queryWords) {
    if (!w) continue;
    const count = entry.search_text.split(w).length - 1;
    s += count;
  }
  return s;
}

function search(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return entries
    .map((e) => ({ entry: e, s: score(e, words) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5)
    .map((r) => r.entry);
}

function renderNumberedList(text) {
  const steps = text
    .split(/\d+\.\s/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (steps.length < 2) return `<p>${escapeHtml(text)}</p>`;
  return `<ol>${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
}

function renderSteps(stepsText) {
  if (!stepsText) return "";
  // Procedures break their steps into named stages with "### Stage" headers
  // (prep, removal, installation, etc, or unrelated sub-jobs done together).
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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// escapeHtml() above is for *text node* content (via textContent), which does
// not escape quote characters, those only matter inside attribute values. Use
// this one specifically when building an attribute, e.g. alt="...", src="...".
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Minimal, safe markdown line renderer: handles our own authored content only
// (images and italic emphasis). Splits into image matches and plain-text
// segments first, so italic handling only ever runs over escaped plain text,
// never over already-built HTML, and image attributes get attribute-safe
// escaping rather than the text-node escaping used elsewhere on this page.
function renderMarkdownLine(line) {
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
        const safeSrc = /^(https?:|\.\.?\/|[\w-]+\/)/.test(p.target) ? p.target : "#";
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

function renderReferenceCard(entry) {
  const paragraphs = entry.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return `
    <div class="result-card">
      <div class="card-icon-row">${iconFor(entry.category)}<h3 style="margin:0">${escapeHtml(entry.procedure_name)}</h3></div>
      <div class="result-meta">${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)} · ${escapeHtml(entry.category)}</div>
      ${paragraphs.map((p) => `<p>${renderMarkdownLine(p)}</p>`).join("")}
      <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
      <a class="back-link" href="procedures/${escapeAttr(entry.slug)}.html" style="margin-top:12px">View full page &rarr;</a>
    </div>
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

function renderResultCard(entry) {
  if (entry.type === "reference") return renderReferenceCard(entry);
  return `
    <div class="result-card">
      <div class="card-icon-row">${iconFor(entry.category)}<h3 style="margin:0">${escapeHtml(entry.procedure_name)}</h3></div>
      <div class="result-meta">${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)} · ${escapeHtml(entry.category)}</div>
      <p>${escapeHtml(entry.summary)}</p>
      ${renderSpecTable(entry)}
      ${entry.steps ? `<p class="section-title">Steps</p>${renderSteps(entry.steps)}` : ""}
      ${entry.notes_warnings ? `<p class="section-title">Notes</p><p class="warning">${escapeHtml(entry.notes_warnings)}</p>` : ""}
      <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
      <a class="back-link" href="procedures/${escapeAttr(entry.slug)}.html" style="margin-top:12px">View full page &rarr;</a>
    </div>
  `;
}

function renderResults(list) {
  const el = document.getElementById("results");
  if (!list.length) {
    el.innerHTML = `<p class="no-results">No matches yet. Try a different word, or check the full list below.</p>`;
    return;
  }
  el.innerHTML = list.map(renderResultCard).join("");
}

function renderCategoryGrid() {
  const grid = document.getElementById("category-grid");
  grid.innerHTML = entries
    .map(
      (e) => `
      <a class="grid-card" href="procedures/${escapeAttr(e.slug)}.html">
        <div class="card-icon-row">${iconFor(e.category)}<h4 style="margin:0">${escapeHtml(e.procedure_name)}</h4></div>
        <p>${escapeHtml(e.category)}</p>
      </a>`
    )
    .join("");
}

document.getElementById("ask-btn").addEventListener("click", () => {
  const q = document.getElementById("query").value;
  renderResults(search(q));
});

document.getElementById("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("ask-btn").click();
});

// --- Ask (AI) ------------------------------------------------------------
// Points at the Cloudflare Worker that holds the inference key. The key is
// never in this file, see worker/README.md.
const ASK_WORKER_URL = "https://bmw-repair-assistant-ask.bmwrepairworkshop.workers.dev";

const aiBtn = document.getElementById("ai-btn");
const aiInput = document.getElementById("ai-query");
const aiAnswer = document.getElementById("ai-answer");

// Renders the model's reply. Markdown-ish output from a model is untrusted
// text as far as the DOM is concerned, so it goes through escapeHtml and only
// paragraph breaks are turned into markup.
function renderAnswer(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  aiAnswer.innerHTML = `
    <div class="result-card">
      <div class="card-icon-row">${iconFor("General")}<h3 style="margin:0">Answer</h3></div>
      ${paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("")}
      <p class="result-meta" style="margin-top:12px">
        Generated from this site's procedures only, by an open-weight model. Check the linked
        procedure before turning a wrench, and verify any torque figure or part number yourself.
      </p>
    </div>`;
}

function renderAnswerNotice(message) {
  aiAnswer.innerHTML = `<p class="no-results">${escapeHtml(message)}</p>`;
}

async function askQuestion() {
  const question = aiInput.value.trim();
  if (!question) return;

  if (!ASK_WORKER_URL) {
    renderAnswerNotice("Ask isn't wired up yet, the worker URL hasn't been set.");
    return;
  }

  aiBtn.disabled = true;
  renderAnswerNotice("Thinking...");

  try {
    const res = await fetch(ASK_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) {
      renderAnswerNotice(data.error || `Request failed (${res.status}).`);
      return;
    }
    renderAnswer(data.answer);
  } catch {
    renderAnswerNotice("Couldn't reach the answer service. Check your connection and try again.");
  } finally {
    aiBtn.disabled = false;
  }
}

aiBtn.addEventListener("click", askQuestion);
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") askQuestion();
});

loadIndex();
