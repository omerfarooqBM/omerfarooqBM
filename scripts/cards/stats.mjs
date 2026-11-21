import { dateRange, esc, num, r2 } from "../lib/format.mjs";
import { MOTION, SANS } from "../lib/theme.mjs";

const W = 900;
const H = 360;
const PAD = 28;

function columnPath(x, baseline, width, height) {
  const r = Math.min(4, width / 2, height);
  const top = baseline - height;
  return `M${r2(x)} ${r2(baseline)}V${r2(top + r)}A${r} ${r} 0 0 1 ${r2(x + r)} ${r2(top)}H${r2(x + width - r)}A${r} ${r} 0 0 1 ${r2(x + width)} ${r2(top + r)}V${r2(baseline)}Z`;
}

function columns({ x, top, width, baseline, items, t, delay }) {
  const band = width / items.length;
  const barW = Math.min(24, band * 0.56);
  const max = Math.max(1, ...items.map((d) => d.value));
  const plotH = baseline - top - 18;
  const last = items.length - 1;
  const peak = items.findIndex((d) => d.value === max);
  let bars = "";
  let labels = "";
  items.forEach((d, i) => {
    const h = d.value > 0 ? Math.max(2, (d.value / max) * plotH) : 0;
    const bx = x + band * i + (band - barW) / 2;
    const cx = r2(bx + barW / 2);
    if (h) {
      bars += `<path class="bar" style="animation-delay:${(delay + i * 0.05).toFixed(2)}s;transform-origin:${cx}px ${baseline}px" d="${columnPath(bx, baseline, barW, h)}" fill="${t.series}"/>`;
    }
    labels += `<text x="${cx}" y="${baseline + 17}" class="tick">${esc(d.label)}</text>`;
    if (i === peak || i === last) {
      labels += `<text x="${cx}" y="${r2(baseline - h - 6)}" class="value" style="animation-delay:${(delay + 0.7).toFixed(2)}s">${num(d.value)}</text>`;
    }
  });
  return `${bars}<line x1="${x}" x2="${x + width}" y1="${baseline + 0.5}" y2="${baseline + 0.5}" stroke="${t.axis}"/>${labels}`;
}

function tile(x, { value, unit, label, sub, up }, delay, hero = false) {
  const size = hero ? 52 : 28;
  return `<g class="fade" style="animation-delay:${delay}s">
<text x="${x}" y="128" class="kpi" font-size="${size}">${esc(value)}${unit ? `<tspan class="unit" font-size="${hero ? 22 : 15}"> ${esc(unit)}</tspan>` : ""}</text>
<text x="${x}" y="152" class="label">${esc(label)}</text>
<text x="${x}" y="170" class="sub${up ? " up" : ""}">${esc(sub)}</text>
</g>`;
}

export function renderStats(s, t) {
  const { streak, lastYear } = s;
  const activePct = Math.round((lastYear.activeDays / lastYear.dayCount) * 100);
  const [prev, thisYear] = s.years.slice(-2);
  const growth = prev?.total ? Math.round((thisYear.total / prev.total - 1) * 100) : 0;
  const tiles = [
    { value: num(lastYear.total), label: "Last 12 months", sub: "contributions" },
    {
      value: num(thisYear.total),
      label: `In ${thisYear.year}`,
      sub: growth > 0 ? `▲ ${growth}% vs ${prev.year}` : "so far this year",
      up: growth > 0,
    },
    { value: num(lastYear.activeDays), label: "Active days", sub: `${activePct}% of the last year` },
    {
      value: num(streak.longest.length),
      unit: streak.longest.length === 1 ? "day" : "days",
      label: "Longest streak",
      sub: streak.longest.length ? dateRange(streak.longest.start, streak.longest.end) : "—",
    },
  ];
  const tileX = 300;
  const tileW = (W - PAD - tileX) / tiles.length;
  const current = s.months.at(-1);

  const chartTop = 236;
  const baseline = 318;
  const yearItems = s.years.map((y) => ({ value: y.total, label: String(y.year) }));
  const monthItems = s.months.map((m) => ({ value: m.total, label: m.label }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">GitHub activity for ${esc(s.login)}</title>
<desc id="desc">${num(s.allTime)} total contributions since ${esc(s.since)}; ${num(lastYear.total)} in the last 12 months over ${num(lastYear.activeDays)} active days. Current streak ${num(streak.current)} days, longest ${num(streak.longest.length)} days.</desc>
<style>
.title{font:600 16px ${SANS};fill:${t.ink}}
.subtitle{font:400 12px ${SANS};fill:${t.ink2}}
.kpi{font-family:${SANS};font-weight:600;fill:${t.ink}}
.unit{font-weight:500;fill:${t.ink2}}
.label{font:500 13px ${SANS};fill:${t.ink}}
.sub{font:400 12px ${SANS};fill:${t.ink2}}
.up{fill:${t.up};font-weight:600}
.h{font:600 13px ${SANS};fill:${t.ink}}
.hs{font-weight:400;fill:${t.ink2}}
.tick{font:400 11px ${SANS};fill:${t.muted};text-anchor:middle}
.value{font:600 12px ${SANS};fill:${t.ink2};text-anchor:middle;animation:fade .4s ease-out both}
.bar{animation:grow .9s cubic-bezier(.2,.8,.2,1) both}
.fade{animation:fade .6s ease-out both}
@keyframes grow{from{transform:scaleY(0)}}
${MOTION}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.surface}" stroke="${t.ring}"/>
<text x="${PAD}" y="42" class="title">GitHub activity</text>
<text x="${PAD}" y="62" class="subtitle">Every contribution counted, private repositories included</text>
<text x="${W - PAD}" y="42" class="subtitle" text-anchor="end">Updated ${esc(s.updated)}</text>
${tile(PAD, { value: num(s.allTime), label: "Total contributions", sub: `since ${s.since}` }, 0.05, true)}
${tiles.map((d, i) => `<line x1="${r2(tileX + tileW * i - 16)}" x2="${r2(tileX + tileW * i - 16)}" y1="98" y2="172" stroke="${t.grid}"/>${tile(r2(tileX + tileW * i), d, (0.15 + i * 0.08).toFixed(2))}`).join("\n")}
<line x1="${PAD}" x2="${W - PAD}" y1="196.5" y2="196.5" stroke="${t.grid}"/>
<text x="${PAD}" y="224" class="h">Contributions per year</text>
${columns({ x: PAD, top: chartTop, width: 382, baseline, items: yearItems, t, delay: 0.3 })}
<text x="470" y="224" class="h">Last 12 months <tspan class="hs">· ${esc(current.label)} to date</tspan></text>
${columns({ x: 470, top: chartTop, width: W - PAD - 470, baseline, items: monthItems, t, delay: 0.45 })}
</svg>`;
}
