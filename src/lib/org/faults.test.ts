import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Inline } from '$lib/project/model/text';
import type { RefRecord } from '$lib/project/model/types';
import { writeContentLines, writeLine, type InlineReading, type InlineWriting } from './inline';
import { readProject } from './read';
import { writeBlocks } from './write';

// What the Org form cannot do is said in the log, never dropped (the rule
// that nothing fails quietly).

const cite: Inline[] = [
  { kind: 'text', text: 'As ', marks: {} },
  { kind: 'citation', items: [{ id: 'r1' }], mode: 'normal' },
];

/** A writing and a reading that disagree on the key of a work, so that no way of writing reads back the same. */
const writing = (unsure: (text: string) => void): InlineWriting => ({
  kindName: (id) => id,
  citeKey: () => 'homer',
  refPrefix: () => 'id',
  unsure,
});
const reading: InlineReading = { kindOf: (name) => name, citeId: () => 'another' };

afterEach(() => vi.restoreAllMocks());

describe('words that will not read back the same', () => {
  it('are told of, in a paragraph and on one line', () => {
    const told: string[] = [];
    const lines = writeContentLines(
      cite,
      'prose',
      writing((t) => told.push(t)),
      reading,
    );
    expect(lines.join('\n')).toContain('homer');
    writeLine(
      cite,
      writing((t) => told.push(t)),
      reading,
    );
    expect(told).toHaveLength(2);
    expect(told[0]).toContain('As ');
  });

  it('are not told of when they read back the same', () => {
    const told: string[] = [];
    writeContentLines(
      cite,
      'prose',
      writing((t) => told.push(t)),
      {
        kindOf: (n) => n,
        citeId: () => 'r1',
      },
    );
    expect(told).toEqual([]);
  });

  it('leave the log quiet when a text reads back the same', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeBlocks([{ kind: 'paragraph', name: 'text', indent: 0, content: cite }], {
      references: [{ id: 'r1', key: 'homer' } as RefRecord],
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('are said once in the log for a whole text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Two works of one key: the first is cited, and the key reads back as the second.
    const references = [
      { id: 'r1', key: 'homer' },
      { id: 'r2', key: 'homer' },
    ] as RefRecord[];
    const para = { kind: 'paragraph' as const, name: 'text', indent: 0, content: cite };
    writeBlocks([para, para], { references });
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toMatch(/2 passage/);
  });
});

describe('an Org file the reader fails on', () => {
  it('is kept as a draft, and the log says why', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // A work whose key cannot be read makes the reader throw.
    const broken = {
      id: 'r1',
      get key(): string {
        throw new Error('no key');
      },
    } as unknown as RefRecord;
    const org = readProject('* Title\nWords.\n', [broken]);
    expect(org.elements).toHaveLength(1);
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0][1])).toContain('no key');
  });
});
