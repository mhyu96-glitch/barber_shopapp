const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    title: 'BarberPro',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false, // Show when ready to prevent flicker
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Maximize on start for best experience
  mainWindow.maximize();

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    // Dev mode: load Vite dev server
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
          // Final fallback
          portIndex = 0;
          setTimeout(loadWithRetry, 3000);
        }
      });
    };
    loadWithRetry();
  } else {
    // Production: load built files
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Buka BarberPro',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Keluar',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('BarberPro - Manajemen Barbershop');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC: Native desktop notification
ipcMain.on('show-notification', (event, { title, body }) => {
  const notification = new Notification({
    title: title || 'BarberPro',
    body: body || '',
    icon: path.join(__dirname, 'build', 'icon.png'),
  });
  notification.show();

  // Flash taskbar if window is not focused
  if (mainWindow && !mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
    // Stop flashing after 5 seconds
    setTimeout(() => {
      if (mainWindow) mainWindow.flashFrame(false);
    }, 5000);
  }

  // Clicking the notification brings the window to front
  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
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
