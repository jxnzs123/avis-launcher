/**
 * VPN-Empfehlung im Browser-Bereich der Einstellungen.
 *
 * Anders als bei Instant Gaming (siehe instantGaming.js) gibt es hier noch
 * keinen echten Affiliate-Code - das musst du einmalig selbst eintragen,
 * nachdem du dich bei einem Partnerprogramm angemeldet hast (z.B. NordVPN,
 * ExpressVPN oder Surfshark - alle drei haben öffentlich zugängliche
 * Affiliate-Programme mit üblicherweise 30-40% Provision pro Abschluss).
 *
 * Einfach VPN_AFFILIATE_URL unten durch deinen echten Link ersetzen.
 */
export const VPN_AFFILIATE_URL = "https://DEIN-VPN-AFFILIATE-LINK";

export function hasVpnAffiliateLink() {
  return !VPN_AFFILIATE_URL.includes("DEIN-VPN-AFFILIATE-LINK");
}
