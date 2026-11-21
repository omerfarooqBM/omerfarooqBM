import { MONTHS, WEEKDAYS, isoDay, plural, shortDate, utcDate } from "./format.mjs";

const DAY = 86_400_000;

function streaks(counts, today) {
  let cursor = utcDate(today).getTime();
  if (!(counts.get(today) > 0)) cursor -= DAY;
  let current = 0;
  while (counts.get(isoDay(new Date(cursor))) > 0) {
    current++;
    cursor -= DAY;
  }
  const currentStart = current ? isoDay(new Date(cursor + DAY)) : null;

  let longest = { length: 0, start: null, end: null };
  let lastActive = null;
  let run = 0;
  let start = null;
  const first = [...counts.keys()].sort()[0];
  for (let t = utcDate(first ?? today).getTime(), end = utcDate(today).getTime(); t <= end; t += DAY) {
    const key = isoDay(new Date(t));
    if (counts.get(key) > 0) {
      lastActive = key;
      if (run === 0) start = key;
      run++;
      if (run > longest.length) longest = { length: run, start, end: key };
    } else {
      run = 0;
    }
  }
  return { current, currentStart, longest, lastActive };
}

function uptime(createdAt, now) {
  const start = new Date(createdAt);
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
  if (now.getUTCDate() < start.getUTCDate()) months--;
  const parts = [Math.floor(months / 12), months % 12];
  return [parts[0] && plural(parts[0], "year"), parts[1] && plural(parts[1], "month")].filter(Boolean).join(", ") || "under a month";
}

export function computeStats(data, now = new Date()) {
  const today = isoDay(now);
  const counts = new Map(data.days.map((d) => [d.date, d.count]));
  for (const d of data.lastYear.days) if (!counts.has(d.date)) counts.set(d.date, d.count);

  const lastYearDays = data.lastYear.days.filter((d) => d.date <= today);
  const firstDay = utcDate(lastYearDays[0].date);
  const offset = firstDay.getUTCDay();
  const cells = lastYearDays.map((d) => {
    const index = Math.round((utcDate(d.date) - firstDay) / DAY) + offset;
    return { ...d, week: Math.floor(index / 7), weekday: index % 7 };
  });

  const weekdayTotals = Array(7).fill(0);
  for (const d of lastYearDays) weekdayTotals[utcDate(d.date).getUTCDay()] += d.count;
  const bestDay = lastYearDays.reduce((best, d) => (d.count > best.count ? d : best), { date: null, count: 0 });

  const created = new Date(data.createdAt);
  const yearTotals = new Map();
  for (let y = created.getUTCFullYear(); y <= now.getUTCFullYear(); y++) yearTotals.set(y, 0);
  for (const [date, count] of counts) {
    const y = Number(date.slice(0, 4));
    yearTotals.set(y, (yearTotals.get(y) ?? 0) + count);
  }
  let years = [...yearTotals].sort((a, b) => a[0] - b[0]).map(([year, total]) => ({ year, total }));
  const peakYear = Math.max(0, ...years.map((y) => y.total));
  // Years before the account saw real use (e.g. a single commit) would only add empty bars.
  const firstUsed = years.findIndex((y) => y.total > 0 && y.total >= peakYear * 0.01);
  if (firstUsed > 0) years = years.slice(firstUsed);

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ key: isoDay(d).slice(0, 7), label: MONTHS[d.getUTCMonth()], year: d.getUTCFullYear(), total: 0 });
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  for (const [date, count] of counts) {
    const i = monthIndex.get(date.slice(0, 7));
    if (i !== undefined) months[i].total += count;
  }

  return {
    login: data.login,
    followers: data.followers,
    publicRepos: data.publicRepos,
    since: `${MONTHS[created.getUTCMonth()]} ${created.getUTCFullYear()}`,
    uptime: uptime(data.createdAt, now),
    allTime: [...counts.values()].reduce((a, b) => a + b, 0),
    lastYear: {
      total: data.lastYear.total,
      activeDays: lastYearDays.filter((d) => d.count > 0).length,
      dayCount: lastYearDays.length,
      bestDay,
      topWeekday: WEEKDAYS[weekdayTotals.indexOf(Math.max(...weekdayTotals))],
      cells,
    },
    streak: streaks(counts, today),
    years,
    months,
    updated: shortDate(today),
  };
}
