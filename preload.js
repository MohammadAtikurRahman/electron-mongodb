const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onMongoConnectionStatus: (callback) => ipcRenderer.on("mongo-connection-status", callback),
});
