import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  PlugZap,
  Palette,
  Check,
  Image as ImageIcon,
  Sparkles,
  Grid3x3,
  Languages,
  Cloud,
  Gamepad2,
  Globe,
  ShieldCheck,
  ShieldQuestion,
  KeyRound,
  DownloadCloud,
} from "lucide-react";
import { PRESET_COLORS, applyAccentColor, saveAccentColor, loadSavedAccentColor } from "../utils/theme";
import { VPN_AFFILIATE_URL, hasVpnAffiliateLink } from "../utils/vpnAffiliate";
import { getBackgroundModes } from "../utils/background";
import { LANGUAGES } from "../utils/i18n";
import { useLibraryStore, formatPlaytime } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

function getSections(t) {
  return [
    { id: "general", label: t("settings.sectionGeneral"), icon: Sparkles },
    { id: "sources", label: t("settings.sectionSources"), icon: Gamepad2 },
    { id: "cloud", label: t("settings.sectionCloud"), icon: Cloud },
    { id: "discord", label: t("settings.sectionDiscord"), icon: Gamepad2 },
    { id: "browser", label: t("settings.sectionBrowser"), icon: Globe },
  ];
}

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState("general");
  const language = useLibraryStore((s) => s.language);
  const t = useT();
  const SECTIONS = getSections(t);

  return (
    <div className="relative z-10 flex gap-8 px-8 pb-10">
      {/* Kategorien-Sidebar */}
      <nav className="flex w-44 flex-shrink-0 flex-col gap-1 pt-1">
        <h1 className="mb-3 text-lg font-bold text-white">{t("settings.title")}</h1>
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active ? "bg-accent/15 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon size={15} className={active ? "text-accent-soft" : ""} />
              {section.label}
            </button>
          );
        })}
      </nav>

      {/* Inhalt der ausgewählten Kategorie */}
      <div className="max-w-lg flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === "general" && <GeneralSection t={t} language={language} />}
            {activeSection === "sources" && <SourcesSection />}
            {activeSection === "cloud" && <CloudSection />}
            {activeSection === "discord" && <DiscordSection />}
            {activeSection === "browser" && <BrowserSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-base-850 p-5 shadow-card">{children}</div>
  );
}

