import { dateRange, num, shortDate } from "./format.mjs";

const START = "<!-- stats:start -->";
const END = "<!-- stats:end -->";

const row = (cells) => `| ${cells.join(" | ")} |`;
const align = (n) => `|${Array(n).fill(":---:").join("|")}|`;

export function statsMarkdown(s) {
  const { streak, lastYear } = s;
  const longest = streak.longest.start ? ` (${dateRange(streak.longest.start, streak.longest.end)})` : "";
  const current = streak.current > 1 ? `${num(streak.current)} days current · ` : "";
  const best = lastYear.bestDay.date ? ` on ${shortDate(lastYear.bestDay.date)}` : "";
  return [
    "**Contributions per year**",
    "",
    row(s.years.map((y) => String(y.year))),
    align(s.years.length),
    row(s.years.map((y) => num(y.total))),
    "",
    "**Last 12 months**",
    "",
    row(s.months.map((m) => `${m.label} ’${String(m.year).slice(2)}`)),
    align(s.months.length),
    row(s.months.map((m) => num(m.total))),
    "",
    `- **All-time:** ${num(s.allTime)} contributions since ${s.since}`,
    `- **Last 12 months:** ${num(lastYear.total)} contributions across ${num(lastYear.activeDays)} active days`,
    `- **Streaks:** ${current}${num(streak.longest.length)} days longest${longest}`,
    `- **Best day:** ${num(lastYear.bestDay.count)} contributions${best} · most active on ${lastYear.topWeekday}s`,
    "",
    `<sub>Refreshed automatically · last update ${s.updated}</sub>`,
  ].join("\n");
}

export function injectStats(readme, markdown) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start) return readme;
  return `${readme.slice(0, start + START.length)}\n\n${markdown}\n\n${readme.slice(end)}`;
}
