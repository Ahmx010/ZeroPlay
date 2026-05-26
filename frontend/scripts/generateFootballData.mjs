import { writeFile } from "node:fs/promises";

const outputPath = new URL("../src/data/footballData.js", import.meta.url);
const dateWindow = "20250801-20260630";

const leagueConfigs = [
  {
    slug: "premier-league",
    name: "Premier League",
    fullName: "English Premier League",
    country: "England",
    code: "PL",
    espnCode: "eng.1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
    accent: "#00d4ff",
    secondary: "#7c3aed",
  },
  {
    slug: "la-liga",
    name: "La Liga",
    fullName: "Spanish LALIGA",
    country: "Spain",
    code: "LL",
    espnCode: "esp.1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
    accent: "#ff4d8d",
    secondary: "#ffd166",
  },
  {
    slug: "serie-a",
    name: "Serie A",
    fullName: "Italian Serie A",
    country: "Italy",
    code: "SA",
    espnCode: "ita.1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
    accent: "#3b82f6",
    secondary: "#22c55e",
  },
  {
    slug: "bundesliga",
    name: "Bundesliga",
    fullName: "German Bundesliga",
    country: "Germany",
    code: "BL",
    espnCode: "ger.1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
    accent: "#ef4444",
    secondary: "#facc15",
  },
  {
    slug: "ligue-1",
    name: "Ligue 1",
    fullName: "French Ligue 1",
    country: "France",
    code: "L1",
    espnCode: "fra.1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
    accent: "#22c55e",
    secondary: "#38bdf8",
  },
];

const kickoffFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function ascii(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return ascii(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ordinal(value) {
  const number = Number(value) || 0;
  const suffix =
    number % 100 >= 11 && number % 100 <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][number % 10] || "th";

  return `${number}${suffix}`;
}

function hexColor(value, fallback) {
  const raw = String(value ?? "").replace("#", "").trim();
  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}` : fallback;
}

function getStat(entry, names) {
  const stat = entry?.stats?.find(
    (item) => names.includes(item.name) || names.includes(item.type),
  );
  const value = Number(stat?.value ?? Number.parseFloat(stat?.displayValue));
  return Number.isFinite(value) ? value : 0;
}

function getLogo(team) {
  return (
    team?.logos?.find((logo) => logo.rel?.includes("default"))?.href ||
    team?.logos?.[0]?.href ||
    team?.logo ||
    `https://a.espncdn.com/i/teamlogos/soccer/500/${team?.id}.png`
  );
}

function formatKickoff(isoDate) {
  return isoDate ? kickoffFormatter.format(new Date(isoDate)) : "TBD";
}

function formatDateOnly(isoDate) {
  return isoDate ? dateFormatter.format(new Date(isoDate)) : "TBD";
}

function getDateRange(games) {
  const dates = games.map((game) => game.isoDate).filter(Boolean).sort();
  if (!dates.length) {
    return "TBD";
  }

  const first = formatDateOnly(dates[0]);
  const last = formatDateOnly(dates[dates.length - 1]);
  return first === last ? first : `${first} - ${last}`;
}

function getResult(teamSlug, game) {
  if (game.status === "Scheduled") {
    return null;
  }

  const [homeScoreText, awayScoreText] = String(game.score).split(" - ");
  const homeScore = Number(homeScoreText);
  const awayScore = Number(awayScoreText);

  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return null;
  }

  const isHome = game.homeSlug === teamSlug;
  const goalsFor = isHome ? homeScore : awayScore;
  const goalsAgainst = isHome ? awayScore : homeScore;

  if (goalsFor > goalsAgainst) {
    return "W";
  }

  return goalsFor === goalsAgainst ? "D" : "L";
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  return response.json();
}

