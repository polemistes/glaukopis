import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { chatSchema } from '$lib/editor/schema';
import type { ChatWords } from '$lib/project/model/types';
import { FieldUndo, isEmpty, markOn, toggle } from './field';
import {
  NOTHING,
  docOf,
  keptOf,
  linksOf,
  onlyEmojis,
  stretches,
  wordsOf,
  writtenOf,
} from './written';

describe('the words and marks of the field', () => {
  const back = (words: ChatWords) => wordsOf(docOf(words));

  it('come back as they went, with their line breaks', () => {
    expect(back({ text: 'First line\nsecond line' })).toEqual({ text: 'First line\nsecond line' });
    expect(back({ text: '\n\nafter two empty lines\n' })).toEqual({
      text: '\n\nafter two empty lines\n',
    });
  });

  it('with marks that overlap, cross lines and stand at the ends', () => {
    const words: ChatWords = {
      text: 'Bold and both\nitalic',
      marks: [
        { from: 0, to: 13, mark: 'strong' },
        { from: 9, to: 20, mark: 'em' },
      ],
    };
    const doc = docOf(words);
    expect(doc.childCount).toBe(2);
    expect(doc.child(1).firstChild!.marks.map((m) => m.type.name)).toEqual(['em']);
    // The break between the lines is not marked, so each mark comes back cut at it.
    expect(wordsOf(doc)).toEqual({
      text: 'Bold and both\nitalic',
      marks: [
        { from: 0, to: 13, mark: 'strong' },
        { from: 9, to: 13, mark: 'em' },
        { from: 14, to: 20, mark: 'em' },
      ],
    });
  });

  it('a break within a line, as from a paste, is a line break', () => {
    const doc = chatSchema.node('doc', null, [
      chatSchema.node('line', null, [
        chatSchema.text('One'),
        chatSchema.node('hard_break'),
        chatSchema.text('two', [chatSchema.marks.code.create()]),
      ]),
    ]);
    expect(wordsOf(doc)).toEqual({ text: 'One\ntwo', marks: [{ from: 4, to: 7, mark: 'code' }] });
  });
});

describe('the keys and the state of the field', () => {
  const state = (words: ChatWords) => EditorState.create({ doc: docOf(words) });

  it('says which marks are on at the cursor, and toggles them', () => {
    let s = state({ text: 'Bold plain', marks: [{ from: 0, to: 4, mark: 'strong' }] });
    s = s.apply(s.tr.setSelection(TextSelection.create(s.doc, 3)));
    expect(markOn(s, 'strong')).toBe(true);
    expect(markOn(s, 'em')).toBe(false);
    s = s.apply(s.tr.setSelection(TextSelection.create(s.doc, 6, 11)));
    toggle('em')(s, (tr) => (s = s.apply(tr)));
    expect(markOn(s, 'em')).toBe(true);
    expect(wordsOf(s.doc).marks).toContainEqual({ from: 5, to: 10, mark: 'em' });
  });

  it('knows an empty field', () => {
    expect(isEmpty(state({ text: '' }))).toBe(true);
    expect(isEmpty(state({ text: '\n' }))).toBe(false);
  });
});

describe('the field’s own undo', () => {
  it('makes a step of what is written without a pause, and goes back and forth', () => {
    const undo = new FieldUndo<string>(600);
    undo.changed('', 0);
    undo.changed('S', 100);
    undo.changed('Si', 200);
    undo.changed('Sin', 1000);
    expect(undo.undo('Sing')).toBe('Sin');
    expect(undo.undo('Sin')).toBe('');
    expect(undo.undo('')).toBeNull();
    expect(undo.redo('')).toBe('Sin');
    expect(undo.redo('Sin')).toBe('Sing');
    expect(undo.redo('Sing')).toBeNull();
  });

  it('forgets what was undone once something new is written', () => {
    const undo = new FieldUndo<string>(600);
    undo.changed('', 0);
    expect(undo.undo('a')).toBe('');
    undo.changed('', 5000);
    expect(undo.redo('b')).toBeNull();
  });
});

