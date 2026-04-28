const { contextBridge, ipcRenderer } = require('electron');

// Preload for Queue Display Window
contextBridge.exposeInMainWorld('queueDisplayAPI', {
  onQueueUpdate: (callback) => {
    ipcRenderer.on('queue-data-update', (event, data) => callback(data));
  },
});
