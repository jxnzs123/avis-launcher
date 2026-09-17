/**
 * EXPERIMENTELL - automatisches Wegklicken von Steams
 * Installations-Bestätigungsdialogen.
 *
 * ==========================================================================
 * WICHTIGER HINWEIS, BITTE LESEN:
 * Das hier ist reine Windows-UI-Automatisierung (dasselbe Prinzip wie
 * AutoHotkey/AutoIt) - es gibt KEINE offizielle Steam-API dafür. Der Code
 * wurde OHNE Zugriff auf einen echten Windows-PC mit Steam geschrieben und
 * konnte nicht getestet werden. Er sucht in Steams Fenstern nach Buttons,
 * deren Beschriftung zu einer Liste bekannter Wörter passt ("Installieren",
 * "Weiter", "Install", "Next", ...), und klickt sie automatisch.
 *
 * Mögliche Probleme, auf die du achten solltest:
 * - Findet das Skript keinen passenden Button (z.B. weil Steam eine andere
 *   Sprache/Formulierung nutzt oder ein neueres UI hat), passiert einfach
 *   nichts - dann bitte manuell in Steam bestätigen wie bisher.
 * - Steams Installationsdialog ist oft mehrstufig (Sprache -> Ordner ->
 *   Installieren) - das Skript versucht das über mehrere Sekunden verteilt
 *   mehrfach, damit es mehrere Schritte hintereinander erwischen kann.
 * - Falls es einen FALSCHEN Button anklickt (z.B. weil ein Wort in einem
 *   anderen Kontext vorkommt), kann das zu einer ungewollten Aktion führen.
 *   Melde mir bitte genau, was passiert, damit die Wortliste angepasst
 *   werden kann.
 * ==========================================================================
 */

const { execFile } = require("child_process");

const BUTTON_KEYWORDS = [
  "Installieren",
  "Install",
  "Weiter",
  "Next",
  "Fertig stellen",
  "Fertigstellen",
  "Finish",
  "OK",
  "Akzeptieren",
  "Accept",
];

function attemptAutoConfirmInstall() {
  if (process.platform !== "win32") return;

  const keywordList = BUTTON_KEYWORDS.map((k) => `'${k.replace(/'/g, "''")}'`).join(",");

  const script = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$keywords = @(${keywordList})
$clicked = @{}

for ($round = 0; $round -lt 18; $round++) {
  Get-Process -Name steam*, gameoverlayui -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = $_
    if ($proc.MainWindowHandle -ne 0) {
      try {
        $root = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
        $condition = New-Object System.Windows.Automation.PropertyCondition(
          [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
          [System.Windows.Automation.ControlType]::Button
        )
        $buttons = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
        foreach ($btn in $buttons) {
          $name = $btn.Current.Name
          $id = $proc.Id.ToString() + "|" + $name
          if ($name -and -not $clicked.ContainsKey($id)) {
            foreach ($kw in $keywords) {
              if ($name -like "*$kw*") {
                try {
                  $pattern = $btn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
                  $pattern.Invoke()
                  $clicked[$id] = $true
                } catch {}
                break
              }
            }
          }
        }
      } catch {}
    }
  }
  Start-Sleep -Milliseconds 1200
}
`.trim();

  execFile("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", script], (error) => {
    if (error) {
      console.warn("Automatisches Bestätigen der Steam-Installation ist fehlgeschlagen (kein Problem, einfach manuell in Steam bestätigen):", error.message);
    }
  });
}

module.exports = { attemptAutoConfirmInstall };
