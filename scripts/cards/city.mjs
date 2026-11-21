import { MONTHS, WEEKDAYS, esc, num, r2, shade, shortDate, utcDate } from "../lib/format.mjs";
import { MOTION, SANS } from "../lib/theme.mjs";

const W = 900;
const H = 372;
const PAD = 28;
const AW = 13;
const BW = 1.6;
const AD = 6.6;
const BD = 8.6;
const GAP = 0.14;
const MIN_H = 3;
const MAX_H = 50;
const AREA_TOP = 84;
const AREA_BOTTOM = H - 62;
const LABEL_SPACE = 18;

function quantile(sorted, p) {
  if (!sorted.length) return 1;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (i - lo);
}

export function renderCity(s, t) {
  const { cells, total, bestDay, topWeekday } = s.lastYear;
  const weeks = Math.max(...cells.map((c) => c.week)) + 1;
  const gridW = weeks * AW + 7 * AD;
  const ox = (W - gridW) / 2 + 12;
  const rise = weeks * BW + MAX_H;
  const extent = rise + 7 * BD + LABEL_SPACE;
  const oy = AREA_TOP + Math.max(0, (AREA_BOTTOM - AREA_TOP - extent) / 2) + rise;
  const P = (w, d) => [ox + w * AW + d * AD, oy - w * BW + d * BD];
  const pts = (...ps) => ps.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ");

  const active = cells.filter((c) => c.count > 0).map((c) => c.count).sort((a, b) => a - b);
  const [q1, q2, q3] = [0.25, 0.5, 0.75].map((p) => quantile(active, p));
  // Capping at the 95th percentile keeps one outlier day from flattening every other tower.
  const cap = Math.max(1, quantile(active, 0.95));
  const level = (n) => (n === 0 ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4);
  const height = (n) => MIN_H + (MAX_H - MIN_H) * Math.sqrt(Math.min(n, cap) / cap);

  const corners = (c) => {
    const [w0, w1, d0, d1] = [c.week + GAP, c.week + 1 - GAP, c.weekday + GAP, c.weekday + 1 - GAP];
    return [P(w0, d0), P(w1, d0), P(w1, d1), P(w0, d1)];
  };
  const delay = (c) => (0.2 + c.week * 0.02).toFixed(2);

  let tiles = "";
  for (const c of cells.filter((c) => c.count === 0)) {
    tiles += `<polygon class="tile" style="animation-delay:${delay(c)}s" points="${pts(...corners(c))}" fill="${t.scale[0]}"/>`;
  }

  let towers = "";
  const order = cells.filter((c) => c.count > 0).sort((a, b) => a.weekday - b.weekday || b.week - a.week);
  for (const c of order) {
    const [A, B, C, D] = corners(c);
    const h = height(c.count);
    const up = ([x, y]) => [x, y - h];
    const color = t.scale[level(c.count)];
    towers += `<g class="tower" style="animation-delay:${delay(c)}s;transform-origin:${r2(D[0])}px ${r2(D[1])}px">`;
    towers += `<polygon points="${pts(A, D, up(D), up(A))}" fill="${shade(color, t.sideLeft)}"/>`;
    towers += `<polygon points="${pts(D, C, up(C), up(D))}" fill="${shade(color, t.sideFront)}"/>`;
    towers += `<polygon points="${pts(up(A), up(B), up(C), up(D))}" fill="${color}"/></g>`;
  }

  const angle = r2((Math.atan2(-BW, AW) * 180) / Math.PI);
  let labels = "";
  for (const d of [1, 3, 5]) {
    const [x, y] = P(-0.8, d + 0.5);
    labels += `<text x="${r2(x)}" y="${r2(y + 3.5)}" class="axis" text-anchor="end">${WEEKDAYS[d].slice(0, 3)}</text>`;
  }
  const firstSunday = cells.find((c) => c.weekday === 0);
  for (let w = 0; w < weeks; w++) {
    const sunday = new Date(utcDate(firstSunday.date).getTime() + (w - firstSunday.week) * 7 * 86_400_000);
    if (sunday.getUTCDate() > 7 || w === 0) continue;
    const [x, y] = P(w + 0.15, 7.35);
    labels += `<text x="${r2(x)}" y="${r2(y + 10)}" class="axis" transform="rotate(${angle} ${r2(x)} ${r2(y + 10)})">${MONTHS[sunday.getUTCMonth()]}</text>`;
  }

  const legendX = W - PAD - 5 * 14 - 34;
  const legend = t.scale
    .map((c, i) => `<rect x="${legendX + i * 14}" y="${H - 38}" width="10" height="10" rx="2" fill="${c}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Contribution city for ${esc(s.login)}</title>
<desc id="desc">Isometric contribution calendar for the last 12 months: ${num(total)} contributions, best day ${num(bestDay.count)} on ${bestDay.date ? shortDate(bestDay.date) : "n/a"}, most active on ${topWeekday}s.</desc>
<style>
.title{font:600 16px ${SANS};fill:${t.ink}}
.subtitle{font:400 12px ${SANS};fill:${t.ink2}}
.axis{font:400 10px ${SANS};fill:${t.muted}}
.foot{font:400 13px ${SANS};fill:${t.ink2}}
.strong{font-weight:600;fill:${t.ink}}
.legend{font:400 11px ${SANS};fill:${t.muted}}
.tower{animation:rise .9s cubic-bezier(.2,.8,.2,1) both}
.tile{animation:fade .5s ease-out both}
@keyframes rise{from{transform:scaleY(0)}}
${MOTION}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.surface}" stroke="${t.ring}"/>
<text x="${PAD}" y="42" class="title">Contribution city</text>
<text x="${PAD}" y="62" class="subtitle">Last 12 months · one tower per day, taller means more contributions</text>
${tiles}
${towers}
${labels}
<text x="${PAD}" y="${H - 28}" class="foot"><tspan class="strong">${num(total)}</tspan> contributions  ·  best day <tspan class="strong">${num(bestDay.count)}</tspan>${bestDay.date ? ` on ${esc(shortDate(bestDay.date))}` : ""}  ·  most active on <tspan class="strong">${esc(topWeekday)}s</tspan></text>
<text x="${legendX - 6}" y="${H - 29}" class="legend" text-anchor="end">Less</text>
${legend}
<text x="${legendX + 5 * 14 + 2}" y="${H - 29}" class="legend">More</text>
</svg>`;
}
