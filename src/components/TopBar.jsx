import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Library,
  DownloadCloud,
  Cloud,
  Compass,
  MessageCircle,
  Settings,
  Plus,
  LogIn,
  LogOut,
  ExternalLink,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

const NAV_ITEMS = [
  { id: "home", key: "nav.home", icon: Home },
  { id: "library", key: "nav.library", icon: Library },
  { id: "store", key: "nav.store", icon: ShoppingBag },
  { id: "downloads", key: "nav.downloads", icon: DownloadCloud },
  { id: "cloud", key: "nav.cloud", icon: Cloud },
  { id: "browser", key: "nav.browser", icon: Compass },
  { id: "discord", key: "nav.discord", icon: MessageCircle },
  { id: "settings", key: "nav.settings", icon: Settings },
];

/** Steam-Login-Widget oben rechts - zeigt "Mit Steam anmelden", solange
 * niemand eingeloggt ist, danach Avatar + Name mit Dropdown. */
function SteamLoginWidget() {
  const t = useT();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("checking"); // checking | idle | loggingIn
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const menuRef = useRef(null);
  const openInBrowserTab = useLibraryStore((s) => s.openInBrowserTab);

  useEffect(() => {
    window.api.getLoggedInSteamProfile().then((result) => {
      if (result.success) setProfile(result.profile);
      setStatus("idle");
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogin() {
    setStatus("loggingIn");
    setError(null);
    const result = await window.api.loginWithSteam();
    if (result.success) {
      setProfile(result.profile);
    } else {
      setError(result.error);
    }
    setStatus("idle");
  }

  async function handleLogout() {
    await window.api.logoutSteam();
    setProfile(null);
    setMenuOpen(false);
  }

  if (status === "checking") return <div className="h-9 w-9" />;

  if (!profile) {
    return (
      <div className="flex flex-col items-end gap-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          disabled={status === "loggingIn"}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-60"
        >
          {status === "loggingIn" ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
          {t("steam.login")}
        </motion.button>
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
      >
        <img src={profile.avatarUrl} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/10" />
        <span className="text-sm font-medium text-white/90">{profile.name}</span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl bg-base-800 shadow-xl ring-1 ring-white/10"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                openInBrowserTab(profile.profileUrl);
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
            >
              <ExternalLink size={14} />
              {t("steam.openProfile")}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white/80"
            >
              <LogOut size={14} />
              {t("steam.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TopBar() {
  const view = useLibraryStore((s) => s.view);
  const setView = useLibraryStore((s) => s.setView);
  const openAddModal = useLibraryStore((s) => s.openAddModal);
  const t = useT();

  return (
    <div className="relative z-30 flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-10">
        <span className="text-lg font-semibold tracking-wide text-white/90">
          AVIS
        </span>
        <nav className="flex items-center gap-7">
          {NAV_ITEMS.map(({ id, key, icon: Icon }) => {
            const active = view === id;
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                whileTap={{ scale: 0.93 }}
                className={`group relative flex items-center gap-2 pb-1 text-sm transition-colors ${
                  active ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {t(key)}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-accent transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                  }`}
                />
              </motion.button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={openAddModal}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20"
        >
          <Plus size={16} />
          {t("nav.addGame")}
        </motion.button>

        <SteamLoginWidget />
      </div>
    </div>
  );
}
