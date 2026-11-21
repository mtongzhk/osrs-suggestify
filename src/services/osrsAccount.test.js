import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAccountProgress, AccountFetchError, HISCORES_URL } from './osrsAccount.js';

const PAYLOAD = {
  name: 'Zezima',
  skills: [
    { id: 0, name: 'Overall', rank: 100, level: 2277, xp: 99999999 },
    { id: 1, name: 'Attack', rank: 50, level: 99, xp: 13034431 },
    { id: 2, name: 'Sailing', rank: -1, level: 1, xp: 0 },
  ],
  activities: [
    { id: 7, name: 'Clue Scrolls (all)', rank: 10, score: 1234 },
    { id: 8, name: 'Bosses', rank: -1, score: 0 },
  ],
};

function okResponse(body = PAYLOAD, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('fetchAccountProgress', () => {
  it('fetches and normalizes progress for a valid RSN', async () => {
    let requestedUrl;
    const progress = await fetchAccountProgress('  Zezima ', {
      fetchImpl: async (url) => {
        requestedUrl = url;
        return okResponse();
      },
    });

    assert.equal(requestedUrl, `${HISCORES_URL}?player=Zezima`);
    assert.equal(progress.rsn, 'Zezima');
    assert.equal(progress.totalLevel, 2277);
    assert.equal(progress.totalXp, 99999999);
    assert.deepEqual(progress.skills.attack, { level: 99, xp: 13034431, rank: 50 });
    assert.deepEqual(progress.skills.sailing, { level: 1, xp: 0, rank: -1 });
    assert.deepEqual(progress.activities['clue scrolls (all)'], {
      name: 'Clue Scrolls (all)',
      score: 1234,
      rank: 10,
    });
    assert.deepEqual(progress.activities.bosses, { name: 'Bosses', score: 0, rank: -1 });
  });

  it('rejects invalid RSNs without making a request', async () => {
    let called = false;
    await assert.rejects(
      fetchAccountProgress('bad@name', {
        fetchImpl: async () => {
          called = true;
          return okResponse();
        },
      }),
      (err) => err instanceof AccountFetchError && err.code === 'INVALID_RSN'
    );
    assert.equal(called, false);
  });

  it('maps HTTP 404 to NOT_FOUND', async () => {
    await assert.rejects(
      fetchAccountProgress('Zezima', {
        fetchImpl: async () => new Response('not found', { status: 404 }),
      }),
      (err) => err.code === 'NOT_FOUND'
    );
  });

  it('maps other HTTP errors and network failures', async () => {
    await assert.rejects(
      fetchAccountProgress('Zezima', {
        fetchImpl: async () => new Response('oops', { status: 503 }),
      }),
      (err) => err.code === 'HTTP'
    );
    await assert.rejects(
      fetchAccountProgress('Zezima', {
        fetchImpl: async () => {
          throw new Error('socket hangup');
        },
      }),
      (err) => err.code === 'NETWORK'
    );
  });

  it('maps malformed JSON and unexpected shapes to BAD_RESPONSE', async () => {
    await assert.rejects(
      fetchAccountProgress('Zezima', {
        fetchImpl: async () => new Response('<html>', { status: 200 }),
      }),
      (err) => err.code === 'BAD_RESPONSE'
    );
    await assert.rejects(
      fetchAccountProgress('Zezima', {
        fetchImpl: async () => okResponse({ name: 'Zezima' }),
      }),
      (err) => err.code === 'BAD_RESPONSE'
    );
  });
});
