import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { blocksHtml } from '$lib/project/model/html';
import { readBody } from '$lib/project/model/text';
import { drawnHolder, markDrawn, unmarkDrawn } from './drawn';
import type { Mark } from './marks';

function el(
  name: string,
  children: (Y.XmlElement | Y.XmlText)[] = [],
  attrs: Record<string, unknown> = {},
) {
  const e = new Y.XmlElement(name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v as string);
  e.insert(0, children);
  return e;
}

const text = (s: string) => new Y.XmlText(s);

/** A text with what is drawn and what is not: an equation without a formula, a list, a row of one figure, a table. */
function drawn() {
  const doc = new Y.Doc();
  const body = doc.getXmlFragment('body');
  body.insert(0, [
    el('paragraph', [
      text('The black cat'),
      el('citation', [], { items: [{ id: 'x' }] }),
      text(' sat.'),
    ]),
    el('equation', [], { tex: '' }),
    el('bullet_list', [
      el('list_item', [el('paragraph', [text('One')])]),
      el('list_item', [el('paragraph', [text('Two')])]),
    ]),
    el('row', [el('figure', [text('A shield.')], { id: 'f', file: '', extension: '' })]),
    el('tabular', [
      el('table_caption', [text('A table.')]),
      el('table', [el('table_row', [el('table_cell', [el('paragraph', [text('Cell')])])])]),
    ]),
    el('paragraph', [text('Last'), el('footnote', [text('Note.')])]),
  ]);
  const root = document.createElement('div');
  root.innerHTML = blocksHtml(readBody(body));
  return { body, root };
}

function mark(
  kind: Mark['kind'],
  path: Mark['path'],
  from: number,
  to: number,
  text?: string,
): Mark {
  return {
    change: 'c',
    current: false,
    kind,
    element: 'e',
    part: 'body',
    path,
    from,
    to,
    text,
    colour: 'red',
  };
}

describe('drawn text', () => {
  it('holds each block where it is drawn, past what is not drawn', () => {
    const { body, root } = drawn();
    const at = (path: Mark['path']) => drawnHolder(root, body, 'body', path)?.textContent;
    expect(at([0])).toBe(
      'The black cat(x) sat.'.replace('(x)', root.querySelector('.citation')!.textContent!),
    );
    expect(at([1])).toBeUndefined();
    expect(at([2, 1, 0])).toBe('Two');
    expect(at([3, 0])).toBe('A shield.');
    expect(at([4, 0])).toBe('A table.');
    expect(at([4, 1, 0, 0, 0])).toBe('Cell');
    expect(drawnHolder(root, body, 'body', [5, 'note', 0])?.matches('sup.footnote')).toBe(true);
  });

  it('marks what was added and what was deleted, and takes the marks away again', () => {
    const { body, root } = drawn();
    const before = root.innerHTML;
    const made = markDrawn(
      root,
      body,
      [
        mark('added', [0], 4, 10),
        mark('removed', [0], 14, 14, 'lazily'),
        mark('gone', [2], 0, 0, 'Gone.'),
      ],
      'body',
    );
    const p = root.querySelector('p')!;
    expect(p.querySelector('.review-added')!.textContent).toBe('black ');
    const removed = p.querySelector('.review-removed')!;
    expect(removed.textContent).toBe('');
    expect((removed as HTMLElement).dataset.text).toBe('lazily');
    // After the citation, before " sat.".
    expect(removed.previousElementSibling?.matches('.citation')).toBe(true);
    expect(root.querySelector('div.review-removed.block')!.nextElementSibling?.tagName).toBe('UL');
    unmarkDrawn(made);
    expect(root.innerHTML).toBe(before);
  });
});

describe('what a drawn text holds from elsewhere', () => {
  it('is nothing of the marks made for it, and is taken away like them', () => {
    // WebKit gives a text set again by innerHTML the nodes it parsed before, marks and all.
    const el = document.createElement('div');
    el.innerHTML =
      '<p>The <span class="review-mark review-added">wrath</span> of <span class="review-object review-mark-class">Achilles</span></p>';
    unmarkDrawn([...el.querySelectorAll<HTMLElement>('.review-mark, .review-mark-class')]);
    expect(el.innerHTML).toBe('<p>The wrath of <span class="">Achilles</span></p>');
  });
});
