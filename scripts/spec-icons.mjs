// Small animated icons for each spec-table row label. Same pattern as
// icons.mjs: plain data, duplicated into docs/app.js since there's no build
// step to share modules between Node and the browser.
export const SPEC_ICONS = {
  Torque: '<svg class="spec-icon icon-torque" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M7.76 7.76L6.34 6.34M17.66 17.66l-1.42-1.42M7.76 16.24l-1.42 1.42M17.66 6.34l-1.42 1.42"/><circle cx="12" cy="12" r="4"/></svg>',
  Parts: '<svg class="spec-icon icon-parts" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  Tools: '<svg class="spec-icon icon-tools" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z"/></svg>',
  Time: '<svg class="spec-icon icon-time" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  Difficulty: '<svg class="spec-icon icon-difficulty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15a8 8 0 0116 0"/><path d="M12 15l3-4"/><circle cx="12" cy="15" r="1"/></svg>',
};

export function specIconFor(label) {
  return SPEC_ICONS[label] || "";
}
