const paths = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  sword: '<path d="m15 3 6 0 0 6-11 11-6-6L15 3Zm-4 14 7-7M3 21l5-5M3 12l9 9"/>',
  book: '<path d="M12 5c-4-3-9-1-9-1v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15"/>',
  bag: '<path d="M7 8V6a5 5 0 0 1 10 0v2M5 8h14l2 13H3L5 8Z"/>',
  leaf: '<path d="M20 3C5 2 1 13 7 18s15-1 13-15ZM4 21 16 8"/>',
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
  letter: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 5 9 8 9-8m-18 14 7-7m11 7-7-7"/>',
  banner: '<path d="M5 22V3h14v13l-7-3-7 3"/>',
  seal: '<path d="m12 2 3 3 4 1 1 4 2 2-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-2 1-4 4-1 3-3Z"/><circle cx="12" cy="12" r="4"/>',
  cloak: '<path d="M8 5a4 4 0 0 1 8 0l5 15-9 2-9-2L8 5Zm0 0 4 6 4-6m-4 6v11"/>',
  sound: '<path d="m11 4-5 4H2v8h4l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-5 4H2v8h4l5 4V4Zm5 5 6 6m0-6-6 6"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 2v4l4 2 3-1 3 1 4-2v-4l2-2-2-4-3-1-1-3H9Z"/><circle cx="12" cy="11" r="3"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  crown: '<path d="m3 6 5 5 4-8 4 8 5-5-2 13H5L3 6Zm2 10h14"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export function icon(name, cls = '') { return `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.seal}</svg>`; }
export function escapeHtml(text = '') { return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
