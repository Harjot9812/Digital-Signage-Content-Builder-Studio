// renderer.js
const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Fabric.js canvas
  const canvas = new fabric.Canvas("canvas");
  canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

  // Listen for canvas updates from the main process (both online and offline)
  ipcRenderer.on("canvas-update", (event, content) => {
    console.log("Received canvas-update from main process:", content);
    if (content) {
      canvas.loadFromJSON(content, () => {
        canvas.renderAll();
        console.log("Canvas updated with new JSON content.");
      });
    } else {
      console.log("No canvas content received.");
    }
  });

  // Optional: Manual sync button to request the latest offline data
  const screenIdInput = document.getElementById("screenId");
  const syncBtn = document.getElementById("syncBtn");

  if (syncBtn && screenIdInput) {
    syncBtn.addEventListener("click", () => {
      const screenId = screenIdInput.value.trim();
      if (!screenId) {
        alert("Please enter a valid Screen ID");
        return;
      }
      ipcRenderer.send("request-canvas-update", screenId);
    });
  }
});
