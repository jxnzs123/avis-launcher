import { useLibraryStore } from "../store/useLibraryStore";
import { translate } from "../utils/i18n";

/**
 * Kurzer Hook statt in jeder Komponente erneut "language" aus dem Store zu
 * holen und t() manuell zu bauen. Nutzung: const t = useT();  t("key")
 */
export function useT() {
  const language = useLibraryStore((s) => s.language);
  return (key, vars) => translate(language, key, vars);
}
