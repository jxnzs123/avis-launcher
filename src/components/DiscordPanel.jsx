import React from "react";

/**
 * Lädt Discords eigenen Web-Client (discord.com/app) - technisch identisch
 * mit der offiziellen Desktop-App, die selbst nur ein Electron-Wrapper um
 * genau diese Web-Version ist. Läuft in einer EIGENEN Session-Partition
 * ("persist:avisdiscord"), damit der Login unabhängig vom allgemeinen
 * Browser-Tab bestehen bleibt.
 */
export default function DiscordPanel() {
  return (
    <div className="relative z-10 h-[calc(100vh-84px)] px-8 pb-6">
      <div className="h-full overflow-hidden rounded-xl bg-base-950 ring-1 ring-white/10">
        <webview
          src="https://discord.com/app"
          partition="persist:avisdiscord"
          className="h-full w-full"
          allowpopups="true"
          webpreferences="backgroundThrottling=false"
        />
      </div>
    </div>
  );
}
