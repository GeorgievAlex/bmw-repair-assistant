// Shared category -> icon map. Kept as plain data (no build step) so it can be
// duplicated verbatim into docs/app.js for the browser side without a bundler.
export const CATEGORY_ICONS = {
  Engine: {
    cls: "icon-engine",
    svg: '<svg class="cat-icon icon-engine" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  },
  Brakes: {
    cls: "icon-brakes",
    svg: '<svg class="cat-icon icon-brakes" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
  },
  Electrical: {
    cls: "icon-electrical",
    svg: '<svg class="cat-icon icon-electrical" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  },
  Cooling: {
    cls: "icon-cooling",
    svg: '<svg class="cat-icon icon-cooling" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3c4 5 7 8.5 7 12a7 7 0 01-14 0c0-3.5 3-7 7-12z"/></svg>',
  },
  Maintenance: {
    cls: "icon-maintenance",
    svg: '<svg class="cat-icon icon-maintenance" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z"/></svg>',
  },
  Suspension: {
    cls: "icon-suspension",
    svg: '<svg class="cat-icon icon-suspension" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14M5 21h14"/><path d="M8 3v2l8 3-8 3 8 3-8 3v2"/></svg>',
  },
  Steering: {
    cls: "icon-steering",
    svg: '<svg class="cat-icon icon-steering" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V3M9.8 13.2l-5.6 3.3M14.2 13.2l5.6 3.3"/></svg>',
  },
  General: {
    cls: "icon-general",
    svg: '<svg class="cat-icon icon-general" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg>',
  },
};

export function iconFor(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.General;
}
