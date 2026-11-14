import { describe, expect, it } from 'vitest';
import {
  documentOf,
  leftAt,
  OUTLINE_WIDTH,
  readBeside,
  readMemory,
  sameBeside,
  sideWidth,
  toStore,
} from './layout';
import { PROJECT } from './model/types';

const elements = new Set(['a', 'b']);

describe('what a project keeps of how it was looked at', () => {
  it('is as a project first met where nothing, or nothing readable, was kept', () => {
    for (const kept of [undefined, null, 'x', {}, { cameras: 3, tops: ['a'], outlineWidth: 5 }])
      expect(readMemory(kept)).toEqual({
        cameras: {},
        tops: {},
        outlineWidth: OUTLINE_WIDTH,
        left: null,
        beside: null,
        document: null,
        chat: null,
        drafts: {},
        commenting: null,
      });
    expect(leftAt(readMemory(null), elements)).toEqual({ at: PROJECT, mode: 'diagram' });
  });

  it('reads back as it was written: cameras, folds, tops, the outline and where it was left', () => {
    const memory = {
      cameras: { a: { cx: 1, cy: 2, k: 1 }, gone: { cx: 0, cy: 0, k: 1 } },
      tops: { a: 'b', b: 'gone' },
      outlineWidth: 300,
      left: { at: 'a', mode: 'text' as const },
      beside: null,
      document: 'b',
      chat: { id: 'm', created: '2026-11-13T09:00:00Z' },
      drafts: {},
      commenting: null,
    };
    const stored = toStore(memory, elements, ['a']);
    expect(stored).toEqual({
      cameras: { a: { cx: 1, cy: 2, k: 1 } },
      folded: ['a'],
      tops: { a: 'b' },
      outlineWidth: 300,
      at: 'a',
      mode: 'text',
      document: 'b',
      chat: { id: 'm', created: '2026-11-13T09:00:00Z' },
    });
    expect(readMemory(JSON.parse(JSON.stringify(stored)))).toEqual({
      ...memory,
      cameras: { a: { cx: 1, cy: 2, k: 1 } },
      tops: { a: 'b' },
    });
  });

  it('keeps what stood beside it, its tabs or itself the other way, read with care', () => {
    const tabs = toStore({ ...readMemory(null), beside: { kind: 'tabs' } }, elements, []);
    expect(readMemory(JSON.parse(JSON.stringify(tabs))).beside).toEqual({ kind: 'tabs' });
    const map = toStore(
      { ...readMemory(null), beside: { kind: 'map', at: 'b', mode: 'diagram' } },
      elements,
      [],
    );
    expect(readMemory(map).beside).toEqual({ kind: 'map', at: 'b', mode: 'diagram' });
    // An element gone stands for the project; what is neither is none.
    const gone = toStore(
      { ...readMemory(null), beside: { kind: 'map', at: 'gone', mode: 'text' } },
      elements,
      [],
    );
    expect(readMemory(gone).beside).toEqual({ kind: 'map', at: PROJECT, mode: 'text' });
    expect(readBeside({ kind: 'map', mode: 'film' })).toEqual({
      kind: 'map',
      at: PROJECT,
      mode: 'diagram',
    });
    expect(readBeside({ kind: 'other' })).toBeNull();
    expect(toStore(readMemory(null), elements, [])).not.toHaveProperty('beside');
    expect(sameBeside({ kind: 'tabs' }, { kind: 'tabs' })).toBe(true);
    expect(
      sameBeside({ kind: 'map', at: 'a', mode: 'text' }, { kind: 'map', at: 'a', mode: 'diagram' }),
    ).toBe(false);
    expect(sameBeside(null, { kind: 'tabs' })).toBe(false);
  });

  it('keeps the element marked as the document while it is there, and reads a view without one as none', () => {
    expect(toStore({ ...readMemory(null), document: 'gone' }, elements, [])).not.toHaveProperty(
      'document',
    );
    expect(toStore({ ...readMemory(null), document: PROJECT }, elements, []).document).toBe(
      PROJECT,
    );
    expect(readMemory({ at: 'a', document: '' }).document).toBeNull();
    expect(readMemory({ at: 'a', document: 3 }).document).toBeNull();
  });

  it('keeps what is written in a field and not yet sent, where the field holds words', () => {
    const stored = toStore(
      { ...readMemory(null), drafts: { chat: 'Shall we', 'answer:t': '' } },
      elements,
      [],
    );
    expect(stored.drafts).toEqual({ chat: 'Shall we' });
    expect(readMemory(JSON.parse(JSON.stringify(stored))).drafts).toEqual({ chat: 'Shall we' });
    expect(toStore(readMemory(null), elements, [])).not.toHaveProperty('drafts');
    for (const kept of [3, 'x', ['a'], { chat: 4, other: null }])
      expect(readMemory({ drafts: kept }).drafts).toEqual({});
  });

  it('keeps the comment that is being begun while its element is there, with its passage', () => {
    const passage = { from: new Uint8Array([1, 2, 250]), to: new Uint8Array([3]), text: 'wrath' };
    const onPassage = toStore(
      { ...readMemory(null), commenting: { element: 'a', passage } },
      elements,
      [],
    );
    expect(readMemory(JSON.parse(JSON.stringify(onPassage))).commenting).toEqual({
      element: 'a',
      passage,
    });
    const onElement = toStore(
      { ...readMemory(null), commenting: { element: PROJECT, passage: null } },
      elements,
      [],
    );
    expect(onElement.commenting).toEqual({ element: PROJECT });
    expect(readMemory(onElement).commenting).toEqual({ element: PROJECT, passage: null });
    const gone = toStore(
      { ...readMemory(null), commenting: { element: 'gone', passage: null } },
      elements,
      [],
    );
    expect(gone).not.toHaveProperty('commenting');
    for (const kept of [3, {}, { element: '' }, { element: 'a', passage: { from: 1 } }])
      expect(readMemory({ commenting: kept }).commenting).toBeNull();
    expect(
      readMemory({ commenting: { element: 'a', passage: { from: '*', to: '*', text: 'x' } } })
        .commenting,
    ).toBeNull();
  });

  it('has as its document the element marked, wherever the element in view is, else the element in view', () => {
    // No mark: the element in view.
    expect(documentOf(null, elements, 'b')).toBe('b');
    // A mark that is there: the mark, with the element in view within it, beside it or above it.
    expect(documentOf('a', elements, 'b')).toBe('a');
    expect(documentOf('a', elements, 'a')).toBe('a');
    expect(documentOf('a', elements, PROJECT)).toBe('a');
    expect(documentOf(PROJECT, elements, 'b')).toBe(PROJECT);
    // A mark whose element is gone: the element in view again.
    expect(documentOf('gone', elements, 'b')).toBe('b');
  });

  it('is left at the project where the element it was left at is gone', () => {
    const memory = readMemory({ at: 'gone', mode: 'text' });
    expect(leftAt(memory, elements)).toEqual({ at: PROJECT, mode: 'text' });
    expect(toStore(memory, elements, [])).not.toHaveProperty('at');
  });

  it('reads where it was left from the first pane of a view kept before the sides were the window’s', () => {
    expect(
      readMemory({
        panes: [
          { at: 'b', mode: 'text' },
          { at: 'a', project: 'x' },
        ],
      }).left,
    ).toEqual({
      at: 'b',
      mode: 'text',
    });
  });

  it('gives the panes beside the sides what the room allows', () => {
    expect(sideWidth('references', 300, -1000, 1200)).toBe(600);
    expect(sideWidth('references', 300, 1000, 1200)).toBe(240);
    expect(sideWidth('preview', 500, -2000, 1000)).toBe(700);
  });
});
