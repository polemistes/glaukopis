import { describe, expect, it } from 'vitest';
import { blocksHtml, excerpt } from './html';
import { boxed, linemark, pagebreak, paragraph, type Inline, type ParagraphBlock } from './text';

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const br: Inline = { kind: 'break' };
const BR = '<span class="hard-break"><br></span>';

describe('a text as HTML', () => {
  it('draws a numbered stanza with a speaker: its lines parted, a number before each line that shows one', () => {
    const stretch: Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side' | 'from'> = {
      indent: 0,
      numbering: 'counted',
      every: 2,
      side: 'right',
      from: '1',
    };
    const html = blocksHtml([
      paragraph([t('Nurse')], 'speaker', stretch),
      paragraph(
        [
          t('If only the Argo'),
          br,
          t('had never flown'),
          br,
          linemark({ counted: false, margin: 'ia.' }),
          t('through the dark'),
          br,
          t('Clashing Rocks'),
        ],
        'line',
        stretch,
      ),
    ]);
    expect(html).toBe(
      '<p data-kind="speaker" data-numbering="counted" data-every="2" data-side="right" data-from="1">Nurse</p>' +
        '<p data-kind="line" data-numbering="counted" data-every="2" data-side="right" data-from="1">' +
        'If only the Argo' +
        BR +
        '<span class="line-number" data-n="2"></span>had never flown' +
        BR +
        '<span class="linemark" data-uncounted data-margin="ia."></span>through the dark' +
        BR +
        'Clashing Rocks</p>',
    );
  });

  it('counts every fifth where the stretch does not say, across paragraphs, and shows no hidden number', () => {
    const stretch = { indent: 0, numbering: 'counted' as const, from: '1' };
    const lines = (n: number): Inline[] =>
      Array.from({ length: n }, (_, i) => [br, t(`l${i}`)])
        .flat()
        .slice(1);
    const html = blocksHtml([
      paragraph(lines(3), 'line', stretch),
      paragraph([t('aside')], 'direction', stretch),
      paragraph([...lines(2), br, linemark({ hidden: true }), t('held')], 'line', stretch),
      paragraph([t('after')], 'line', 0),
    ]);
    // The count begins from 1, which does not divide by five and stands on no page.
    expect(html.match(/data-n="[^"]*"/g)).toEqual(['data-n="5"']);
    expect(html).toContain('<span class="line-number" data-n="5"></span>l1');
    expect(html).toContain(`${BR}<span class="linemark" data-hidden></span>held</p>`);
    expect(html).toContain('<p data-kind="line">after</p>');
  });

  it('draws breaks, and lists nested by their indent, an item given a number keeping it', () => {
    const html = blocksHtml([
      paragraph([t('one')], 'item'),
      paragraph([linemark({ number: '3' }), t('three')], 'numbered', 1),
      paragraph([t('two')], 'item'),
      pagebreak('column'),
      paragraph([t('again')], 'item'),
      paragraph([t('anew')], 'item', { indent: 0, new: true }),
    ]);
    expect(html).toBe(
      '<ul><li><p data-kind="item">one</p>' +
        '<ol><li value="3"><p data-kind="numbered" data-indent="1" style="--indent: 1" data-number="3">' +
        '<span class="linemark" data-number="3"></span>three</p></li></ol>' +
        '</li><li><p data-kind="item">two</p></li></ul>' +
        '<div class="pagebreak" data-what="column"></div>' +
        '<ul><li><p data-kind="item">again</p></li></ul>' +
        '<ul><li><p data-kind="item" data-new>anew</p></li></ul>',
    );
  });

  it('draws points to tick as points of a list, ticked where they are', () => {
    const html = blocksHtml([
      paragraph([t('open')], 'todo'),
      paragraph([t('ticked')], 'todo', { indent: 0, done: true }),
      paragraph([t('within')], 'todo', { indent: 1 }),
      paragraph([t('a point')], 'item'),
    ]);
    expect(html).toBe(
      '<ul><li><p data-kind="todo">open</p></li>' +
        '<li><p data-kind="todo" data-done>ticked</p>' +
        '<ul><li><p data-kind="todo" data-indent="1" style="--indent: 1">within</p></li></ul></li>' +
        '<li><p data-kind="item">a point</p></li></ul>',
    );
  });

  it('gives each point of a numbered list its number, counting on from one given by hand', () => {
    const html = blocksHtml([
      paragraph([t('first')], 'numbered'),
      paragraph([t('said of it')], 'text', 1),
      paragraph([linemark({ number: '2' }), t('second')], 'numbered'),
      paragraph([t('third')], 'numbered'),
    ]);
    expect(html.match(/data-number="\d+">(?:<span[^>]*><\/span>)?\w+/g)).toEqual([
      'data-number="1">first',
      'data-number="2"><span class="linemark" data-number="2"></span>second',
      'data-number="3">third',
    ]);
  });

  it('draws a box of rich text as a sheet around what stands in it, and one for each box', () => {
    const words = (text: string, name = 'text') =>
      paragraph([{ kind: 'text', text, marks: {} }], name);
    // Each sheet says its name beside what it holds, for the head it is drawn with.
    const sheet = '<div class="rich" data-rich data-rich-name="Rich text">';
    const html = blocksHtml([
      words('Before'),
      boxed(words('One'), 'first'),
      boxed(words('A point', 'item'), 'in'),
      // A point after the box is a list of its own.
      words('A point outside', 'item'),
      boxed(words('Two'), 'first'),
      boxed(words('Three'), 'first'),
    ]);
    expect(html).toBe(
      '<p>Before</p>' +
        `${sheet}<p>One</p><ul><li><p data-kind="item">A point</p></li></ul></div>` +
        '<ul><li><p data-kind="item">A point outside</p></li></ul>' +
        `${sheet}<p>Two</p></div>` +
        `${sheet}<p>Three</p></div>`,
    );
  });

  it('draws what is set by hand in rich text as the editor draws it', () => {
    const html = blocksHtml([
      boxed(
        paragraph(
          [
            t('Plain '),
            t('set', {
              font: { family: 'EB Garamond' },
              size: { pt: 20 },
              colour: { value: '#a02020' },
            }),
          ],
          'text',
          { indent: 0, hand: { align: 'center', spaceAfter: '12pt' } },
        ),
        'first',
      ),
    ]);
    const root = document.createElement('div');
    root.innerHTML = html;
    const p = root.querySelector('p')!;
    expect(JSON.parse(p.dataset.hand!)).toEqual({ align: 'center', spaceAfter: '12pt' });
    expect(p.style.textAlign).toBe('center');
    expect(p.getAttribute('style')).toContain('padding-bottom: calc(');
    const font = root.querySelector<HTMLElement>('span[data-font]')!;
    expect(font.dataset.font).toBe('EB Garamond');
    expect(font.style.fontFamily).toBe('"EB Garamond"');
    expect(root.querySelector<HTMLElement>('span[data-size]')!.getAttribute('style')).toBe(
      'font-size: calc(var(--text-size, 17px) * 20 / var(--hand-base, 11))',
    );
    expect(root.querySelector<HTMLElement>('span[data-colour]')!.dataset.colour).toBe('#a02020');
    expect(p.textContent).toBe('Plain set');
  });

  it('says of a heading of rich text that it is one, for the style sheet', () => {
    const html = blocksHtml([
      boxed(paragraph([t('Title')], 'text', { indent: 0, hand: { heading: 2 } }), 'first'),
      boxed(paragraph([t('Text')]), 'in'),
    ]);
    const root = document.createElement('div');
    root.innerHTML = html;
    const [title, text] = Array.from(root.querySelectorAll('p'));
    expect(title.dataset.heading).toBe('2');
    expect(title.style.textIndent).toBe('0px');
    expect(text.dataset.heading).toBeUndefined();
  });

  it('cuts a text at a block, a break taking no room', () => {
    const { blocks, cut } = excerpt([pagebreak(), paragraph([t('a'.repeat(50))])], 60);
    expect(blocks).toHaveLength(2);
    expect(cut).toBe(false);
  });
});
