const express = require("express");
const router = express.Router();

const espnLeagues = [
  { code: "eng.1", name: "Premier League" },
  { code: "esp.1", name: "La Liga" },
  { code: "ita.1", name: "Serie A" },
  { code: "ger.1", name: "Bundesliga" },
  { code: "fra.1", name: "Ligue 1" },
];

const rssSources = [
  {
    source: "BBC Sport",
    topic: "Football",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
  },
  {
    source: "Sky Sports",
    topic: "Football",
    url: "https://www.skysports.com/rss/11095",
  },
  {
    source: "The Guardian",
    topic: "Football",
    url: "https://www.theguardian.com/football/rss",
  },
  {
    source: "CBS Sports",
    topic: "Soccer",
    url: "https://www.cbssports.com/rss/headlines/soccer/",
  },
];

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value = "") {
  return decodeXml(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? cleanText(match[1]) : "";
}

function getTagAttribute(block, tagName, attributeName) {
  const match = block.match(
    new RegExp(`<${tagName}[^>]*\\s${attributeName}=["']([^"']+)["'][^>]*>`, "i"),
  );

  return match ? decodeXml(match[1]) : "";
}

function getRssImage(item) {
  return (
    getTagAttribute(item, "media:content", "url") ||
    getTagAttribute(item, "media:thumbnail", "url") ||
    getTagAttribute(item, "enclosure", "url") ||
    null
  );
}

function parseRssFeed(xml, source) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemMatches
    .map((item) => {
      const url = getTagValue(item, "link") || getTagValue(item, "guid");
      const published = getTagValue(item, "pubDate") || getTagValue(item, "dc:date");
      const headline = getTagValue(item, "title");

      return {
        id: `${source.source}-${url || headline}`,
        headline,
        description: getTagValue(item, "description"),
        source: source.source,
        league: source.topic,
        published: normalizeDate(published),
        image: getRssImage(item),
        url,
        type: "News",
      };
    })
    .filter((article) => article.headline && article.url);
}

function getEspnArticleImage(article) {
  return article.images?.find((image) => image.url)?.url || null;
}

function normalizeEspnArticle(article, leagueName) {
  return {
    id: `ESPN-${article.id}`,
    headline: article.headline,
    description: article.description || "",
    source: "ESPN",
    byline: article.byline || "",
    league: leagueName,
    published: article.published || article.lastModified || null,
    image: getEspnArticleImage(article),
    url: article.links?.web?.href || article.links?.mobile?.href || null,
    type: article.type || "News",
  };
}

function getArticleKey(article) {
  return article.url || article.id;
}

function sortByPublishedDate(articles) {
  return articles.sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
}

function diversifySources(articles, limit) {
  const bySource = new Map();

  articles.forEach((article) => {
    const sourceArticles = bySource.get(article.source) || [];
    sourceArticles.push(article);
    bySource.set(article.source, sourceArticles);
  });

  const leadArticles = sortByPublishedDate(
    Array.from(bySource.values())
      .map((sourceArticles) => sourceArticles[0])
      .filter(Boolean),
  );
  const leadKeys = new Set(leadArticles.map(getArticleKey));
  const rest = articles.filter((article) => !leadKeys.has(getArticleKey(article)));

  return [...leadArticles, ...rest].slice(0, limit);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getEspnLeagueNews(league) {
  const response = await fetchWithTimeout(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/news`,
    {
      headers: {
        "User-Agent": "ZeroPlay/1.0",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`ESPN returned ${response.status} for ${league.name}`);
  }

  const data = await response.json();

  return (data.articles || [])
    .map((article) => normalizeEspnArticle(article, league.name))
    .filter((article) => article.headline && article.url);
}

async function getRssNews(source) {
  const response = await fetchWithTimeout(source.url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "ZeroPlay/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${source.source} returned ${response.status}`);
  }

  return parseRssFeed(await response.text(), source);
}

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 24, 40);
    const tasks = [
      ...espnLeagues.map((league) => getEspnLeagueNews(league)),
      ...rssSources.map((source) => getRssNews(source)),
    ];

    const results = await Promise.allSettled(tasks);
    const articles = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const uniqueArticles = sortByPublishedDate(Array.from(
      new Map(articles.map((article) => [article.url || article.id, article])).values(),
    ));
    const mixedArticles = diversifySources(uniqueArticles, limit);

    if (mixedArticles.length === 0) {
      throw new Error("No news articles were returned");
    }

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: mixedArticles.length,
      sources: ["ESPN", ...rssSources.map((source) => source.source)],
      data: mixedArticles,
    });
  } catch (error) {
    console.error("Error fetching news:", error);

    res.status(502).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
});

module.exports = router;
