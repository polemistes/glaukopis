import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { bodySchema } from '$lib/editor/schema';
import { linemark, paragraph, readBody, type Block } from '$lib/project/model/text';
import { bodyPassages } from '$lib/search/passages';
import { readBodyDoc } from '$lib/search/prosemirror';
import { readBodyY } from '$lib/search/replacing';
import type { Surface } from '$lib/search/text.svelte';
import { makeCitation, type Target } from './change';
import { gather, type Marked } from './gather';
import { revealFound } from './reveal';
import { p, project, t, zotero } from './testing';

let views: EditorView[] = [];

function editor(fragment: Y.XmlFragment): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({ schema: bodySchema, plugins: [ySyncPlugin(fragment)] }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

const target = (m: Marked): Target => ({
  passage: m.passage,
  start: m.start,
  end: m.end,
  text: m.text,
  id: m.found.id,
});

/** Prose with a reference mark before what was found, and verse with line marks around it. */
const TEXT: Block[] = [
  p(
    t('For God so '),
    { kind: 'refmark', label: '3:16' },
    t('loved the world '),
    t('(Nagy 1979)', { found: zotero('a1b2c3d4e5f6') }),
    t('.'),
  ),
  paragraph(
    [
      linemark({ number: '1' }),
      t('If only the Argo '),
      t('(Page 1955)', { found: zotero('b1b2c3d4e5f6', 'WXYZ6789') }),
      { kind: 'break' },
      linemark({ counted: false, margin: 'ia.' }),
      t('had never flown'),
    ],
    'line',
    { indent: 0, numbering: 'counted' },
  ),
];

describe('a citation that was found, in a line with a reference mark or a line mark', () => {
  it('is in a passage read alike by the found and by every reader of the search', () => {
    const { pr, at, elements } = project(TEXT);
    const fragment = pr.fragment(elements[0], 'body')!;
    const found = gather(pr, at).places.map((x) => x.text);
    expect(found).toEqual([
      'For God so loved the world (Nagy 1979).',
      'If only the Argo (Page 1955)\nhad never flown',
    ]);
    expect(bodyPassages(readBody(fragment)).map((x) => x.text)).toEqual(found);
    expect(readBodyY(fragment, null).passages.map((x) => x.text)).toEqual(found);
    expect(readBodyDoc(editor(fragment).state.doc, null).passages.map((x) => x.text)).toEqual(
      found,
    );
  });

  it('is shown in the text, where it stands', async () => {
    const { pr, at, elements } = project(TEXT);
    const view = editor(pr.fragment(elements[0], 'body')!);
    const surface = {
      project: pr,
      reveal: async () => view,
      scroller: () => null,
    } as unknown as Surface;
    const { marked } = gather(pr, at);
    expect(marked.map((m) => m.text)).toEqual(['(Nagy 1979)', '(Page 1955)']);
    for (const m of marked) {
      expect(await revealFound(surface, target(m), elements[0])).toBe(true);
      const { from, to } = view.state.selection;
      expect(view.state.doc.textBetween(from, to)).toBe(m.text);
    }
  });

  it('is made a citation without taking the marks beside it', () => {
    const { pr, at, elements } = project([
      p(
        t('So '),
        { kind: 'refmark', label: '3:16' },
        t('(Nagy 1979)', { found: zotero('a1b2c3d4e5f6') }),
        { kind: 'refmark', label: '3:17' },
        t(' and more.'),
      ),
    ]);
    const [m] = gather(pr, at).marked;
    expect(m.text).toBe('(Nagy 1979)');
    expect(makeCitation(pr, target(m), [{ id: 'r1' }], 'normal')).toEqual({ done: true });
    const [line] = readBody(pr.fragment(elements[0], 'body')!);
    const kinds = line.kind === 'paragraph' ? line.content.map((i) => i.kind) : [];
    expect(kinds).toEqual(['text', 'refmark', 'citation', 'refmark', 'text']);
  });
});
