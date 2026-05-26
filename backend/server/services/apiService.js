const leagues = {
  "premier-league": "eng.1",
  "la-liga": "esp.1",
  "serie-a": "ita.1",
  bundesliga: "ger.1",
  "ligue-1": "fra.1",
};

const leagueNames = {
  "premier-league": "Premier League",
  "la-liga": "La Liga",
  "serie-a": "Serie A",
  bundesliga: "Bundesliga",
  "ligue-1": "Ligue 1",
};

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
};
