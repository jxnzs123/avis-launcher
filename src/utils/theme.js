const STORAGE_KEY = "avis-theme-accent";

export const PRESET_COLORS = [
  { name: "Avis Blau", value: "#4fb2ff" },
  { name: "Violett", value: "#a78bfa" },
  { name: "Smaragd", value: "#34d399" },
  { name: "Bernstein", value: "#fbbf24" },
  { name: "Rose", value: "#fb7185" },
  { name: "Cyan", value: "#22d3ee" },
];

/** Hex -> {h,s,l} */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgbTriplet(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toByte = (v) => Math.round((v + m) * 255);
  return `${toByte(r)} ${toByte(g)} ${toByte(b)}`;
}

function hexToRgbTriplet(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Leitet aus einer Basisfarbe eine hellere ("soft") und dunklere ("muted")
 * Variante ab. Rückgabewerte sind RGB-Tripel-Strings ("79 178 255"), damit
 * sie direkt in CSS-Variablen passen, die Tailwinds Opacity-Modifier
 * (z.B. ring-accent/70, bg-accent/15) unterstützen.
 */
export function deriveAccentPalette(baseHex) {
  const { h, s, l } = hexToHsl(baseHex);
  return {
    accent: hexToRgbTriplet(baseHex),
    soft: hslToRgbTriplet(h, clamp01(s * 0.9), clamp01(l + 0.15)),
    muted: hslToRgbTriplet(h, clamp01(s * 0.9), clamp01(l - 0.18)),
  };
}

/** Setzt die CSS-Variablen live auf dem Dokument-Root */
export function applyAccentColor(baseHex) {
  const palette = deriveAccentPalette(baseHex);
  const root = document.documentElement;
  root.style.setProperty("--color-accent", palette.accent);
  root.style.setProperty("--color-accent-soft", palette.soft);
  root.style.setProperty("--color-accent-muted", palette.muted);
}

export function saveAccentColor(baseHex) {
  localStorage.setItem(STORAGE_KEY, baseHex);
}

export function loadSavedAccentColor() {
  return localStorage.getItem(STORAGE_KEY);
}

/** Beim App-Start aufrufen: wendet zuvor gespeicherte Farbe an (falls vorhanden) */
export function initTheme() {
  const saved = loadSavedAccentColor();
  if (saved) applyAccentColor(saved);
}
