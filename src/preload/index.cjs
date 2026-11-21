const { contextBridge, ipcRenderer } = require('electron');

// Narrow, typed API surface exposed to the renderer.
// Channel names must match IPC_CHANNELS in src/shared/constants.js — this
// file is sandboxed and cannot import shared modules.
const CHANNELS = {
  PING: 'suggestify:ping',
  STATE_GET: 'suggestify:state:get',
  STATE_CHANGED: 'suggestify:state:changed',
  SETTINGS_GET: 'suggestify:settings:get',
  SETTINGS_SET: 'suggestify:settings:set',
  HISTORY_GET: 'suggestify:history:get',
  HISTORY_ADD: 'suggestify:history:add',
  ACCOUNT_CONNECT: 'suggestify:account:connect',
  ACCOUNT_GET: 'suggestify:account:get',
  ACCOUNT_REFRESH: 'suggestify:account:refresh',
  ACCOUNT_DISCONNECT: 'suggestify:account:disconnect',
};

contextBridge.exposeInMainWorld('suggestify', {
  ping: () => ipcRenderer.invoke(CHANNELS.PING),
  getState: () => ipcRenderer.invoke(CHANNELS.STATE_GET),
  getSettings: () => ipcRenderer.invoke(CHANNELS.SETTINGS_GET),
  setSettings: (patch) => ipcRenderer.invoke(CHANNELS.SETTINGS_SET, patch),
  getHistory: () => ipcRenderer.invoke(CHANNELS.HISTORY_GET),
  addHistoryEntry: (entry) => ipcRenderer.invoke(CHANNELS.HISTORY_ADD, entry),
  connectAccount: (rsn) => ipcRenderer.invoke(CHANNELS.ACCOUNT_CONNECT, rsn),
  getAccount: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_GET),
  refreshAccount: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_REFRESH),
  disconnectAccount: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_DISCONNECT),
  onStateChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on(CHANNELS.STATE_CHANGED, listener);
    return () => ipcRenderer.removeListener(CHANNELS.STATE_CHANGED, listener);
  },
});
