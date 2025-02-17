const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create a WebSocket server on port 8080.
const wss = new WebSocket.Server({ port: 8080 });

// A Map to store screen sessions. Each screen has a dashboard and connected Electron apps.
const screens = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get('role');
  const screenId = url.searchParams.get('screenId');

  if (!screenId) {
    ws.close(4002, 'Missing screenId parameter');
    return;
  }

  if (role === 'dashboard') {
    handleDashboardConnection(ws, screenId);
  } else if (role === 'electron') {
    handleElectronConnection(ws, screenId);
  } else {
    ws.close(4001, 'Invalid role');
  }
});

function handleDashboardConnection(ws, screenId) {
  // Save dashboard connection; multiple Electron apps may connect later.
  if (!screens.has(screenId)) {
    screens.set(screenId, { dashboard: ws, electrons: new Set() });
  } else {
    screens.get(screenId).dashboard = ws;
  }
  
  console.log(`Dashboard connected for screenId: ${screenId}`);

  ws.on('message', (message) => {
    try {
      const { type, content } = JSON.parse(message);

      if (type === 'sync') {
        const screen = screens.get(screenId);
        if (screen) {
          // Broadcast updated content to all connected Electron apps
          screen.electrons.forEach(electron => {
            if (electron.readyState === WebSocket.OPEN) {
              electron.send(JSON.stringify({ type: 'contentUpdate', content }));
            }
          });

          // Save content to a JSON file for persistence
          const filePath = path.join(__dirname, `${screenId}.json`);
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
          console.log(`Content synced and broadcasted for screen: ${screenId}`);
        }
      }
    } catch (error) {
      console.error(`Error processing dashboard message: ${error}`);
    }
  });

  ws.on('close', () => {
    const screen = screens.get(screenId);
    if (screen) {
      screen.dashboard = null;
    }
    console.log(`Dashboard disconnected for screenId: ${screenId}`);
  });
}

function handleElectronConnection(ws, screenId) {
  if (!screens.has(screenId)) {
    screens.set(screenId, { dashboard: null, electrons: new Set([ws]) });
  } else {
    screens.get(screenId).electrons.add(ws);
  }

  console.log(`Electron connected for screenId: ${screenId}`);

  // Send any existing content to the Electron app upon connection.
  const filePath = path.join(__dirname, `${screenId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (!err) {
      try {
        const content = JSON.parse(data);
        ws.send(JSON.stringify({ type: 'contentUpdate', content }));
        console.log(`Initial content sent to Electron for screenId: ${screenId}`);
      } catch (parseError) {
        console.error(`Error parsing JSON for screenId ${screenId}: ${parseError}`);
      }
    } else {
      console.log(`No existing content for screen: ${screenId}`);
    }
  });

  ws.on('close', () => {
    const screen = screens.get(screenId);
    if (screen) {
      screen.electrons.delete(ws);
    }
    console.log(`Electron disconnected for screenId: ${screenId}`);
  });
}

console.log('WebSocket server running on port 8080');
