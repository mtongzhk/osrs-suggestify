import { contextBridge } from 'electron';

// Scaffold only — no IPC channels are exposed yet.
// Feature work will add a narrow, typed API surface here.
contextBridge.exposeInMainWorld('suggestify', {});
