/**
 * Feste App-weite Konfiguration - wird beim Bauen der App mit ausgeliefert,
 * ist also für JEDEN Nutzer gleich (im Gegensatz zu den privaten Cloud-
 * Zugangsdaten, die jeder Nutzer selbst in den Einstellungen einträgt).
 *
 * WICHTIG (an dich als Entwickler): Trage hier die URL zu deiner öffentlich
 * gehosteten Store-Katalog-JSON ein, BEVOR du die App baust/veröffentlichst.
 * Am einfachsten: ein öffentliches GitHub-Repo (oder Gist) mit einer Datei
 * "catalog.json" anlegen, dann die "Raw"-URL hier eintragen, z.B.:
 *
 *   https://raw.githubusercontent.com/DEIN-NUTZERNAME/avis-store/main/catalog.json
 *
 * Jede Änderung, die du an dieser Datei auf GitHub vornimmst, sehen alle
 * Nutzer automatisch beim nächsten Öffnen des Store-Tabs - ganz ohne neuen
 * App-Build. Format der catalog.json: siehe README.md, Abschnitt "Store".
 */
export const DEFAULT_STORE_CATALOG_URL =
  "https://raw.githubusercontent.com/jxnzs123/avis-store/main/catalog.json";
