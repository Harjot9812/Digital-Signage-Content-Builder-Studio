// index.js (Electron Main Process)
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const WebSocket = require("ws");

let mainWindow;
const screenId = "123"; // Use the same screenId as in your dashboard
// Path to store the offline canvas JSON
const JSON_FILE = path.join(app.getPath("userData"), `${screenId}.json`);
const WS_URL = `ws://localhost:8080?role=electron&screenId=${screenId}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,  // Enable Node integration in the renderer
      contextIsolation: false // Disable context isolation for simplicity
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools for debugging.
  mainWindow.webContents.openDevTools();

  // Attempt to connect to the WebSocket server.
  setupWebSocket();
}

let ws;
let isConnected = false;

function setupWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    isConnected = true;
    console.log("WebSocket connected");
    // You can optionally send a request for the latest data here.
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === "contentUpdate") {
        // Save the latest canvas data locally.
        saveCanvasData(message.content);
        // Send the canvas data to the renderer process.
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send("canvas-update", message.content);
        }
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    isConnected = false;
    console.log("WebSocket closed. Switching to offline mode.");
    loadOfflineCanvas();
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    isConnected = false;
    loadOfflineCanvas();
  });
}

// Save the canvas data locally
function saveCanvasData(content) {
  fs.writeFile(JSON_FILE, JSON.stringify(content, null, 2), (err) => {
    if (err) {
      console.error("Error saving canvas data:", err);
    } else {
      console.log("Canvas data saved locally.");
    }
  });
}

// Load the offline canvas data (if available) and send it to the renderer
function loadOfflineCanvas() {
  fs.readFile(JSON_FILE, "utf8", (err, data) => {
    if (err) {
      console.log("No offline canvas data found.");
    } else {
      try {
        const content = JSON.parse(data);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send("canvas-update", content);
        }
        console.log("Offline canvas data loaded.");
      } catch (parseErr) {
        console.error("Error parsing offline canvas data:", parseErr);
      }
    }
  });
}

// Optional: Listen for a manual sync request from the renderer.
ipcMain.on("request-canvas-update", (event, requestedScreenId) => {
  if (requestedScreenId === screenId) {
    if (!isConnected) {
      loadOfflineCanvas();
    } else {
      console.log("WebSocket is connected, no manual sync needed.");
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