function buildLeaderMaps(statistics) {
  const goals = new Map();
  const assists = new Map();
  const goalsLeaders =
    statistics?.stats?.find((stat) => stat.name === "goalsLeaders")?.leaders ||
    [];
  const assistsLeaders =
    statistics?.stats?.find((stat) => stat.name === "assistsLeaders")
      ?.leaders || [];

  for (const leader of goalsLeaders) {
    const teamId = String(leader.athlete?.team?.id ?? leader.team?.id ?? "");

    if (!teamId || goals.has(teamId)) {
      continue;
    }

    goals.set(teamId, {
      name: ascii(
        leader.athlete?.displayName ||
          leader.athlete?.shortName ||
          "Club leader",
      ),
      goals: Number(leader.value) || 0,
      assists: Number(
        String(leader.shortDisplayValue || "").match(/A:\s*(\d+)/)?.[1] || 0,
      ),
      headshot: leader.athlete?.headshot?.href || null,
      espnUrl: leader.athlete?.links?.[0]?.href || null,
    });
  }

  for (const leader of assistsLeaders) {
    const teamId = String(leader.athlete?.team?.id ?? leader.team?.id ?? "");

    if (!teamId || assists.has(teamId)) {
      continue;
    }

    assists.set(teamId, {
      name: ascii(
        leader.athlete?.displayName ||
          leader.athlete?.shortName ||
          "Chance creator",
      ),
      assists: Number(leader.value) || 0,
      headshot: leader.athlete?.headshot?.href || null,
      espnUrl: leader.athlete?.links?.[0]?.href || null,
    });
  }

  return { goals, assists };
}

