import { getNewsArticleTag, getNewsBadge, getTimeAgo } from "../utils/newsUtils";

function NewsImageFallback({ article, compact = false }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_28%_18%,rgba(34,211,238,0.24),transparent_32%),linear-gradient(135deg,#111113,#050505)] ${compact ? "p-3" : "p-6"}`}
    >
      <span className="text-center text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">
        {article.source || article.league || "ZeroPlay"}
      </span>
    </div>
  );
}

function NewsImage({ article, className, featured = false }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {article.image ? (
        <img
          src={article.image}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading={featured ? "eager" : "lazy"}
        />
      ) : (
        <NewsImageFallback article={article} compact={className.includes("h-24")} />
      )}
    </div>
  );
}

function NewsCard({ article, compact = false, variant = "standard", priority = "" }) {
  const isFeatured = variant === "featured";
  const isSide = variant === "side";
  const isRail = variant === "rail";
  const isDense = variant === "dense";
  const tag = getNewsArticleTag(article);
  const badge = getNewsBadge(article, priority);
  const titleClass = compact
    ? "text-xl font-black leading-tight"
    : isFeatured
      ? "text-4xl font-black leading-tight sm:text-5xl"
      : isSide
        ? "text-2xl font-black leading-tight"
        : "text-2xl font-black leading-tight";

  if (isRail) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="group grid grid-cols-[92px_1fr] gap-4 rounded-2xl border border-zinc-800 bg-black/45 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:bg-zinc-900/80"
      >
        <NewsImage article={article} className="h-24 rounded-xl" />
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-200">
              {tag}
            </span>
            {badge ? (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                {badge}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-base font-black leading-tight transition group-hover:text-cyan-300">
            {article.headline}
          </h3>
          <p className="mt-2 truncate text-xs font-semibold text-zinc-500">
            {article.source || "Football"} - {getTimeAgo(article.published)}
          </p>
        </div>
      </a>
    );
  }

  if (isDense) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="group block rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:bg-zinc-900/85"
      >
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-cyan-300">
          {article.source || tag} - {getTimeAgo(article.published)}
        </p>
        <h3 className="text-xl font-black leading-tight transition group-hover:text-cyan-300">
          {article.headline}
        </h3>
        {article.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
            {article.description}
          </p>
        ) : null}
      </a>
    );
  }

  if (isFeatured || isSide) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="group relative block min-h-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-cyan-500/20"
      >
        <NewsImage
          article={article}
          className={isFeatured ? "h-[520px]" : "h-full min-h-72"}
          featured={isFeatured}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {badge ? (
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                {badge}
              </span>
            ) : null}
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-200">
              {tag}
            </span>
          </div>

          <p className="mb-3 text-sm font-bold text-cyan-300">
            {article.source || "Football"} - {getTimeAgo(article.published)}
          </p>

          <h2 className={titleClass}>{article.headline}</h2>

          {article.description && isFeatured ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              {article.description}
            </p>
          ) : null}

          <span className="mt-5 inline-flex text-sm font-black text-white transition group-hover:text-cyan-300">
            Read on {article.source || "source"}
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-cyan-500/20"
    >
      <NewsImage article={article} className={compact ? "h-44" : "aspect-video"} />
      <div className={compact ? "flex flex-1 flex-col p-5" : "flex flex-1 flex-col p-6"}>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
            {tag}
          </span>
          {badge ? (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {badge}
            </span>
          ) : null}
        </div>

        <p className="mb-3 text-sm font-black text-cyan-300">
          {article.source || article.league}
        </p>

        <h2 className={titleClass}>{article.headline}</h2>

        {article.description ? (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
            {article.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {getTimeAgo(article.published)}
          </span>
          <span className="text-sm font-black text-zinc-300 transition group-hover:text-cyan-300">
            Read on {article.source || "ESPN"}
          </span>
        </div>
      </div>
    </a>
  );
}

export default NewsCard;
