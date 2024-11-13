const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getUsers: async () => ipcRenderer.invoke('get-users'),
    addUser: async (user) => ipcRenderer.invoke('add-user', user),
});
