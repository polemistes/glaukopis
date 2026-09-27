/**
 * The connection between a project and the server it is shared through.
 *
 * It speaks the synchronisation protocol of Yjs: each side tells the other
 * what it has, and is given what it lacks. A project that cannot reach its
 * server is worked on as any other; what was written meanwhile is brought
 * along when the server is reached again. See ADR 0006.
 */

import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
  type Awareness,
} from 'y-protocols/awareness';
import {
  messageYjsSyncStep2,
  readSyncMessage,
  writeSyncStep1,
  writeUpdate,
} from 'y-protocols/sync';
import type * as Y from 'yjs';

const SYNC = 0;
const AWARENESS = 1;
const QUERY_AWARENESS = 3;

/** Codes with which the server closes a connection for good. */
const REMOVED = 4001;
const DELETED = 4002;

const LONGEST_WAIT = 30_000;

export type ConnectionStatus = 'connecting' | 'connected' | 'offline' | 'ended';

/** Why the sharing has ended for this copy. */
export type Ending = 'removed' | 'deleted';

export interface Refusal {
  kind: string;
  message: string;
}

export interface ConnectionOptions {
  /** Asks for an address to open the socket at. It is good once. */
  ticket: () => Promise<string>;
  /** Called when the server has no place for this copy any more. */
  onended?: (why: Ending) => void;
  /** For tests. */
  socket?: (url: string) => WebSocket;
}

function isFinal(error: unknown): Ending | null {
  const kind = typeof error === 'object' && error !== null ? (error as Refusal).kind : null;
  if (kind === 'no-room') return 'deleted';
  if (kind === 'not-admitted') return 'removed';
  return null;
}

export class Connection {
  status = $state<ConnectionStatus>('connecting');
  /** Whether what the server holds has been received since the socket was opened. */
  synced = $state(false);
  /** Whether it ever has, since the project was opened. */
  everSynced = $state(false);
  ending = $state<Ending | null>(null);
  /** Why the server could not be reached, the last time it was tried. */
  problem = $state<string | null>(null);
  readonly #doc: Y.Doc;
  readonly #awareness: Awareness;
  readonly #options: ConnectionOptions;
  #socket: WebSocket | null = null;
  #attempts = 0;
  #retry: ReturnType<typeof setTimeout> | undefined;
  #stopped = false;
  #opening = false;

