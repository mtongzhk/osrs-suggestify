import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalPersistence } from '../data/persistence.js';
import { IPC_CHANNELS } from '../shared/constants.js';
import { createAccountController } from './account.js';
import { attachStateBroadcast, registerIpcHandlers } from './ipc.js';
import { StateStore } from './stateStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.argv.includes('--dev');

let broadcastState;
const windows = new Set();

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

  // Retain a reference — an unreferenced BrowserWindow can be GC'd, which
  // closes the window unexpectedly.
  windows.add(win);
  win.on('closed', () => windows.delete(win));

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
    account: null,
  });

  const account = createAccountController({ store, persistence });

  registerIpcHandlers({ store, persistence, account });
  broadcastState = attachStateBroadcast(store);

  createWindow();

  // Restore the connected account from persisted settings, if any.
  if (settings.rsn) {
    account.connect(settings.rsn).catch((err) => {
      console.error('Failed to restore OSRS account:', err);
    });
  }

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
