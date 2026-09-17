import React from "react";

/**
 * Lädt Steams Community-Seite (steamcommunity.com) - eigene
 * Session-Partition ("persist:avissteam"), dieselbe, die auch der
 * "Mit Steam anmelden"-Login nutzt, damit man hier automatisch eingeloggt
 * ist, sobald man sich einmal über den Button oben rechts angemeldet hat.
 *
 * WICHTIG - ehrliche Einordnung: Anders als bei Discord gibt es hier
 * keinen vollwertigen "Web-Client". Diese Seite zeigt Profil, Freunde,
 * Community-Gruppen und den Store - NICHT die eigene Spielebibliothek,
 * laufende Downloads oder installierte Spiele. Das gibt es ausschließlich
 * in der echten Steam-Desktop-App, dafür existiert keine Web-Version.
 */
export default function SteamPanel() {
  return (
    <div className="relative z-10 h-[calc(100vh-84px)] px-8 pb-6">
      <div className="h-full overflow-hidden rounded-xl bg-base-950 ring-1 ring-white/10">
        <webview
          src="https://steamcommunity.com/"
          partition="persist:avissteam"
          className="h-full w-full"
          allowpopups="true"
          webpreferences="backgroundThrottling=false"
        />
      </div>
    </div>
  );
}