function CardHeader({ icon: Icon, title, hint }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white">
        <Icon size={15} className="text-accent-soft" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------------ */
/* Allgemein: Sprache, Akzentfarbe, Hintergrund                             */
/* ------------------------------------------------------------------------ */
function GeneralSection({ t, language }) {
  const setLanguage = useLibraryStore((s) => s.setLanguage);
  const backgroundConfig = useLibraryStore((s) => s.backgroundConfig);
  const setBackgroundConfig = useLibraryStore((s) => s.setBackgroundConfig);
  const [accentColor, setAccentColor] = useState(loadSavedAccentColor() || PRESET_COLORS[0].value);
  const BACKGROUND_MODES = getBackgroundModes(t);

  function handleAccentChange(hex) {
    setAccentColor(hex);
    applyAccentColor(hex);
    saveAccentColor(hex);
  }

  async function handlePickBackgroundImage() {
    const filePath = await window.api.selectImage();
    if (filePath) setBackgroundConfig({ mode: "custom", imagePath: filePath });
  }

  return (
    <>
      <Card>
        <CardHeader icon={Languages} title={t("settings.language")} />
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                language === lang.code
                  ? "bg-accent text-base-950"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader icon={Palette} title={t("settings.accent")} />
        <div className="flex flex-wrap items-center gap-3">
          {PRESET_COLORS.map((preset) => (
            <motion.button
              key={preset.value}
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => handleAccentChange(preset.value)}
              title={preset.name}
              className="relative h-9 w-9 rounded-full ring-2 ring-transparent transition-shadow"
              style={{ backgroundColor: preset.value }}
            >
              {accentColor.toLowerCase() === preset.value.toLowerCase() && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full ring-2 ring-white/80">
                  <Check size={14} className="text-white drop-shadow" />
                </span>
              )}
            </motion.button>
          ))}

          <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-dashed ring-white/25">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className="pointer-events-none h-full w-full rounded-full"
              style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader icon={ImageIcon} title={t("settings.background")} />
        <div className="flex flex-col gap-2">
          {BACKGROUND_MODES.map((mode) => {
            const Icon = mode.id === "ambient" ? Sparkles : mode.id === "custom" ? ImageIcon : Grid3x3;
            const active = backgroundConfig.mode === mode.id;
            return (
              <motion.button
                key={mode.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  mode.id === "custom" ? handlePickBackgroundImage() : setBackgroundConfig({ mode: mode.id })
                }
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left ring-1 transition-colors ${
                  active ? "bg-accent/10 ring-accent/50" : "bg-white/5 ring-white/10 hover:bg-white/10"
                }`}
              >
                <Icon size={16} className={active ? "text-accent-soft" : "text-white/40"} />
                <span className="flex-1 text-sm text-white">{mode.label}</span>
                {active && <Check size={15} className="text-accent-soft" />}
              </motion.button>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Spiele-Quellen: Steam-Bibliotheks-Import                                 */
/* ------------------------------------------------------------------------ */
function SourcesSection() {
  const [steamId, setSteamId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [credsSaved, setCredsSaved] = useState(false);
  const [importState, setImportState] = useState({ status: "idle" }); // idle | loading | success | error
  const addExistingGame = useLibraryStore((s) => s.addExistingGame);
  const games = useLibraryStore((s) => s.games);
  const t = useT();

  useEffect(() => {
    window.api.getSteamConfig().then((c) => {
      setSteamId(c.steamId || "");
      setApiKey(c.apiKey || "");
    });
  }, []);

  async function handleSaveCreds() {
    await window.api.saveSteamConfig({ steamId: steamId.trim(), apiKey: apiKey.trim() });
    setCredsSaved(true);
    setTimeout(() => setCredsSaved(false), 1500);
  }

  async function handleImport() {
    window.api.saveSteamConfig({ steamId: steamId.trim(), apiKey: apiKey.trim() });
    setImportState({ status: "loading" });
    const result = await window.api.steamImportLibrary({ steamId: steamId.trim(), apiKey: apiKey.trim() });
    if (!result.success) {
      setImportState({ status: "error", message: result.error });
      return;
    }

    const existingAppIds = new Set(
      games.filter((g) => g.source === "steam").map((g) => g.steamAppId)
    );
    let added = 0;
    result.games.forEach((game) => {
      if (existingAppIds.has(game.steamAppId)) return;
      addExistingGame({ id: crypto.randomUUID(), ...game });
      added += 1;
    });

    setImportState({
      status: "success",
      message:
        added > 0
          ? t("sources.importedNew", { added, total: result.games.length })
          : t("sources.importedNoneNew"),
    });
  }

  return (
    <>
      <Card>
        <CardHeader
          icon={Gamepad2}
          title={t("sources.title")}
          hint={t("sources.hint")}
        />

        <Field label={t("sources.steamId")}>
          <input
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder={t("sources.steamIdPlaceholder")}
            className="input"
          />
        </Field>
        <Field label={t("sources.apiKey")}>
          <div className="flex gap-2">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("sources.apiKeyPlaceholder")}
              type="password"
              className="input flex-1"
            />
            <button
              onClick={handleSaveCreds}
              className="flex-shrink-0 rounded-lg bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
            >
              {credsSaved ? t("common.saved") : t("common.save")}
            </button>
          </div>
        </Field>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleImport}
          disabled={importState.status === "loading" || !steamId || !apiKey}
          className="flex items-center gap-2 self-start rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft disabled:opacity-50"
        >
          {importState.status === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <DownloadCloud size={15} />
          )}
          {t("sources.importLibrary")}
        </motion.button>

        {importState.status === "success" && (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={14} /> {importState.message}
          </p>
        )}
        {importState.status === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle size={14} /> {importState.message}
          </p>
        )}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Cloud-Speicher: S3-Zugangsdaten                                          */
/* ------------------------------------------------------------------------ */
const emptyCloudConfig = {
  endpoint: "",
  region: "eu-central-1",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
  remotePath: "games",
  forcePathStyle: true,
};

function CloudSection() {
  const [config, setConfig] = useState(emptyCloudConfig);
  const [saveState, setSaveState] = useState("idle");
  const [testState, setTestState] = useState({ status: "idle", message: "" });
  const t = useT();

  useEffect(() => {
    window.api.getCloudConfig().then((loaded) => setConfig({ ...emptyCloudConfig, ...loaded }));
  }, []);

  function update(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaveState("idle");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveState("saving");
    await window.api.saveCloudConfig(config);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  async function handleTestConnection() {
    setTestState({ status: "testing", message: "" });
    await window.api.saveCloudConfig(config);
    const result = await window.api.testCloudConnection();
    setTestState(
      result.success
        ? { status: "success", message: t("cloudSettings.testSuccess") }
        : { status: "error", message: result.error || t("cloudSettings.testFailed") }
    );
  }

  return (
    <motion.form onSubmit={handleSave}>
      <Card>
        <CardHeader
          icon={Cloud}
          title={t("cloudSettings.title")}
          hint={t("cloudSettings.hint")}
        />

        <Field label={t("cloudSettings.endpoint")}>
          <input
            value={config.endpoint}
            onChange={(e) => update("endpoint", e.target.value)}
            placeholder="https://fsn1.your-objectstorage.com"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("cloudSettings.region")}>
            <input
              value={config.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="fsn1"
              className="input"
            />
          </Field>
          <Field label={t("cloudSettings.bucket")}>
            <input
              value={config.bucket}
              onChange={(e) => update("bucket", e.target.value)}
              placeholder={t("cloudSettings.bucketPlaceholder")}
              className="input"
            />
          </Field>
        </div>

        <Field label={t("cloudSettings.accessKey")}>
          <input
            value={config.accessKeyId}
            onChange={(e) => update("accessKeyId", e.target.value)}
            placeholder="Access Key ID"
            className="input"
            autoComplete="off"
          />
        </Field>

        <Field label={t("cloudSettings.secretKey")}>
          <input
            type="password"
            value={config.secretAccessKey}
            onChange={(e) => update("secretAccessKey", e.target.value)}
            placeholder="Secret Access Key"
            className="input"
            autoComplete="off"
          />
        </Field>

        <Field label={t("cloudSettings.remotePath")}>
          <input
            value={config.remotePath}
            onChange={(e) => update("remotePath", e.target.value)}
            placeholder="games"
            className="input"
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-white/70">
          <input
            type="checkbox"
            checked={config.forcePathStyle !== false}
            onChange={(e) => update("forcePathStyle", e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t("cloudSettings.pathStyle")}
        </label>

        <div className="mt-1 flex items-center gap-3">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
          >
            <Save size={15} />
            {saveState === "saving" ? t("common.saving") : saveState === "saved" ? t("common.saved") : t("common.save")}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleTestConnection}
            whileTap={{ scale: 0.95 }}
            disabled={testState.status === "testing"}
            className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
          >
            {testState.status === "testing" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <PlugZap size={15} />
            )}
            {t("settings.testConnection")}
          </motion.button>
        </div>

        {testState.status === "success" && (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={14} /> {testState.message}
          </p>
        )}
        {testState.status === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle size={14} /> {testState.message}
          </p>
        )}
      </Card>
    </motion.form>
  );
}

/* ------------------------------------------------------------------------ */
/* Discord Rich Presence                                                    */
/* ------------------------------------------------------------------------ */
function DiscordSection() {
  const [config, setConfig] = useState({ enabled: false, clientId: "" });
  const [status, setStatus] = useState("disconnected");
  const t = useT();

  useEffect(() => {
    window.api.getDiscordConfig().then(setConfig);
    window.api.getDiscordStatus().then(setStatus);
    const unsubscribe = window.api.onDiscordStatus(setStatus);
    return unsubscribe;
  }, []);

  async function handleToggle() {
    const next = await window.api.saveDiscordConfig({ enabled: !config.enabled });
    setConfig(next);
  }

  async function handleSaveClientId() {
    const next = await window.api.saveDiscordConfig({ clientId: config.clientId });
    setConfig(next);
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardHeader
          icon={Gamepad2}
          title={t("discordSettings.title")}
          hint={t("discordSettings.hint")}
        />
        <ToggleSwitch checked={config.enabled} onChange={handleToggle} />
      </div>

      {config.enabled && (
        <>
          <Field label={t("discordSettings.appId")}>
            <div className="flex gap-2">
              <input
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder={t("discordSettings.appIdPlaceholder")}
                className="input flex-1"
              />
              <button
                onClick={handleSaveClientId}
                className="flex-shrink-0 rounded-lg bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
              >
                {t("common.save")}
              </button>
            </div>
          </Field>

          <p className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-success" : "bg-white/30"}`}
            />
            <span className="text-white/50">
              {status === "connected" ? t("discordSettings.connected") : t("discordSettings.disconnected")}
            </span>
          </p>
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Browser: DNS-Datenschutz + optionaler Proxy                              */
/* ------------------------------------------------------------------------ */
function BrowserSection() {
  const [proxy, setProxy] = useState({ enabled: false, protocol: "socks5", host: "", port: "" });
  const [saved, setSaved] = useState(false);
  const [adBlocker, setAdBlocker] = useState({ enabled: true });
  const [vtConfig, setVtConfig] = useState({ apiKey: "" });
  const [vtSaved, setVtSaved] = useState(false);
  const t = useT();

  useEffect(() => {
    window.api.getBrowserProxyConfig().then(setProxy);
    window.api.getAdBlockerConfig().then(setAdBlocker);
    window.api.getVirusScanConfig().then(setVtConfig);
  }, []);

  async function handleSave() {
    const next = await window.api.saveBrowserProxyConfig(proxy);
    setProxy(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleSaveVtKey() {
    const next = await window.api.saveVirusScanConfig(vtConfig);
    setVtConfig(next);
    setVtSaved(true);
    setTimeout(() => setVtSaved(false), 1500);
  }

  async function handleToggleAdBlocker() {
    const next = await window.api.saveAdBlockerConfig({ enabled: !adBlocker.enabled });
    setAdBlocker(next);
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <CardHeader
            icon={ShieldCheck}
            title={t("browserSettings.adBlockerTitle")}
            hint={t("browserSettings.adBlockerHint")}
          />
          <ToggleSwitch checked={adBlocker.enabled} onChange={handleToggleAdBlocker} />
        </div>
      </Card>

      <Card>
        <CardHeader icon={ShieldCheck} title={t("browserSettings.dnsTitle")} />
        <p className="flex items-center gap-1.5 text-xs text-white/50">
          <span className="h-2 w-2 rounded-full bg-success" />
          {t("browserSettings.dnsActive")}
        </p>
      </Card>

      <Card>
        <CardHeader
          icon={ShieldCheck}
          title={t("browserSettings.virusScanTitle")}
          hint={t("browserSettings.virusScanHint")}
        />
        <Field label={t("browserSettings.virusTotalKey")}>
          <div className="flex gap-2">
            <input
              value={vtConfig.apiKey}
              onChange={(e) => setVtConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder={t("browserSettings.virusTotalKeyPlaceholder")}
              type="password"
              className="input flex-1"
            />
            <button
              onClick={handleSaveVtKey}
              className="flex-shrink-0 rounded-lg bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
            >
              {vtSaved ? t("common.saved") : t("common.save")}
            </button>
          </div>
        </Field>
        <p className="text-xs text-white/40">{t("browserSettings.virusScanNote")}</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardHeader
            icon={Globe}
            title={t("browserSettings.proxyTitle")}
            hint={t("browserSettings.proxyHint")}
          />
          <ToggleSwitch checked={proxy.enabled} onChange={() => setProxy((p) => ({ ...p, enabled: !p.enabled }))} />
        </div>

        {proxy.enabled && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t("browserSettings.proxyType")}>
                <select
                  value={proxy.protocol}
                  onChange={(e) => setProxy((p) => ({ ...p, protocol: e.target.value }))}
                  className="input"
                >
                  <option value="socks5">SOCKS5</option>
                  <option value="http">HTTP</option>
                </select>
              </Field>
              <Field label={t("browserSettings.proxyHost")}>
                <input
                  value={proxy.host}
                  onChange={(e) => setProxy((p) => ({ ...p, host: e.target.value }))}
                  placeholder="127.0.0.1"
                  className="input"
                />
              </Field>
              <Field label={t("browserSettings.proxyPort")}>
                <input
                  value={proxy.port}
                  onChange={(e) => setProxy((p) => ({ ...p, port: e.target.value }))}
                  placeholder="1080"
                  className="input"
                />
              </Field>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex items-center gap-2 self-start rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
            >
              <Save size={15} />
              {saved ? t("common.saved") : t("common.save")}
            </motion.button>

            {hasVpnAffiliateLink() && (
              <div className="mt-1 flex items-start gap-2.5 rounded-xl bg-white/5 p-3">
                <ShieldQuestion size={15} className="mt-0.5 flex-shrink-0 text-accent-soft" />
                <div className="flex-1">
                  <p className="text-xs text-white/70">{t("browserSettings.vpnRecommendation")}</p>
                  <button
                    onClick={() => useLibraryStore.getState().openInBrowserTab(VPN_AFFILIATE_URL)}
                    className="mt-1.5 text-xs font-medium text-accent-soft hover:underline"
                  >
                    {t("browserSettings.vpnLearnMore")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-white/15"
      }`}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
