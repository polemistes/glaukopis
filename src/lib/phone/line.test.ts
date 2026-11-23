import { describe, expect, it } from 'vitest';
import type { SyncStatus } from '$lib/api/sync';
import { lineOf } from './line';

const status = (change: Partial<SyncStatus>): SyncStatus => ({
  on: true,
  server: 'https://example.org',
  name: 'Phone',
  state: 'idle',
  last: null,
  problem: null,
  waiting: false,
  ...change,
});

describe('the line over the notes', () => {
  it('is not there before the status is known, nor where the device is in no home', () => {
    expect(lineOf(null)).toBeNull();
    expect(lineOf(status({ on: false, state: 'off', server: null }))).toBeNull();
    expect(lineOf(status({ on: false, state: 'off', problem: 'old words' }))).toBeNull();
  });

  it('is not there where all is well', () => {
    expect(lineOf(status({ state: 'idle' }))).toBeNull();
    expect(lineOf(status({ state: 'working' }))).toBeNull();
  });

  it('says the synchronization has stopped where the server lets the device in no more', () => {
    expect(lineOf(status({ state: 'refused', problem: 'refused' }))).toBe('sync-refused');
    expect(lineOf(status({ state: 'refused', waiting: true }))).toBe('sync-refused');
  });

  it('says that an update is needed where the synchronization stopped for a later form', () => {
    expect(lineOf(status({ state: 'outdated', problem: 'Update is needed' }))).toBe(
      'sync-outdated',
    );
    expect(lineOf(status({ state: 'outdated', waiting: true }))).toBe('sync-outdated');
  });

  it('says what waits where the server is not reached and something does', () => {
    expect(lineOf(status({ state: 'offline', waiting: true, problem: 'no network' }))).toBe(
      'phone-waiting',
    );
  });

  it('is not there where the server is merely not reached', () => {
    expect(lineOf(status({ state: 'offline', waiting: false, problem: 'no network' }))).toBeNull();
    expect(lineOf(status({ state: 'offline', waiting: undefined }))).toBeNull();
  });

  it('says something is wrong where a problem is said and the server was reached', () => {
    expect(lineOf(status({ state: 'idle', problem: 'a later form' }))).toBe('phone-problem');
    expect(lineOf(status({ state: 'working', problem: 'a later form' }))).toBe('phone-problem');
  });
});
