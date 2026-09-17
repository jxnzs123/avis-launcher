const tokenInput = document.getElementById("token");
const portInput = document.getElementById("port");
const status = document.getElementById("status");

chrome.storage.local.get(["avisToken", "avisPort"]).then((stored) => {
  tokenInput.value = stored.avisToken || "";
  portInput.value = stored.avisPort || 8721;
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    avisToken: tokenInput.value.trim(),
    avisPort: Number(portInput.value) || 8721,
    avisEnabled: true,
  });
  status.textContent = "Gespeichert ✓";
  status.style.color = "#3ddc84";
  setTimeout(() => (status.textContent = ""), 2000);
});
