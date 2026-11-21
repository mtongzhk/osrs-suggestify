// Minimal reactive state store for the main process.
// Renderer receives snapshots via the STATE_CHANGED IPC channel; it never
// mutates state directly — all changes go through update().

export class StateStore {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  getState() {
    return structuredClone(this.state);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  update(patch) {
    this.state = { ...this.state, ...patch, updatedAt: new Date().toISOString() };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
