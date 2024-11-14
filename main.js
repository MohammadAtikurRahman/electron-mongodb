const { app, BrowserWindow } = require("electron");
const path = require("path");
const log = require("electron-log");
const connectToDatabase = require("./portable-mongodb");

let mainWindow;

async function connectToMongo() {
  try {
    log.info("Starting MongoDB connection process...");
    await connectToDatabase("portable-mongodb-database");
    log.info("MongoDB connected successfully to database: portable-mongodb-database");

    mainWindow.webContents.send("mongo-connection-status", "MongoDB connected successfully!");
  } catch (err) {
    log.error("Database not connected:", err.message);
    mainWindow.webContents.send("mongo-connection-status", `Database not connected: ${err.message}`);
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

  connectToMongo();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
