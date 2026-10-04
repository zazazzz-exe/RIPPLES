// Inline SVG icons. Status icons use a distinct shape per status so the
// meaning never depends on color alone.
import { raw } from '../../ui.js';

const svg = (body, vb = '0 0 24 24', extra = '') => raw(`<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`);

const STATUS_SHAPES = {
  planned: '<circle cx="12" cy="12" r="8"/>',
  ongoing: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/>',
  completed: '<circle cx="12" cy="12" r="8" fill="currentColor"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke="#fff"/>',
  delayed: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  incomplete: '<circle cx="12" cy="12" r="8" stroke-dasharray="4.2 3.2"/>',
  verify: '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12Z"/><path d="M12 8.5v4.2M12 15.6v.1"/>',
};
export const statusIcon = (key) => svg(STATUS_SHAPES[key]);

// White glyph shown inside a map pin (same shapes, drawn for a dark marker).
const PIN_GLYPHS = {
  planned: '<circle cx="12" cy="12" r="5.5" stroke="#fff" stroke-width="2.4"/>',
  ongoing: '<circle cx="12" cy="12" r="5.5" stroke="#fff" stroke-width="2.4"/><path d="M12 6.5a5.5 5.5 0 0 1 0 11Z" fill="#fff" stroke="none"/>',
  completed: '<path d="M7.5 12.3l3 3 6-6.3" stroke="#fff" stroke-width="2.8"/>',
  delayed: '<circle cx="12" cy="12" r="6" stroke="#fff" stroke-width="2.2"/><path d="M12 8.6V12l2.4 1.6" stroke="#fff" stroke-width="2.2"/>',
  incomplete: '<circle cx="12" cy="12" r="5.5" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 3"/>',
  verify: '<path d="M12 6.8v6M12 16.6v.4" stroke="#fff" stroke-width="3"/>',
};
export const pinGlyph = (key) => raw(`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PIN_GLYPHS[key]}</svg>`);
export const pinBody = (color) => raw(`<svg class="body" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37C15 37 2 22.6 2 14a13 13 0 0 1 26 0c0 8.6-13 23-13 23Z" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`);

const FEATURE = {
  chain: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z"/><path d="M9 4v13.5M15 6.5V20"/>',
  progress: '<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/><path d="M15 8h3v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  timeline: '<path d="M3 12h18"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M18 9l3 3-3 3"/>',
  risk: '<path d="M12 3.5 21 19H3Z"/><path d="M12 10v4M12 16.5v.1"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7" height="9" rx="1"/><rect x="13.5" y="3.5" width="7" height="5" rx="1"/><rect x="13.5" y="11.5" width="7" height="9" rx="1"/><rect x="3.5" y="15.5" width="7" height="5" rx="1"/>',
  network: '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="7" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 6.4 17 7M6.2 7.9l4.6 8.3M17.8 8.9l-4.6 7.3"/>',
};
export const featureIcon = (k) => svg(FEATURE[k]);

export const arrowRight = () => svg('<path d="M5 12h14M13 6l6 6-6 6"/>');
export const arrowLeft = () => svg('<path d="M19 12H5M11 6l-6 6 6 6"/>');
export const closeIcon = () => svg('<path d="M6 6l12 12M18 6 6 18"/>');
export const plusIcon = () => svg('<path d="M12 5v14M5 12h14"/>');
export const minusIcon = () => svg('<path d="M5 12h14"/>');
export const homeIcon = () => svg('<path d="M4 11l8-7 8 7M6 10v10h12V10"/>');
export const listIcon = () => svg('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>');

// Brand mark: ripples around a point (navy + red), used in the navbar and footer.
