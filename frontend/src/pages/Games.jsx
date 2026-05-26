import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getMatchdaysByLeague,
  getTeamBySlug,
  getTeamsByLeague,
  leagues,
} from "../data/footballData";

function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLeague = searchParams.get("league");
  const activeLeague = leagues.some((league) => league.slug === requestedLeague)
    ? requestedLeague
    : "premier-league";
  const [selectedMatchdayId, setSelectedMatchdayId] = useState(
    getMatchdaysByLeague(activeLeague)[0]?.id || "",
  );

  const selectedLeague =
    leagues.find((league) => league.slug === activeLeague) || leagues[0];
  const leagueMatchdays = useMemo(
    () => getMatchdaysByLeague(activeLeague),
    [activeLeague],
  );
  const leagueTeams = useMemo(() => getTeamsByLeague(activeLeague), [activeLeague]);
  const rawMatchdayIndex = leagueMatchdays.findIndex(
    (matchday) => matchday.id === selectedMatchdayId,
  );
  const selectedMatchdayIndex = rawMatchdayIndex >= 0 ? rawMatchdayIndex : 0;
  const selectedMatchday =
    leagueMatchdays[selectedMatchdayIndex] || leagueMatchdays[0];
  const tickerTeams = [...leagueTeams, ...leagueTeams];
  const canGoBack = selectedMatchdayIndex > 0;
  const canGoForward = selectedMatchdayIndex < leagueMatchdays.length - 1;

  function selectLeague(leagueSlug) {
    const nextMatchday = getMatchdaysByLeague(leagueSlug)[0];
    setSearchParams({ league: leagueSlug });
    setSelectedMatchdayId(nextMatchday?.id || "");
  }

  function moveMatchday(direction) {
    const nextIndex = selectedMatchdayIndex + direction;

    if (nextIndex >= 0 && nextIndex < leagueMatchdays.length) {
      setSelectedMatchdayId(leagueMatchdays[nextIndex].id);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section
        className="border-b border-zinc-900 px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${selectedLeague.accent}22, #050505 42%, #0f0f13)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-cyan-300">
                {selectedLeague.season}
              </p>
              <h1 className="text-4xl font-black sm:text-6xl">
                {selectedLeague.name} match center
              </h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Browse every matchweek, scoreline, venue, and club detail for {selectedLeague.name}.
              </p>
            </div>

            <img
              src={selectedLeague.logo}
              alt={`${selectedLeague.name} logo`}
              className="h-24 w-24 object-contain opacity-90"
            />
          </div>

          <div className="zero-smooth-scroll mt-8 flex gap-3 overflow-x-auto pb-2">
            {leagues.map((league) => (
              <button
                key={league.slug}
                type="button"
                onClick={() => selectLeague(league.slug)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all duration-300 ${
                  activeLeague === league.slug
                    ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_26px_rgba(34,211,238,0.22)]"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-cyan-300 hover:text-white"
                }`}
              >
                {league.code} - {league.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
              {selectedLeague.teamCount} clubs - {selectedLeague.matchCount} fixtures
            </p>
            <h2 className="text-3xl font-black">Games by matchweek</h2>
          </div>

          {selectedMatchday ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2">
              <button
                type="button"
                onClick={() => moveMatchday(-1)}
                disabled={!canGoBack}
                title="Previous matchweek"
                className="h-10 w-10 rounded-lg bg-black text-lg font-bold text-zinc-200 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:text-zinc-700"
              >
                {"<"}
              </button>

              <label htmlFor="matchweek-select" className="sr-only">
                Matchweek
              </label>
              <select
                id="matchweek-select"
                value={selectedMatchday.id}
                onChange={(event) => setSelectedMatchdayId(event.target.value)}
                className="h-10 rounded-lg border border-zinc-700 bg-black px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
              >
                {leagueMatchdays.map((matchday) => (
                  <option key={matchday.id} value={matchday.id}>
                    {matchday.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => moveMatchday(1)}
                disabled={!canGoForward}
                title="Next matchweek"
                className="h-10 w-10 rounded-lg bg-black text-lg font-bold text-zinc-200 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:text-zinc-700"
              >
                {">"}
              </button>
            </div>
          ) : null}
        </div>

        <section
          id="teams"
          className="mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-black py-4"
        >
          <div className="team-ticker">
            <div className="team-ticker-track flex gap-4 px-4">
              {tickerTeams.map((team, index) => (
                <Link
                  key={`${team.slug}-${index}`}
                  to={`/team/${team.slug}`}
                  className="flex min-w-56 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:border-cyan-400 hover:bg-zinc-800"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10"
                    style={{ backgroundColor: team.color }}
                  >
                    <img
                      src={team.logo}
                      alt={`${team.name} logo`}
                      className="h-10 w-10 object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{team.name}</span>
                    <span className="text-xs text-zinc-400">
                      {team.stats.position} - {team.shortName}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {selectedMatchday ? (
          <>
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">{selectedMatchday.label}</h2>
                <p className="text-sm text-zinc-400">
                  {selectedMatchday.week} - {selectedMatchday.dateRange}
                </p>
              </div>
              <p className="text-sm font-semibold text-cyan-300">
                {selectedMatchday.games.length} games
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {selectedMatchday.games.map((game) => {
                const homeTeam = getTeamBySlug(game.homeSlug);
                const awayTeam = getTeamBySlug(game.awaySlug);

                return (
                  <article
                    key={game.id}
                    className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                  >
                    <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      <span>{game.kickoff}</span>
                      <span className="rounded bg-zinc-800 px-2 py-1 text-cyan-300">
                        {game.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      <Link
                        to={`/team/${homeTeam?.slug}`}
                        className="flex min-w-0 items-center gap-3 text-left hover:text-cyan-300"
                      >
                        <img
                          src={homeTeam?.logo}
                          alt={`${homeTeam?.name} logo`}
                          className="h-10 w-10 object-contain"
                        />
                        <span className="truncate font-semibold">{homeTeam?.name}</span>
                      </Link>

                      <div className="rounded-xl bg-black px-4 py-2 text-center text-2xl font-black">
                        {game.score}
                      </div>

                      <Link
                        to={`/team/${awayTeam?.slug}`}
                        className="flex min-w-0 items-center justify-end gap-3 text-right hover:text-cyan-300"
                      >
                        <span className="truncate font-semibold">{awayTeam?.name}</span>
                        <img
                          src={awayTeam?.logo}
                          alt={`${awayTeam?.name} logo`}
                          className="h-10 w-10 object-contain"
                        />
                      </Link>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
                      <span>{game.venue}</span>
                      <span>{game.leagueName}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-8 text-zinc-400">
            No fixtures found for this league.
          </div>
        )}
      </main>
    </div>
  );
}

export default Games;
