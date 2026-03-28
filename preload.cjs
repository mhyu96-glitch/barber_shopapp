const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  appVersion: require('./package.json').version || '2.0.0',
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },
});
