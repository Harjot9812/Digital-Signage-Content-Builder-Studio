# Digital Signage Content Builder Studio

This repository contains a complete digital signage solution comprising a **React dashboard** for creating interactive content and an **Electron display app** that shows the content. A Node.js **WebSocket server** handles real-time syncing between the dashboard and the display app while supporting offline functionality.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
  - [Dashboard (React App)](#dashboard-react-app)
  - [Display App (Electron)](#display-app-electron)
  - [WebSocket Server](#websocket-server)
- [WebSocket Implementation Details](#websocket-implementation-details)
- [Offline Functionality Explanation](#offline-functionality-explanation)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Architecture Overview

- **Dashboard (React App):**
  - Uses Fabric.js to provide a canvas-based content builder.
  - Automatically sends canvas updates (as JSON) to a WebSocket server.
  
- **WebSocket Server (Node.js):**
  - Built using the `ws` library.
  - Listens on port `8080` and accepts connections from both the dashboard (content creators) and Electron display apps.
  - Persists canvas data as a JSON file (named by `screenId`) for offline usage.

- **Display App (Electron):**
  - Connects to the WebSocket server as an Electron client.
  - Receives live canvas updates via WebSocket.
  - In offline mode, loads the last saved canvas JSON from the local file system.
  - Renders the canvas using Fabric.js.

---

## Setup Instructions

### Dashboard (React App)

1. **Clone the Repository:**
   ```bash
   gh repo clone Harjot9812/Signage-Dashboard
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the App:**
   ```bash
   npm start
   ```
   The dashboard will be available at `http://localhost:3000`.

---

### Display App (Electron)

1. **Navigate to the Electron App Folder:**
   ```bash
   cd your-repo/electron-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Electron App:**
   ```bash
   npm start
   ```
   This will launch the Electron window. The app will try to connect to the WebSocket server for live updates. If the server is unavailable, it will load the last saved canvas state from disk.

---

### WebSocket Server

1. **Navigate to the Server Folder:**
   ```bash
   cd your-repo/server
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Server:**
   ```bash
   node server.js
   ```
   The WebSocket server listens on port `8080`.

---

## WebSocket Implementation Details

- **Server:**  
  The server uses the `ws` package. Clients connect using URLs containing query parameters:
  - `role`: Determines if the client is a **dashboard** or **electron** client.
  - `screenId`: Used to identify the specific content to sync.
  
- **Data Flow:**  
  - **Dashboard:** Sends `"sync"` messages with the canvas JSON to the server.
  - **Server:** Forwards these updates to the connected Electron client(s) and saves the JSON data locally in a file named `<screenId>.json`.
  - **Electron App:** Receives `"contentUpdate"` messages and renders the canvas. If the WebSocket connection is lost, the server loads the saved JSON and sends it to the Electron app.

---

## Offline Functionality Explanation

1. **Local Storage Location:**  
   The Electron app saves the canvas JSON file in a directory returned by `app.getPath("userData")` (this varies by operating system).

2. **Saving Data:**  
   Whenever a `"contentUpdate"` is received over the WebSocket, the server writes the canvas JSON to a file named after the screen ID (e.g., `123.json`).

3. **Offline Mode:**  
   - If the WebSocket connection is closed or encounters an error, the Electron app (via the main process) loads the last saved JSON file.
   - The offline JSON data is then sent to the renderer via IPC, ensuring that the display shows the last known canvas state until the server comes back online.

---

## Known Limitations

- **Single Screen ID:**  
  Currently supports a single static screen ID (`123`). Multiple screens or dynamic screen IDs are not yet implemented.
- **Error Handling:**  
  Basic error handling is in place for file operations and WebSocket events, but more robust solutions are needed for production.
- **Authentication & Security:**  
  No authentication or secure pairing mechanism is implemented between the dashboard and the display app.
- **Scalability:**  
  The current implementation is suitable for demo purposes. For large-scale deployments, consider using a proper database instead of JSON file storage.

---

## Future Improvements

- **Dynamic Screen Management:**  
  Allow multiple dashboards and display apps with dynamically generated screen IDs.
- **Enhanced Error Handling:**  
  Improve error and exception handling for file I/O and WebSocket events.
- **Security Enhancements:**  
  Implement authentication and a secure pairing mechanism for connecting the dashboard to the display app.
- **Database Integration:**  
  Replace local JSON file storage with a scalable database solution (e.g., MongoDB) for persistence.
- **User Interface Enhancements:**  
  Expand the dashboard with more interactive widgets and customization options.
- **Automatic Reconnection:**  
  Enhance the Electron app to automatically reconnect to the WebSocket server and seamlessly update the display.

---



![Demo-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/f1d24255-ced0-4c1b-81a6-9dde8672e62f)


