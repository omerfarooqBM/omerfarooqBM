import { esc, num, plural } from "../lib/format.mjs";
import { MONO, MOTION } from "../lib/theme.mjs";

const C = {
  bg: "#0d1117",
  bar: "#161b22",
  ring: "#30363d",
  text: "#f0efec",
  muted: "#898781",
  key: "#6da7ec",
  title: "#9085e9",
  prompt: "#0ca30c",
  edge: "#30363d",
  node: "#3987e5",
  pulse: "#86b6ef",
};
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#0ca30c", "#9085e9", "#e34948"];

const W = 900;
const FONT = 14;
const CHAR = FONT * 0.6;
const LINE = 20;
const INFO_X = 336;
const VALUE_X = INFO_X + 136;

function network(top, bottom) {
  const layers = [4, 6, 6, 3];
  const xs = [66, 138, 210, 282];
  const mid = (top + bottom) / 2;
  const gap = 36;
  const nodes = layers.map((n, l) => Array.from({ length: n }, (_, i) => [xs[l], mid + (i - (n - 1) / 2) * gap]));

  let edges = "";
  let pulses = "";
  let k = 0;
  for (let l = 0; l < nodes.length - 1; l++) {
    for (const [x1, y1] of nodes[l]) {
      for (const [x2, y2] of nodes[l + 1]) {
        const d = `M${x1} ${y1}L${x2} ${y2}`;
        edges += `<path d="${d}"/>`;
        // Light up roughly a third of the edges so the signal reads as sparse, not a solid sheet.
        if ((k * 7 + l * 3) % 3 === 0) {
          const delay = (1.6 + l * 0.75 + (k % 5) * 0.31).toFixed(2);
          pulses += `<path class="pulse" pathLength="100" style="animation-delay:${delay}s" d="${d}"/>`;
        }
        k++;
      }
    }
  }
  const circles = nodes
    .flatMap((layer, l) =>
      layer.map(([x, y], i) => {
        const delay = (1.2 + l * 0.12 + i * 0.03).toFixed(2);
        const glow = l === nodes.length - 1 ? ` style="animation-delay:${delay}s,${(2.4 + i * 0.5).toFixed(2)}s"` : ` style="animation-delay:${delay}s"`;
        return `<circle class="node${l === nodes.length - 1 ? " out" : ""}"${glow} cx="${x}" cy="${y}" r="7"/>`;
      }),
    )
    .join("");
  return `<g class="edges">${edges}</g><g class="pulses">${pulses}</g><g>${circles}</g>`;
}

