import { describe, expect, it } from 'vitest';
import { readRecords, writeRecords, type HistoryRecord } from './records';

const records: HistoryRecord[] = [
  { kind: 'start', here: true, time: 1000, until: 1000, update: new Uint8Array([1, 2, 3]) },
  { kind: 'change', here: false, time: 2000, until: 2000, update: new Uint8Array([4]) },
  { kind: 'merged', here: true, time: 3000, until: 9000, update: new Uint8Array([5, 6]) },
];

/** A record's head: its length with the highest bit set, and a sum (not checked here). */
function head(length: number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setUint32(0, (length | 0x8000_0000) >>> 0, true);
  return out;
}

describe('the records of a history', () => {
  it('are read as they were written', () => {
    expect(readRecords(writeRecords(records))).toEqual(records);
  });

  it('as an earlier version wrote them are changes made here', () => {
    const bytes = new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 7, 8]);
    expect(readRecords(bytes)).toEqual([
      { kind: 'change', here: true, time: 0, until: 0, update: new Uint8Array([7, 8]) },
    ]);
  });

  it('that do not read are not left out without a word', () => {
    const whole = writeRecords(records);
    // Cut short within the last record.
    expect(() => readRecords(whole.subarray(0, whole.length - 1))).toThrow(
      /record 3 of the history.*does not read: it ends after/,
    );
    // A few bytes after the last record that are not one.
    expect(() => readRecords(new Uint8Array([...whole, 1, 2]))).toThrow(
      /2 bytes that are not a record/,
    );
    // A merged record too short to hold the time of its last.
    const merged = new Uint8Array([...head(12), 2, 1, ...new Uint8Array(10)]);
    expect(() => readRecords(merged)).toThrow(/record 1 .*too short, 12 bytes/);
    // A kind not known.
    const unknown = new Uint8Array([...head(10), 9, 1, ...new Uint8Array(8)]);
    expect(() => readRecords(unknown)).toThrow(/its kind, 9, is not known/);
  });
});
