/**
 * Instant-Gaming-Affiliate-Links.
 *
 * Der Referral-Parameter (igr) wird bei jedem generierten Link automatisch
 * angehängt - unabhängig davon, ob der Link aus dem Store-Bereich, den
 * Neuerscheinungen oder sonst woher in Avis kommt.
 */
const AFFILIATE_CODE = "gamer-7356601";

/**
 * Baut eine Instant-Gaming-Such-URL für einen Spieltitel.
 * Beispiel: getInstantGamingUrl("GTA V")
 *        -> "https://www.instant-gaming.com/de/suche/?q=GTA%20V&igr=gamer-7356601"
 */
export function getInstantGamingUrl(gameTitle) {
  const query = encodeURIComponent(gameTitle || "");
  return `https://www.instant-gaming.com/de/suche/?q=${query}&igr=${AFFILIATE_CODE}`;
}

/** Referral-Link direkt auf die Instant-Gaming-Startseite (z.B. für Werbebanner). */
export function getInstantGamingHomeUrl() {
  return `https://www.instant-gaming.com/?igr=${AFFILIATE_CODE}`;
}
