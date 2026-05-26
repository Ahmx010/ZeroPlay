import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import {
  getFeaturedGames,
  getTeamBySlug,
  getTeamsByLeague,
  leagues,
  teams,
} from "../data/footballData";
import { fallbackNews } from "../data/newsData";
import { getNewsArticleTag, getTimeAgo } from "../utils/newsUtils";

const resultScore = {
  W: 3,
  D: 1,
  L: 0,
};

const heroVariants = [
  {
    eyebrow: "Matchday Briefing",
    headline: "Every match, table, and story in one place.",
    subhead:
      "Follow Europe's top leagues with live results, club form, standings, and football news built for quick reads.",
    image:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1800&q=85",
  },
  {
    eyebrow: "European Football Live",
    headline: "Track the football day without the noise.",
    subhead:
      "ZeroPlay brings scores, fixtures, team momentum, and breaking stories into one clean matchday view.",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1800&q=85",
  },
  {
    eyebrow: "Club Intelligence",
    headline: "See who is rising before the table says it.",
    subhead:
      "Compare form, goals, clean sheets, fixtures, and league context across the biggest clubs in Europe.",
    image:
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1800&q=85",
  },
  {
    eyebrow: "Football Newsroom",
    headline: "Scores, form, tables, news. All synced.",
    subhead:
      "A sharper home base for match results, league races, transfer stories, injuries, and club analytics.",
    image:
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1800&q=85",
  },
];

function getFormScore(team) {
  return team.form.reduce((sum, result) => sum + (resultScore[result] || 0), 0);
}

function getWinRate(team) {
  if (!team.stats.played) {
    return 0;
  }

  return Math.round((team.stats.wins / team.stats.played) * 100);
}

function getLeagueTable(leagueSlug) {
  return getTeamsByLeague(leagueSlug).sort((a, b) => a.stats.rank - b.stats.rank);
}

function getGameGoalTotal(game) {
  const [homeScore, awayScore] = String(game.score).split(" - ").map(Number);

  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return 0;
  }

  return homeScore + awayScore;
}

