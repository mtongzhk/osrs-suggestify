import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalPersistence } from '../data/persistence.js';
import { IPC_CHANNELS } from '../shared/constants.js';
import { attachStateBroadcast, registerIpcHandlers } from './ipc.js';
import { StateStore } from './stateStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.argv.includes('--dev');

let broadcastState;

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 480,
    title: 'OSRS Suggestify',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on('did-finish-load', () => {
    broadcastState?.(win.webContents);
    // Send the current snapshot so late-loading renderers aren't stale.
    win.webContents.send(IPC_CHANNELS.STATE_CHANGED, store.getState());
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

let store;

app.whenReady().then(async () => {
  console.log('OSRS Suggestify main process started.');

  const persistence = new LocalPersistence(app.getPath('userData'));
  const { settings } = await persistence.load();

  store = new StateStore({
    status: 'ready',
    settings,
    currentActivity: null,
    sessionStartedAt: null,
  });

  registerIpcHandlers({ store, persistence });
  broadcastState = attachStateBroadcast(store);

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
