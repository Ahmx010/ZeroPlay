import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { leagues, teams } from "../data/footballData";

const resultScore = {
  W: 3,
  D: 1,
  L: 0,
};

const performanceFilters = [
  { id: "all", label: "All" },
  { id: "top-four", label: "Top 4" },
  { id: "europe", label: "Europe Chase" },
  { id: "hot-form", label: "Hot Form" },
  { id: "attack", label: "Attack" },
  { id: "defense", label: "Defense" },
  { id: "pressure", label: "Under Pressure" },
];

function getPositionNumber(team) {
  return Number.parseInt(team.stats.position, 10) || 99;
}

function formatName(value) {
  return value
    .replaceAll("Ã¶", "o")
    .replaceAll("Ã£", "a")
    .replaceAll("Ã©", "e")
    .replaceAll("Ãº", "u")
    .replaceAll("Ã­", "i");
}

function getFormScore(team) {
  const total = team.form.reduce((sum, result) => sum + (resultScore[result] || 0), 0);
  return total / (team.form.length * 3);
}

function getWinRate(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.wins / team.stats.played) * 100);
}

function getAttackIndex(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.goalsFor / team.stats.played) * 90);
}

function getControlIndex(team) {
  const defensiveScore = Math.max(0, 100 - team.stats.goalsAgainst);
  const formScore = Math.round(getFormScore(team) * 100);
  return Math.round((defensiveScore + formScore + getWinRate(team)) / 3);
}

function getMomentumLabel(team) {
  const score = getFormScore(team);

  if (score >= 0.72) {
    return "Surging";
  }

  if (score >= 0.45) {
    return "Stable";
  }

  return "Volatile";
}

function getIndicatorColor(team) {
  const score = getFormScore(team);

  if (score >= 0.72) {
    return "bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]";
  }

  if (score < 0.35) {
    return "bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.65)]";
  }

  return "bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]";
}

function getInsight(team) {
  const formScore = Math.round(getFormScore(team) * 100);
  const attackIndex = getAttackIndex(team);

  if (formScore >= 75) {
    return `${team.name} are trending up with a ${formScore}% form pulse across the last five games.`;
  }

  if (team.stats.goalsAgainst <= 35) {
    return `${team.name} are protecting space well, allowing only ${team.stats.goalsAgainst} goals this season.`;
  }

  if (attackIndex >= 140) {
    return `${team.name} carry one of the sharpest attacking profiles in the league.`;
  }

  return `${team.name} need cleaner late-game control to convert more possession into points.`;
}

function getTrendBars(team) {
  return team.form.map((result, index) => {
    const height = result === "W" ? "h-9" : result === "D" ? "h-6" : "h-3";
    const color = result === "W" ? "bg-green-400" : result === "D" ? "bg-yellow-300" : "bg-red-500";

    return (
      <span
        key={`${team.slug}-trend-${index}`}
        className={`w-2 rounded-full ${height} ${color}`}
      />
    );
  });
}

