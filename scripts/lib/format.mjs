export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const num = (n) => Math.round(n).toLocaleString("en-US");

export const plural = (n, word) => `${num(n)} ${word}${n === 1 ? "" : "s"}`;

export const r2 = (n) => Math.round(n * 100) / 100;

export const utcDate = (iso) => new Date(`${iso}T00:00:00Z`);

export const isoDay = (date) => date.toISOString().slice(0, 10);

export function shortDate(iso, withYear = true) {
  const d = utcDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
}

export function dateRange(startIso, endIso) {
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  return `${shortDate(startIso, !sameYear)} – ${shortDate(endIso)}`;
}

export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.min(255, Math.round(v * factor)));
  return `#${channels.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
