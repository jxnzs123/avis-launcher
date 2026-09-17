/**
 * Store-Daten über die kostenlose CheapShark-API (kein API-Key nötig).
 * CheapShark ist selbst kein Shop - es aggregiert nur Preise/Metadaten
 * verschiedener Stores (u.a. Steam) und verlinkt normalerweise dorthin.
 * In Avis wird der eigentliche Kaufen-Link stattdessen auf Instant Gaming
 * mit unserem Affiliate-Code umgebogen (siehe instantGaming.js im Frontend).
 *
 * Dokumentation: https://apidocs.cheapshark.com/
 */

const CHEAPSHARK_BASE = "https://www.cheapshark.com/api/1.0";
const STEAM_STORE_ID = "1"; // CheapSharks interne ID für den Steam-Store

/** Gemeinsame Fetch-Logik für alle CheapShark-Endpunkte - inkl. User-Agent
 * (manche APIs blocken pauschal Anfragen ohne einen "echt" aussehenden) und
 * einer aussagekräftigen Fehlermeldung, falls die Antwort kein JSON ist. */
async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
  } catch (err) {
    throw new Error(`Verbindung zu CheapShark fehlgeschlagen: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(`CheapShark-API-Fehler (${response.status}).`);
  }

  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`CheapShark-Antwort ist kein JSON: "${rawText.slice(0, 120)}"`);
  }
}

async function getDeals({ pageSize = 60 } = {}) {
  const url = new URL(`${CHEAPSHARK_BASE}/deals`);
  url.searchParams.set("storeID", STEAM_STORE_ID);
  url.searchParams.set("pageSize", String(pageSize));
  // Bewusst OHNE "sortBy"/"onSale" - das waren vermutlich falsch formatierte
  // Parameter, die einen 400er verursacht haben. "sortBy" hat serverseitig
  // ohnehin "Deal Rating" als Default. Die Filterung auf echte Angebote
  // (wirklich reduzierter Preis) übernehmen wir stattdessen unten selbst.

  const data = await fetchJson(url);
  if (!Array.isArray(data)) {
    throw new Error("Unerwartetes Antwortformat von CheapShark.");
  }

  return data
    .filter((deal) => deal.steamAppID && Number(deal.savings) > 0) // nur echte Angebote mit bekannter Steam-AppID
    .map((deal) => ({
      dealId: deal.dealID,
      title: deal.title,
      steamAppId: deal.steamAppID,
      // Eigenes Cover-CDN von Steam nutzen (dasselbe wie beim Bibliotheks-Import) -
      // deutlich höhere Auflösung als CheapSharks eigenes Vorschaubild.
      coverImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamAppID}/library_600x900.jpg`,
      thumbnailFallback: deal.thumb,
      normalPrice: Number(deal.normalPrice),
      salePrice: Number(deal.salePrice),
      savingsPercent: Math.round(Number(deal.savings)),
    }))
    // Ohne "sortBy"-Parameter an die API liefert sie ihre eigene
    // Standardreihenfolge - hier zusätzlich nach höchster Ersparnis sortiert,
    // damit die besten Angebote zuerst erscheinen.
    .sort((a, b) => b.savingsPercent - a.savingsPercent);
}

/**
 * Sucht Spiele nach Titel über CheapSharks /games-Endpunkt - das durchsucht
 * die komplette CheapShark-Spieledatenbank, nicht nur die aktuellen
 * Angebote aus getDeals(). "steamAppID" ist bei manchen Einträgen null
 * (CheapShark kennt nicht für jedes Spiel die passende Steam-AppID) -
 * deshalb wird als Cover-Bild immer CheapSharks eigenes Vorschaubild
 * ("thumb") genutzt statt sich auf eine AppID zu verlassen.
 */
async function searchGames(title) {
  const trimmed = (title || "").trim();
  if (!trimmed) return [];

  const url = new URL(`${CHEAPSHARK_BASE}/games`);
  url.searchParams.set("title", trimmed);
  url.searchParams.set("limit", "20");

  const data = await fetchJson(url);
  if (!Array.isArray(data)) {
    throw new Error("Unerwartetes Antwortformat von CheapShark.");
  }

  return data.map((game) => ({
    gameId: game.gameID,
    title: game.external,
    steamAppId: game.steamAppID || null,
    // Hochauflösendes Steam-Cover nutzen, wenn eine AppID bekannt ist -
    // CheapSharks eigenes "thumb" ist nur eine winzige Miniatur
    // (z.B. "capsule_sm_120"), auf Kartengröße hochgezogen wirkt das
    // verpixelt. "thumb" bleibt als Rückfallebene für Spiele ohne
    // bekannte Steam-AppID.
    coverImage: game.steamAppID
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppID}/library_600x900.jpg`
      : null,
    thumbnail: game.thumb,
    cheapestPrice: game.cheapest ? Number(game.cheapest) : null,
  }));
}

module.exports = { getDeals, searchGames };
