const STORAGE_KEY = "avis-background-config";

export function getBackgroundModes(t) {
  return [
    {
      id: "ambient",
      label: t("background.ambient"),
      description: t("background.ambientDesc"),
    },
    {
      id: "custom",
      label: t("background.custom"),
      description: t("background.customDesc"),
    },
    {
      id: "classic",
      label: t("background.classic"),
      description: t("background.classicDesc"),
    },
  ];
}

const DEFAULT_CONFIG = { mode: "ambient", imagePath: "" };

export function loadBackgroundConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveBackgroundConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
