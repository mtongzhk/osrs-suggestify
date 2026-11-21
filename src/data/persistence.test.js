import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JsonFileStore, LocalPersistence } from './persistence.js';
import { DEFAULT_SETTINGS } from '../shared/constants.js';

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'osrs-suggestify-test-'));
}

test('read returns fallback when file is missing', async () => {
  const dir = await tempDir();
  const store = new JsonFileStore(dir, 'missing.json', { a: 1 });
  assert.deepEqual(await store.read(), { a: 1 });
});

test('write then read round-trips data', async () => {
  const dir = await tempDir();
  const store = new JsonFileStore(dir, 'data.json', null);
  await store.write({ hello: 'world', n: 42 });
  assert.deepEqual(await store.read(), { hello: 'world', n: 42 });
});

test('corrupt file falls back and is preserved as backup', async () => {
  const dir = await tempDir();
  const filePath = path.join(dir, 'data.json');
  await fs.writeFile(filePath, '{not valid json', 'utf8');

  const store = new JsonFileStore(dir, 'data.json', { fallback: true });
  assert.deepEqual(await store.read(), { fallback: true });

  const entries = await fs.readdir(dir);
  assert.ok(entries.some((e) => e.startsWith('data.json.corrupt-')));
});

test('load returns defaults when nothing is stored', async () => {
  const dir = await tempDir();
  const persistence = new LocalPersistence(dir);
  const { settings, history } = await persistence.load();
  assert.deepEqual(settings, DEFAULT_SETTINGS);
  assert.deepEqual(history, []);
});

test('settings persist across LocalPersistence instances (restart)', async () => {
  const dir = await tempDir();
  const first = new LocalPersistence(dir);
  await first.saveSettings({ rsn: 'Zezima', sessionLimitMinutes: 120 });

  const second = new LocalPersistence(dir);
  const { settings } = await second.load();
  assert.equal(settings.rsn, 'Zezima');
  assert.equal(settings.sessionLimitMinutes, 120);
  assert.equal(settings.activityLimitMinutes, null);
});

test('unknown stored keys are dropped, defaults fill the rest', async () => {
  const dir = await tempDir();
  await fs.writeFile(
    path.join(dir, 'settings.json'),
    JSON.stringify({ rsn: 'Torv', bogus: 'x' }),
    'utf8',
  );
  const persistence = new LocalPersistence(dir);
  const { settings } = await persistence.load();
  assert.equal(settings.rsn, 'Torv');
  assert.equal(settings.bogus, undefined);
  assert.ok('sessionLimitMinutes' in settings);
});

test('history entries append and survive reload', async () => {
  const dir = await tempDir();
  const first = new LocalPersistence(dir);
  await first.addHistoryEntry({ activityId: 'boss:corp', startedAt: '2026-11-20T10:00:00Z' });
  await first.addHistoryEntry({ activityId: 'skill:woodcutting', startedAt: '2026-11-20T11:00:00Z' });

  const second = new LocalPersistence(dir);
  const history = await second.getHistory();
  assert.equal(history.length, 2);
  assert.equal(history[0].activityId, 'boss:corp');
  assert.ok(history[0].recordedAt);
});
