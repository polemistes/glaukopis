import { describe, expect, it } from 'vitest';
import type { Block, Inline } from '$lib/project/model/text';
import type { PassageKindRecord } from '$lib/project/model/types';
import { br, everything, mark, p, t, trapBlocks, TRAPS } from './fixtures';
import { normalInlines } from './inline';
import { readBlocks, readProject } from './read';
import type { OrgProject } from './types';
import { writeBlocks, writeProject } from './write';

/** Blocks as the Org form holds them: empty paragraphs dropped, as Org has none, and words in their plain form. */
function normal(blocks: readonly Block[]): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.kind === 'paragraph') {
      const content = normalInlines(b.content);
      if (content.length || b.name === 'break') out.push({ ...b, content });
    } else if (b.kind === 'table')
      out.push({
        ...b,
        caption: normalInlines(b.caption),
        rows: b.rows.map((r) => r.map((c) => ({ ...c, content: normal(c.content) }))),
      });
    else if (b.kind === 'figure') out.push({ ...b, caption: normalInlines(b.caption) });
    else if (b.kind === 'row') out.push({ ...b, items: normal(b.items) });
    else if (b.kind === 'parallel')
      out.push({ ...b, left: normal(b.left), right: normal(b.right) });
    else out.push(b);
  }
  return out;
}

function normalProject(p: OrgProject): OrgProject {
  return {
    ...p,
    elements: p.elements.map((e) => ({
      ...e,
      name: normalInlines(e.name),
      blocks: normal(e.blocks),
    })),
  };
}

const own: PassageKindRecord[] = [
  { id: 'k1', name: "Ship's name", family: 'words', basedOn: 'title', look: {}, order: 'a' },
  { id: 'k2', name: 'Letter', family: 'paragraph', basedOn: 'quote', look: {}, order: 'b' },
  { id: 'k3', name: 'Log', family: 'paragraph', basedOn: 'text', look: {}, order: 'c' },
];

/** Writes blocks, checks that they read back as they were, and gives the lines. */
function written(blocks: Block[], options: Parameters<typeof writeBlocks>[1] = {}): string {
  const text = writeBlocks(blocks, options);
  expect(readBlocks(text, options)).toEqual(normal(blocks));
  return text;
}

const lines = (...ls: string[]) => `${ls.join('\n')}\n`;

describe('the Org form of a project', () => {
  it('reads back the project that uses everything as it was', () => {
    const project = everything();
    const text = writeProject(project);
    expect(readProject(text, project.references)).toEqual(normalProject(project));
    // And writes what it read the same again.
    expect(writeProject(readProject(text, project.references))).toBe(text);
  });

  it('writes the file, the project headline with its drawers, and an element under it', () => {
    const text = writeProject(everything());
    expect(
      text.startsWith(
        '#+TITLE: Medea\n#+LANGUAGE: en-GB\n#+BIBLIOGRAPHY: references.bib\n\n* Medea\n:PROPERTIES:\n:ID:           project\n',
      ),
    ).toBe(true);
    expect(text).toContain(
      lines(
        ':ELEMENT_KINDS:',
        '- Character :: id=k-char colour=blue begins=line order=a0 template="Who they are.\\n\\nWhat they want."',
        '- Scene :: id=k-scene colour=green based-on=chapter order=a1',
      ),
    );
    expect(text).toContain(
      lines(
        ':PARAGRAPH_KINDS:',
        '- Letter :: id=own-letter based-on=quote order=b0 indent-left=1cm italic=yes',
        "- Ship's name :: id=own-ship words based-on=title order=b1 bold=no case=smallcaps",
      ),
    );
    expect(text).toContain(
      '- Numbered :: id=own-numbered based-on=epigraph order=b3 slug=numbered-2\n',
    );
    expect(text).toContain('#+BEGIN_SRC json :template play\n{\n  "id": "play",');
    expect(text).toContain(
      lines(
        '** The /prologue/ of [Medea]{sc}^{2} :noexport:',
        ':PROPERTIES:',
        ':ID:           scene1',
        ':KIND:         Scene',
        ':STATUS:       draft',
        ':WHEN:         {"start":{"at":"431 BC","approx":true,"margin":"5 years"},"end":{"after":"scene2"}}',
        ':HEADING:      no',
        ':ORIGIN:       old1',
        ':POS:          120,-40',
        ':COLLAPSED:    t',
        ':LINKS:        [[id:kinds][answers]] [[id:blocks]]',
        ':TITLE:        ""',
      ),
    );
    expect(text).toContain(
      ':AUTHORS:      Euripides; Ann Smith / University of Oslo <ann@example.org> orcid=0000-0001-2345-6789\n',
    );
    expect(text).toContain(':IDENTIFIERS:  isbn=978-3-16-148410-0 doi="10.1000/xyz 1"\n');
    expect(text).toContain(':LINE_NUMBERS: t\n');
    expect(text).toContain(
      ':LOOK:         {"font":{"family":"EB Garamond"},"kinds":{"quote":{"italic":null}}}\n',
    );
    expect(text).toContain('*** Kinds\n:PROPERTIES:\n:ID:     kinds\n:KIND:   Character\n');
    expect(text).toContain('** \\TODO Buy milk :work\\:\n');
    expect(text).toContain('*** \\[#A] * star :a:b\\:\n');
    expect(text).toContain('*** \\COMMENT this\n');
  });

  it('writes comments in a drawer, answers under them, a settled thread so marked', () => {
    const text = writeProject(everything());
    expect(text).toContain(
      lines(
        ':COMMENTS:',
        '- [2026-10-12 Robert] on "gods before men": Is this Nagy\'s phrase?',
        '  - [2026-10-13 Anna Berg] Yes, Best of the Achaeans, p. 73. (settled)',
        '- [2026-10-12 Robert] A note on the scene,',
        '    \\- on two lines',
        '    \\:END:',
        '    \\\\ and more \\(settled)',
        ':END:',
      ),
    );
  });

  it('writes the kind of an element by its id where its name is another kind’s as well', () => {
    const project = everything();
    project.elements[6].kind = 'k-twin2';
    const text = writeProject(project);
    expect(text).toMatch(/\n:KIND: +k-twin2\n/);
    expect(readProject(text, project.references).elements[6].kind).toBe('k-twin2');
  });
});

