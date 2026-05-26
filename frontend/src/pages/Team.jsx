import { Link, useParams } from "react-router-dom";
import { getLeagueBySlug, getTeamBySlug, getTeamFixtures } from "../data/footballData";

const formStyles = {
  W: "bg-green-400 text-black",
  D: "bg-yellow-300 text-black",
  L: "bg-red-500 text-white",
};

function getWinRate(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.wins / team.stats.played) * 100);
}

function getGoalRate(team) {
  if (!team.stats.played) {
    return "0.00";
  }

  return (team.stats.goalsFor / team.stats.played).toFixed(2);
}

function getCleanSheetRate(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.cleanSheets / team.stats.played) * 100);
}

function FormPills({ form }) {
  return (
    <div className="flex gap-2 text-lg font-black">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${formStyles[result]}`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function MetricCard({ label, value, detail, tone = "text-cyan-300" }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5 transition hover:border-cyan-400">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-2 text-4xl font-black ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
    </article>
  );
}

function Team() {
  const { teamName } = useParams();
  const team = getTeamBySlug(teamName);

  if (!team) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-[#0f0f13] p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-300">
            Team not found
          </p>
          <h1 className="mb-4 text-4xl font-black capitalize">
            {teamName?.replaceAll("-", " ")}
          </h1>
          <Link to="/teams" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Back to teams
          </Link>
        </div>
      </div>
    );
  }

  const league = getLeagueBySlug(team.leagueSlug);
  const fixtures = getTeamFixtures(teamName).sort(
    (a, b) => String(a.isoDate).localeCompare(String(b.isoDate)),
  );
  const latestFixtures = fixtures
    .filter((game) => game.status !== "Scheduled")
    .slice(-6)
    .reverse();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section
        className="relative overflow-hidden border-b border-zinc-900 px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background: `radial-gradient(circle at 16% 10%, ${team.color}44, transparent 30%), linear-gradient(135deg, #050505, #0f0f13 60%, #050505)`,
        }}
      >
        <div className="zero-hero-mesh absolute inset-0 opacity-35" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              to="/teams"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-300"
            >
              Teams
            </Link>
            <Link
              to={`/league/${team.leagueSlug}`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-300"
            >
              {team.leagueName}
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-wide text-cyan-300">
                {team.leagueName} club analytics
              </p>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <span
                  className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl border border-white/10 p-5 shadow-2xl"
                  style={{ backgroundColor: team.color }}
                >
                  <img
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className="h-24 w-24 object-contain"
                  />
                </span>
                <div>
                  <h1 className="text-5xl font-black leading-none sm:text-7xl">
                    {team.name}
                  </h1>
                  <p className="mt-4 text-lg text-zinc-300">
                    {team.stats.position} in {team.leagueName} - {team.stats.points} points - {team.note || team.country}
                  </p>
                </div>
              </div>
            </div>

            <article className="rounded-3xl border border-cyan-400/20 bg-black/45 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                ZeroPlay pulse
              </p>
              <h2 className="mt-2 text-3xl font-black">{getWinRate(team)}% win rate</h2>
              <p className="mt-4 text-zinc-400">
                {team.name} are scoring {getGoalRate(team)} goals per match with a {getCleanSheetRate(team)}% clean-sheet rate.
              </p>
              <div className="mt-5">
                <FormPills form={team.form} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Position" value={team.stats.position} detail={team.leagueName} />
          <MetricCard label="Points" value={team.stats.points} detail={`${team.stats.wins} wins`} />
          <MetricCard label="Goal diff" value={team.stats.goalDifference} detail={`${team.stats.goalsFor}/${team.stats.goalsAgainst}`} />
          <MetricCard label="Clean sheets" value={team.stats.cleanSheets} detail={`${getCleanSheetRate(team)}% of matches`} />
        </section>

        <section className="mb-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
              Team leaders
            </p>
            <h2 className="text-3xl font-black">Player Signal</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Top scorer</p>
                <p className="mt-2 text-2xl font-black">{team.topScorer.name}</p>
                <p className="mt-2 text-cyan-300">{team.topScorer.goals} goals</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Top creator</p>
                <p className="mt-2 text-2xl font-black">{team.topAssist.name}</p>
                <p className="mt-2 text-cyan-300">{team.topAssist.assists} assists</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
              Next phase
            </p>
            <h2 className="text-3xl font-black">Fixture Context</h2>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-sm text-zinc-500">Next match</p>
              <p className="mt-2 text-3xl font-black">{team.nextMatch.opponent}</p>
              <p className="mt-3 text-cyan-300">{team.nextMatch.date}</p>
              <p className="mt-1 text-sm text-zinc-400">{team.nextMatch.venue}</p>
            </div>
          </article>
        </section>

        <section className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
            AI Match Intelligence
          </p>
          <h2 className="text-3xl font-black leading-tight">
            {team.name} sit {team.stats.position} with {team.stats.goalsFor} goals for and {team.stats.goalsAgainst} against, giving them a {team.stats.goalDifference >= 0 ? "+" : ""}{team.stats.goalDifference} differential profile.
          </h2>
          <p className="mt-4 max-w-3xl text-zinc-400">
            This page now reads from the same league-aware data layer as Games, Teams, and League pages, so a La Liga or Serie A club keeps its own table and fixture context.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
            <h2 className="mb-5 text-2xl font-black text-purple-300">
              Recent Form
            </h2>
            <FormPills form={team.form} />
            <div className="mt-6 space-y-3 text-sm text-zinc-300">
              <p>Played: {team.stats.played}</p>
              <p>Wins: {team.stats.wins}</p>
              <p>Draws: {team.stats.draws}</p>
              <p>Losses: {team.stats.losses}</p>
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-cyan-300">Latest Games</h2>
              <Link
                to={`/league/${team.leagueSlug}`}
                className="text-sm font-bold text-cyan-300"
              >
                League hub
              </Link>
            </div>

            <div className="space-y-3">
              {latestFixtures.map((game) => {
                const homeTeam = getTeamBySlug(game.homeSlug);
                const awayTeam = getTeamBySlug(game.awaySlug);

                return (
                  <div
                    key={game.id}
                    className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-zinc-800 bg-black px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {homeTeam?.name} vs {awayTeam?.name}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {game.matchday} - {game.kickoff}
                      </p>
                    </div>
                    <p className="text-xl font-black text-cyan-300">{game.score}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        {team.espnUrl || league?.standingsUrl ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {team.espnUrl ? (
              <a
                href={team.espnUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-black transition hover:bg-cyan-200"
              >
                ESPN Clubhouse
              </a>
            ) : null}
            {league?.standingsUrl ? (
              <a
                href={league.standingsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-zinc-700 px-5 py-3 font-black transition hover:border-cyan-300 hover:text-cyan-300"
              >
                League Standings
              </a>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default Team;