async function buildLeague(config) {
  const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${config.espnCode}/scoreboard?dates=${dateWindow}&limit=1000`;
  const standingsUrl = `https://site.api.espn.com/apis/v2/sports/soccer/${config.espnCode}/standings`;
  const statisticsUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${config.espnCode}/statistics`;
  const [scoreboard, standings, statistics] = await Promise.all([
    fetchJson(scoreboardUrl),
    fetchJson(standingsUrl),
    fetchJson(statisticsUrl),
  ]);

  const leaderMaps = buildLeaderMaps(statistics);
  const teamByEspnId = new Map();
  const teams = [];
  const entries = standings?.children?.[0]?.standings?.entries || [];

  function addTeam(teamPayload, entry = null) {
    const id = String(teamPayload?.id ?? "");

    if (!id) {
      return null;
    }

    const existing = teamByEspnId.get(id);

    if (existing) {
      return existing;
    }

    const name = ascii(
      teamPayload.displayName ||
        teamPayload.name ||
        teamPayload.shortDisplayName ||
        "Unknown Club",
    );
    const rank = getStat(entry, ["rank"]) || teams.length + 1;
    const goalsFor = getStat(entry, ["pointsFor", "pointsfor"]);
    const fallbackGoals = Math.max(1, Math.round(goalsFor * 0.24));

    const team = {
      slug: `${config.slug}-${slugify(name)}`,
      espnId: id,
      name,
      shortName: ascii(
        teamPayload.abbreviation ||
          teamPayload.shortDisplayName ||
          name.slice(0, 3).toUpperCase(),
      ),
      leagueSlug: config.slug,
      leagueName: config.name,
      leagueCode: config.code,
      country: config.country,
      logo: getLogo(teamPayload),
      color: hexColor(teamPayload.color, config.accent),
      alternateColor: hexColor(teamPayload.alternateColor, config.secondary),
      note: ascii(entry?.note?.description || ""),
      espnUrl: teamPayload.links?.[0]?.href || null,
      stats: {
        played: getStat(entry, ["gamesPlayed", "gamesplayed"]),
        wins: getStat(entry, ["wins"]),
        draws: getStat(entry, ["ties"]),
        losses: getStat(entry, ["losses"]),
        goalsFor,
        goalsAgainst: getStat(entry, ["pointsAgainst", "pointsagainst"]),
        goalDifference: getStat(entry, [
          "pointDifferential",
          "pointdifferential",
        ]),
        points: getStat(entry, ["points"]),
        cleanSheets: 0,
        form: [],
        position: ordinal(rank),
        rank,
        goals: goalsFor,
      },
      topScorer: leaderMaps.goals.get(id) || {
        name: `${name} attack leader`,
        goals: fallbackGoals,
        assists: Math.max(1, Math.round(fallbackGoals * 0.35)),
        headshot: null,
        espnUrl: null,
      },
      topAssist: leaderMaps.assists.get(id) || {
        name: `${name} chance creator`,
        assists: Math.max(1, Math.round(goalsFor * 0.16)),
        headshot: null,
        espnUrl: null,
      },
      nextMatch: {
        opponent: "Season complete",
        date: "2025/26 campaign",
        venue: config.country,
      },
      form: [],
    };

    teamByEspnId.set(id, team);
    teams.push(team);
    return team;
  }

  for (const entry of entries) {
    addTeam(entry.team, entry);
  }

  for (const event of scoreboard.events || []) {
    for (const competitor of event.competitions?.[0]?.competitors || []) {
      addTeam(competitor.team);
    }
  }

  const games = (scoreboard.events || [])
    .map((event) => {
      const competition = event.competitions?.[0] || {};
      const competitors = competition.competitors || [];
      const home =
        competitors.find((competitor) => competitor.homeAway === "home") ||
        competitors[0];
      const away =
        competitors.find((competitor) => competitor.homeAway === "away") ||
        competitors[1];
      const homeTeam = addTeam(home?.team);
      const awayTeam = addTeam(away?.team);

      if (!homeTeam || !awayTeam) {
        return null;
      }

      const statusType = competition.status?.type || event.status?.type || {};
      const completed = Boolean(statusType.completed);
      const inProgress = statusType.state === "in";
      const homeScore = Number(home?.score ?? 0);
      const awayScore = Number(away?.score ?? 0);

      return {
        id: `${config.slug}-${event.id}`,
        espnId: String(event.id),
        leagueSlug: config.slug,
        leagueName: config.name,
        homeSlug: homeTeam.slug,
        awaySlug: awayTeam.slug,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        score:
          completed || inProgress ? `${homeScore} - ${awayScore}` : "vs",
        status: completed
          ? "Final"
          : inProgress
            ? statusType.shortDetail || "Live"
            : "Scheduled",
        kickoff: formatKickoff(event.date || competition.date),
        isoDate: event.date || competition.date || null,
        venue: ascii(
          competition.venue?.fullName || event.venue?.fullName || "TBD",
        ),
        broadcast: ascii(competition.broadcasts?.[0]?.names?.[0] || ""),
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.isoDate).localeCompare(String(b.isoDate)));

  for (const game of games) {
    if (game.status !== "Final") {
      continue;
    }

    const [homeScore, awayScore] = game.score.split(" - ").map(Number);
    const homeTeam = teams.find((team) => team.slug === game.homeSlug);
    const awayTeam = teams.find((team) => team.slug === game.awaySlug);

    if (!homeTeam || !awayTeam) {
      continue;
    }

    if (awayScore === 0) {
      homeTeam.stats.cleanSheets += 1;
    }

    if (homeScore === 0) {
      awayTeam.stats.cleanSheets += 1;
    }
  }

  for (const team of teams) {
    const teamGames = games.filter(
      (game) => game.homeSlug === team.slug || game.awaySlug === team.slug,
    );
    const form = teamGames
      .filter((game) => game.status !== "Scheduled")
      .slice(-5)
      .map((game) => getResult(team.slug, game))
      .filter(Boolean);

    team.form = form.length ? form : ["D", "D", "D", "D", "D"];
    team.stats.form = team.form;

    const nextGame = teamGames.find((game) => game.status === "Scheduled");

    if (nextGame) {
      const opponentSlug =
        nextGame.homeSlug === team.slug ? nextGame.awaySlug : nextGame.homeSlug;
      const opponent = teams.find((candidate) => candidate.slug === opponentSlug);

      team.nextMatch = {
        opponent: opponent?.name || "TBD",
        date: nextGame.kickoff,
        venue: nextGame.venue,
      };
    }
  }

  teams.sort(
    (a, b) =>
      a.stats.rank - b.stats.rank ||
      b.stats.points - a.stats.points ||
      a.name.localeCompare(b.name),
  );

  const gamesPerMatchday = Math.max(1, Math.round(teams.length / 2));
  const matchdays = [];

  for (let index = 0; index < games.length; index += gamesPerMatchday) {
    const chunk = games.slice(index, index + gamesPerMatchday);
    const round = Math.floor(index / gamesPerMatchday) + 1;
    const label = `Matchweek ${round}`;

    matchdays.push({
      id: `${config.slug}-matchweek-${round}`,
      leagueSlug: config.slug,
      leagueName: config.name,
      label,
      week: label,
      round,
      dateRange: getDateRange(chunk),
      games: chunk.map((game) => ({ ...game, matchday: label })),
    });
  }

  const scoreForm = (team) =>
    team.form.reduce(
      (sum, result) => sum + (result === "W" ? 3 : result === "D" ? 1 : 0),
      0,
    );
  const totalGoals = teams.reduce((sum, team) => sum + team.stats.goalsFor, 0);
  const totalPoints = teams.reduce((sum, team) => sum + team.stats.points, 0);
  const hotTeam = [...teams].sort(
    (a, b) => scoreForm(b) - scoreForm(a) || b.stats.points - a.stats.points,
  )[0];

  return {
    league: {
      ...config,
      sourceName: scoreboard.leagues?.[0]?.name || config.fullName,
      season: statistics?.season?.displayName || "2025/26",
      teamCount: teams.length,
      matchCount: games.length,
      totalGoals,
      averageGoals: Math.round(totalGoals / Math.max(teams.length, 1)),
      averagePoints: Math.round(totalPoints / Math.max(teams.length, 1)),
      leaderSlug: teams[0]?.slug || null,
      leaderName: teams[0]?.name || "TBD",
      hotTeamSlug: hotTeam?.slug || null,
      hotTeamName: hotTeam?.name || "TBD",
      standingsUrl: `https://www.espn.com/soccer/table/_/league/${config.espnCode}`,
      scoreboardUrl: `https://www.espn.com/soccer/scoreboard/_/league/${config.espnCode}`,
    },
    teams,
    matchdays,
  };
}

