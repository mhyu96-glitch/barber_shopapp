const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  appVersion: require('./package.json').version || '2.0.0',

  // Native desktop notification
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Queue Display Window
  openQueueDisplay: () => {
    ipcRenderer.send('open-queue-display');
  },
  updateQueueDisplay: (data) => {
    ipcRenderer.send('update-queue-display', data);
  },
  closeQueueDisplay: () => {
    ipcRenderer.send('close-queue-display');
  },
  isQueueDisplayOpen: () => ipcRenderer.invoke('is-queue-display-open'),

  // Auto Backup
  selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
  triggerBackup: (data) => ipcRenderer.invoke('trigger-backup', data),
  getBackupSettings: () => ipcRenderer.invoke('get-backup-settings'),
  saveBackupSettings: (settings) => ipcRenderer.invoke('save-backup-settings', settings),

  // App update check
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),

  // Keyboard shortcut events from main process
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut-triggered', (event, action) => callback(action));
  },

  // Tray queue count update
  updateTrayQueueCount: (count) => {
    ipcRenderer.send('update-tray-queue', { count });
  },
});
