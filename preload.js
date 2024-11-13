const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    fetchUsers: async () => ipcRenderer.invoke('get-users'), // Fetch all users
    addUser: async (user) => ipcRenderer.invoke('add-user', user), // Add a new user
});
