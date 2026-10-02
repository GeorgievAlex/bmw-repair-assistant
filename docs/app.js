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
  // Some procedures split steps into labeled sub-groups with "### Label" headers
  // (e.g. two unrelated filters done in one job). Render each group separately.
  if (stepsText.includes("### ")) {
    const parts = stepsText.split(/^###\s+(.+)$/m);
    let html = "";
    for (let i = 1; i < parts.length; i += 2) {
      html += `<p class="section-title">${escapeHtml(parts[i].trim())}</p>${renderNumberedList(parts[i + 1] || "")}`;
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
  const imgRegex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = imgRegex.exec(line)) !== null) {
    if (m.index > lastIndex) parts.push({ type: "text", value: line.slice(lastIndex, m.index) });
    parts.push({ type: "image", alt: m[1], src: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) parts.push({ type: "text", value: line.slice(lastIndex) });

  return parts
    .map((p) => {
      if (p.type === "image") {
        const safeSrc = /^(https?:|\.\.?\/|[\w-]+\/)/.test(p.src) ? p.src : "#";
        return `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(p.alt)}" loading="lazy" style="max-width:100%;border-radius:8px;border:1px solid var(--border)" />`;
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
      <h3>${escapeHtml(entry.procedure_name)}</h3>
      <div class="result-meta">${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)} · ${escapeHtml(entry.category)}</div>
      ${paragraphs.map((p) => `<p>${renderMarkdownLine(p)}</p>`).join("")}
      <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
    </div>
  `;
}

function renderResultCard(entry) {
  if (entry.type === "reference") return renderReferenceCard(entry);
  const chips = [];
  if (entry.torque_specs) {
    chips.push(`<span class="spec-chip">torque: ${escapeHtml(entry.torque_specs)}</span>`);
  }
  if (entry.part_numbers) {
    chips.push(`<span class="spec-chip">parts: ${escapeHtml(entry.part_numbers)}</span>`);
  }
  if (entry.time_estimate) {
    chips.push(`<span class="spec-chip">time: ${escapeHtml(entry.time_estimate)}</span>`);
  }
  if (entry.difficulty) {
    chips.push(`<span class="spec-chip">difficulty: ${escapeHtml(entry.difficulty)}</span>`);
  }

  return `
    <div class="result-card">
      <h3>${escapeHtml(entry.procedure_name)}</h3>
      <div class="result-meta">${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)} · ${escapeHtml(entry.category)}</div>
      <p>${escapeHtml(entry.summary)}</p>
      ${chips.length ? `<div class="spec-row">${chips.join("")}</div>` : ""}
      ${entry.steps ? `<p class="section-title">Steps</p>${renderSteps(entry.steps)}` : ""}
      ${entry.tools_needed ? `<p class="section-title">Tools</p><p>${escapeHtml(entry.tools_needed)}</p>` : ""}
      ${entry.notes_warnings ? `<p class="section-title">Notes</p><p class="warning">${escapeHtml(entry.notes_warnings)}</p>` : ""}
      <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
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
      (e, i) => `
      <div class="grid-card" data-id="${e.id}">
        <h4>${escapeHtml(e.procedure_name)}</h4>
        <p>${escapeHtml(e.category)}</p>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".grid-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.id);
      const entry = entries.find((e) => e.id === id);
      renderResults([entry]);
      document.getElementById("results").scrollIntoView({ behavior: "smooth" });
    });
  });
}

document.getElementById("ask-btn").addEventListener("click", () => {
  const q = document.getElementById("query").value;
  renderResults(search(q));
});

document.getElementById("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("ask-btn").click();
});

loadIndex();
