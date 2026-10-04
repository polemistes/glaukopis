import { afterEach, describe, expect, it } from 'vitest';
import { DOMSerializer } from 'prosemirror-model';
import { bodySchema } from '$lib/editor/schema';
import { blocksHtml } from '$lib/project/model/html';
import { foundUi, goThroughWhenOpen, pressedFound, takeWaiting } from './found.svelte';
import { p, t, zotero } from './testing';

const NAGY = zotero('a1b2c3d4e5f6');
const LEFT = zotero('b1b2c3d4e5f6', 'LORD1960', { left: true });

afterEach(() => {
  foundUi.request = null;
  document.body.innerHTML = '';
});

describe('pressing a citation that was found', () => {
  it('opens the panel at that one, where the text is shown', () => {
    document.body.innerHTML = blocksHtml([
      p(t('Said '), t('(Nagy ', { found: NAGY }), t('1979', { found: NAGY, em: {} }), t(')')),
      p(t('Left '), t('(Lord 1960)', { found: LEFT })),
    ]);
    // On the words in italics within it, as on any of it.
    const asked = foundUi.asked;
    expect(pressedFound(document.querySelector('.found em'), 'm1')).toBe(true);
    expect(foundUi.request).toEqual({ map: 'm1', at: NAGY.id });
    expect(foundUi.asked).toBe(asked + 1);
    foundUi.request = null;
    // Not on other text, nor on what was left as text.
    expect(pressedFound(document.querySelector('p'), 'm1')).toBe(false);
    expect(pressedFound(document.querySelectorAll('p')[1], 'm1')).toBe(false);
    expect(document.body.textContent).toContain('(Lord 1960)');
    expect(document.querySelectorAll('.found')).toHaveLength(2);
    expect(pressedFound(null, 'm1')).toBe(false);
    expect(pressedFound(document.querySelector('.found'), null)).toBe(false);
    expect(foundUi.request).toBeNull();
  });

  it('and where it is written, as the editors show it', () => {
    const { found } = bodySchema.marks;
    const node = bodySchema.text('(Nagy 1979)', [found.create(NAGY)]);
    const left = bodySchema.text('(Lord 1960)', [found.create(LEFT)]);
    const serializer = DOMSerializer.fromSchema(bodySchema);
    document.body.append(
      serializer.serializeFragment(bodySchema.nodes.paragraph.create(null, [node, left]).content),
    );
    const [first, second] = document.querySelectorAll('span[data-found]');
    expect(pressedFound(first, 'm2')).toBe(true);
    expect(foundUi.request).toEqual({ map: 'm2', at: NAGY.id });
    foundUi.request = null;
    expect(pressedFound(second, 'm2')).toBe(false);
  });
});

describe('a project that is made of a document', () => {
  it('has its citations gone through when it has been opened, and no other project', () => {
    goThroughWhenOpen('p1', 'm1');
    expect(takeWaiting('p2')).toBeNull();
    expect(takeWaiting('p1')).toBe('m1');
    // Once.
    expect(takeWaiting('p1')).toBeNull();
  });
});
