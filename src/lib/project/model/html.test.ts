import { describe, expect, it } from 'vitest';
import { blocksHtml, excerpt } from './html';
import { linemark, pagebreak, paragraph, type Inline, type ParagraphBlock } from './text';

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const br: Inline = { kind: 'break' };
const BR = '<span class="hard-break"><br></span>';

describe('a text as HTML', () => {
  it('draws a numbered stanza with a speaker: its lines parted, a number before each line that shows one', () => {
    const stretch: Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side'> = {
      indent: 0,
      numbering: 'counted',
      every: 2,
      side: 'right',
    };
    const html = blocksHtml([
      paragraph([t('Nurse')], 'speaker', stretch),
      paragraph(
        [
          linemark({ number: '1' }),
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
      '<p data-kind="speaker" data-numbering="counted" data-every="2" data-side="right">Nurse</p>' +
        '<p data-kind="line" data-numbering="counted" data-every="2" data-side="right">' +
        '<span class="line-number" data-n="1" data-n-set></span>' +
        '<span class="linemark" data-number="1"></span>If only the Argo' +
        BR +
        '<span class="line-number" data-n="2"></span>had never flown' +
        BR +
        '<span class="linemark" data-uncounted data-margin="ia."></span>through the dark' +
        BR +
        'Clashing Rocks</p>',
    );
  });

  it('counts every fifth where the stretch does not say, across paragraphs, and shows no hidden number', () => {
    const stretch = { indent: 0, numbering: 'counted' as const };
    const lines = (n: number): Inline[] =>
      Array.from({ length: n }, (_, i) => [br, t(`l${i}`)])
        .flat()
        .slice(1);
    const html = blocksHtml([
      paragraph([linemark({ number: '1' }), ...lines(3)], 'line', stretch),
      paragraph([t('aside')], 'direction', stretch),
      paragraph([...lines(2), br, linemark({ hidden: true }), t('held')], 'line', stretch),
      paragraph([t('after')], 'line', 0),
    ]);
    expect(html.match(/data-n="[^"]*"/g)).toEqual(['data-n="1"', 'data-n="5"']);
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
        '<ol><li value="3"><p data-kind="numbered" data-indent="1" style="--indent: 1">' +
        '<span class="linemark" data-number="3"></span>three</p></li></ol>' +
        '</li><li><p data-kind="item">two</p></li></ul>' +
        '<div class="pagebreak" data-what="column"></div>' +
        '<ul><li><p data-kind="item">again</p></li></ul>' +
        '<ul><li><p data-kind="item" data-new>anew</p></li></ul>',
    );
  });

  it('cuts a text at a block, a break taking no room', () => {
    const { blocks, cut } = excerpt([pagebreak(), paragraph([t('a'.repeat(50))])], 60);
    expect(blocks).toHaveLength(2);
    expect(cut).toBe(false);
  });
});
