import { isValidRsn } from '../shared/rsn.js';

// Official Jagex Hiscores endpoint — public, no API key, read-only.
// See docs/PRD.md §7: chosen account-progress source for T1.1. Covers skill
// levels/XP and activity scores (boss KC, clues, minigames); quest/diary
// completion is NOT covered — see PRD §8 Q2.
export const HISCORES_URL =
  'https://secure.runescape.com/m=hiscore_oldschool/index_lite.json';

const REQUEST_TIMEOUT_MS = 10000;
const USER_AGENT = 'OSRS Suggestify/0.1.0 (https://github.com/mtongzhk/osrs-suggestify)';

export class AccountFetchError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'AccountFetchError';
    this.code = code;
  }
}

export async function fetchAccountProgress(rsn, { fetchImpl = fetch } = {}) {
  const name = typeof rsn === 'string' ? rsn.trim() : rsn;
  if (!isValidRsn(name)) {
    throw new AccountFetchError(
      'INVALID_RSN',
      'Enter a valid OSRS display name (1-12 letters, numbers, spaces, _ or -).'
    );
  }

  const url = `${HISCORES_URL}?player=${encodeURIComponent(name)}`;
  let res;
  try {
    res = await fetchImpl(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT },
    });
  } catch (err) {
    throw new AccountFetchError(
      'NETWORK',
      'Could not reach the OSRS hiscores service. Check your connection and try again.',
      { cause: err }
    );
  }

  if (res.status === 404) {
    throw new AccountFetchError('NOT_FOUND', `No OSRS account found for "${name}".`);
  }
  if (!res.ok) {
    throw new AccountFetchError('HTTP', `OSRS hiscores request failed (HTTP ${res.status}).`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new AccountFetchError(
      'BAD_RESPONSE',
      'OSRS hiscores returned an unreadable response.',
      { cause: err }
    );
  }

  if (!data || !Array.isArray(data.skills)) {
    throw new AccountFetchError('BAD_RESPONSE', 'OSRS hiscores returned an unexpected response.');
  }

  const skills = {};
  const activities = {};
  let totalLevel = null;
  let totalXp = null;

  for (const s of data.skills) {
    if (s.name === 'Overall') {
      totalLevel = s.level;
      totalXp = s.xp;
    } else if (typeof s.name === 'string') {
      skills[s.name.toLowerCase()] = { level: s.level, xp: s.xp, rank: s.rank };
    }
  }
  for (const a of Array.isArray(data.activities) ? data.activities : []) {
    if (typeof a.name === 'string') {
      activities[a.name.toLowerCase()] = { name: a.name, score: a.score, rank: a.rank };
    }
  }

  return {
    rsn: typeof data.name === 'string' ? data.name : name,
    totalLevel,
    totalXp,
    skills,
    activities,
  };
}
