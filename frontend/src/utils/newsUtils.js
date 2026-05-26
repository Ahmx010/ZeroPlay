export function getTimeAgo(dateString) {
  if (!dateString) {
    return "Latest";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Latest";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${days}d ago`;
}

export function getNewsArticleTag(article) {
  const text = `${article.headline || ""} ${article.description || ""} ${article.league || ""}`.toLowerCase();

  if (text.includes("transfer") || text.includes("signing") || text.includes("loan")) {
    return "Transfer";
  }

  if (text.includes("injur") || text.includes("fitness")) {
    return "Injury";
  }

  if (text.includes("champions league") || text.includes("ucl")) {
    return "Champions League";
  }

  if (text.includes("world cup") || text.includes("fifa")) {
    return "World Cup";
  }

  if (text.includes("premier league")) {
    return "Premier League";
  }

  return article.league || article.type || "Football";
}

export function getNewsBadge(article, priority) {
  const text = `${article.headline || ""} ${article.description || ""}`.toLowerCase();

  if (priority === "lead") {
    return "Breaking";
  }

  if (text.includes("breaking") || text.includes("live")) {
    return "Live";
  }

  if (text.includes("transfer") || text.includes("deal")) {
    return "Hot";
  }

  if (text.includes("injur")) {
    return "Alert";
  }

  return "";
}
