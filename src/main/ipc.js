import { ipcMain } from 'electron';
import { APP_VERSION, DEFAULT_SETTINGS, IPC_CHANNELS } from '../shared/constants.js';

const SETTINGS_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

function validateSettingsPatch(patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('settings patch must be an object');
  }
  const clean = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!SETTINGS_KEYS.has(key)) {
      throw new Error(`unknown setting: ${key}`);
    }
    if (key === 'rsn') {
      if (value !== null && typeof value !== 'string') {
        throw new Error('rsn must be a string or null');
      }
    } else if (value !== null && (typeof value !== 'number' || value <= 0)) {
      throw new Error(`${key} must be a positive number or null`);
    }
    clean[key] = value;
  }
  return clean;
}

function validateHistoryEntry(entry) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error('history entry must be an object');
  }
  if (typeof entry.activityId !== 'string' || entry.activityId.length === 0) {
    throw new Error('history entry requires a non-empty activityId');
  }
  if (typeof entry.startedAt !== 'string' || Number.isNaN(Date.parse(entry.startedAt))) {
    throw new Error('history entry requires a valid startedAt timestamp');
  }
}

export function registerIpcHandlers({ store, persistence }) {
  ipcMain.handle(IPC_CHANNELS.PING, () => ({
    pong: true,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  }));

  ipcMain.handle(IPC_CHANNELS.STATE_GET, () => store.getState());

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => store.getState().settings);

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, patch) => {
    const clean = validateSettingsPatch(patch);
    const settings = { ...store.getState().settings, ...clean };
    await persistence.saveSettings(settings);
    store.update({ settings });
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, () => persistence.getHistory());

  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, async (_event, entry) => {
    validateHistoryEntry(entry);
    return persistence.addHistoryEntry(entry);
  });
}

// Pushes store snapshots to every registered renderer. Call the returned
// function with each window's webContents once the window exists.
export function attachStateBroadcast(store) {
  const targets = new Set();

  store.subscribe((state) => {
    for (const wc of targets) {
      if (!wc.isDestroyed()) {
        wc.send(IPC_CHANNELS.STATE_CHANGED, state);
      }
    }
  });

  return function registerTarget(webContents) {
    targets.add(webContents);
    webContents.on('destroyed', () => targets.delete(webContents));
  };
}
