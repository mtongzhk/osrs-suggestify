// Shared constants used by both the main and renderer processes.
// Must stay free of Node- or DOM-only APIs.

export const APP_NAME = 'OSRS Suggestify';
export const APP_VERSION = '0.1.0';

// IPC channel names. NOTE: src/preload/index.cjs runs sandboxed and cannot
// import this file, so it duplicates these strings — keep them in sync.
export const IPC_CHANNELS = {
  PING: 'suggestify:ping',
  STATE_GET: 'suggestify:state:get',
  STATE_CHANGED: 'suggestify:state:changed',
  SETTINGS_GET: 'suggestify:settings:get',
  SETTINGS_SET: 'suggestify:settings:set',
  HISTORY_GET: 'suggestify:history:get',
  HISTORY_ADD: 'suggestify:history:add',
};

export const DEFAULT_SETTINGS = {
  rsn: null,
  sessionLimitMinutes: null,
  activityLimitMinutes: null,
};
