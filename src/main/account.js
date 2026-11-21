import { fetchAccountProgress, AccountFetchError } from '../services/osrsAccount.js';
import { normalizeRsn } from '../shared/rsn.js';

// Orchestrates connect/refresh/disconnect for the player's OSRS account.
// Persists the RSN via settings (settings.rsn) and mirrors fetch state into
// the app state store so the renderer can subscribe to it.

const IDLE_ACCOUNT = { rsn: null, status: 'idle', progress: null, error: null, fetchedAt: null };

export function createAccountController({ store, persistence }) {
  async function persistRsn(rsn) {
    const settings = { ...store.getState().settings, rsn };
    await persistence.saveSettings(settings);
    store.update({ settings });
  }

  function setAccount(account) {
    store.update({ account });
    return store.getState().account;
  }

  async function connect(rsnInput) {
    const rsn = normalizeRsn(rsnInput);
    if (!rsn) {
      return setAccount({
        ...IDLE_ACCOUNT,
        status: 'error',
        error: 'Enter a valid OSRS display name (1-12 letters, numbers, spaces, _ or -).',
      });
    }

    // Persist once the RSN is syntactically valid so it survives restarts even
    // if the progress fetch fails (e.g. offline at launch).
    await persistRsn(rsn);

    setAccount({ rsn, status: 'connecting', progress: null, error: null, fetchedAt: null });
    try {
      const progress = await fetchAccountProgress(rsn);
      progress.fetchedAt = new Date().toISOString();
      return setAccount({ rsn, status: 'connected', progress, error: null, fetchedAt: progress.fetchedAt });
    } catch (err) {
      const message =
        err instanceof AccountFetchError
          ? err.message
          : 'Failed to fetch account progress. Please try again.';
      return setAccount({ rsn, status: 'error', progress: null, error: message, fetchedAt: null });
    }
  }

  async function refresh() {
    const rsn = store.getState().account?.rsn ?? store.getState().settings?.rsn;
    if (!rsn) return store.getState().account ?? IDLE_ACCOUNT;
    return connect(rsn);
  }

  async function disconnect() {
    await persistRsn(null);
    return setAccount({ ...IDLE_ACCOUNT });
  }

  return { connect, refresh, disconnect };
}