describe('the Org form of a text', () => {
  it('writes verse with speakers, directions, a stanza gap and what is said of its lines', () => {
    const S = { numbering: 'counted' as const, every: 5, side: 'right' as const };
    expect(
      written([
        p([t('Nurse')], 'speaker', S),
        p(
          [
            mark({ number: '1' }),
            t('If only the Argo had never flown'),
            br,
            mark({ indent: 1, number: '1234' }),
            t('to the land of Colchis,'),
            br,
            mark({ counted: false }),
            t('nor the pine been felled'),
            br,
            mark({ hidden: true }),
            t('in the glens of Pelion.'),
          ],
          'line',
          S,
        ),
        p([t('She weeps.')], 'direction', S),
        p(
          [
            mark({ margin: 'ia. trim.', number: '45', counted: false }),
            t('had taken oars in hand'),
          ],
          'line',
          S,
        ),
        p([t('A second stanza.')], 'line', S),
      ]),
    ).toBe(
      lines(
        '#+ATTR_GLAUKOPIS: :numbering counted :every 5 :side right',
        '#+BEGIN_VERSE',
        '@ Nurse',
        'If only the Argo had never flown {1}',
        '  to the land of Colchis, {1234}',
        'nor the pine been felled {-}',
        'in the glens of Pelion. {~}',
        '> She weeps.',
        'had taken oars in hand {45 - | ia. trim.}',
        '',
        'A second stanza.',
        '#+END_VERSE',
      ),
    );
  });

  it('wraps a stretch of more than one block, and says the settings of one block before it', () => {
    const S = { numbering: 'given' as const, every: 2, side: 'left' as const };
    expect(written([p([t('Prose')], 'text', S), p([t('Verse')], 'line', S)])).toBe(
      lines(
        '#+ATTR_GLAUKOPIS: :numbering given :every 2 :side left',
        '#+BEGIN_numbered',
        'Prose',
        '',
        '#+BEGIN_VERSE',
        'Verse',
        '#+END_VERSE',
        '#+END_numbered',
      ),
    );
    expect(written([p([t('Alone')], 'text', { numbering: 'counted' })])).toBe(
      lines('#+ATTR_GLAUKOPIS: :numbering counted', 'Alone'),
    );
  });

  it('says the language of a whole paragraph before it, and of some words in the line', () => {
    expect(
      written([
        p([t('Gallia est omnis divisa', { lang: { tag: 'la' } })]),
        p([t('Some '), t('Wörter', { lang: { tag: 'de' } })]),
        p([t('Arma', { lang: { tag: 'la' } })], 'quote'),
        p([t('virumque', { lang: { tag: 'la' } })], 'quote'),
      ]),
    ).toBe(
      lines(
        '#+ATTR_GLAUKOPIS: :lang la',
        'Gallia est omnis divisa',
        '',
        'Some [Wörter]{lang=de}',
        '',
        '#+ATTR_GLAUKOPIS: :lang la',
        '#+BEGIN_QUOTE',
        'Arma',
        '',
        'virumque',
        '#+END_QUOTE',
      ),
    );
  });

  it("writes Org's marks, and the bracket form for what Org cannot say", () => {
    expect(
      written(
        [
          p([
            t('bold', { strong: true }),
            t(' '),
            t('italic', { em: true }),
            t(' '),
            t('under', { underline: true }),
            t(' '),
            t('struck', { strike: true }),
            t(' '),
            t('code', { code: true }),
            t(' x'),
            t('2', { sup: true }),
            t(' H'),
            t('2', { sub: true }),
            t('O '),
            t('words', { link: { href: 'https://example.org' } }),
            t(' '),
            t('Small', { smallcaps: true }),
            t(' '),
            t('λόγος', { kind: { name: 'foreign', lang: 'grc' } }),
            t(' '),
            t('Iliad', { kind: { name: 'title', lang: '' } }),
            t(' '),
            t('kleos', { kind: { name: 'term', lang: '' } }),
            t(' '),
            t('word', { kind: { name: 'mention', lang: '' } }),
            t(' '),
            t('words', { kind: { name: 'highlight', lang: '' } }),
            t(' '),
            t('Me.', { kind: { name: 'speaker', lang: '' } }),
            t(' '),
            t('aside', { kind: { name: 'direction', lang: '' } }),
            t(' '),
            t('Argo', { kind: { name: 'k1', lang: '' } }),
            t(' '),
            t('Hom', { em: true }),
            t('eric '),
            t('Nagy 1979, 73', {
              found: {
                id: 'f1',
                by: 'key',
                items: [{ key: 'nagy1979' }],
                mode: 'normal',
                left: false,
              },
            }),
          ]),
        ],
        { paragraphKinds: own },
      ),
    ).toBe(
      lines(
        '*bold* /italic/ _under_ +struck+ ~code~ x^{2} H_{2}O [[https://example.org][words]] [Small]{sc} [λόγος]{foreign lang=grc} [Iliad]{title} [kleos]{term} [word]{mention} [words]{highlight} [Me.]{speaker} [aside]{direction} [Argo]{ships-name} [Hom]{em}eric [Nagy 1979, 73]{found key=nagy1979 id=f1 by=key items=[{"key":"nagy1979"}]}',
      ),
    );
  });

  it('writes citations as org-cite, notes, formulas, reference marks and cross-references', () => {
    const refs = [
      { id: 'r1', key: 'nagy1979' },
      { id: 'r2', key: 'west2001' },
    ].map((r) => ({
      ...r,
      type: 'book',
      fields: {},
      names: {},
      modified: '',
      authors: '',
      year: '',
      title: '',
      container: '',
    }));
    const targets = new Map<string, 'fig' | 'tab' | 'eq'>([
      ['hull', 'fig'],
      ['crew', 'tab'],
      ['euler', 'eq'],
    ]);
    const content: Inline[] = [
      {
        kind: 'citation',
        mode: 'normal',
        items: [{ id: 'r1', prefix: 'see', locator: '73', suffix: 'for the phrase' }, { id: 'r2' }],
      },
      t(' '),
      { kind: 'citation', mode: 'intext', items: [{ id: 'r1' }] },
      t(' '),
      {
        kind: 'citation',
        mode: 'normal',
        items: [{ id: 'r1', suppressAuthor: true, label: 'chapter', locator: '3' }],
      },
      t(' '),
      { kind: 'citation', mode: 'normal', items: [{ id: 'r2', label: 'line', locator: '45' }] },
      t(' '),
      { kind: 'footnote', content: [t('So Nagy, who is not alone.')] },
      { kind: 'footnote', content: [t('So Nagy.')], place: 'end' },
      { kind: 'footnote', content: [t('At the foot.')], place: 'foot' },
      t(' '),
      { kind: 'math', tex: 'e^{i\\pi}' },
      t(' in the line '),
      { kind: 'refmark', label: '1:1' },
      t(' See '),
      { kind: 'crossref', target: 'hull', form: 'full' },
      t(', figure '),
      { kind: 'crossref', target: 'hull', form: 'number' },
      t(', '),
      { kind: 'crossref', target: 'crew', form: 'name' },
      t(', '),
      { kind: 'crossref', target: 'euler', form: 'full' },
      t(' and '),
      { kind: 'crossref', target: '4KP9IEtvBUMv', form: 'name' },
      t('.'),
    ];
    expect(written([p(content)], { references: refs, targets })).toBe(
      lines(
        '[cite:see @nagy1979 73 for the phrase; @west2001] [cite/t:@nagy1979] [cite:-@nagy1979 ch. 3] [cite:@west2001 l. 45] [fn::So Nagy, who is not alone.][fn::@end So Nagy.][fn::@foot At the foot.] $e^{i\\pi}$ in the line {#1:1} See [[fig:hull]], figure [[fig:hull][n]], [[tab:crew][name]], [[eq:euler]] and [[id:4KP9IEtvBUMv][name]].',
      ),
    );
    // A locator of pages that the record writes with its word reads back as pages.
    expect(
      readBlocks('[cite:see @nagy1979 p. 73 for the phrase; @west2001]', { references: refs }),
    ).toEqual([
      p([
        {
          kind: 'citation',
          mode: 'normal',
          items: [
            { id: 'r1', prefix: 'see', locator: '73', suffix: 'for the phrase' },
            { id: 'r2' },
          ],
        },
      ]),
    ]);
  });

  it('writes what is said of a line at its end, with its indent in the braces outside verse', () => {
    expect(
      written([
        p([
          mark({ number: '12', indent: 2, margin: 'note' }),
          t('Prose'),
          br,
          mark({ hidden: true }),
          t('more'),
        ]),
      ]),
    ).toBe(lines('Prose {12 > 2 | note} \\\\', 'more {~}'));
  });

  it('writes speakers and directions on lines of their own, and every other kind as a block of its name', () => {
    expect(
      written(
        [
          p([t('Of making many books')], 'epigraph'),
          p([t('Ecclesiastes')], 'attribution'),
          p([t('JASON')], 'character'),
          p([t('We sail.')], 'dialogue'),
          p([t('MEDEA')], 'speaker'),
          p([t('Then I go.')], 'dialogue'),
          p([t('Exit.')], 'direction'),
          p([t('Day one.')], 'k3'),
          p([t('Dear Jason,')], 'k2'),
        ],
        { paragraphKinds: own },
      ),
    ).toBe(
      lines(
        '#+BEGIN_epigraph',
        'Of making many books',
        '#+END_epigraph',
        '',
        '#+BEGIN_attribution',
        'Ecclesiastes',
        '#+END_attribution',
        '',
        '#+BEGIN_character',
        'JASON',
        '#+END_character',
        '',
        '#+BEGIN_dialogue',
        'We sail.',
        '',
        '@ MEDEA',
        '',
        'Then I go.',
        '#+END_dialogue',
        '',
        '> Exit.',
        '',
        '#+BEGIN_log',
        'Day one.',
        '#+END_log',
        '',
        '#+ATTR_GLAUKOPIS: :kind letter',
        '#+BEGIN_QUOTE',
        'Dear Jason,',
        '#+END_QUOTE',
      ),
    );
  });

  it('writes lists nested by two spaces, a number given as a counter, and a glossary as a description list', () => {
    expect(
      written([
        p([t('An item')], 'item'),
        p([t('Nested')], 'item', { indent: 1 }),
        p([mark({ number: '5' }), t('Five')], 'numbered', { indent: 1 }),
        p([t('Six')], 'numbered', { indent: 1 }),
        p([t('Back'), br, t('on two lines')], 'item'),
        p([t('Argo')], 'headword'),
        p([t('The ship in which Jason sailed.')], 'gloss'),
        p([t('A second paragraph of the gloss.')], 'gloss'),
        p([t('Colchis')], 'headword'),
      ]),
    ).toBe(
      lines(
        '- An item',
        '  - Nested',
        '  5. [@5] Five',
        '  6. Six',
        '- Back \\\\',
        '  on two lines',
        '',
        '- Argo :: The ship in which Jason sailed.',
        '',
        '  A second paragraph of the gloss.',
        '- Colchis ::',
      ),
    );
  });

  it('writes code as a source block, a break, a draft as a comment', () => {
    expect(
      written([
        p([t('def f(x):')], 'code'),
        p([t('    return x * 2')], 'code'),
        p([t('* not a headline')], 'code'),
        p([], 'break'),
        p([t('Not for the document.')], 'draft'),
      ]),
    ).toBe(
      lines(
        '#+BEGIN_SRC',
        'def f(x):',
        '    return x * 2',
        ',* not a headline',
        '#+END_SRC',
        '',
        '-----',
        '',
        '#+BEGIN_COMMENT',
        'Not for the document.',
        '#+END_COMMENT',
      ),
    );
  });

  it('escapes a code line that looks like a headline after its indentation, as Org does', () => {
    expect(
      written([
        p([t('    * a comment-ish line')], 'code'),
        p([t('  #+not a keyword')], 'code'),
        p([t('  ,* once escaped')], 'code'),
        p([t(', * a comma, then a star')], 'code'),
        p([t('  , * left alone')], 'code'),
      ]),
    ).toBe(
      lines(
        '#+BEGIN_SRC',
        '    ,* a comment-ish line',
        '  ,#+not a keyword',
        '  ,,* once escaped',
        ',, * a comma, then a star',
        '  , * left alone',
        '#+END_SRC',
      ),
    );
  });

  it('reads a code line escaped before its indentation, as earlier versions wrote it', () => {
    expect(
      readBlocks(lines('#+BEGIN_SRC', ',    * a comment-ish line', ',  #+not a keyword', '#+END_SRC')),
    ).toEqual(normal([p([t('    * a comment-ish line')], 'code'), p([t('  #+not a keyword')], 'code')]));
  });

  it('closes and opens the block where a paragraph begins a new run', () => {
    expect(
      written([
        p([t('One')], 'quote'),
        p([t('Two')], 'quote', { new: true }),
        p([t('Three')], 'item'),
        p([t('Four')], 'item', { new: true }),
        p([t('Five')], 'text', { new: true }),
      ]),
    ).toBe(
      lines(
        '#+BEGIN_QUOTE',
        'One',
        '#+END_QUOTE',
        '',
        '#+BEGIN_QUOTE',
        'Two',
        '#+END_QUOTE',
        '',
        '- Three',
        '',
        '#+ATTR_GLAUKOPIS: :new t',
        '- Four',
        '',
        '#+ATTR_GLAUKOPIS: :new t',
        'Five',
      ),
    );
  });

  it('writes figures, formulas, tables, rows, breaks and texts side by side', () => {
    const figure: Block = {
      kind: 'figure',
      id: 'hull',
      align: 'right',
      wrap: true,
      file: '3f9ac2',
      extension: 'png',
      name: 'hull.png',
      caption: [t('The hull of the Argo')],
      alt: 'A drawing of a hull',
      width: 60,
      numbered: false,
    };
    expect(
      written([
        figure,
        { kind: 'equation', id: 'euler', tex: 'e^{i\\pi} + 1 = 0', numbered: true },
        { kind: 'equation', id: '', tex: 'x = 1', numbered: false, align: 'left' },
        {
          kind: 'table',
          id: 'crew',
          caption: [t('The crew by rank')],
          rows: [
            [
              { content: [p([t('Rank')])], colspan: 1, rowspan: 1, header: true },
              { content: [p([t('Name')])], colspan: 1, rowspan: 1, header: true },
            ],
            [
              { content: [p([t('Helmsman')])], colspan: 1, rowspan: 1, header: false },
              { content: [p([t('Tiphys')])], colspan: 1, rowspan: 1, header: false },
            ],
          ],
          numbered: true,
          width: 0,
        },
        {
          kind: 'row',
          items: [
            { ...figure, id: 'a', caption: [] },
            { kind: 'equation', id: 'b', tex: 'y', numbered: true },
          ],
        },
        { kind: 'break', what: 'page' },
        { kind: 'break', what: 'column' },
        {
          kind: 'parallel',
          left: [p([t('Μῆνιν ἄειδε')], 'line')],
          right: [p([t('Sing, goddess')], 'line')],
        },
      ]),
    ).toBe(
      lines(
        '#+CAPTION: The hull of the Argo',
        '#+NAME: fig:hull',
        '#+ATTR_GLAUKOPIS: :width 60 :align right :wrap t :alt "A drawing of a hull" :file-name hull.png :numbered nil',
        '[[file:pictures/3f9ac2.png]]',
        '',
        '#+NAME: eq:euler',
        '\\begin{equation} e^{i\\pi} + 1 = 0 \\end{equation}',
        '',
        '#+ATTR_GLAUKOPIS: :align left',
        '\\[ x = 1 \\]',
        '',
        '#+CAPTION: The crew by rank',
        '#+NAME: tab:crew',
        '| Rank     | Name   |',
        '|----------+--------|',
        '| Helmsman | Tiphys |',
        '',
        '#+BEGIN_row',
        '#+NAME: fig:a',
        '#+ATTR_GLAUKOPIS: :width 60 :align right :wrap t :alt "A drawing of a hull" :file-name hull.png :numbered nil',
        '[[file:pictures/3f9ac2.png]]',
        '',
        '#+NAME: eq:b',
        '\\begin{equation} y \\end{equation}',
        '#+END_row',
        '',
        '#+BREAK: page',
        '',
        '#+BREAK: column',
        '',
        '#+BEGIN_parallel',
        '#+BEGIN_left',
        '#+BEGIN_VERSE',
        'Μῆνιν ἄειδε',
        '#+END_VERSE',
        '#+END_left',
        '#+BEGIN_right',
        '#+BEGIN_VERSE',
        'Sing, goddess',
        '#+END_VERSE',
        '#+END_right',
        '#+END_parallel',
      ),
    );
  });

  it('writes a table whose cells span and hold paragraphs as a grid table, and reads it back', () => {
    const c = (content: Block[], more = {}) => ({
      content,
      colspan: 1,
      rowspan: 1,
      header: false,
      ...more,
    });
    const table: Block = {
      kind: 'table',
      id: '',
      caption: [],
      rows: [
        [c([p([t('Heading')])], { header: true }), c([p([t('Heading')])], { header: true })],
        [
          c([p([t('A cell of'), br, t('two lines')])]),
          c([p([t('spans two')]), p([t('rows')])], { rowspan: 2 }),
        ],
        [c([p([t('another')])])],
        [c([p([t('across both')])], { colspan: 2 })],
      ],
      numbered: true,
      width: 0,
    };
    expect(written([table])).toBe(
      lines(
        '+--------------+-----------+',
        '| Heading      | Heading   |',
        '+==============+===========+',
        '| A cell of \\\\ | spans two |',
        '| two lines    |           |',
        '+--------------+ rows      |',
        '| another      |           |',
        '+--------------+-----------+',
        '| across both              |',
        '+--------------------------+',
      ),
    );
  });

  it('reads back a text made of nothing but words that look like signs', () => {
    const blocks = trapBlocks();
    const text = writeBlocks(blocks);
    expect(readBlocks(text)).toEqual(normal(blocks));
    // Every trap is written with a backslash where it would read as a sign.
    for (const trap of [
      '@ Not a speaker',
      '* Not a headline',
      '#+TITLE: not a keyword',
      '| not | a table |',
    ])
      expect(text).toContain(
        `\n${trap.startsWith('#') ? '#\\+TITLE: not a keyword' : `\\${trap}`}\n`,
      );
    expect(TRAPS.length).toBeGreaterThan(40);
  });
});

