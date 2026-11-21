import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderCity } from "./cards/city.mjs";
import { renderStats } from "./cards/stats.mjs";
import { renderTerminal } from "./cards/terminal.mjs";
import { num } from "./lib/format.mjs";
import { fetchContributions } from "./lib/github.mjs";
import { injectStats, statsMarkdown } from "./lib/readme.mjs";
import { computeStats } from "./lib/stats.mjs";
import { themes } from "./lib/theme.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(path.join(root, "profile.config.json"), "utf8"));

async function loadData() {
  const flag = process.argv.indexOf("--data");
  if (flag > -1) return JSON.parse(readFileSync(process.argv[flag + 1], "utf8"));
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Set GITHUB_TOKEN or pass --data <file.json>");
  return fetchContributions(process.env.PROFILE_USER || config.username, token);
}

const stats = computeStats(await loadData());
const assets = path.join(root, "assets");
mkdirSync(path.join(assets, "badges"), { recursive: true });
const write = (file, content) => writeFileSync(path.join(assets, file), content);

write("terminal.svg", renderTerminal(config, stats));
for (const theme of Object.values(themes)) {
  write(`stats-${theme.name}.svg`, renderStats(stats, theme));
  write(`city-${theme.name}.svg`, renderCity(stats, theme));
}

const badge = (label, message) => JSON.stringify({ schemaVersion: 1, label, message, color: "2a78d6" });
write("badges/contributions.json", badge("contributions", num(stats.allTime)));
write("badges/this-year.json", badge(`in ${stats.years.at(-1).year}`, num(stats.years.at(-1).total)));

const readmePath = path.join(root, "README.md");
if (existsSync(readmePath)) {
  writeFileSync(readmePath, injectStats(readFileSync(readmePath, "utf8"), statsMarkdown(stats)));
}

console.log(
  `${stats.login}: ${num(stats.allTime)} all-time, ${num(stats.lastYear.total)} last year, ` +
    `streak ${stats.streak.current} (best ${stats.streak.longest.length})`,
);
