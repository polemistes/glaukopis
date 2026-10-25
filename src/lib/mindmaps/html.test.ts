import { describe, expect, it } from 'vitest';
import { paragraph, type Block, type Inline } from '$lib/project/model/text';
import { htmlToBlocks, nameHtml, nameOfHtml, notesHtml, notesPlain, plainToBlocks } from './html';
import type { LeftOut } from './map';

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const cite = () => '(Nagy 1979, 12)';

/** The words of a text, block by block, with the marks of each run. */
const shape = (blocks: Block[]) =>
  blocks.map((b) =>
    b.kind === 'paragraph'
      ? {
          name: b.name,
          indent: b.indent,
          runs: b.content.map((i) =>
            i.kind === 'text' ? [i.text, Object.keys(i.marks).sort()] : [i.kind],
          ),
        }
      : { kind: b.kind },
  );

describe('the text as HTML for another program, and back', () => {
  it('keeps the words, the marks, the lists and the quotations', () => {
    const blocks: Block[] = [
      paragraph([
        t('The wrath of '),
        t('Achilles', { em: {} }),
        t(', and '),
        t('more', { strong: {} }),
      ]),
      paragraph([t('Sing, goddess.')], 'quote'),
      paragraph([t('one')], 'item'),
      paragraph([t('two')], 'item', 1),
      paragraph([t('three')], 'numbered'),
      paragraph([t('A '), t('Name', { smallcaps: {} }), t(' and x'), t('2', { sup: {} })]),
    ];
    const left: LeftOut = {};
    const html = notesHtml(blocks, null, cite, left);
    expect(html).not.toMatch(/data-|class=/);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<span style="font-variant: small-caps">Name</span>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<ol>');
    expect(shape(htmlToBlocks(html, left))).toEqual(shape(blocks));
    expect(left).toEqual({});
  });

  it('writes a citation as its words, and a note in square brackets where it stands', () => {
    const blocks: Block[] = [
      paragraph([
        t('As '),
        { kind: 'citation', items: [{ id: 'r1', locator: '12' }], mode: 'normal' },
        t(' says'),
        { kind: 'footnote', content: [t('So the '), t('scholia', { em: {} })] },
        t('.'),
      ]),
    ];
    const left: LeftOut = {};
    const html = notesHtml(blocks, null, cite, left);
    expect(html).toBe('<p>As (Nagy 1979, 12) says [So the <em>scholia</em>].</p>');
    expect(notesPlain(blocks, cite, left)).toBe('As (Nagy 1979, 12) says [So the scholia].');
  });

  it('gives a figure as its caption, and counts the picture', () => {
    const left: LeftOut = {};
    const html = notesHtml(
      [
        {
          kind: 'figure',
          id: 'f1',
          file: 'a'.repeat(64),
          extension: 'png',
          alt: '',
          caption: [t('A ship')],
          width: 100,
          numbered: true,
        } as Block,
        { kind: 'equation', id: 'e1', tex: 'a^2', numbered: false } as Block,
      ],
      null,
      cite,
      left,
    );
    expect(html).toBe('<p><em>A ship</em></p><p>a^2</p>');
    expect(left).toEqual({ pictures: 1 });
  });

  it('parts plain words into paragraphs by blank lines', () => {
    const blocks = plainToBlocks('First line\nsecond line\n\nAnother');
    expect(blocks).toHaveLength(2);
    expect(shape(blocks)[0].runs).toEqual([['First line', []], ['break'], ['second line', []]]);
    expect(shape(htmlToBlocks('Only words &amp; more', {}))).toEqual([
      { name: 'text', indent: 0, runs: [['Only words & more', []]] },
    ]);
  });

  it('reads HTML of other programs: headings as paragraphs, pictures counted', () => {
    const left: LeftOut = {};
    const blocks = htmlToBlocks('<h2>Head</h2><p>Text <img src="x.png"> on</p>', left);
    expect(shape(blocks).map((b) => (b.runs ? b.runs.map((r) => r[0]).join('') : ''))).toEqual([
      'Head',
      'Text on',
    ]);
    expect(left).toEqual({ images: 1 });
  });
});

describe('a name with its marks', () => {
  it('goes to HTML and back', () => {
    const name = [
      t('The '),
      t('wanderings', { em: {} }),
      t(' of O'),
      t('dysseus', { smallcaps: {} }),
    ];
    const html = nameHtml(name);
    expect(html).toBe(
      'The <i>wanderings</i> of O<span style="font-variant: small-caps">dysseus</span>',
    );
    const read = nameOfHtml(
      new DOMParser().parseFromString(`<p>\n  ${html}\n</p>`, 'text/html').body,
    );
    expect(read).toEqual(name);
  });
});
