/**
 * ---------------------------------------------------------------------------
 * GAMING-NEWS (RSS)
 * ---------------------------------------------------------------------------
 * Lädt Schlagzeilen von mehreren öffentlichen RSS-Feeds großer Gaming-Seiten
 * - kein API-Key, keine Anmeldung nötig. Läuft im Hauptprozess (nicht im
 * Renderer), damit keine CORS-Beschränkungen greifen. Einzelne Feeds, die
 * gerade nicht erreichbar sind, werden übersprungen statt die ganze
 * Abfrage abzubrechen.
 * ---------------------------------------------------------------------------
 */

const FEEDS = [
  { url: "https://www.pcgamer.com/rss/", source: "PC Gamer" },
  { url: "https://www.eurogamer.net/feed", source: "Eurogamer" },
  { url: "https://www.gamespot.com/feeds/game-news/", source: "GameSpot" },
];

const MAX_ITEMS = 12;
const FETCH_TIMEOUT_MS = 6000;

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return "";
  return decodeEntities(stripCdata(match[1].trim()));
}

/** Versucht, ein Vorschaubild aus media:content, enclosure oder dem description-HTML zu extrahieren */
function extractImage(itemXml) {
  const media = itemXml.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i);
  if (media) return media[1];
  const enclosure = itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
  if (enclosure) return enclosure[1];
  const imgInDescription = itemXml.match(/<img[^>]*src="([^"]+)"/i);
  if (imgInDescription) return imgInDescription[1];
  return "";
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AvisLauncher/1.0)" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseFeed(xml, source) {
  const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 6);
  return items.map((match) => {
    const itemXml = match[1];
    return {
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link") || extractTag(itemXml, "guid"),
      pubDate: extractTag(itemXml, "pubDate") || extractTag(itemXml, "dc:date"),
      image: extractImage(itemXml),
      source,
    };
  });
}

/**
 * Holt aktuelle Gaming-News von allen konfigurierten Feeds, mischt sie nach
 * Datum und markiert Einträge, deren Titel den Namen eines Bibliotheks-
 * Spiels enthalten (grobe Relevanz-Erkennung per Textvergleich).
 */
async function fetchLatestNews(libraryGameNames = []) {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => parseFeed(await fetchWithTimeout(feed.url), feed.source))
  );

  let allItems = [];
  for (const result of results) {
    if (result.status === "fulfilled") allItems = allItems.concat(result.value);
  }

  allItems = allItems.filter((item) => item.title && item.link);

  allItems.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  const lowerNames = libraryGameNames.map((n) => n.toLowerCase()).filter(Boolean);
  allItems = allItems.map((item) => ({
    ...item,
    relevant: lowerNames.some((name) => item.title.toLowerCase().includes(name)),
  }));

  // Relevante Treffer nach vorne, sonst chronologisch
  allItems.sort((a, b) => (b.relevant === a.relevant ? 0 : b.relevant ? 1 : -1));

  return allItems.slice(0, MAX_ITEMS);
}

module.exports = { fetchLatestNews };