function FormPills({ form }) {
  return (
    <div className="flex gap-1">
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
            className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-black ${className}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

function LeagueLogo({ league }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/70 p-2">
      <img
        src={league.logo}
        alt={`${league.name} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </span>
  );
}

function StatTile({ label, value, detail, tone = "text-cyan-300" }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md transition hover:border-cyan-400">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-4xl font-black ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
    </article>
  );
}

function MatchCard({ game }) {
  const homeTeam = getTeamBySlug(game.homeSlug);
  const awayTeam = getTeamBySlug(game.awaySlug);

  return (
    <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-cyan-500/10">
      <div className="mb-5 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-wide">
        <span className="rounded-full bg-red-500 px-3 py-1 text-white">
          {game.status}
        </span>
        <span className="text-zinc-500">{game.leagueName}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link to={`/team/${homeTeam?.slug}`} className="min-w-0 text-center hover:text-cyan-300">
          <img src={homeTeam?.logo} alt="" className="mx-auto h-14 w-14 object-contain" />
          <p className="mt-3 truncate text-sm font-black sm:text-base">{homeTeam?.name}</p>
        </Link>

        <div className="rounded-2xl bg-black px-4 py-3 text-center text-3xl font-black text-cyan-300">
          {game.score}
        </div>

        <Link to={`/team/${awayTeam?.slug}`} className="min-w-0 text-center hover:text-cyan-300">
          <img src={awayTeam?.logo} alt="" className="mx-auto h-14 w-14 object-contain" />
          <p className="mt-3 truncate text-sm font-black sm:text-base">{awayTeam?.name}</p>
        </Link>
      </div>

      <p className="mt-5 truncate border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        {game.matchday} - {game.venue}
      </p>
    </article>
  );
}

function LeagueIntelligenceCard({ league }) {
  const table = getLeagueTable(league.slug);
  const leader = table[0];
  const hotTeam = [...table].sort(
    (a, b) => getFormScore(b) - getFormScore(a) || b.stats.points - a.stats.points,
  )[0];
  const topThree = table.slice(0, 3);

  return (
    <Link
      to={`/league/${league.slug}`}
      className="group relative min-h-[340px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#0f0f13] p-5 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-cyan-500/15"
    >
      <img
        src={league.logo}
        alt=""
        className="absolute -right-10 top-6 h-40 w-40 object-contain opacity-10 transition duration-300 group-hover:scale-110 group-hover:opacity-20"
      />

      <div className="relative flex items-start justify-between gap-4">
        <LeagueLogo league={league} />
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
          {league.code}
        </span>
      </div>

      <div className="relative mt-8">
        <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">
          {league.country}
        </p>
        <h2 className="mt-2 text-3xl font-black">{league.name}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {leader?.name} lead the table. {hotTeam?.name} carry the hottest form signal.
        </p>
      </div>

      <div className="relative mt-6 space-y-3">
        {topThree.map((team) => (
          <div
            key={team.slug}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/45 px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-3">
              <img src={team.logo} alt="" className="h-8 w-8 object-contain" />
              <span className="truncate text-sm font-black">{team.name}</span>
            </span>
            <span className="text-sm font-black text-cyan-300">{team.stats.points}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function TeamSignalCard({ team }) {
  return (
    <Link
      to={`/team/${team.slug}`}
      className="group flex min-w-[260px] items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400"
    >
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 p-2"
        style={{ backgroundColor: team.color }}
      >
        <img src={team.logo} alt="" className="h-12 w-12 object-contain" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-black group-hover:text-cyan-300">
          {team.name}
        </span>
        <span className="block text-sm text-zinc-500">
          {team.leagueName} - {team.stats.position} - {getWinRate(team)}% win rate
        </span>
        <span className="mt-3 block">
          <FormPills form={team.form} />
        </span>
      </span>
    </Link>
  );
}

function NewsRail({ articles }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-cyan-300">News pulse</p>
          <h2 className="mt-1 text-3xl font-black">Live Desk</h2>
        </div>
        <Link to="/news" className="text-sm font-black text-cyan-300">
          Open
        </Link>
      </div>

      <div className="space-y-3">
        {articles.slice(0, 5).map((article) => (
          <a
            key={`${article.id}-${article.url}`}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="group grid grid-cols-[72px_1fr] gap-4 rounded-2xl border border-zinc-800 bg-black/45 p-3 transition hover:border-cyan-400"
          >
            <div className="h-20 overflow-hidden rounded-xl bg-zinc-900">
              {article.image ? (
                <img src={article.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-black text-cyan-300">
                  {article.source?.slice(0, 3) || "ZP"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-cyan-300">
                {getNewsArticleTag(article)} - {getTimeAgo(article.published)}
              </p>
              <h3 className="line-clamp-2 text-sm font-black leading-tight group-hover:text-cyan-300">
                {article.headline}
              </h3>
              <p className="mt-2 truncate text-xs text-zinc-500">{article.source}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const [latestNews, setLatestNews] = useState(fallbackNews);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const heroVariant = heroVariants[heroVariantIndex];

  useEffect(() => {
    const heroTimer = window.setTimeout(() => {
      setHeroVariantIndex(Math.floor(Math.random() * heroVariants.length));
    }, 0);

    return () => window.clearTimeout(heroTimer);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch("http://localhost:5000/news?limit=8", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("News request failed");
        }

        return response.json();
      })
      .then((payload) => {
        if (!ignore && payload.data?.length) {
          setLatestNews(payload.data.slice(0, 8));
        }
      })
      .catch(() => {
        setLatestNews(fallbackNews);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const featuredGames = useMemo(
    () =>
      leagues
        .flatMap((league) => getFeaturedGames(1, league.slug))
        .sort((a, b) => getGameGoalTotal(b) - getGameGoalTotal(a))
        .slice(0, 4),
    [],
  );
  const hotTeams = useMemo(
    () =>
      [...teams]
        .sort((a, b) => getFormScore(b) - getFormScore(a) || b.stats.points - a.stats.points)
        .slice(0, 10),
    [],
  );
  const headlineGame = featuredGames[0];
  const headlineHome = headlineGame ? getTeamBySlug(headlineGame.homeSlug) : null;
  const headlineAway = headlineGame ? getTeamBySlug(headlineGame.awaySlug) : null;
  const totalGoals = leagues.reduce((sum, league) => sum + league.totalGoals, 0);
  const totalMatches = leagues.reduce((sum, league) => sum + league.matchCount, 0);
  const topClub = [...teams].sort((a, b) => b.stats.points - a.stats.points)[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="relative min-h-[calc(100vh-76px)] overflow-hidden border-b border-zinc-900 px-6 py-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url(${heroVariant.image})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.9)_34%,rgba(5,5,5,0.58)_64%,rgba(5,5,5,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(239,68,68,0.14),transparent_28%)]" />
        <div className="zero-hero-mesh absolute inset-0 opacity-25" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid min-h-[calc(100vh-156px)] gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
                  {heroVariant.eyebrow}
                </span>
                <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-200">
                  Live football intelligence
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-none sm:text-7xl">
                {heroVariant.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                {heroVariant.subhead}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/games"
                  className="rounded-2xl bg-cyan-300 px-6 py-3 font-black text-black transition hover:-translate-y-1 hover:bg-cyan-200"
                >
                  Explore Matches
                </Link>
                <Link
                  to="/teams"
                  className="rounded-2xl border border-zinc-700 bg-black/40 px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:border-cyan-300 hover:text-cyan-300"
                >
                  Club Intelligence
                </Link>
                <Link
                  to="/news"
                  className="rounded-2xl border border-zinc-700 bg-black/40 px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:border-red-400 hover:text-red-300"
                >
                  Newsroom
                </Link>
              </div>
            </div>

            {headlineGame ? (
              <article className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-black/55 p-6 shadow-2xl backdrop-blur-md">
                <div className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(135deg, ${headlineHome?.color || "#22d3ee"}33, transparent 52%, ${headlineAway?.color || "#ef4444"}22)` }} />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-wide">
                    <span className="rounded-full bg-red-500 px-3 py-1 text-white">{headlineGame.status}</span>
                    <span className="text-zinc-400">{headlineGame.leagueName}</span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <Link to={`/team/${headlineHome?.slug}`} className="min-w-0 text-center hover:text-cyan-300">
                      <img src={headlineHome?.logo} alt="" className="mx-auto h-24 w-24 object-contain" />
                      <p className="mt-4 truncate text-xl font-black">{headlineHome?.name}</p>
                    </Link>
                    <div className="rounded-3xl bg-black px-5 py-4 text-center text-5xl font-black text-cyan-300">
                      {headlineGame.score}
                    </div>
                    <Link to={`/team/${headlineAway?.slug}`} className="min-w-0 text-center hover:text-cyan-300">
                      <img src={headlineAway?.logo} alt="" className="mx-auto h-24 w-24 object-contain" />
                      <p className="mt-4 truncate text-xl font-black">{headlineAway?.name}</p>
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                      <p className="text-xs text-zinc-500">Matchweek</p>
                      <p className="mt-1 font-black">{headlineGame.matchday}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                      <p className="text-xs text-zinc-500">Venue</p>
                      <p className="mt-1 truncate font-black">{headlineGame.venue}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                      <p className="text-xs text-zinc-500">Signal</p>
                      <p className="mt-1 font-black text-cyan-300">Featured result</p>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Indexed clubs" value={teams.length} detail="Across Europe's top leagues" />
          <StatTile label="Matches tracked" value={totalMatches} detail="Full 2025/26 league slate" tone="text-green-300" />
          <StatTile label="Goals modeled" value={totalGoals} detail="Table and match intelligence" tone="text-amber-300" />
          <StatTile label="Top points" value={topClub.stats.points} detail={`${topClub.name}, ${topClub.leagueName}`} tone="text-violet-300" />
        </section>

        <section className="mb-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                League intelligence
              </p>
              <h2 className="mt-1 text-4xl font-black">Top 5 European Leagues</h2>
            </div>
            <Link to="/teams" className="w-fit rounded-xl border border-zinc-800 px-5 py-3 font-black transition hover:border-cyan-400 hover:text-cyan-300">
              View All Clubs
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {leagues.map((league) => (
              <LeagueIntelligenceCard key={league.slug} league={league} />
            ))}
          </div>
        </section>

        <section className="mb-12 grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                  Match radar
                </p>
                <h2 className="mt-1 text-4xl font-black">Featured Results</h2>
              </div>
              <Link to="/games" className="w-fit rounded-xl border border-zinc-800 px-5 py-3 font-black transition hover:border-cyan-400 hover:text-cyan-300">
                Match Center
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {featuredGames.map((game) => (
                <MatchCard key={game.id} game={game} />
              ))}
            </div>
          </div>

          <NewsRail articles={latestNews} />
        </section>

        <section className="mb-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                Momentum layer
              </p>
              <h2 className="mt-1 text-4xl font-black">Clubs In Form</h2>
            </div>
            <Link to="/teams" className="w-fit rounded-xl border border-zinc-800 px-5 py-3 font-black transition hover:border-cyan-400 hover:text-cyan-300">
              Team Lab
            </Link>
          </div>

          <div className="zero-smooth-scroll flex gap-4 overflow-x-auto pb-4">
            {hotTeams.map((team) => (
              <TeamSignalCard key={team.slug} team={team} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
              ZeroPlay read
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight">
              {topClub.name} own the strongest points profile, while {hotTeams[0].name} carry the hottest form across the top five leagues.
            </h2>
            <p className="mt-5 text-zinc-400">
              The home page now blends standings, match results, club form, league context, and live football media into one command center.
            </p>
          </article>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                  Top stories
                </p>
                <h2 className="mt-1 text-4xl font-black">Newsroom</h2>
              </div>
              <Link to="/news" className="text-sm font-black text-cyan-300">
                More
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {latestNews.slice(0, 2).map((article) => (
                <NewsCard key={`${article.id}-${article.url}`} article={article} variant="side" />
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default Home;
