const { app, BrowserWindow } = require("electron");
const path = require("path");
const log = require("electron-log");
const { initializeDatabase } = require("./portable-mongo-wrapper"); // Import the wrapper function

let mainWindow;

async function connectToMongo() {
  try {
    log.info("Connecting to MongoDB...");
    await initializeDatabase("portable-mongodb-database"); // Use the function from the wrapper
    log.info("MongoDB connection successful!");

    mainWindow.webContents.send("mongo-connection-status", "MongoDB connected successfully!");
  } catch (error) {
    log.error("MongoDB connection failed:", error.message);
    mainWindow.webContents.send("mongo-connection-status", `Database not connected: ${error.message}`);
  }
}

app.whenReady().then(() => {
  log.info("App is ready");

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  connectToMongo().catch((err) => {
    log.error("Critical error during MongoDB initialization:", err.message);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