  constructor(doc: Y.Doc, awareness: Awareness, options: ConnectionOptions) {
    this.#doc = doc;
    this.#awareness = awareness;
    this.#options = options;
    doc.on('update', this.#onUpdate);
    awareness.on('update', this.#onAwareness);
    if (typeof window !== 'undefined') window.addEventListener('online', this.#onOnline);
    void this.#open();
  }

  /** Ends the connection. The project stays as it is. */
  stop() {
    if (this.#stopped) return;
    this.#stopped = true;
    clearTimeout(this.#retry);
    this.#doc.off('update', this.#onUpdate);
    this.#awareness.off('update', this.#onAwareness);
    if (typeof window !== 'undefined') window.removeEventListener('online', this.#onOnline);
    // Said while there is a socket to say it on: the others see this one leave at once.
    removeAwarenessStates(this.#awareness, [this.#doc.clientID], 'leaving');
    this.#forgetOthers();
    const socket = this.#socket;
    this.#socket = null;
    if (socket) {
      socket.onclose = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.close(1000);
    }
    if (this.status !== 'ended') this.status = 'offline';
    this.synced = false;
  }

  /** Tries at once, rather than when the time for the next attempt has come. */
  retry() {
    if (this.#stopped || this.status === 'ended' || this.#socket || this.#opening) return;
    clearTimeout(this.#retry);
    void this.#open();
  }

  #onOnline = () => this.retry();

  #onUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, SYNC);
    writeUpdate(encoder, update);
    this.#send(encoding.toUint8Array(encoder));
  };

  #onAwareness = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (origin === this) return;
    const changed = [...added, ...updated, ...removed];
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, AWARENESS);
    encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.#awareness, changed));
    this.#send(encoding.toUint8Array(encoder));
  };

  #forgetOthers() {
    const others = [...this.#awareness.getStates().keys()].filter((c) => c !== this.#doc.clientID);
    if (others.length) removeAwarenessStates(this.#awareness, others, this);
  }

  #send(message: Uint8Array<ArrayBuffer>) {
    const socket = this.#socket;
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(message);
  }

  async #open() {
    if (this.#stopped || this.#opening || this.#socket) return;
    this.#opening = true;
    let url: string;
    try {
      url = await this.#options.ticket();
    } catch (error) {
      this.#opening = false;
      const ending = isFinal(error);
      if (ending) this.#end(ending);
      else this.#failed((error as Refusal)?.message ?? String(error));
      return;
    }
    this.#opening = false;
    if (this.#stopped) return;

    const socket = this.#options.socket ? this.#options.socket(url) : new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    this.#socket = socket;

    socket.onopen = () => {
      if (this.#socket !== socket) return;
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, SYNC);
      writeSyncStep1(encoder, this.#doc);
      socket.send(encoding.toUint8Array(encoder));
      if (this.#awareness.getLocalState() !== null) {
        const hello = encoding.createEncoder();
        encoding.writeVarUint(hello, AWARENESS);
        encoding.writeVarUint8Array(
          hello,
          encodeAwarenessUpdate(this.#awareness, [this.#doc.clientID]),
        );
        socket.send(encoding.toUint8Array(hello));
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      if (this.#socket !== socket || !(event.data instanceof ArrayBuffer)) return;
      this.#attempts = 0;
      this.problem = null;
      if (this.status !== 'connected') this.status = 'connected';
      try {
        this.#read(new Uint8Array(event.data), socket);
      } catch (error) {
        console.error('a message from the server could not be read', error);
      }
    };

    socket.onclose = (event: CloseEvent) => {
      if (this.#socket !== socket) return;
      this.#socket = null;
      this.synced = false;
      this.#forgetOthers();
      if (event.code === REMOVED) this.#end('removed');
      else if (event.code === DELETED) this.#end('deleted');
      else this.#failed(event.reason || null);
    };
    // A failure is followed by the closing of the socket, which is where it is dealt with.
    socket.onerror = () => {};
  }

  #read(data: Uint8Array, socket: WebSocket) {
    const decoder = decoding.createDecoder(data);
    while (decoding.hasContent(decoder)) {
      const kind = decoding.readVarUint(decoder);
      if (kind === SYNC) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, SYNC);
        const step = readSyncMessage(decoder, encoder, this.#doc, this);
        if (encoding.length(encoder) > 1) socket.send(encoding.toUint8Array(encoder));
        if (step === messageYjsSyncStep2 && !this.synced) {
          this.synced = true;
          this.everSynced = true;
        }
      } else if (kind === AWARENESS) {
        applyAwarenessUpdate(this.#awareness, decoding.readVarUint8Array(decoder), this);
      } else if (kind === QUERY_AWARENESS) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, AWARENESS);
        const all = [...this.#awareness.getStates().keys()];
        encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.#awareness, all));
        socket.send(encoding.toUint8Array(encoder));
      } else {
        // Something this version does not know of: the rest cannot be told apart.
        return;
      }
    }
  }

  #failed(why: string | null) {
    if (this.#stopped || this.status === 'ended') return;
    this.status = 'offline';
    this.problem = why;
    const wait = Math.min(LONGEST_WAIT, 1000 * 2 ** this.#attempts) * (0.75 + Math.random() * 0.5);
    this.#attempts = Math.min(this.#attempts + 1, 10);
    clearTimeout(this.#retry);
    this.#retry = setTimeout(() => void this.#open(), wait);
  }

  #end(why: Ending) {
    clearTimeout(this.#retry);
    this.status = 'ended';
    this.ending = why;
    this.synced = false;
    this.#options.onended?.(why);
  }
}

const COLOURS = [
  '#0e7490',
  '#b45309',
  '#7c3aed',
  '#be185d',
  '#15803d',
  '#1d4ed8',
  '#c2410c',
  '#4d7c0f',
];

/** A colour for a person, the same wherever they are seen. */
export function colourOf(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

/** The letters that stand for a person where there is no room for the name. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : '';
  return (first + last).toUpperCase();
}
