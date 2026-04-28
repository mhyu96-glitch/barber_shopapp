const {
  app, BrowserWindow, Tray, Menu, nativeImage,
  ipcMain, Notification, globalShortcut, dialog, shell
} = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// ─── Single Instance Lock ────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let queueDisplayWindow = null;

// ─── Backup Settings (persisted in userData) ─────────────────────────────────
const userDataPath = app.getPath('userData');
const backupSettingsPath = path.join(userDataPath, 'backup-settings.json');

function loadBackupSettings() {
  try {
    if (fs.existsSync(backupSettingsPath)) {
      return JSON.parse(fs.readFileSync(backupSettingsPath, 'utf8'));
    }
  } catch { }
  return { enabled: false, folder: '', intervalHours: 24, lastBackup: null };
}

function saveBackupSettingsFile(settings) {
  try {
    fs.writeFileSync(backupSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save backup settings:', e);
  }
}

let backupSettings = loadBackupSettings();
let backupTimer = null;

// ─── Main Window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    title: 'BarberPro',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.maximize();

  const isDev = !app.isPackaged;
  if (isDev) {
    const ports = [5173, 5174, 5175];
    let portIndex = 0;
    const loadWithRetry = () => {
      const url = `http://localhost:${ports[portIndex]}`;
      console.log(`Electron loading: ${url}`);
      mainWindow.loadURL(url).catch(() => {
        portIndex++;
        if (portIndex < ports.length) {
          setTimeout(loadWithRetry, 500);
        } else {
          portIndex = 0;
          setTimeout(loadWithRetry, 3000);
        }
      });
    };
    loadWithRetry();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    // Check for updates after window is ready (non-blocking)
    setTimeout(() => checkForUpdate(false), 5000);
    // Start auto backup scheduler
    scheduleAutoBackup();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      showTrayBalloon('BarberPro berjalan di background', 'Klik ikon di system tray untuk membuka kembali.');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Queue Display Window ─────────────────────────────────────────────────────
function createQueueDisplayWindow() {
  if (queueDisplayWindow && !queueDisplayWindow.isDestroyed()) {
    queueDisplayWindow.focus();
    return;
  }

  queueDisplayWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    title: 'BarberPro - Tampilan Antrian',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0D0D0D',
    webPreferences: {
      preload: path.join(__dirname, 'preload-queue.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    // Load the queue display HTML from project root
    queueDisplayWindow.loadFile(path.join(__dirname, 'queue-display.html'));
  } else {
    queueDisplayWindow.loadFile(path.join(__dirname, 'dist', 'queue-display.html'));
  }

  queueDisplayWindow.on('closed', () => {
    queueDisplayWindow = null;
    // Notify main window that queue display was closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('queue-display-closed');
    }
  });

  console.log('✅ Queue Display Window opened');
}

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);

  updateTrayMenu(0);

  tray.setToolTip('BarberPro - Manajemen Barbershop');

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu(queueCount) {
  const queueLabel = queueCount > 0
    ? `Antrian Hari Ini: ${queueCount} orang`
    : 'Antrian Hari Ini: Kosong';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '✂️  BarberPro',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `📋  ${queueLabel}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '🖥️  Buka BarberPro',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
      },
    },
    {
      label: '📺  Tampilan Antrian (TV)',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        createQueueDisplayWindow();
      },
    },
    {
      label: '📅  Janji Temu',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        mainWindow.webContents.send('shortcut-triggered', 'appointments');
      },
    },
    {
      label: '💰  Kasir (POS)',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        mainWindow.webContents.send('shortcut-triggered', 'pos');
      },
    },
    {
      label: '📊  Dashboard',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        mainWindow.webContents.send('shortcut-triggered', 'dashboard');
      },
    },
    { type: 'separator' },
    {
      label: '💾  Backup Sekarang',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('shortcut-triggered', 'backup-now');
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌  Keluar',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`BarberPro${queueCount > 0 ? ` • ${queueCount} antrian` : ''}`);
}

function showTrayBalloon(title, content) {
  if (tray && process.platform === 'win32') {
    tray.displayBalloon({ title, content, iconType: 'info' });
  }
}

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
function registerGlobalShortcuts() {
  // Ctrl+Shift+B → Buka / fokus BarberPro dari mana saja
  globalShortcut.register('CommandOrControl+Shift+B', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Ctrl+Shift+N → Tambah Appointment baru
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('shortcut-triggered', 'new-appointment');
    }
  });

  // Ctrl+Shift+P → Buka POS / Kasir
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('shortcut-triggered', 'pos');
    }
  });

  // Ctrl+Shift+Q → Buka Queue Display
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    createQueueDisplayWindow();
  });

  console.log('⌨️  Global shortcuts registered');
}

// ─── Auto Update Check ────────────────────────────────────────────────────────
const CURRENT_VERSION = require('./package.json').version;
const UPDATE_CHECK_URL = 'https://api.github.com/repos/barberpro/barberpro-desktop/releases/latest';

function checkForUpdate(showNoUpdateToast = true) {
  return new Promise((resolve) => {
    const req = https.get(
      UPDATE_CHECK_URL,
      { headers: { 'User-Agent': 'BarberPro-Desktop' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const latestVersion = (release.tag_name || '').replace(/^v/, '');
            const hasUpdate = latestVersion && latestVersion !== CURRENT_VERSION;

            if (hasUpdate) {
              const downloadUrl = release.html_url || '';
              // Notify renderer
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('shortcut-triggered', 'update-available', {
                  currentVersion: CURRENT_VERSION,
                  latestVersion,
                  downloadUrl,
                  releaseNotes: release.body || '',
                });
              }
              // Also show native notification
              const notif = new Notification({
                title: '🆕 Update BarberPro Tersedia!',
                body: `Versi ${latestVersion} sudah tersedia. Klik untuk download.`,
                icon: path.join(__dirname, 'build', 'icon.png'),
              });
              notif.show();
              notif.on('click', () => {
                if (downloadUrl) shell.openExternal(downloadUrl);
              });
            }
            resolve({ hasUpdate, latestVersion, currentVersion: CURRENT_VERSION });
          } catch {
            resolve({ hasUpdate: false, error: 'Parse error' });
          }
        });
      }
    );
    req.on('error', () => resolve({ hasUpdate: false, error: 'Network error' }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ hasUpdate: false, error: 'Timeout' }); });
  });
}

// ─── Auto Backup ─────────────────────────────────────────────────────────────
function scheduleAutoBackup() {
  if (backupTimer) clearInterval(backupTimer);
  if (!backupSettings.enabled || !backupSettings.folder) return;

  const intervalMs = (backupSettings.intervalHours || 24) * 60 * 60 * 1000;

  // Check if backup is due now
  const lastBackup = backupSettings.lastBackup ? new Date(backupSettings.lastBackup) : null;
  const now = new Date();
  const msSinceLast = lastBackup ? (now - lastBackup) : Infinity;

  if (msSinceLast >= intervalMs) {
    // Trigger immediately
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('shortcut-triggered', 'backup-now');
    }
  }

  backupTimer = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('shortcut-triggered', 'backup-now');
    }
  }, intervalMs);

  console.log(`💾 Auto backup scheduled every ${backupSettings.intervalHours}h`);
}

function performBackup(jsonData) {
  if (!backupSettings.folder) return { success: false, error: 'Folder backup belum dipilih' };

  try {
    if (!fs.existsSync(backupSettings.folder)) {
      return { success: false, error: 'Folder backup tidak ditemukan' };
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const filename = `barberpro_backup_${timestamp}.json`;
    const filePath = path.join(backupSettings.folder, filename);

    fs.writeFileSync(filePath, jsonData, 'utf8');

    // Keep only last 30 backups
    const files = fs.readdirSync(backupSettings.folder)
      .filter(f => f.startsWith('barberpro_backup_') && f.endsWith('.json'))
      .sort();
    if (files.length > 30) {
      files.slice(0, files.length - 30).forEach(f => {
        try { fs.unlinkSync(path.join(backupSettings.folder, f)); } catch { }
      });
    }

    // Update last backup time
    backupSettings.lastBackup = now.toISOString();
    saveBackupSettingsFile(backupSettings);

    console.log(`💾 Backup saved: ${filePath}`);
    return { success: true, filePath, filename };
  } catch (e) {
    console.error('Backup error:', e);
    return { success: false, error: e.message };
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Native notification
ipcMain.on('show-notification', (event, { title, body }) => {
  const notification = new Notification({
    title: title || 'BarberPro',
    body: body || '',
    icon: path.join(__dirname, 'build', 'icon.png'),
  });
  notification.show();

  if (mainWindow && !mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
    setTimeout(() => { if (mainWindow) mainWindow.flashFrame(false); }, 5000);
  }

  notification.on('click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
});

// Queue Display
ipcMain.on('open-queue-display', () => {
  createQueueDisplayWindow();
});

ipcMain.on('update-queue-display', (event, data) => {
  if (queueDisplayWindow && !queueDisplayWindow.isDestroyed()) {
    queueDisplayWindow.webContents.send('queue-data-update', data);
  }
});

ipcMain.on('close-queue-display', () => {
  if (queueDisplayWindow && !queueDisplayWindow.isDestroyed()) {
    queueDisplayWindow.close();
  }
});

ipcMain.handle('is-queue-display-open', () => {
  return !!(queueDisplayWindow && !queueDisplayWindow.isDestroyed());
});

// Tray queue count
ipcMain.on('update-tray-queue', (event, { count }) => {
  updateTrayMenu(count || 0);
});

// Backup: select folder
ipcMain.handle('select-backup-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih Folder Backup',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Backup: perform backup
ipcMain.handle('trigger-backup', (event, jsonData) => {
  return performBackup(jsonData);
});

// Backup: get settings
ipcMain.handle('get-backup-settings', () => {
  return backupSettings;
});

// Backup: save settings
ipcMain.handle('save-backup-settings', (event, settings) => {
  backupSettings = { ...backupSettings, ...settings };
  saveBackupSettingsFile(backupSettings);
  scheduleAutoBackup();
  return backupSettings;
});

// Update check
ipcMain.handle('check-for-update', () => {
  return checkForUpdate(true);
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
});

// Second instance: focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
});
