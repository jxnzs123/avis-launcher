// Avis Downloads Bridge - meldet Download-Events an den lokalen Avis-Server.
// Läuft komplett lokal: nur http://127.0.0.1 wird angesprochen, sonst nichts.

const DEFAULT_PORT = 8721;

async function getSettings() {
  const stored = await chrome.storage.local.get(["avisToken", "avisPort", "avisEnabled"]);
  return {
    token: stored.avisToken || "",
    port: stored.avisPort || DEFAULT_PORT,
    enabled: stored.avisEnabled !== false, // Standard: aktiv, sobald ein Token hinterlegt ist
  };
}

async function sendEvent(payload) {
  const { token, port, enabled } = await getSettings();
  if (!enabled || !token) return; // Ohne Token/Aktivierung nichts senden

  try {
    await fetch(`http://127.0.0.1:${port}/download-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Avis läuft evtl. gerade nicht - einfach stillschweigend ignorieren
  }
}

function extractFilename(item) {
  if (!item.filename) return "Download";
  const parts = item.filename.split(/[\\/]/);
  return parts[parts.length - 1] || "Download";
}

chrome.downloads.onCreated.addListener((item) => {
  sendEvent({
    type: "started",
    id: item.id,
    filename: extractFilename(item),
    filePath: item.filename || "", // voller lokaler Pfad, für "Ordner öffnen" in Avis
    url: item.url,
    totalBytes: item.totalBytes || item.fileSize || 0,
  });
});

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === "complete") {
    chrome.downloads.search({ id: delta.id }, (results) => {
      const item = results?.[0];
      sendEvent({ type: "done", id: delta.id, filePath: item?.filename || "" });
    });
    return;
  }
  if (delta.state && delta.state.current === "interrupted") {
    sendEvent({ type: "error", id: delta.id });
    return;
  }
  if (delta.bytesReceived) {
    // Aktuellen Gesamtstand nachladen, da onChanged nur das Delta liefert
    chrome.downloads.search({ id: delta.id }, (results) => {
      const item = results?.[0];
      if (!item) return;
      sendEvent({
        type: "progress",
        id: item.id,
        receivedBytes: item.bytesReceived,
        totalBytes: item.totalBytes,
      });
    });
  }
});