describe('what is written and not yet sent, as it is kept', () => {
  it('as JSON, with its marks and what it answers or changes', () => {
    const written = {
      words: { text: 'Yes', marks: [{ from: 0, to: 3, mark: 'em' as const }] },
      to: 'm1',
    };
    expect(writtenOf(keptOf(written))).toEqual(written);
    const editing = {
      words: { text: 'Changed' },
      editing: 'm2',
      before: { words: { text: 'Half' }, to: 'm1' },
    };
    expect(writtenOf(keptOf(editing))).toEqual(editing);
  });

  it('with the words it quotes, and those of what was written before a change', () => {
    const quoting = {
      words: { text: 'Why?' },
      to: 'm1',
      quote: { id: 'm3', text: 'the wrath\nof Achilles' },
    };
    expect(writtenOf(keptOf(quoting))).toEqual(quoting);
    const editing = {
      words: { text: 'Changed' },
      editing: 'm2',
      before: { words: { text: 'Half' }, quote: { id: 'm3', text: 'the wrath' } },
    };
    expect(writtenOf(keptOf(editing))).toEqual(editing);
    // A quote that cannot be read is left out, and what is written kept.
    expect(writtenOf(JSON.stringify({ text: 'Why?', quote: { id: 'm3', text: ' ' } }))).toEqual({
      words: { text: 'Why?' },
    });
  });

  it('keeps the field where a quote stands alone, without words', () => {
    const alone = { words: { text: '' }, quote: { id: 'm3', text: 'the wrath' } };
    expect(keptOf(alone)).not.toBe('');
    expect(writtenOf(keptOf(alone))).toEqual(alone);
  });

  it('as nothing, where nothing is written, answered or changed', () => {
    expect(keptOf(NOTHING)).toBe('');
    expect(keptOf({ words: { text: '' }, to: 'm1' })).not.toBe('');
    expect(writtenOf('')).toEqual(NOTHING);
  });

  it('reads the plain words an earlier version kept as words', () => {
    expect(writtenOf('Shall we begin')).toEqual({ words: { text: 'Shall we begin' } });
    expect(writtenOf('{not json')).toEqual({ words: { text: '{not json' } });
    expect(writtenOf('{"marks":[]}')).toEqual({ words: { text: '{"marks":[]}' } });
  });

  it('reads with care what it cannot trust', () => {
    expect(
      writtenOf(
        JSON.stringify({ text: 'ab', marks: [{ from: 0, to: 9, mark: 'em' }], to: 5, before: {} }),
      ),
    ).toEqual({ words: { text: 'ab' } });
  });
});

describe('how a message is drawn', () => {
  it('in stretches cut wherever a mark or a link begins or ends', () => {
    expect(
      stretches({
        text: 'See https://example.org/a now',
        marks: [{ from: 0, to: 8, mark: 'strong' }],
      }),
    ).toEqual([
      { text: 'See ', marks: ['strong'] },
      { text: 'http', marks: ['strong'], href: 'https://example.org/a' },
      { text: 's://example.org/a', marks: [], href: 'https://example.org/a' },
      { text: ' now', marks: [] },
    ]);
    expect(stretches({ text: 'Plain' })).toEqual([{ text: 'Plain', marks: [] }]);
  });

  it('with the addresses of the web as links, to the next space', () => {
    expect(linksOf('Look at http://a.org/x?y=1, and (https://b.org).')).toEqual([
      { from: 8, to: 26, href: 'http://a.org/x?y=1' },
      { from: 33, to: 46, href: 'https://b.org' },
    ]);
    expect(linksOf('http:// nothing, nor ftp://c.org')).toEqual([]);
  });

  it('larger where it is one to three emojis and nothing else', () => {
    expect(onlyEmojis('👍')).toBe(true);
    expect(onlyEmojis(' 🎉 🏳️‍🌈 👍🏽 ')).toBe(true);
    expect(onlyEmojis('👍👍👍👍')).toBe(false);
    expect(onlyEmojis('Yes 👍')).toBe(false);
    expect(onlyEmojis('1')).toBe(false);
    expect(onlyEmojis('')).toBe(false);
  });
});
