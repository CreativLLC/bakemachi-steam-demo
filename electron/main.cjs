const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

const DIST_PATH = path.join(__dirname, '..', 'dist');

// Register a custom 'app' protocol BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'Bakemachi | \u5316\u3051\u753A',
    icon: path.join(__dirname, '..', 'public', 'bakemachi-icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load via custom protocol so all absolute paths resolve correctly
    win.loadURL('app://./index.html');
  }
}

app.whenReady().then(() => {
  // Handle all 'app://' requests by serving files from dist/
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    // Decode the pathname and resolve to dist directory
    let filePath = decodeURIComponent(requestUrl.pathname);
    // Remove leading slash on Windows
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    const fullPath = path.join(DIST_PATH, filePath);
    return net.fetch(url.pathToFileURL(fullPath).href);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
