import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as encoding from 'lib0/encoding';
import { Awareness } from 'y-protocols/awareness';
import { writeSyncStep1 } from 'y-protocols/sync';
import * as Y from 'yjs';
import { Connection } from './connection.svelte';

/** A socket as the browser gives one, opened and closed by the test. */
class Socket {
  readyState = 0;
  binaryType = 'blob';
  sent: Uint8Array[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  send(message: Uint8Array) {
    this.sent.push(message);
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  /** What the server says first: what it has. */
  hear() {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0);
    writeSyncStep1(encoder, new Y.Doc());
    this.onmessage?.({ data: encoding.toUint8Array(encoder).buffer } as MessageEvent);
  }
  closed(code: number, reason = '') {
    this.readyState = 3;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

function connect() {
  const doc = new Y.Doc();
  const sockets: Socket[] = [];
  const connection = new Connection(doc, new Awareness(doc), {
    ticket: async () => 'ws://server/room',
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
  });
  return { connection, sockets };
}

describe('the connection to the server', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is tried again at once when one that lasted is lost', async () => {
    const { connection, sockets } = connect();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0].open();
    sockets[0].hear();
    expect(connection.status).toBe('connected');
    await vi.advanceTimersByTimeAsync(11_000);
    sockets[0].closed(1006);
    expect(connection.status).toBe('offline');
    await vi.advanceTimersByTimeAsync(1_300);
    expect(sockets).toHaveLength(2);
    connection.stop();
  });

  it('waits ever longer when each is lost as soon as it is made', async () => {
    const { connection, sockets } = connect();
    await vi.advanceTimersByTimeAsync(0);
    for (let i = 0; i < 4; i++) {
      sockets[i].open();
      sockets[i].hear();
      sockets[i].closed(1011);
      await vi.advanceTimersByTimeAsync(1_250 * 2 ** i);
      expect(sockets).toHaveLength(i + 2);
    }
    // The fifth waits at least 0.75 × 16 seconds.
    sockets[4].open();
    sockets[4].hear();
    sockets[4].closed(1011);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(sockets).toHaveLength(5);
    connection.stop();
  });

  it('says so when the server refuses a change as too large, and tries again seldom', async () => {
    const { connection, sockets } = connect();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0].open();
    sockets[0].hear();
    sockets[0].closed(4005, 'too large');
    expect(connection.tooLarge).toBe(true);
    expect(connection.status).toBe('offline');
    expect(connection.ending).toBeNull();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(sockets).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(sockets).toHaveLength(2);
    // Taken in this time: once the connection has lasted, the refusal is past.
    sockets[1].open();
    sockets[1].hear();
    expect(connection.tooLarge).toBe(true);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(connection.tooLarge).toBe(false);
    connection.stop();
  });

  it('ends for good when this copy is removed', async () => {
    const ended: string[] = [];
    const doc = new Y.Doc();
    const sockets: Socket[] = [];
    const connection = new Connection(doc, new Awareness(doc), {
      ticket: async () => 'ws://server/room',
      socket: () => {
        sockets.push(new Socket());
        return sockets.at(-1) as unknown as WebSocket;
      },
      onended: (why) => ended.push(why),
    });
    await vi.advanceTimersByTimeAsync(0);
    sockets[0].open();
    sockets[0].closed(4001);
    expect(connection.status).toBe('ended');
    expect(ended).toEqual(['removed']);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sockets).toHaveLength(1);
  });
});