const built = await Promise.all(leagueConfigs.map(buildLeague));
const leagues = built.map((item) => item.league);
const teams = built.flatMap((item) => item.teams);
const matchdays = built.flatMap((item) => item.matchdays);

const seasonMeta = {
  name: "2025/26 European top leagues",
  sourceUpdatedAt: new Date().toISOString(),
  dateWindow,
  sources: leagueConfigs.map((league) => ({
    league: league.name,
    standings: `https://site.api.espn.com/apis/v2/sports/soccer/${league.espnCode}/standings`,
    scoreboard: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard?dates=${dateWindow}&limit=1000`,
    statistics: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/statistics`,
  })),
};

const file = `// Generated from free ESPN soccer standings, scoreboard, and leader APIs.
// Run-time helpers below keep every page league-aware.
export const seasonMeta = ${JSON.stringify(seasonMeta, null, 2)};

export const leagues = ${JSON.stringify(leagues, null, 2)};

export const teams = ${JSON.stringify(teams, null, 2)};

export const allTeams = teams;

export const matchdays = ${JSON.stringify(matchdays, null, 2)};

export const allMatchdays = matchdays;

export const leaguesBySlug = Object.fromEntries(
  leagues.map((league) => [league.slug, league]),
);

export const teamsBySlug = Object.fromEntries(
  teams.map((team) => [team.slug, team]),
);

export function getLeagueBySlug(slug) {
  return leaguesBySlug[slug];
}

export function getTeamBySlug(slug) {
  return teamsBySlug[slug];
}

export function getTeamsByLeague(leagueSlug) {
  if (!leagueSlug || leagueSlug === "all") {
    return teams;
  }

  return teams.filter((team) => team.leagueSlug === leagueSlug);
}

export function getMatchdaysByLeague(leagueSlug) {
  if (!leagueSlug || leagueSlug === "all") {
    return matchdays;
  }

  return matchdays.filter((matchday) => matchday.leagueSlug === leagueSlug);
}

export function getTeamFixtures(slug) {
  return matchdays.flatMap((matchday) =>
    matchday.games
      .filter((game) => game.homeSlug === slug || game.awaySlug === slug)
      .map((game) => ({
        ...game,
        matchday: matchday.week,
      })),
  );
}

export function getFeaturedGames(limit = 6, leagueSlug = "all") {
  const games = getMatchdaysByLeague(leagueSlug)
    .flatMap((matchday) =>
      matchday.games.map((game) => ({ ...game, matchday: matchday.week })),
    )
    .sort((a, b) => String(b.isoDate).localeCompare(String(a.isoDate)));

  return games.slice(0, limit);
}
`;

await writeFile(outputPath, file);

console.log(
  JSON.stringify(
    {
      leagues: leagues.map(
        (league) => `${league.name}: ${league.teamCount} teams, ${league.matchCount} matches`,
      ),
      teams: teams.length,
      matchdays: matchdays.length,
    },
    null,
    2,
  ),
);