describe('reading an Org file written by hand', () => {
  const file = [
    '#+TITLE: Notes',
    '#+AUTHOR: Someone',
    '#+TODO: TODO WAIT | DONE',
    '#+STARTUP: overview',
    '',
    'Some words before the first headline,',
    'on two lines.',
    '',
    '* TODO [#B] A task :work:noexport:',
    'SCHEDULED: <2026-10-12 Mon>',
    ':PROPERTIES:',
    ':ID:       task-1',
    ':CUSTOM:   kept',
    ':END:',
    ':LOGBOOK:',
    '- Note taken on [2026-10-12 Mon 10:00]',
    ':END:',
    'A paragraph with a bare',
    'newline, *bold* and /italic/ words.',
    '',
    '#+BEGIN_aside',
    'In a block of a name not known.',
    '#+END_aside',
    '',
    '#+UNKNOWN: a keyword line',
    '#+BEGIN_EXAMPLE',
    'literal *text*',
    '#+END_EXAMPLE',
    '',
    '# A comment line',
    '',
    '- an item',
    '- [ ] a box',
    '',
    '| a | b |',
    '|---+---|',
    '| 1 | 2 |',
    '** WAIT Sub heading',
    'Text with \\alpha, a [[https://example.org][link]] and [fn:1].',
    '',
    '#+BEGIN_SRC python',
    'print(1)',
    '#+END_SRC',
  ].join('\n');

  it('reads without losing words', () => {
    const org = readProject(file);
    expect(org.title).toBe('Notes');
    const [project, task, sub] = org.elements;
    expect(project.id).toBe('project');
    expect(project.depth).toBe(0);
    expect(project.blocks).toEqual([p([t('Some words before the first headline, on two lines.')])]);
    expect(task.id).toBe('task-1');
    expect(task.depth).toBe(1);
    expect(task.excluded).toBe(true);
    expect(task.name).toEqual([t('A task')]);
    const drafts = task.blocks.filter((b) => b.kind === 'paragraph' && b.name === 'draft');
    const kept = drafts.map((b) =>
      b.kind === 'paragraph'
        ? b.content.map((i) => (i.kind === 'text' ? i.text : '\n')).join('')
        : '',
    );
    expect(kept).toEqual([
      'TODO\n[#B]\n:work:',
      'SCHEDULED: <2026-10-12 Mon>',
      ':PROPERTIES:\n:CUSTOM:   kept\n:END:',
      ':LOGBOOK:\n- Note taken on [2026-10-12 Mon 10:00]\n:END:',
      '# A comment line',
    ]);
    expect(task.blocks).toContainEqual(
      p([
        t('A paragraph with a bare newline, '),
        t('bold', { strong: true }),
        t(' and '),
        t('italic', { em: true }),
        t(' words.'),
      ]),
    );
    expect(task.blocks).toContainEqual(p([t('In a block of a name not known.')], 'own-aside'));
    expect(org.paragraphKinds).toEqual([
      {
        id: 'own-aside',
        name: 'aside',
        family: 'paragraph',
        basedOn: 'text',
        look: {},
        order: '0',
      },
    ]);
    expect(task.blocks).toContainEqual(p([t('literal *text*')], 'code'));
    expect(task.blocks).toContainEqual(p([t('an item')], 'item'));
    expect(task.blocks).toContainEqual(p([t('[ ] a box')], 'item'));
    expect(
      task.blocks.some((b) => b.kind === 'table' && b.rows.length === 2 && b.rows[0][0].header),
    ).toBe(true);
    expect(sub.depth).toBe(2);
    expect(sub.name).toEqual([t('Sub heading')]);
    expect(sub.blocks[0]).toEqual(p([t('WAIT')], 'draft'));
    expect(sub.blocks[1]).toEqual(
      p([
        t('Text with \\alpha, a '),
        t('link', { link: { href: 'https://example.org' } }),
        t(' and [fn:1].'),
      ]),
    );
    expect(sub.blocks[2]).toEqual(p([t('print(1)')], 'code'));
  });

  it('never fails on what it reads', () => {
    for (const bad of [
      '',
      '*',
      '* \n:PROPERTIES:\n:WHEN: {not json\n',
      '#+BEGIN_VERSE\nno end',
      '[[[[',
      '[cite:',
      '+--+\n| x',
      '\\',
      ':COMMENTS:\n- [',
      '#+ATTR_GLAUKOPIS: :headers [[ :aligns {',
      '- a :: b ::',
      '{> x}',
    ]) {
      expect(() => readProject(bad)).not.toThrow();
      expect(() => readBlocks(bad)).not.toThrow();
    }
  });

  it('reads signs that open and never close without reading them over and over', () => {
    const started = Date.now();
    for (const bad of [
      '['.repeat(2000),
      '[x '.repeat(1000),
      '*a /b _c +d [e '.repeat(300),
      '[[a]['.repeat(500),
    ])
      expect(readBlocks(bad)).toEqual([p([t(bad)])]);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('writes and reads a long text in good time', () => {
    const blocks: Block[] = [];
    for (let n = 0; n < 2000; n++)
      blocks.push(
        p(
          [
            t(`Paragraph ${n} with `),
            t('marks', { em: true }),
            t(' and [brackets] and a * star.'),
            br,
            t('A second line.'),
          ],
          n % 3 ? 'text' : 'line',
        ),
      );
    const started = Date.now();
    const text = writeBlocks(blocks);
    expect(readBlocks(text)).toEqual(normal(blocks));
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
