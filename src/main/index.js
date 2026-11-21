import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.argv.includes('--dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 480,
    title: 'OSRS Suggestify',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  console.log('OSRS Suggestify main process started.');
  // TODO: initialise services (activity detection, session timer, suggestions)
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
