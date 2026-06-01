const soccerLeagues = [
  {
    slug: "premier-league",
    code: "eng.1",
    name: "Premier League",
    country: "England",
  },
  {
    slug: "la-liga",
    code: "esp.1",
    name: "La Liga",
    country: "Spain",
  },
  {
    slug: "serie-a",
    code: "ita.1",
    name: "Serie A",
    country: "Italy",
  },
  {
    slug: "bundesliga",
    code: "ger.1",
    name: "Bundesliga",
    country: "Germany",
  },
  {
    slug: "ligue-1",
    code: "fra.1",
    name: "Ligue 1",
    country: "France",
  },
];

const leagues = Object.fromEntries(
  soccerLeagues.map((league) => [league.slug, league.code])
);

const leagueNames = Object.fromEntries(
  soccerLeagues.map((league) => [league.slug, league.name])
);

function getSoccerLeagues() {
  return soccerLeagues.map((league) => ({ ...league }));
}

async function getLeagueGames(leagueName) {
  try {
    const leagueKeys = leagueName ? [leagueName] : Object.keys(leagues);
    const validLeagueKeys = leagueKeys.filter((key) => leagues[key]);

    if (validLeagueKeys.length === 0) {
      return [];
    }

    const leagueGameLists = await Promise.all(
      validLeagueKeys.map(async (key) => {
        const leagueCode = leagues[key];
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=20250801-20260630&limit=1000`
        );

        const data = await response.json();
        const events = data.events || [];

        return events.map((game) => {
          const competition = game.competitions?.[0] || {};
          const competitors = competition.competitors || [];
          const home =
            competitors.find((competitor) => competitor.homeAway === "home") ||
            competitors[0];
          const away =
            competitors.find((competitor) => competitor.homeAway === "away") ||
            competitors[1];
          const statusType = competition.status?.type || game.status?.type || {};
          const isScored = statusType.completed || statusType.state === "in";

          return {
            id: `${key}-${game.id}`,
            homeTeam: home?.team?.displayName,
            awayTeam: away?.team?.displayName,
            score: isScored ? `${home?.score || 0}-${away?.score || 0}` : "vs",
            status: statusType.completed
              ? "Final"
              : statusType.state === "in"
                ? statusType.shortDetail || "Live"
                : "Scheduled",
            date: game.date,
            kickoff: game.date,
            venue:
              competition.venue?.fullName || game.venue?.fullName || "TBD",
            league: leagueNames[key] || data.leagues?.[0]?.name || key,
            leagueSlug: key,
          };
        });
      })
    );

    return leagueGameLists.flat();
  } catch (error) {
    console.error("Error fetching league games:", error);
    return [];
  }
}

module.exports = {
  getLeagueGames,
  getSoccerLeagues,
};