function FormPills({ form }) {
  return (
    <div className="flex gap-1.5">
      {form.map((result, index) => {
        const className =
          result === "W"
            ? "bg-green-400 text-black"
            : result === "D"
              ? "bg-yellow-300 text-black"
              : "bg-red-500 text-white";

        return (
          <span
            key={`${result}-${index}`}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-black ${className}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

function MetricBar({ label, value, color = "bg-cyan-400" }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
        <span>{label}</span>
        <span className="text-zinc-200">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RadarGraph({ team }) {
  const attack = Math.min(getAttackIndex(team), 100);
  const defense = Math.min(Math.round((team.stats.cleanSheets / team.stats.played) * 260), 100);
  const form = Math.round(getFormScore(team) * 100);
  const wins = getWinRate(team);
  const points = Math.min(Math.round((team.stats.points / 90) * 100), 100);
  const values = [attack, defense, form, wins, points];
  const pointsMap = [
    [50, 8],
    [91, 38],
    [75, 88],
    [25, 88],
    [9, 38],
  ];
  const polygon = values
    .map((value, index) => {
      const [x, y] = pointsMap[index];
      const nextX = 50 + ((x - 50) * value) / 100;
      const nextY = 50 + ((y - 50) * value) / 100;
      return `${nextX},${nextY}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-44 w-44">
      <polygon points="50,8 91,38 75,88 25,88 9,38" fill="none" stroke="rgba(255,255,255,0.12)" />
      <polygon points="50,22 77,42 68,75 32,75 23,42" fill="none" stroke="rgba(255,255,255,0.08)" />
      <polygon points={polygon} fill="rgba(34,211,238,0.22)" stroke="rgb(34,211,238)" strokeWidth="2" />
      <circle cx="50" cy="50" r="2" fill="rgb(34,211,238)" />
    </svg>
  );
}

function TeamCard({ team }) {
  const position = getPositionNumber(team);
  const trend = getMomentumLabel(team);

  return (
    <Link
      to={`/team/${team.slug}`}
      className="group relative min-h-[300px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-[0_0_36px_rgba(34,211,238,0.14)]"
    >
      <span className={`absolute left-0 top-5 h-24 w-1 rounded-r-full ${getIndicatorColor(team)}`} />
      <img
        src={team.logo}
        alt=""
        className="absolute -right-8 top-8 h-36 w-36 object-contain opacity-10 transition duration-300 group-hover:scale-110 group-hover:opacity-20"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 p-2"
          style={{ backgroundColor: team.color }}
        >
          <img src={team.logo} alt={`${team.name} logo`} className="h-12 w-12 object-contain" />
        </span>

        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
          {trend}
        </span>
      </div>

      <div className="relative mt-10">
        <p className="mb-2 text-xs font-bold uppercase text-zinc-500">{team.leagueName}</p>
        <h2 className="text-3xl font-black leading-tight text-white">{team.name}</h2>
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">Position</p>
          <p className="mt-1 font-black text-white">{position}</p>
        </div>
        <div>
          <p className="text-zinc-500">Goals</p>
          <p className="mt-1 font-black text-white">{team.stats.goalsFor}</p>
        </div>
        <div>
          <p className="text-zinc-500">Points</p>
          <p className="mt-1 font-black text-white">{team.stats.points}</p>
        </div>
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <FormPills form={team.form} />
        <div className="flex h-10 items-end gap-1.5">{getTrendBars(team)}</div>
      </div>
    </Link>
  );
}

function TrendingClub({ team, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(team.slug)}
      className={`min-w-[230px] rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
        isActive
          ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 p-2"
          style={{ backgroundColor: team.color }}
        >
          <img src={team.logo} alt="" className="h-10 w-10 object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-black">{team.name}</span>
          <span className="text-sm text-zinc-400">
            {team.stats.position} - {getMomentumLabel(team)}
          </span>
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <FormPills form={team.form} />
        <span className="text-sm font-bold text-cyan-300">{team.stats.points} pts</span>
      </div>
    </button>
  );
}

function PlayerSpotlightCard({ player, label }) {
  const playerName = formatName(player.name);

  return (
    <article className="min-w-[260px] rounded-2xl border border-zinc-800 bg-[#0f0f13] p-5">
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-xl font-black"
          style={{ backgroundColor: player.team.color }}
        >
          {playerName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xl font-black">{playerName}</span>
          <span className="text-sm text-zinc-400">{player.team.name}</span>
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-black p-3">
          <p className="text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{player.value}</p>
        </div>
        <div className="rounded-xl bg-black p-3">
          <p className="text-zinc-500">Rating</p>
          <p className="mt-1 text-2xl font-black text-cyan-300">{player.rating}</p>
        </div>
      </div>
    </article>
  );
}

function Teams() {
  const [query, setQuery] = useState("");
  const [activeLeague, setActiveLeague] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [spotlightSlug, setSpotlightSlug] = useState("premier-league-arsenal");

  const leagueOptions = useMemo(
    () => [{ slug: "all", name: "All Leagues", code: "TOP5" }, ...leagues],
    [],
  );

  const leagueTeams = useMemo(() => {
    if (activeLeague === "all") {
      return teams;
    }

    return teams.filter((team) => team.leagueSlug === activeLeague);
  }, [activeLeague]);

  const sortedTeams = useMemo(
    () =>
      [...leagueTeams].sort(
        (a, b) =>
          getPositionNumber(a) - getPositionNumber(b) ||
          a.leagueName.localeCompare(b.leagueName),
      ),
    [leagueTeams],
  );

  const trendingTeams = useMemo(
    () =>
      [...leagueTeams]
        .sort((a, b) => {
          const formDelta = getFormScore(b) - getFormScore(a);
          return formDelta || b.stats.points - a.stats.points;
        })
        .slice(0, 10),
    [leagueTeams],
  );

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedTeams.filter((team) => {
      const position = getPositionNumber(team);
      const searchMatches =
        normalizedQuery.length === 0 ||
        team.name.toLowerCase().includes(normalizedQuery) ||
        team.shortName.toLowerCase().includes(normalizedQuery) ||
        team.leagueName.toLowerCase().includes(normalizedQuery) ||
        team.topScorer.name.toLowerCase().includes(normalizedQuery) ||
        team.topAssist.name.toLowerCase().includes(normalizedQuery);

      if (!searchMatches) {
        return false;
      }

      if (activeFilter === "top-four") {
        return position <= 4;
      }

      if (activeFilter === "europe") {
        return position <= 7;
      }

      if (activeFilter === "hot-form") {
        return getFormScore(team) >= 0.65;
      }

      if (activeFilter === "attack") {
        return team.stats.goalsFor >= 55;
      }

      if (activeFilter === "defense") {
        return team.stats.cleanSheets >= 10 || team.stats.goalsAgainst <= 45;
      }

      if (activeFilter === "pressure") {
        return position >= 16 || getFormScore(team) < 0.35;
      }

      return true;
    });
  }, [activeFilter, query, sortedTeams]);

  const spotlightTeam =
    sortedTeams.find((team) => team.slug === spotlightSlug) ||
    trendingTeams[0] ||
    sortedTeams[0] ||
    teams[0];

  const playerSpotlights = useMemo(() => {
    const scorers = [...leagueTeams]
      .sort((a, b) => b.topScorer.goals - a.topScorer.goals)
      .slice(0, 5)
      .map((team) => ({
        name: team.topScorer.name,
        team,
        value: team.topScorer.goals,
        rating: (7.4 + team.topScorer.goals / 20).toFixed(1),
        type: "Goals",
      }));
    const creators = [...leagueTeams]
      .sort((a, b) => b.topAssist.assists - a.topAssist.assists)
      .slice(0, 3)
      .map((team) => ({
        name: team.topAssist.name,
        team,
        value: team.topAssist.assists,
        rating: (7.2 + team.topAssist.assists / 18).toFixed(1),
        type: "Assists",
      }));

    return [...scorers, ...creators];
  }, [leagueTeams]);

  const leagueAverages = useMemo(() => {
    const goals = leagueTeams.reduce((sum, team) => sum + team.stats.goalsFor, 0);
    const points = leagueTeams.reduce((sum, team) => sum + team.stats.points, 0);
    const cleanSheets = leagueTeams.reduce((sum, team) => sum + team.stats.cleanSheets, 0);
    const divisor = Math.max(leagueTeams.length, 1);

    return {
      goals: Math.round(goals / divisor),
      points: Math.round(points / divisor),
      cleanSheets: Math.round(cleanSheets / divisor),
    };
  }, [leagueTeams]);

  const activeLeagueName =
    activeLeague === "all"
      ? "Europe's top five"
      : leagues.find((league) => league.slug === activeLeague)?.name || "Selected league";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="zero-teams-hero relative overflow-hidden border-b border-zinc-900 px-6 py-16 sm:py-20">
        <div className="zero-hero-mesh absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-cyan-300">
              ZeroPlay club intelligence
            </p>
            <h1 className="text-5xl font-black leading-none sm:text-7xl">
              Explore Elite Football Clubs
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Track form, fixtures, attack profile, clean sheets, player leaders, and AI-powered momentum signals across {activeLeagueName}.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_0_50px_rgba(34,211,238,0.12)] backdrop-blur">
            <label htmlFor="team-search" className="sr-only">
              Search clubs
            </label>
            <input
              id="team-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clubs, leagues, players..."
              className="h-16 w-full rounded-xl border border-zinc-800 bg-black/70 px-5 text-lg font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400"
            />
          </div>

          <div className="zero-smooth-scroll mt-8 flex gap-3 overflow-x-auto pb-2">
            {leagueOptions.map((league) => (
              <button
                key={league.slug}
                type="button"
                onClick={() => setActiveLeague(league.slug)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all duration-300 ${
                  activeLeague === league.slug
                    ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_28px_rgba(34,211,238,0.25)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-cyan-300 hover:text-white"
                }`}
              >
                {league.code} - {league.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">Live momentum</p>
              <h2 className="mt-1 text-3xl font-black">Trending Clubs</h2>
            </div>
            <p className="hidden text-sm text-zinc-500 sm:block">Tap a club to update the spotlight</p>
          </div>

          <div className="zero-smooth-scroll flex gap-4 overflow-x-auto pb-4">
            {trendingTeams.map((team) => (
              <TrendingClub
                key={team.slug}
                team={team}
                isActive={team.slug === spotlightTeam.slug}
                onSelect={setSpotlightSlug}
              />
            ))}
          </div>
        </section>

        <section className="sticky top-0 z-20 -mx-6 mb-10 border-y border-zinc-900 bg-black/80 px-6 py-4 backdrop-blur-xl">
          <div className="zero-smooth-scroll mx-auto flex max-w-6xl gap-3 overflow-x-auto">
            {performanceFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`relative shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {filter.label}
                {activeFilter === filter.id ? (
                  <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-cyan-300" />
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12 overflow-hidden rounded-3xl border border-zinc-800 bg-[#0f0f13]">
          <div
            className="relative grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8"
            style={{
              background: `linear-gradient(135deg, ${spotlightTeam.color}33, rgba(15,15,19,0.92) 42%, rgba(5,5,5,0.98))`,
            }}
          >
            <img
              src={spotlightTeam.logo}
              alt=""
              className="absolute -left-16 top-8 h-72 w-72 object-contain opacity-10"
            />

            <div className="relative">
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-cyan-200">
                Featured Club Showcase
              </p>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 p-4 shadow-2xl"
                  style={{ backgroundColor: spotlightTeam.color }}
                >
                  <img
                    src={spotlightTeam.logo}
                    alt={`${spotlightTeam.name} logo`}
                    className="h-20 w-20 object-contain"
                  />
                </span>
                <div>
                  <h2 className="text-5xl font-black leading-none">{spotlightTeam.name}</h2>
                  <p className="mt-3 text-zinc-300">
                    {spotlightTeam.leagueName} - {spotlightTeam.stats.position} - {spotlightTeam.stats.points} points
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="text-sm text-zinc-400">Top scorer</p>
                  <p className="mt-1 text-xl font-black">{formatName(spotlightTeam.topScorer.name)}</p>
                  <p className="mt-1 text-cyan-300">{spotlightTeam.topScorer.goals} goals</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="text-sm text-zinc-400">Creator</p>
                  <p className="mt-1 text-xl font-black">{formatName(spotlightTeam.topAssist.name)}</p>
                  <p className="mt-1 text-cyan-300">{spotlightTeam.topAssist.assists} assists</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="text-sm text-zinc-400">Next match</p>
                  <p className="mt-1 text-xl font-black">{spotlightTeam.nextMatch.opponent}</p>
                  <p className="mt-1 text-cyan-300">{spotlightTeam.nextMatch.date}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <FormPills form={spotlightTeam.form} />
                <Link
                  to={`/team/${spotlightTeam.slug}`}
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-black transition hover:bg-cyan-300"
                >
                  View Club Analytics
                </Link>
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">ZeroPlay model</p>
                  <h3 className="mt-1 text-2xl font-black">Performance Shape</h3>
                </div>
                <RadarGraph team={spotlightTeam} />
              </div>

              <div className="space-y-5">
                <MetricBar label="Win rate" value={getWinRate(spotlightTeam)} color="bg-green-400" />
                <MetricBar label="Attack index" value={Math.min(getAttackIndex(spotlightTeam), 100)} />
                <MetricBar label="Control index" value={getControlIndex(spotlightTeam)} color="bg-violet-400" />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-6">
            <p className="text-sm text-zinc-500">Selection avg goals</p>
            <p className="mt-2 text-4xl font-black">{leagueAverages.goals}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-6">
            <p className="text-sm text-zinc-500">Selection avg points</p>
            <p className="mt-2 text-4xl font-black">{leagueAverages.points}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-6">
            <p className="text-sm text-zinc-500">Avg clean sheets</p>
            <p className="mt-2 text-4xl font-black">{leagueAverages.cleanSheets}</p>
          </article>
        </section>

        <section className="mb-12 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300">AI Match Intelligence</p>
          <h2 className="text-3xl font-black">{getInsight(spotlightTeam)}</h2>
          <p className="mt-4 max-w-3xl text-zinc-400">
            ZeroPlay combines table position, recent form, goals, clean sheets, and win rate to surface club momentum.
          </p>
        </section>

        <section className="mb-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                Player Spotlight
              </p>
              <h2 className="mt-1 text-3xl font-black">Top Players This Week</h2>
            </div>
          </div>

          <div className="zero-smooth-scroll flex gap-4 overflow-x-auto pb-4">
            {playerSpotlights.map((player, index) => (
              <PlayerSpotlightCard
                key={`${player.name}-${player.team.slug}-${index}`}
                player={player}
                label={player.type}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">Club universe</p>
              <h2 className="mt-1 text-3xl font-black">Team Grid</h2>
            </div>
            <p className="text-sm text-zinc-500">
              {filteredTeams.length} clubs visible
            </p>
          </div>

          {filteredTeams.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeams.map((team) => (
                <TeamCard key={team.slug} team={team} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-[#0f0f13] p-8 text-zinc-400">
              No clubs match that search.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Teams;