export function renderTerminal(config, s) {
  const rows = [
    ...config.about,
    null,
    ["Contributions", `${num(s.allTime)} total · ${num(s.lastYear.total)} in the last year`],
    [
      "Streak",
      s.streak.current > 1
        ? `${plural(s.streak.current, "day")} now · ${plural(s.streak.longest.length, "day")} best`
        : `${plural(s.streak.longest.length, "day")} longest`,
    ],
    ["Active days", `${num(s.lastYear.activeDays)} of the last ${num(s.lastYear.dayCount)}`],
    ["Uptime", `${s.uptime} on GitHub`],
  ];
  const host = `${s.login}@github`;
  const promptW = (config.prompt.length + 4) * CHAR;
  const cmdW = config.command.length * CHAR;

  const top = 118;
  let y = top;
  let delay = 1.5;
  const step = 0.07;
  const line = (content) => {
    const out = `<g class="ln" style="animation-delay:${delay.toFixed(2)}s">${content}</g>`;
    delay += step;
    y += LINE;
    return out;
  };

  let info = line(`<text x="${INFO_X}" y="${y}" class="t title">${esc(host)}</text>`);
  info += line(`<text x="${INFO_X}" y="${y}" class="t dim">${"─".repeat(host.length)}</text>`);
  for (const row of rows) {
    if (!row) {
      info += line(`<text x="${INFO_X}" y="${y}" class="t dim">${"─".repeat(host.length)}</text>`);
      continue;
    }
    info += line(
      `<text x="${INFO_X}" y="${y}" class="t key">${esc(row[0])}</text><text x="${VALUE_X}" y="${y}" class="t">${esc(row[1])}</text>`,
    );
  }
  const infoBottom = y - LINE;

  const swatchY = infoBottom + 18;
  const swatches = PALETTE.map((c, i) => `<rect x="${INFO_X + i * 30}" y="${swatchY}" width="26" height="14" rx="3" fill="${c}"/>`).join("");
  info += `<g class="ln" style="animation-delay:${delay.toFixed(2)}s">${swatches}</g>`;
  delay += 0.3;

  const finalY = swatchY + 54;
  const H = finalY + 26;

  const promptText = (py) =>
    `<text x="28" y="${py}" class="t"><tspan fill="${C.prompt}">${esc(config.prompt)}</tspan><tspan fill="${C.key}"> ~</tspan><tspan fill="${C.text}"> %</tspan></text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">${esc(host)} — neofetch</title>
<desc id="desc">${esc(rows.filter(Boolean).map((r) => `${r[0]}: ${r[1]}`).join(". "))}</desc>
<style>
.t{font:${FONT}px ${MONO};fill:${C.text}}
.title{fill:${C.title};font-weight:700}
.key{fill:${C.key};font-weight:600}
.dim{fill:${C.muted}}
.bar-title{font:12px ${MONO};fill:${C.muted};text-anchor:middle}
.ln{animation:fade .35s ease-out both}
.cover{transform:translateX(${Math.ceil(cmdW + 12)}px);animation:type ${(config.command.length * 0.055).toFixed(2)}s steps(${config.command.length}) .45s both}
.caret{animation:hide .01s linear 1.45s both}
.edges path{stroke:${C.edge};stroke-width:1;fill:none;animation:fade .6s ease-out 1.1s both}
.pulse{fill:none;stroke:${C.pulse};stroke-width:2;stroke-linecap:round;stroke-dasharray:9 200;stroke-dashoffset:9;animation:flow 2.6s linear infinite}
.node{fill:${C.bg};stroke:${C.node};stroke-width:1.5;animation:fade .4s ease-out both}
.out{fill:${C.node};fill-opacity:.25;animation:fade .4s ease-out both,glow 2.8s ease-in-out infinite}
.blink{animation:blink 1.1s steps(1) infinite}
.final{animation:fade .3s ease-out ${delay.toFixed(2)}s both}
@keyframes type{from{transform:translateX(0)}}
@keyframes hide{to{opacity:0}}
@keyframes flow{from{stroke-dashoffset:9}to{stroke-dashoffset:-100}}
@keyframes glow{50%{fill-opacity:.85}}
@keyframes blink{50%{opacity:0}}
${MOTION}
@media (prefers-reduced-motion:reduce){.pulse{display:none}.cover{display:none}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${C.bg}" stroke="${C.ring}"/>
<path d="M.5 40V12.5a12 12 0 0 1 12-12h${W - 25}a12 12 0 0 1 12 12V40z" fill="${C.bar}"/>
<line x1="0" x2="${W}" y1="40.5" y2="40.5" stroke="${C.ring}"/>
<circle cx="24" cy="20.5" r="6" fill="#ff5f57"/><circle cx="44" cy="20.5" r="6" fill="#febc2e"/><circle cx="64" cy="20.5" r="6" fill="#28c840"/>
<text x="${W / 2}" y="25" class="bar-title">${esc(config.prompt)}: ~</text>
${promptText(76)}
<text x="${28 + promptW}" y="76" class="t">${esc(config.command)}</text>
<g class="cover"><rect x="${28 + promptW - 2}" y="60" width="${Math.ceil(cmdW + 16)}" height="22" fill="${C.bg}"/><rect class="caret" x="${28 + promptW - 2}" y="62" width="9" height="18" fill="${C.text}"/></g>
${network(top - 10, infoBottom + 24)}
${info}
<g class="final">${promptText(finalY)}<rect class="blink" x="${28 + promptW}" y="${finalY - 14}" width="9" height="18" fill="${C.text}"/></g>
</svg>`;
}
