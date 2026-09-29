/**
 * The records of a history as the core writes them (`crates/core/src/history.rs`):
 * the length with its highest bit set, a checksum, and a body of the kind,
 * whether it was made here, the time (and of merged records the time of the
 * last), and the change.
 */

export type RecordKind = 'change' | 'start' | 'merged';

export interface HistoryRecord {
  kind: RecordKind;
  here: boolean;
  /** When it was written here, in milliseconds since 1970; of merged records, the first. */
  time: number;
  /** Of merged records, when the last was written; of others, `time`. */
  until: number;
  update: Uint8Array;
}

const KINDS: RecordKind[] = ['change', 'start', 'merged'];
const TIMED = 0x8000_0000;

function checksum(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) hash = Math.imul(hash ^ bytes[i], 0x01000193) >>> 0;
  return hash >>> 0;
}

/** Reads records one after another; what is damaged, and all after it, is left out. */
export function readRecords(bytes: Uint8Array): HistoryRecord[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: HistoryRecord[] = [];
  let at = 0;
  while (at + 8 <= bytes.length) {
    const head = view.getUint32(at, true);
    const length = head & ~TIMED & 0x7fff_ffff;
    const start = at + 8;
    const end = start + length;
    if (end > bytes.length) break;
    at = end;
    if (!(head & TIMED)) {
      out.push({
        kind: 'change',
        here: true,
        time: 0,
        until: 0,
        update: bytes.subarray(start, end),
      });
      continue;
    }
    const kind = KINDS[bytes[start]];
    if (!kind || length < 10) break;
    const here = bytes[start + 1] !== 0;
    const time = Number(view.getBigInt64(start + 2, true));
    const merged = kind === 'merged';
    const until = merged ? Number(view.getBigInt64(start + 10, true)) : time;
    out.push({ kind, here, time, until, update: bytes.subarray(start + (merged ? 18 : 10), end) });
  }
  return out;
}

/** Writes records as the core reads them. */
export function writeRecords(records: HistoryRecord[]): Uint8Array {
  const size = records.reduce((n, r) => n + r.update.length + 26, 0);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let at = 0;
  for (const r of records) {
    const merged = r.kind === 'merged';
    const bodyLength = (merged ? 18 : 10) + r.update.length;
    const body = out.subarray(at + 8, at + 8 + bodyLength);
    body[0] = KINDS.indexOf(r.kind);
    body[1] = r.here ? 1 : 0;
    const bodyView = new DataView(out.buffer, at + 8, bodyLength);
    bodyView.setBigInt64(2, BigInt(Math.round(r.time)), true);
    if (merged) bodyView.setBigInt64(10, BigInt(Math.round(r.until)), true);
    body.set(r.update, merged ? 18 : 10);
    view.setUint32(at, (bodyLength | TIMED) >>> 0, true);
    view.setUint32(at + 4, checksum(body), true);
    at += 8 + bodyLength;
  }
  return out.subarray(0, at);
}
