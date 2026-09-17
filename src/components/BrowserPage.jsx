import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Home as HomeIcon,
  Loader2,
} from "lucide-react";
import { buildBrowserHomeUrl } from "../utils/browserHome";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

/** Erkennt, ob die Eingabe eine URL ist oder als Suchbegriff behandelt werden soll */
function resolveInput(raw) {
  const value = raw.trim();
  if (!value) return null;

  const looksLikeUrl =
    /^https?:\/\//i.test(value) ||
    (/^[\w-]+(\.[\w-]+)+/.test(value) && !value.includes(" "));

  if (looksLikeUrl) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

export default function BrowserPage() {
  const webviewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const t = useT();
  const language = useLibraryStore((s) => s.language);

  // Eigene Avis-Startseite statt Google - übernimmt die aktuell gewählte
  // Akzentfarbe (aus der CSS-Variable, die theme.js zur Laufzeit setzt).
  const homeUrl = useMemo(() => {
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    return buildBrowserHomeUrl(accent, t("browser.searchPlaceholder"), language);
  }, [t, language]);

  const [currentUrl, setCurrentUrl] = useState(homeUrl);

  const pendingBrowserUrl = useLibraryStore((s) => s.pendingBrowserUrl);
  const clearPendingBrowserUrl = useLibraryStore((s) => s.clearPendingBrowserUrl);

  // Reagiert, wenn von außerhalb (z.B. Klick auf eine News auf der
  // Home-Seite) eine Navigation zu einer bestimmten URL angefragt wird.
  useEffect(() => {
    if (pendingBrowserUrl) {
      setCurrentUrl(pendingBrowserUrl);
      clearPendingBrowserUrl();
    }
  }, [pendingBrowserUrl, clearPendingBrowserUrl]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleStartLoading = () => setIsLoading(true);
    const handleStopLoading = () => {
      setIsLoading(false);
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    };
    const handleNavigate = (event) => {
      // Auf der eigenen Startseite (data:-URL) bleibt die Adressleiste leer,
      // damit sie nicht mit einer kryptischen data:text/html;... URL gefüllt wird.
      const isHome = event.url.startsWith("data:text/html");
      setCurrentUrl(event.url);
      setAddressInput(isHome ? "" : event.url);
    };
    // Manche Seiten (u.a. verlinkte News-Artikel) schlagen beim ersten
    // Versuch fehl, z.B. wenn die Seite gerade beim Tab-Wechsel im
    // Hintergrund lag. Ein einmaliger automatischer Neuversuch behebt die
    // meisten Fälle von "lädt einfach nicht" bzw. leerem/schwarzem Bild.
    let retried = false;
    const handleFailLoad = (event) => {
      // -3 = ERR_ABORTED, passiert normal bei schneller Navigation - ignorieren
      if (event.errorCode === -3) return;
      setIsLoading(false);
      if (!retried) {
        retried = true;
        setTimeout(() => {
          if (webviewRef.current) webviewRef.current.reload();
        }, 400);
      }
    };
    const handleDomReady = () => {
      retried = false;
    };

    webview.addEventListener("did-start-loading", handleStartLoading);
    webview.addEventListener("did-stop-loading", handleStopLoading);
    webview.addEventListener("did-navigate", handleNavigate);
    webview.addEventListener("did-navigate-in-page", handleNavigate);
    webview.addEventListener("did-fail-load", handleFailLoad);
    webview.addEventListener("dom-ready", handleDomReady);

    return () => {
      webview.removeEventListener("did-start-loading", handleStartLoading);
      webview.removeEventListener("did-stop-loading", handleStopLoading);
      webview.removeEventListener("did-navigate", handleNavigate);
      webview.removeEventListener("did-navigate-in-page", handleNavigate);
      webview.removeEventListener("did-fail-load", handleFailLoad);
      webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, []);

  function navigateTo(url) {
    setCurrentUrl(url);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const resolved = resolveInput(addressInput);
    navigateTo(resolved || homeUrl);
  }

  return (
    <div className="relative z-10 flex h-[calc(100vh-84px)] flex-col gap-3 px-8 pb-6">
      {/* Adressleiste */}
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => webviewRef.current?.goBack()}
          disabled={!canGoBack}
          icon={ArrowLeft}
          title={t("browser.back")}
        />
        <IconButton
          onClick={() => webviewRef.current?.goForward()}
          disabled={!canGoForward}
          icon={ArrowRight}
          title={t("browser.forward")}
        />
        <IconButton
          onClick={() => webviewRef.current?.reload()}
          icon={isLoading ? Loader2 : RotateCw}
          spin={isLoading}
          title={t("browser.reload")}
        />
        <IconButton onClick={() => navigateTo(homeUrl)} icon={HomeIcon} title={t("browser.home")} />

        <form onSubmit={handleSubmit} className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={t("browser.addressPlaceholder")}
            className="w-full rounded-full bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 ring-1 ring-white/10 transition-shadow focus:ring-2 focus:ring-accent"
          />
        </form>
      </div>

      {/* Eingebetteter Browser */}
      <div className="relative flex-1 overflow-hidden rounded-xl bg-base-950 ring-1 ring-white/10">
        <webview
          ref={webviewRef}
          src={currentUrl}
          partition="persist:avisbrowser"
          className="h-full w-full"
          allowpopups="true"
          webpreferences="backgroundThrottling=false"
        />
      </div>
    </div>
  );
}

function IconButton({ onClick, icon: Icon, disabled, spin, title }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon size={16} className={spin ? "animate-spin" : ""} />
    </motion.button>
  );
}
