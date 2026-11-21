import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS } from '../shared/constants.js';

// JSON-file-backed persistence under Electron's userData directory.
// See docs/PRD.md §8 Q8 — JSON chosen for v1; revisit if history grows large.

export class JsonFileStore {
  constructor(dir, filename, fallback) {
    this.filePath = path.join(dir, filename);
    this.fallback = fallback;
  }

  async read() {
    let raw;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return structuredClone(this.fallback);
      throw err;
    }

    try {
      return JSON.parse(raw);
    } catch {
      // Corrupt file: preserve it for diagnosis, fall back to defaults.
      const backupPath = `${this.filePath}.corrupt-${Date.now()}`;
      await fs.rename(this.filePath, backupPath).catch(() => {});
      return structuredClone(this.fallback);
    }
  }

  async write(data) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, this.filePath);
  }
}

export class LocalPersistence {
  constructor(userDataDir) {
    this.settingsStore = new JsonFileStore(userDataDir, 'settings.json', {});
    this.historyStore = new JsonFileStore(userDataDir, 'history.json', []);
  }

  async load() {
    const [storedSettings, history] = await Promise.all([
      this.settingsStore.read(),
      this.historyStore.read(),
    ]);
    const settings = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (storedSettings[key] !== undefined) settings[key] = storedSettings[key];
    }
    return {
      settings,
      history: Array.isArray(history) ? history : [],
    };
  }

  async saveSettings(settings) {
    await this.settingsStore.write(settings);
  }

  async getHistory() {
    const history = await this.historyStore.read();
    return Array.isArray(history) ? history : [];
  }

  async addHistoryEntry(entry) {
    const history = await this.getHistory();
    history.push({ recordedAt: new Date().toISOString(), ...entry });
    await this.historyStore.write(history);
    return history[history.length - 1];
  }
}
