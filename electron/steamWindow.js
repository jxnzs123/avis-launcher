const { execFile } = require("child_process");

/**
 * Best-Effort-Versuch, das Steam-Hauptfenster zu minimieren, damit man
 * nicht jedes Mal den Steam-Client vor der Nase hat - weder beim Starten
 * eines Spiels noch beim Auslösen eines Downloads über Avis.
 *
 * WICHTIG - ehrliche Grenzen davon:
 * - Steam ist closed-source und bietet keine offizielle API dafür an. Das
 *   hier nutzt reine Windows-Fenstersteuerung von außen (PowerShell +
 *   Win32 ShowWindowAsync), kein Steam-eigener Mechanismus.
 * - Es kann NICHT verhindert werden, dass Steam selbst kurzzeitig eigene
 *   Dialoge zeigt, bevor sie minimiert werden - die Timing-Versuche unten
 *   erwischen das meistens, aber nicht garantiert.
 * - BESONDERS bei einer NEUEN Installation (noch nicht installiertes
 *   Spiel) zeigt Steam oft einen Bestätigungsdialog (Installationsort
 *   wählen o.ä.), der eine Nutzer-Interaktion braucht, BEVOR der
 *   eigentliche Download losläuft. Wird dieser Dialog automatisch
 *   mitminimiert, wirkt es evtl. so, als würde gar nichts passieren -
 *   tatsächlich wartet Steam dann nur im Hintergrund auf eine Bestätigung.
 *   Falls ein Download in Avis ewig bei 0% hängen bleibt, lohnt sich ein
 *   Blick, ob Steam im Hintergrund auf eine Bestätigung wartet.
 * - Bricht potenziell mit zukünftigen Steam-Client-Updates, falls sich
 *   Fenstername/-verhalten ändert. Das ist eine Krücke, keine echte Lösung.
 */
function attemptMinimizeSteamWindow() {
  if (process.platform !== "win32") return;

  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AvisWin32 {
  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
"@
Get-Process -Name steam -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.MainWindowHandle -ne 0) {
    [AvisWin32]::ShowWindowAsync($_.MainWindowHandle, 6) | Out-Null
  }
}
`.trim();

  // Mehrere Versuche mit steigendem Abstand, weil Steams Fenster erst mit
  // Verzögerung erscheint (bzw. nach dem ersten Minimieren nochmal ein
  // eigener Dialog aufpoppen kann).
  // Schnellere, häufigere Versuche als vorher - Steams Fenster soll so kurz
  // wie möglich groß sichtbar sein, bevor es minimiert wird. Mehrere
  // Versuche nötig, weil das Fenster nicht sofort existiert bzw. sich nach
  // einem Minimieren nochmal selbst in den Vordergrund holen kann.
  [300, 600, 1000, 1500, 2200, 3200, 4500, 6000, 8000, 10500].forEach((delay) => {
    setTimeout(() => {
      execFile("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", script], () => {
        // Fehler hier bewusst ignoriert - reiner Best-Effort-Kosmetik-Versuch,
        // soll den eigentlichen Vorgang niemals blockieren oder stören.
      });
    }, delay);
  });
}

module.exports = { attemptMinimizeSteamWindow };
