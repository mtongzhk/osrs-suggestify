// OSRS display-name (RSN) validation. Pure JS — safe in main and renderer.
// Rules (OSRS Wiki "Display name"): 1-12 chars of letters, numbers, spaces,
// underscores, or hyphens; cannot start or end with a space/underscore/hyphen.

const RSN_MAX_LENGTH = 12;
const RSN_BODY = /^[A-Za-z0-9 _-]+$/;

export function isValidRsn(rsn) {
  if (typeof rsn !== 'string') return false;
  const name = rsn.trim();
  if (name.length === 0 || name.length > RSN_MAX_LENGTH) return false;
  if (!RSN_BODY.test(name)) return false;
  return /^[A-Za-z0-9]/.test(name) && /[A-Za-z0-9]$/.test(name);
}

export function normalizeRsn(input) {
  if (typeof input !== 'string') return null;
  const name = input.trim().replace(/\s+/g, ' ');
  return isValidRsn(name) ? name : null;
}
