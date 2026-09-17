/**
 * Baut eine eigenständige HTML-Seite (als data:-URL) für die Startseite des
 * eingebauten Browser-Tabs - im Avis-Look statt Google direkt zu laden.
 * Läuft als eigenständiges Dokument im <webview>, deshalb wird die aktuell
 * gewählte Akzentfarbe als fertiger RGB-String mit reingereicht statt über
 * eine gemeinsame CSS-Variable.
 */
export function buildBrowserHomeUrl(accentRgb, searchPlaceholder, lang) {
  const accent = accentRgb || "79 178 255";
  const placeholder = searchPlaceholder || "Search the web…";
  const htmlLang = lang || "en";

  const quickLinks = [
    { label: "Steam", url: "https://store.steampowered.com" },
    { label: "GOG", url: "https://www.gog.com" },
    { label: "Epic Games", url: "https://store.epicgames.com" },
    { label: "itch.io", url: "https://itch.io" },
  ];

  const linksHtml = quickLinks
    .map(
      (link) => `
      <a class="tile" href="${link.url}">
        <span>${link.label}</span>
      </a>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8" />
<title>Avis Start</title>
<style>
  :root { --accent: ${accent}; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; height: 100%;
    background: #07080b;
    font-family: -apple-system, "Segoe UI", Inter, sans-serif;
    color: #fff;
  }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 28px; padding: 24px;
  }
  .wordmark {
    font-size: 34px; font-weight: 700; letter-spacing: 0.35em;
    color: rgba(255,255,255,0.92);
    text-shadow: 0 0 40px rgb(var(--accent) / 0.35);
  }
  form { width: 100%; max-width: 560px; }
  .search {
    width: 100%; padding: 14px 20px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #fff; font-size: 15px; outline: none;
    transition: box-shadow 0.2s;
  }
  .search:focus { box-shadow: 0 0 0 2px rgb(var(--accent) / 0.8); }
  .search::placeholder { color: rgba(255,255,255,0.3); }
  .tiles {
    display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 560px;
  }
  .tile {
    padding: 10px 18px; border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.75); text-decoration: none; font-size: 13px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .tile:hover {
    background: rgb(var(--accent) / 0.15);
    border-color: rgb(var(--accent) / 0.4);
    color: #fff;
  }
</style>
</head>
<body>
  <div class="wordmark">AVIS</div>
  <form action="https://www.google.com/search" method="GET">
    <input class="search" name="q" placeholder="${placeholder}" autofocus />
  </form>
  <div class="tiles">${linksHtml}</div>
</body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
