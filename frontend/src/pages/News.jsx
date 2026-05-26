import { useEffect, useMemo, useState } from "react";
import NewsCard from "../components/NewsCard";
import { fallbackNews } from "../data/newsData";
import { getNewsArticleTag, getNewsBadge, getTimeAgo } from "../utils/newsUtils";

const categories = [
  { id: "all", label: "All" },
  { id: "premier-league", label: "Premier League" },
  { id: "champions-league", label: "Champions League" },
  { id: "transfers", label: "Transfers" },
  { id: "injuries", label: "Injuries" },
  { id: "world-cup", label: "World Cup" },
  { id: "la-liga", label: "La Liga" },
  { id: "serie-a", label: "Serie A" },
];

const topicKeywords = [
  "Transfer",
  "Injury",
  "World Cup",
  "Champions League",
  "Chelsea",
  "Arsenal",
  "Real Madrid",
  "Barcelona",
  "Tottenham",
  "USMNT",
];

async function fetchNewsArticles(limit = 32) {
  const response = await fetch(`http://localhost:5000/news?limit=${limit}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("News request failed");
  }

  return response.json();
}

function getArticleText(article) {
  return `${article.headline || ""} ${article.description || ""} ${article.league || ""} ${article.type || ""} ${article.source || ""}`.toLowerCase();
}

function isCategoryMatch(article, category) {
  const text = getArticleText(article);

  if (category === "all") {
    return true;
  }

  if (category === "premier-league") {
    return text.includes("premier league") || text.includes("arsenal") || text.includes("chelsea") || text.includes("liverpool") || text.includes("manchester") || text.includes("tottenham");
  }

  if (category === "champions-league") {
    return text.includes("champions league") || text.includes("ucl") || text.includes("european");
  }

  if (category === "transfers") {
    return text.includes("transfer") || text.includes("signing") || text.includes("loan") || text.includes("deal") || text.includes("contract");
  }

  if (category === "injuries") {
    return text.includes("injur") || text.includes("fitness") || text.includes("absence") || text.includes("doubt");
  }

  if (category === "world-cup") {
    return text.includes("world cup") || text.includes("fifa") || text.includes("usmnt");
  }

  if (category === "la-liga") {
    return text.includes("la liga") || text.includes("real madrid") || text.includes("barcelona") || text.includes("atletico");
  }

  if (category === "serie-a") {
    return text.includes("serie a") || text.includes("milan") || text.includes("juventus") || text.includes("inter") || text.includes("napoli");
  }

  return true;
}

function getSourceStats(articles) {
  const stats = new Map();

  articles.forEach((article) => {
    const source = article.source || "Football";
    stats.set(source, (stats.get(source) || 0) + 1);
  });

  return Array.from(stats.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

function getTopicStats(articles) {
  return topicKeywords
    .map((topic) => {
      const count = articles.filter((article) =>
        getArticleText(article).includes(topic.toLowerCase()),
      ).length;

      return { topic, count };
    })
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function NewsSkeleton() {
  return (
    <div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="zero-shimmer h-24 rounded-2xl border border-zinc-800" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
        <div className="zero-shimmer h-[520px] rounded-3xl border border-zinc-800" />
        <div className="grid gap-5">
          <div className="zero-shimmer h-64 rounded-3xl border border-zinc-800" />
          <div className="zero-shimmer h-64 rounded-3xl border border-zinc-800" />
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="zero-shimmer h-96 rounded-2xl border border-zinc-800" />
        ))}
      </div>
    </div>
  );
}

function NewsTicker({ articles }) {
  const tickerArticles = articles.slice(0, 10);

  if (tickerArticles.length === 0) {
    return null;
  }

  return (
    <div className="news-ticker border-y border-zinc-900 bg-black/70">
      <div className="news-ticker-track flex gap-8 py-3">
        {[...tickerArticles, ...tickerArticles].map((article, index) => (
          <a
            key={`${article.id}-${index}`}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-max items-center gap-3 text-sm font-bold text-zinc-300 transition hover:text-cyan-300"
          >
            <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              Live
            </span>
            <span>{article.headline}</span>
            <span className="text-zinc-600">{article.source || "Football"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function PulseCard({ label, value, detail, tone = "text-cyan-300" }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md transition hover:border-cyan-400">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-4xl font-black ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
    </article>
  );
}

function SourceRail({ sourceStats, activeSource, onSelect }) {
  if (sourceStats.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/55 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Source mix</p>
          <h2 className="mt-1 text-2xl font-black">Newsroom Feed</h2>
        </div>
        <button
          type="button"
          onClick={() => onSelect("all")}
          className="text-xs font-black uppercase tracking-wide text-zinc-500 transition hover:text-cyan-300"
        >
          Reset
        </button>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
            activeSource === "all"
              ? "border-cyan-300 bg-cyan-300 text-black"
              : "border-zinc-800 bg-black/45 text-zinc-300 hover:border-cyan-300"
          }`}
        >
          <span>All Sources</span>
          <span>{sourceStats.reduce((sum, source) => sum + source.count, 0)}</span>
        </button>

        {sourceStats.map((source) => (
          <button
            key={source.source}
            type="button"
            onClick={() => onSelect(source.source)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
              activeSource === source.source
                ? "border-cyan-300 bg-cyan-300 text-black"
                : "border-zinc-800 bg-black/45 text-zinc-300 hover:border-cyan-300"
            }`}
          >
            <span>{source.source}</span>
            <span>{source.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TopicRadar({ topics, onSelect }) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/55 p-5 backdrop-blur-md">
      <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Topic radar</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic.topic}
            type="button"
            onClick={() => onSelect(topic.topic)}
            className="rounded-full border border-zinc-800 bg-black/45 px-3 py-2 text-sm font-black text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-300"
          >
            {topic.topic} <span className="text-zinc-600">{topic.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BriefingRail({ articles }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/55 p-5 backdrop-blur-md">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Top briefing</p>
        <h2 className="mt-1 text-2xl font-black">Fast Reads</h2>
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <NewsCard key={`${article.id}-${article.url}`} article={article} variant="rail" />
        ))}
      </div>
    </section>
  );
}

function MiniStoryStack({ title, articles }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Signal desk</p>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <p className="text-sm text-zinc-500">{articles.length} stories</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <NewsCard key={`${article.id}-${article.url}`} article={article} variant="dense" />
        ))}
      </div>
    </section>
  );
}

function News() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [sources, setSources] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSource, setActiveSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadNews() {
    try {
      setIsLoading(true);
      setError("");

      const payload = await fetchNewsArticles();
      const nextArticles = payload.data || payload.articles || [];

      if (nextArticles.length > 0) {
        setArticles(nextArticles);
        setUpdatedAt(payload.updatedAt || new Date().toISOString());
        setSources(payload.sources || []);
      }
    } catch (requestError) {
      console.error(requestError);
      setArticles((currentArticles) =>
        currentArticles.length > 0 ? currentArticles : fallbackNews,
      );
      setError("Showing fallback links. Restart the backend server to load live mixed-source news.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    fetchNewsArticles()
      .then((payload) => {
        const nextArticles = payload.data || payload.articles || [];

        if (!ignore && nextArticles.length > 0) {
          setArticles(nextArticles);
          setUpdatedAt(payload.updatedAt || new Date().toISOString());
          setSources(payload.sources || []);
        }
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!ignore) {
          setArticles(fallbackNews);
          setError("Showing fallback links. Restart the backend server to load live mixed-source news.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const sourceStats = useMemo(() => getSourceStats(articles), [articles]);
  const topicStats = useMemo(() => getTopicStats(articles), [articles]);
  const filteredArticles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const categoryMatches = isCategoryMatch(article, activeCategory);
      const sourceMatches = activeSource === "all" || article.source === activeSource;
      const searchMatches =
        normalizedQuery.length === 0 || getArticleText(article).includes(normalizedQuery);

      return categoryMatches && sourceMatches && searchMatches;
    });
  }, [activeCategory, activeSource, articles, searchQuery]);
  const featuredArticle = filteredArticles[0];
  const sideArticles = filteredArticles.slice(1, 3);
  const briefingArticles = filteredArticles.slice(3, 7);
  const gridArticles = filteredArticles.slice(7);
  const transferStories = useMemo(
    () => articles.filter((article) => isCategoryMatch(article, "transfers")).slice(0, 4),
    [articles],
  );
  const injuryStories = useMemo(
    () => articles.filter((article) => isCategoryMatch(article, "injuries")).slice(0, 4),
    [articles],
  );
  const liveCount = articles.filter((article) => getNewsBadge(article)).length;
  const imageCount = articles.filter((article) => article.image).length;
  const transferCount = transferStories.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden border-b border-zinc-900 px-6 py-8">
        <div className="zero-hero-mesh absolute inset-0 opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(239,68,68,0.13),transparent_28%),linear-gradient(135deg,#050505,#101014_62%,#050505)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  Live Desk
                </span>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-200">
                  ZeroPlay Newsroom
                </span>
              </div>

              <h1 className="text-4xl font-black leading-none sm:text-5xl">
                Latest Football News
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                A live football briefing across transfers, injuries, Europe, and the biggest clubs.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {updatedAt ? <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span> : null}
                {sources.length > 0 ? <span>{sources.length} sources connected</span> : null}
                <span>{articles.length} stories indexed</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[420px]">
              <label htmlFor="news-search" className="sr-only">
                Search news
              </label>
              <input
                id="news-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search stories, clubs, sources..."
                className="h-13 w-full rounded-2xl border border-zinc-800 bg-black/70 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={loadNews}
                className="h-13 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 font-black transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:text-cyan-300"
              >
                {isLoading ? "Refreshing..." : "Refresh News"}
              </button>
            </div>
          </div>

          <div className="zero-smooth-scroll mt-8 flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all duration-300 ${
                  activeCategory === category.id
                    ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_28px_rgba(34,211,238,0.22)]"
                    : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-cyan-300 hover:text-white"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <NewsTicker articles={articles} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error ? (
          <p className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            {error}
          </p>
        ) : null}

        {isLoading && articles.length === 0 ? (
          <NewsSkeleton />
        ) : filteredArticles.length > 0 ? (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <PulseCard label="Live board" value={articles.length} detail="Stories in the current feed" />
              <PulseCard label="Source mix" value={sourceStats.length} detail="Platforms contributing" tone="text-violet-300" />
              <PulseCard label="Transfer radar" value={transferCount} detail="Market stories detected" tone="text-amber-300" />
              <PulseCard label="Alert flags" value={liveCount} detail="Live, hot, or injury tags" tone="text-red-300" />
              <PulseCard label="Visual feed" value={imageCount} detail="Stories with lead media" tone="text-green-300" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
              <div className="min-w-0 space-y-6">
                <section className="grid gap-5 lg:grid-cols-[1.35fr_0.75fr]">
                  <NewsCard article={featuredArticle} variant="featured" priority="lead" />

                  <div className="grid gap-5">
                    {sideArticles.map((article) => (
                      <NewsCard
                        key={`${article.id}-${article.url}`}
                        article={article}
                        variant="side"
                      />
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {briefingArticles.map((article) => (
                    <NewsCard key={`${article.id}-${article.url}`} article={article} variant="dense" />
                  ))}
                </section>

                <div className="grid gap-8 lg:grid-cols-2">
                  <MiniStoryStack title="Transfer Market" articles={transferStories} />
                  <MiniStoryStack title="Injury Watch" articles={injuryStories} />
                </div>

                {gridArticles.length > 0 ? (
                  <section>
                    <div className="mb-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                          Full stream
                        </p>
                        <h2 className="mt-1 text-3xl font-black">More Stories</h2>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {filteredArticles.length} stories
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {gridArticles.map((article) => (
                        <NewsCard key={`${article.id}-${article.url}`} article={article} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-5">
                <SourceRail
                  sourceStats={sourceStats}
                  activeSource={activeSource}
                  onSelect={setActiveSource}
                />
                <TopicRadar
                  topics={topicStats}
                  onSelect={(topic) => {
                    setSearchQuery(topic);
                    setActiveCategory("all");
                  }}
                />
                <BriefingRail articles={filteredArticles.slice(0, 5)} />

                <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
                    ZeroPlay read
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    {getNewsArticleTag(featuredArticle)} is leading the board right now.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    The top story is from {featuredArticle.source || "the feed"} and updated {getTimeAgo(featuredArticle.published)}.
                  </p>
                </section>
              </aside>
            </section>
          </>
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-zinc-400">
            No stories match this view yet. Try All, clear search, or refresh the feed.
          </div>
        )}
      </main>
    </div>
  );
}

export default News;
