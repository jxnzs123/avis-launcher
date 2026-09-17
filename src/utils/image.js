/**
 * Gibt eine für <img src> nutzbare URL zurück - unterscheidet zwischen
 * lokalen Dateipfaden (bekommen "file://" vorangestellt) und bereits
 * vollständigen http(s)-URLs (z.B. Cover-Bilder aus externen Quellen),
 * die unverändert bleiben müssen.
 */
export function resolveImageSrc(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `file://${pathOrUrl}`;
}
