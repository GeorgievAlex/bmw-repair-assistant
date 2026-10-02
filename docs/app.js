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

function renderSteps(stepsText) {
  if (!stepsText || stepsText === "N/A, reference info only.") return "";
  const steps = stepsText
    .split(/\d+\.\s/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (steps.length < 2) return `<p>${escapeHtml(stepsText)}</p>`;
  return `<ol>${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
      ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      <p class="result-meta" style="margin-top:12px">source: ${escapeHtml(entry.source || "unknown")}</p>
    </div>
  `;
}

function renderResultCard(entry) {
  if (entry.type === "reference") return renderReferenceCard(entry);
  const chips = [];
  if (entry.torque_specs && entry.torque_specs !== "N/A") {
    chips.push(`<span class="spec-chip">torque: ${escapeHtml(entry.torque_specs)}</span>`);
  }
  if (entry.part_numbers && entry.part_numbers !== "N/A") {
    chips.push(`<span class="spec-chip">parts: ${escapeHtml(entry.part_numbers)}</span>`);
  }
  if (entry.time_estimate && entry.time_estimate !== "N/A") {
    chips.push(`<span class="spec-chip">time: ${escapeHtml(entry.time_estimate)}</span>`);
  }

  return `
    <div class="result-card">
      <h3>${escapeHtml(entry.procedure_name)}</h3>
      <div class="result-meta">${escapeHtml(entry.chassis)} · ${escapeHtml(entry.engine_code)} · ${escapeHtml(entry.category)}</div>
      <p>${escapeHtml(entry.summary)}</p>
      ${chips.length ? `<div class="spec-row">${chips.join("")}</div>` : ""}
      ${entry.steps && entry.steps !== "N/A, reference info only." ? `<p class="section-title">Steps</p>${renderSteps(entry.steps)}` : ""}
      ${entry.tools_needed && entry.tools_needed !== "N/A" ? `<p class="section-title">Tools</p><p>${escapeHtml(entry.tools_needed)}</p>` : ""}
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
