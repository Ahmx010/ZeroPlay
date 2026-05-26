import { Link, useParams } from "react-router-dom";
import {
  getLeagueBySlug,
  getMatchdaysByLeague,
  getTeamBySlug,
  getTeamsByLeague,
  leagues,
} from "../data/footballData";

const resultScore = {
  W: 3,
  D: 1,
  L: 0,
};

const formStyles = {
  W: "bg-green-400 text-black",
  D: "bg-yellow-300 text-black",
  L: "bg-red-500 text-white",
};

function getFormScore(team) {
  return team.form.reduce((sum, result) => sum + (resultScore[result] || 0), 0);
}

function getWinRate(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.wins / team.stats.played) * 100);
}

function FormPills({ form }) {
  return (
    <div className="flex gap-1.5">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-black ${formStyles[result]}`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
    </article>
  );
}

function League() {
  const { leagueName } = useParams();
  const league = getLeagueBySlug(leagueName);

  if (!league) {
    return (
      <div className="min-h-screen bg-[#050505] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-[#0f0f13] p-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-red-300">
            League not found
          </p>
          <h1 className="text-4xl font-black capitalize">
            {leagueName?.replaceAll("-", " ")}
          </h1>
          <Link to="/" className="mt-6 inline-flex font-bold text-cyan-300">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const teams = getTeamsByLeague(league.slug).sort(
    (a, b) => a.stats.rank - b.stats.rank,
  );
  const matchdays = getMatchdaysByLeague(league.slug);
  const recentGames = matchdays
    .flatMap((matchday) =>
      matchday.games.map((game) => ({ ...game, matchday: matchday.week })),
    )
    .sort((a, b) => String(b.isoDate).localeCompare(String(a.isoDate)))
    .slice(0, 6);
  const hotTeams = [...teams]
    .sort((a, b) => getFormScore(b) - getFormScore(a) || b.stats.points - a.stats.points)
    .slice(0, 5);
  const topAttack = [...teams].sort((a, b) => b.stats.goalsFor - a.stats.goalsFor)[0];
  const topDefense = [...teams].sort(
    (a, b) => a.stats.goalsAgainst - b.stats.goalsAgainst,
  )[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section
        className="relative overflow-hidden border-b border-zinc-900 px-6 py-14"
        style={{
          background: `radial-gradient(circle at 20% 10%, ${league.accent}33, transparent 30%), linear-gradient(135deg, #050505, #0f0f13 58%, #050505)`,
        }}
      >
        <div className="zero-hero-mesh absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-wide text-cyan-300">
                {league.country} football intelligence
              </p>
              <h1 className="text-5xl font-black leading-none sm:text-7xl">
                {league.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                Standings, fixtures, form, team leaders, and ZeroPlay momentum for the full {league.season}.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <img
                src={league.logo}
                alt={`${league.name} logo`}
                className="h-28 w-28 object-contain"
              />
              <div>
                <p className="text-sm text-zinc-500">Leader</p>
                <Link
                  to={`/team/${league.leaderSlug}`}
                  className="text-2xl font-black hover:text-cyan-300"
                >
                  {league.leaderName}
                </Link>
                <p className="mt-1 text-sm text-cyan-300">
                  {league.teamCount} clubs - {league.matchCount} matches
                </p>
              </div>
            </div>
          </div>

          <div className="zero-smooth-scroll mt-10 flex gap-3 overflow-x-auto pb-2">
            {leagues.map((item) => (
              <Link
                key={item.slug}
                to={`/league/${item.slug}`}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all duration-300 ${
                  item.slug === league.slug
                    ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_26px_rgba(34,211,238,0.22)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-cyan-300 hover:text-white"
                }`}
              >
                {item.code} - {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10 grid gap-5 md:grid-cols-4">
          <MetricCard
            label="Average goals"
            value={league.averageGoals}
            detail="Per club this season"
          />
          <MetricCard
            label="Average points"
            value={league.averagePoints}
            detail="Table strength index"
          />
          <MetricCard
            label="Top attack"
            value={topAttack?.stats.goalsFor || 0}
            detail={topAttack?.name || "TBD"}
          />
          <MetricCard
            label="Tightest defense"
            value={topDefense?.stats.goalsAgainst || 0}
            detail={topDefense?.name || "TBD"}
          />
        </section>

        <section className="mb-10 grid min-w-0 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="min-w-0 rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                  Live form layer
                </p>
                <h2 className="mt-1 text-3xl font-black">Trending Clubs</h2>
              </div>
              <Link to="/teams" className="text-sm font-bold text-cyan-300">
                Teams
              </Link>
            </div>

            <div className="space-y-3">
              {hotTeams.map((team) => (
                <Link
                  key={team.slug}
                  to={`/team/${team.slug}`}
                  className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black p-4 transition hover:border-cyan-400"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <img src={team.logo} alt="" className="h-11 w-11 object-contain" />
                    <span className="min-w-0">
                      <span className="block truncate font-black">{team.name}</span>
                      <span className="text-sm text-zinc-500">
                        {team.stats.position} - {team.stats.points} pts
                      </span>
                    </span>
                  </span>
                  <FormPills form={team.form} />
                </Link>
              ))}
            </div>
          </article>

          <article className="min-w-0 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
              AI League Read
            </p>
            <h2 className="break-words text-3xl font-black leading-tight">
              {topAttack?.name} are setting the attacking ceiling, while {topDefense?.name} are controlling the defensive floor.
            </h2>
            <p className="mt-5 text-zinc-400">
              ZeroPlay compares league position, goals, defensive resistance, and five-match form so each league gets its own story instead of borrowing Premier League numbers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={league.standingsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-black transition hover:bg-cyan-200"
              >
                ESPN Standings
              </a>
              <Link
                to={`/games?league=${league.slug}`}
                className="rounded-xl border border-zinc-700 px-5 py-3 font-black transition hover:border-cyan-300 hover:text-cyan-300"
              >
                Match Center
              </Link>
            </div>
          </article>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                Table intelligence
              </p>
              <h2 className="mt-1 text-3xl font-black">Standings</h2>
            </div>
            <p className="text-sm text-zinc-500">{teams.length} clubs</p>
          </div>

          <div className="zero-smooth-scroll overflow-x-auto rounded-3xl border border-zinc-800 bg-[#0f0f13]">
            <div className="grid min-w-[720px] grid-cols-[56px_1.4fr_80px_90px_90px_90px] gap-4 border-b border-zinc-800 px-5 py-3 text-xs font-black uppercase tracking-wide text-zinc-500">
              <span>Rank</span>
              <span>Club</span>
              <span>Pts</span>
              <span>W-D-L</span>
              <span>GF/GA</span>
              <span>Form</span>
            </div>

            {teams.map((team) => (
              <Link
                key={team.slug}
                to={`/team/${team.slug}`}
                className="grid min-w-[720px] grid-cols-[56px_1.4fr_80px_90px_90px_90px] items-center gap-4 border-b border-zinc-900 px-5 py-4 transition last:border-b-0 hover:bg-white/[0.03]"
              >
                <span className="font-black text-zinc-400">{team.stats.position}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <img src={team.logo} alt="" className="h-9 w-9 object-contain" />
                  <span className="min-w-0">
                    <span className="block truncate font-black">{team.name}</span>
                    <span className="text-xs text-zinc-500">{team.note || team.country}</span>
                  </span>
                </span>
                <span className="font-black text-cyan-300">{team.stats.points}</span>
                <span className="text-sm text-zinc-300">
                  {team.stats.wins}-{team.stats.draws}-{team.stats.losses}
                </span>
                <span className="text-sm text-zinc-300">
                  {team.stats.goalsFor}/{team.stats.goalsAgainst}
                </span>
                <span className="text-sm font-black text-zinc-300">
                  {getWinRate(team)}%
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                Recent match feed
              </p>
              <h2 className="mt-1 text-3xl font-black">Latest Results</h2>
            </div>
            <Link to="/games" className="text-sm font-bold text-cyan-300">
              View all matchweeks
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recentGames.map((game) => {
              const homeTeam = getTeamBySlug(game.homeSlug);
              const awayTeam = getTeamBySlug(game.awaySlug);

              return (
                <article
                  key={game.id}
                  className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5 transition hover:border-cyan-400"
                >
                  <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-zinc-500">
                    <span>{game.matchday}</span>
                    <span>{game.status}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <Link
                      to={`/team/${homeTeam?.slug}`}
                      className="min-w-0 font-black hover:text-cyan-300"
                    >
                      {homeTeam?.name}
                    </Link>
                    <span className="rounded-xl bg-black px-4 py-2 text-2xl font-black text-cyan-300">
                      {game.score}
                    </span>
                    <Link
                      to={`/team/${awayTeam?.slug}`}
                      className="min-w-0 text-right font-black hover:text-cyan-300"
                    >
                      {awayTeam?.name}
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-zinc-500">
                    {game.kickoff} - {game.venue}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default League;
