import test from 'node:test';
import assert from 'node:assert/strict';
import { StateStore } from './stateStore.js';

test('getState returns the initial state', () => {
  const store = new StateStore({ status: 'ready', count: 0 });
  assert.deepEqual(store.getState(), { status: 'ready', count: 0 });
});

test('getState returns a snapshot, not a live reference', () => {
  const store = new StateStore({ nested: { value: 1 } });
  const snapshot = store.getState();
  snapshot.nested.value = 99;
  assert.equal(store.getState().nested.value, 1);
});

test('update merges patches and notifies subscribers', () => {
  const store = new StateStore({ status: 'ready', count: 0 });
  const seen = [];
  store.subscribe((state) => seen.push(state));

  store.update({ count: 1 });
  store.update({ status: 'busy' });

  assert.equal(seen.length, 2);
  assert.equal(seen[0].count, 1);
  assert.equal(seen[0].status, 'ready');
  assert.equal(seen[1].status, 'busy');
  assert.equal(seen[1].count, 1);
  assert.ok(seen[1].updatedAt);
});

test('unsubscribe stops notifications', () => {
  const store = new StateStore({});
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);

  store.update({ a: 1 });
  unsubscribe();
  store.update({ a: 2 });

  assert.equal(calls, 1);
});
