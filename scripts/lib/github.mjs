const ENDPOINT = "https://api.github.com/graphql";

const PROFILE_QUERY = `query ($login: String!) {
  user(login: $login) {
    login
    createdAt
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) { totalCount }
    contributionsCollection {
      contributionYears
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const YEAR_QUERY = `query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function graphql(token, query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "profile-cards-generator",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}: ${await res.text()}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  return body.data;
}

const flatten = (calendar) =>
  calendar.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }));

export async function fetchContributions(login, token, now = new Date()) {
  const { user } = await graphql(token, PROFILE_QUERY, { login });
  if (!user) throw new Error(`GitHub user "${login}" not found`);

  const days = new Map();
  const years = [...user.contributionsCollection.contributionYears].sort((a, b) => a - b);
  for (const year of years) {
    const to = year === now.getUTCFullYear() ? now.toISOString() : `${year}-12-31T23:59:59Z`;
    const data = await graphql(token, YEAR_QUERY, { login, from: `${year}-01-01T00:00:00Z`, to });
    for (const day of flatten(data.user.contributionsCollection.contributionCalendar)) {
      if (day.date.startsWith(String(year))) days.set(day.date, day.count);
    }
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  return {
    login: user.login,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    lastYear: { total: calendar.totalContributions, days: flatten(calendar) },
    days: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
  };
}
