/**
 * A project that uses everything the Org form has, for the test that
 * writes it and reads it back; and a text made of nothing but words that
 * look like signs.
 */

import type { Template } from '$lib/api/templates';
import type {
  Block,
  Inline,
  InlineLineMark,
  ParagraphBlock,
  TableCell,
} from '$lib/project/model/text';
import type { OrgElement, OrgProject } from './types';

type Marks = Record<string, Record<string, unknown> | true>;

export const t = (text: string, marks: Marks = {}): Inline => ({ kind: 'text', text, marks });
export const br: Inline = { kind: 'break' };
export const mark = (said: Omit<InlineLineMark, 'kind'>): InlineLineMark => ({
  kind: 'linemark',
  ...said,
});

export function p(
  content: Inline[],
  name = 'text',
  more: Partial<
    Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side' | 'only' | 'new'>
  > = {},
): ParagraphBlock {
  return {
    kind: 'paragraph',
    name,
    indent: more.indent ?? 0,
    ...(more.numbering ? { numbering: more.numbering } : {}),
    ...(more.every ? { every: more.every } : {}),
    ...(more.side ? { side: more.side } : {}),
    ...(more.only ? { only: more.only } : {}),
    ...(more.new ? { new: true as const } : {}),
    content,
  };
}

const cell = (content: Block[], more: Partial<TableCell> = {}): TableCell => ({
  content,
  colspan: 1,
  rowspan: 1,
  header: false,
  ...more,
});

const lang = (tag: string) => ({ lang: { tag } });

/** Words that look like signs, every one of them, in prose. */
export const TRAPS: string[] = [
  '@ Not a speaker',
  '> Not a direction',
  '@',
  '* Not a headline',
  '** Nor this',
  '- Not an item',
  '+ Nor this',
  '-',
  '1. Not numbered',
  '2) Nor this',
  '#+TITLE: not a keyword',
  '#+END_QUOTE',
  '# not a comment',
  '| not | a table |',
  '+--+ not a grid',
  '+==+',
  ':PROPERTIES:',
  ': fixed width',
  ':END:',
  '-----',
  '*bold* /italic/ _under_ +struck+ ~code~ =verbatim=',
  'a*b*c and 2*3*4 and *, * and **',
  '[words]{sc} and [more]{title} and [x]{lang=de}',
  '[[https://example.org]] and [[fig:hull]] and [[id:x][n]]',
  '[cite:@nagy1979] and [cite/t:@west] and [fn::a note] and [fn:1]',
  '$x$ and $5 and 5$ and \\(y\\)',
  '{#1:1} and {45} and {-} and {| words} and {~}',
  '\\[ x \\]',
  '\\begin{equation} x \\end{equation}',
  '\\]',
  'a line that ends as a break \\\\',
  'back\\slash and \\alpha and \\\\ and \\* and \\\\\\',
  'ends with a backslash \\',
  'x^{2} and y_{3} and ^ and _',
  '  two spaces at the start',
  'two spaces at the end  ',
  'a :: b',
  '[@5] a counter',
  '[ ] a box',
  'TODO in the text',
  '[#A] a priority',
  'C:\\path\\*\\file',
  '* * *',
  '[[[nested]]]',
  '[a]] and [[b] and ]{x}',
  ']{sc}',
  '[',
  '\t a tab first',
  '@foot is not a place',
  'see [cite:prefix @key] here',
];

/** A paragraph of each trap, and the traps again as lines of one paragraph, of one verse, of a list, of a quotation. */
export function trapBlocks(): Block[] {
  const lines = (name: string, more = {}) =>
    p(
      TRAPS.flatMap((s, k) => (k ? [br, t(s)] : [t(s)])),
      name,
      more,
    );
  return [
    ...TRAPS.map((s) => p([t(s)])),
    lines('text'),
    lines('line'),
    lines('quote'),
    lines('item'),
    lines('numbered', { indent: 1 }),
    lines('headword'),
    lines('gloss'),
    lines('epigraph'),
    ...TRAPS.map((s) => p([t(s)], 'speaker')),
    ...TRAPS.map((s) => p([t('x'), { kind: 'footnote', content: [t(s)] }])),
    ...TRAPS.map((s) => p([t(s, { em: true })])),
    ...TRAPS.map((s) => p([t('a '), t(s, { smallcaps: true }), t(' b')])),
    ...TRAPS.map((s) => p([mark({ margin: s }), t(s)], 'line')),
    ...TRAPS.map((s) => p([mark({ number: s })], 'line')),
    // Words at the end of a line of verse that read as what is said of it.
    p([t('If only the Argo {45}'), br, t('{-}'), br, t('and {| words}')], 'line'),
  ];
}

const S = { numbering: 'counted' as const, every: 5, side: 'right' as const };

/** The verse, with everything said of its lines, numbered through speakers and stanzas. */
const verse: Block[] = [
  p([t('Nurse, '), t('τροφός', lang('grc'))], 'speaker', S),
  p(
    [
      mark({ number: '1' }),
      t('If only the '),
      t('Argo', { kind: { name: 'own-ship', lang: '' } }),
      t(' had never flown'),
      br,
      t('through the dark '),
      t('Clashing Rocks', { em: true }),
      br,
      mark({ number: '1234', indent: 1 }),
      t('to the land of Colchis,'),
      br,
      mark({ counted: false }),
      t('nor the pine been felled'),
      br,
      mark({ hidden: true, indent: 2 }),
      t('in the glens of Pelion.'),
    ],
    'line',
    S,
  ),
  p([t('She weeps.')], 'direction', S),
  p(
    [
      mark({ margin: 'ia. trim.' }),
      t('had taken oars in hand'),
      br,
      mark({
        number: '567a',
        counted: false,
        hidden: true,
        margin: 'a {braced} margin',
        indent: 3,
      }),
      t('for the men'),
      br,
      mark({ indent: 1 }),
      br,
      t('after an empty line'),
    ],
    'line',
    S,
  ),
  p(
    [
      t('A second stanza, '),
      t('Me.', { kind: { name: 'speaker', lang: '' } }),
      t(' and '),
      t('aside', { kind: { name: 'direction', lang: '' } }),
    ],
    'line',
    S,
  ),
  p([t('Chorus')], 'speaker', S),
  p([t('Medea'), br, t('and Jason')], 'speaker', S),
  p([t('after two speakers')], 'line', S),
  p([t('Prose in the stretch, counted.')], 'text', S),
  p([t('A quotation in the stretch.')], 'quote', S),
  p([t('Off stage.')], 'direction', S),
  // A stretch numbered only by the numbers given, on the left: one block.
  p([mark({ number: 'A' }), t('Given'), br, t('only')], 'line', {
    numbering: 'given',
    side: 'left',
  }),
  p([t('So it goes.')], 'line', { numbering: 'given', side: 'left' }),
  // A new run of verse.
  p([t('First run')], 'line'),
  p([t('Second run')], 'line', { new: true }),
  // Verse in another language, indented as an item was.
  p([t('Sing, goddess', lang('en')), br, t('the wrath', lang('en'))], 'line', { indent: 2 }),
  p([t('Only this is German', lang('de'))], 'line'),
  // A speaker who begins a new run.
  p([t('Jason')], 'speaker', { new: true }),
  p([t('Every how many, with no numbering')], 'text', { every: 3 }),
];

/** Every kind of paragraph and of words, every mark, every citation and note. */
const kinds: Block[] = [
  p([
    t('Every mark: '),
    t('italic', { em: true }),
    t(', '),
    t('bold', { strong: true }),
    t(', '),
    t('small capitals', { smallcaps: true }),
    t(', x'),
    t('2', { sup: true }),
    t(', H'),
    t('2', { sub: true }),
    t('O, '),
    t('struck', { strike: true }),
    t(', '),
    t('underlined', { underline: true }),
    t(', '),
    t('code', { code: true }),
    t(', '),
    t('a link', { link: { href: 'https://example.org/a_b?c=d' } }),
    t(', '),
    t('a link to a figure', { link: { href: 'fig:not-a-crossref' } }),
    t(', '),
    t('bold and italic', { strong: true, em: true }),
    t(', '),
    t('Hom', { em: true }),
    t('eric, '),
    t('λόγος', { kind: { name: 'foreign', lang: 'grc' } }),
    t(', '),
    t('Iliad', { kind: { name: 'title', lang: '' } }),
    t(', '),
    t('kleos', { kind: { name: 'term', lang: '' } }),
    t(', '),
    t('word', { kind: { name: 'mention', lang: '' } }),
    t(', '),
    t('marked', { kind: { name: 'highlight', lang: '' } }),
    t(', '),
    t('Titanic', { kind: { name: 'own-ship', lang: '' } }),
    t(', '),
    t('ein Wort', lang('de')),
    t(', '),
    t('mixed ', { strong: true }),
    t('nesting', { strong: true, em: true, smallcaps: true }),
    t(' here', { em: true }),
    t(', '),
    t('Nagy 1979, 73', {
      found: {
        id: 'f1',
        by: 'key',
        items: [{ key: 'nagy1979', locator: '73' }],
        mode: 'intext',
        left: false,
      },
    }),
    t(' and '),
    t('left as text', { found: { id: 'f2', by: 'form', items: [], mode: 'normal', left: true } }),
    t('.'),
  ]),
  p([t('A first line'), br, t('a second line'), br, br, t('after an empty one')]),
  p([t('Indented text.')], 'text', { indent: 1 }),
  p([t('Tout en français.', lang('fr'))]),
  p([t('A paragraph that begins a new run.')], 'text', { new: true }),
  p([
    t('Citations '),
    {
      kind: 'citation',
      mode: 'normal',
      items: [{ id: 'r1', prefix: 'see', locator: '73', suffix: 'for the phrase' }, { id: 'r2' }],
    },
    t(', '),
    { kind: 'citation', mode: 'intext', items: [{ id: 'r1' }] },
    t(', '),
    {
      kind: 'citation',
      mode: 'normal',
      items: [{ id: 'r2', suppressAuthor: true, locator: '3', label: 'chapter' }],
    },
    t(', '),
    { kind: 'citation', mode: 'normal', items: [{ id: 'r1', locator: '45 ff.', label: 'line' }] },
    t(', '),
    { kind: 'citation', mode: 'normal', items: [{ id: 'r1', locator: 'xii', label: 'section' }] },
    t(', '),
    { kind: 'citation', mode: 'normal', items: [{ id: 'r2', suffix: '2nd ed.' }] },
    t(', '),
    {
      kind: 'citation',
      mode: 'normal',
      items: [{ id: 'r2', prefix: 'cf.; also @ [this]', suffix: 'and p. 5; passim' }],
    },
    t(', '),
    {
      kind: 'citation',
      mode: 'normal',
      items: [{ id: 'unknown-ref', locator: 'iv', suffix: 'v. good' }],
    },
    t('.'),
  ]),
  p([
    t('Notes'),
    { kind: 'footnote', content: [t('A plain note.')] },
    t(', '),
    {
      kind: 'footnote',
      content: [
        t('So '),
        t('Nagy', { em: true }),
        t(', '),
        { kind: 'citation', mode: 'normal', items: [{ id: 'r1', locator: '73' }] },
      ],
      place: 'foot',
    },
    t(', '),
    { kind: 'footnote', content: [t('At the end,'), br, t('on two lines.')], place: 'end' },
    t(', formulas '),
    { kind: 'math', tex: 'e^{i\\pi} + 1 = 0' },
    t(' and '),
    { kind: 'math', tex: 'a$b' },
    t('x, a reference mark '),
    { kind: 'refmark', label: '3:16' },
    t(' and cross-references '),
    { kind: 'crossref', target: 'hull', form: 'full' },
    t(', '),
    { kind: 'crossref', target: 'hull', form: 'number' },
    t(', '),
    { kind: 'crossref', target: 'crew', form: 'name' },
    t(', '),
    { kind: 'crossref', target: 'euler', form: 'full' },
    t(', '),
    { kind: 'crossref', target: 'blocks', form: 'name' },
    t('.'),
  ]),
  p([t('Of making many books there is no end.')], 'epigraph'),
  p([t('Ecclesiastes')], 'attribution'),
  p([t('INT. THE SHIP — NIGHT')], 'scene'),
  p([t('Jason paces.')], 'action'),
  p([t('JASON')], 'character'),
  p([t('(quietly)')], 'parenthetical'),
  p([t('We sail at dawn.')], 'dialogue'),
  p([t('MEDEA')], 'speaker'),
  p([t('Then I go with you.')], 'dialogue'),
  p([t('CUT TO:')], 'transition'),
  p([t('Arma virumque cano', lang('la'))], 'quote'),
  p([t('Troiae qui primus ab oris', lang('la'))], 'quote'),
  p([t('Dear Jason,'), br, t('come home.')], 'own-letter'),
  p([t('Day one: calm seas.')], 'own-log'),
  p([t('A kind of our own named as a sign is.')], 'own-numbered'),
  p([t('Heave'), br, mark({ indent: 1 }), t('ho')], 'own-chant'),
  p([t('Argo')], 'headword'),
  p([t('The ship in which Jason sailed.')], 'gloss'),
  p([t('A second paragraph of the gloss.')], 'gloss'),
  p([t('Colchis')], 'headword'),
  p([t('Pelion')], 'headword'),
  p([t('A mountain, with '), t('two', { em: true }), t(' lines'), br, t('in its gloss.')], 'gloss'),
  p([t('Tiphys'), br, t('the helmsman')], 'headword'),
  p([t('Who steered.', lang('el'))], 'gloss'),
  p([t('An item')], 'item'),
  p([t('Nested')], 'item', { indent: 1 }),
  p([mark({ number: '5' }), t('Numbered from five')], 'numbered', { indent: 1 }),
  p([t('Six')], 'numbered', { indent: 1 }),
  p([t('An item on'), br, t('two lines')], 'item'),
  p([mark({ number: '7a', margin: 'm' }), t('Numbered by a label')], 'numbered'),
  p([t('A new list')], 'item', { new: true }),
  p([t('print("hello")')], 'code'),
  p([t('    return x * 2')], 'code'),
  p([t('#+not a keyword in code')], 'code'),
  p([t('code with '), t('bold', { strong: true }), br, t('and two lines')], 'code'),
  p([], 'break'),
  p([t('A draft that goes into no document.')], 'draft'),
  p([t('Numbered items')], 'item', { numbering: 'counted', every: 1 }),
  p([t('in a stretch')], 'item', { numbering: 'counted', every: 1 }),
];

const figureFull: Block = {
  kind: 'figure',
  id: 'hull',
  align: 'right',
  wrap: true,
  file: '3f9ac2',
  extension: 'png',
  name: 'hull drawing.png',
  caption: [t('The hull of the '), t('Argo', { em: true })],
  alt: 'A drawing of a "hull"',
  width: 60,
  numbered: false,
};

const figurePlain: Block = {
  kind: 'figure',
  id: 'mast',
  file: 'd41d8c',
  extension: 'jpg',
  name: '',
  caption: [],
  alt: '',
  width: 100,
  numbered: true,
};

const simpleTable: Block = {
  kind: 'table',
  id: 'crew',
  caption: [t('The crew by rank')],
  rows: [
    [cell([p([t('Rank')])], { header: true }), cell([p([t('Name')])], { header: true })],
    [cell([p([t('Helmsman')])]), cell([p([t('Tiphys')])])],
    [
      cell([p([t('Seer')])]),
      cell([p([t('Idmon'), { kind: 'footnote', content: [t('Who died.')] }])]),
    ],
    [cell([]), cell([p([t('Orpheus', { em: true })])], { align: 'center' })],
  ],
  numbered: true,
  width: 0,
};

const columnTable: Block = {
  kind: 'table',
  id: 'sides',
  caption: [],
  rows: [
    [cell([p([t('Port')])], { header: true }), cell([p([t('left')])])],
    [cell([p([t('Starboard')])], { header: true }), cell([p([t('right')])])],
  ],
  numbered: false,
  align: 'left',
  wrap: false,
  width: 50,
};

const gridTable: Block = {
  kind: 'table',
  id: 'grid',
  caption: [t('A grid')],
  rows: [
    [cell([p([t('Heading')])], { header: true }), cell([p([t('Heading')])], { header: true })],
    [
      cell([p([t('A cell of'), br, t('two lines')])]),
      cell([p([t('spans two rows')]), p([t('and holds two paragraphs')])], { rowspan: 2 }),
    ],
    [cell([p([t('another')], 'quote')])],
    [
      cell(
        [
          p([t('spans two columns')]),
          p([t('A list')], 'item'),
          p([t('in a cell')], 'item', { indent: 1 }),
        ],
        { colspan: 2 },
      ),
    ],
    [
      cell([p([t('a | bar')])], { align: 'right' }),
      cell([p([mark({ indent: 1 }), t('verse')], 'line')], { header: true }),
    ],
  ],
  numbered: true,
  width: 80,
};

const blocks: Block[] = [
  figureFull,
  figurePlain,
  { kind: 'equation', id: 'euler', tex: 'e^{i\\pi} + 1 = 0', numbered: true, align: 'center' },
  { kind: 'equation', id: '', tex: 'a^2 + b^2\n= c^2', numbered: false },
  { kind: 'equation', id: 'sum', tex: '\\sum_{i=1}^n i\n= \\frac{n(n+1)}{2}', numbered: true },
  { kind: 'equation', id: 'plain', tex: 'x = 1', numbered: false },
  simpleTable,
  columnTable,
  gridTable,
  { kind: 'row', items: [figurePlain, { ...simpleTable, id: 'crew2' }] },
  { kind: 'break', what: 'page' },
  { kind: 'break', what: 'column' },
  {
    kind: 'parallel',
    left: [p([t('Μῆνιν ἄειδε θεὰ', lang('grc'))], 'line'), p([t('Πηληϊάδεω Ἀχιλῆος')], 'line')],
    right: [p([t('Sing, goddess, the wrath')], 'line'), p([t('of Achilles')], 'text')],
  },
];

const template: Template = {
  id: 'play',
  name: 'A play',
  group: 'stage',
  description: 'A play in acts and scenes.\n* Not a headline',
  basedOn: 'plain',
  layout: 'play-script',
  contents: [{ part: 'title-page' }, { part: 'body' }, { kind: 'act' }],
  kinds: ['act', 'scene'],
  passageKinds: ['speaker', 'direction'],
  requirements: {
    words: null,
    abstractWords: 200,
    keywords: 5,
    anonymous: false,
    note: '#+not a keyword',
  },
  outputs: [{ id: 'main', targets: ['pdf', 'docx'] }],
};

const element = (
  more: Partial<OrgElement> & Pick<OrgElement, 'id' | 'depth' | 'name'>,
): OrgElement => ({
  blocks: [],
  kind: null,
  status: null,
  when: null,
  heading: true,
  excluded: false,
  include: null,
  origin: null,
  pos: null,
  collapsed: false,
  document: {},
  timeline: null,
  ...more,
});

/** The project that uses everything. */
export function everything(): OrgProject {
  return {
    title: 'Medea',
    language: 'en-GB',
    elements: [
      element({
        id: 'project',
        depth: 0,
        name: [t('Medea')],
        blocks: [p([t('The preamble of the project.')])],
        document: {
          title: 'Medea',
          subtitle: 'A tragedy',
          authors: [
            { name: 'Euripides' },
            {
              name: 'Ann Smith',
              affiliation: 'University of Oslo',
              email: 'ann@example.org',
              orcid: '0000-0001-2345-6789',
            },
          ],
          keywords: ['tragedy', 'the Argo'],
          date: '431 BC',
          template: 'play',
          style: 'chicago-author-date',
          format: 'play-script',
          language: 'en-GB',
          identifiers: { isbn: '978-3-16-148410-0', doi: '10.1000/xyz 1' },
          lineNumbers: true,
          look: { font: { family: 'EB Garamond' }, kinds: { quote: { italic: null } } },
          composition: {
            parts: { contents: true, 'title-page': false },
            requirements: { words: 8000, keywords: null, anonymous: true },
          },
        },
        timeline: {
          axis: 'dates',
          unit: 'year',
          lanes: [{ kind: 'k-scene' }, { element: 'scene1', each: true }],
        },
      }),
      element({
        id: 'scene1',
        depth: 1,
        name: [
          t('The '),
          t('prologue', { em: true }),
          t(' of '),
          t('Medea', { smallcaps: true }),
          t('2', { sup: true }),
        ],
        blocks: verse,
        kind: 'k-scene',
        status: 'draft',
        when: {
          start: { at: '431 BC', approx: true, margin: '5 years' },
          end: { after: 'scene2' },
        },
        heading: true,
        excluded: true,
        origin: 'old1',
        pos: { x: 120, y: -40 },
        collapsed: true,
        document: {
          title: '',
          lineNumbers: false,
          authors: [{ name: 'Smith; Jones / Co' }],
          keywords: ['a; b'],
        },
        timeline: {},
      }),
      element({
        id: 'kinds',
        depth: 2,
        name: [t('Kinds')],
        blocks: kinds,
        kind: 'k-char',
        status: 'idea',
      }),
      element({ id: 'blocks', depth: 2, name: [t('Blocks')], blocks, status: 'done' }),
      element({
        id: 'traps',
        depth: 1,
        name: [t('TODO Buy milk :work:')],
        blocks: trapBlocks(),
        include: 'kinds',
      }),
      element({ id: 'traps2', depth: 2, name: [t('[#A] * star :a:b:')] }),
      element({ id: 'traps3', depth: 2, name: [t('COMMENT this')] }),
      element({ id: 'empty', depth: 1, name: [] }),
      // The numbering of lines: a stretch that counts the lines of one kind
      // only, of the catalogue and of the writer's own, with a quotation
      // passed over; and lines whose numbers are always shown.
      element({
        id: 'counted-lines',
        depth: 1,
        name: [t('Counted lines')],
        blocks: [
          p(
            [mark({ number: '41' }), t('Counted'), br, mark({ shown: true }), t('always shown')],
            'line',
            {
              numbering: 'counted',
              only: 'line',
            },
          ),
          p([t('A quotation passed over')], 'quote', { numbering: 'counted', only: 'line' }),
          p([t('and on')], 'line', { numbering: 'counted', only: 'line' }),
          p([mark({ number: '7', shown: true }), t('Dear friend,')], 'own-letter', {
            numbering: 'counted',
            every: 1,
            only: 'own-letter',
          }),
        ],
      }),
    ],
    elementKinds: [
      {
        id: 'k-char',
        name: 'Character',
        colour: 'blue',
        template: 'Who they are.\n\nWhat they want.',
        begins: 'line',
        order: 'a0',
      },
      {
        id: 'k-scene',
        name: 'Scene',
        colour: 'green',
        template: '',
        basedOn: 'chapter',
        order: 'a1',
      },
      { id: 'k-twin', name: 'Twin', colour: 'red', template: '', order: 'a2' },
      { id: 'k-twin2', name: 'Twin', colour: 'red', template: '', order: 'a3' },
    ],
    paragraphKinds: [
      {
        id: 'own-letter',
        name: 'Letter',
        family: 'paragraph',
        basedOn: 'quote',
        look: { italic: true, indentLeft: '1cm' },
        order: 'b0',
      },
      {
        id: 'own-ship',
        name: "Ship's name",
        family: 'words',
        basedOn: 'title',
        look: { bold: false, case: 'smallcaps' },
        order: 'b1',
      },
      {
        id: 'own-log',
        name: "Ship's log",
        family: 'paragraph',
        basedOn: 'text',
        look: {
          size: 10.5,
          lineSpacing: 1.2,
          text: '* * *',
          spaceBefore: '6pt',
          keepWithNext: true,
        },
        order: 'b2',
      },
      {
        id: 'own-numbered',
        name: 'Numbered',
        family: 'paragraph',
        basedOn: 'epigraph',
        look: {},
        order: 'b3',
      },
      {
        id: 'own-chant',
        name: 'Chant',
        family: 'paragraph',
        basedOn: 'line',
        look: { align: 'center' },
        order: 'b4',
      },
    ],
    templates: { play: template },
    links: [
      { from: 'scene1', to: 'kinds', label: 'answers' },
      { from: 'scene1', to: 'blocks', label: '' },
      { from: 'kinds', to: 'scene1', label: 'a [bracketed] label' },
    ],
    comments: [
      {
        element: 'scene1',
        words: 'gods before men',
        resolved: true,
        notes: [
          { author: 'Robert', date: '2026-10-12', text: "Is this Nagy's phrase?" },
          { author: 'Anna Berg', date: '2026-10-13', text: 'Yes, Best of the Achaeans, p. 73.' },
        ],
      },
      {
        element: 'scene1',
        words: null,
        resolved: false,
        notes: [
          {
            author: 'Robert',
            date: '2026-10-12',
            text: 'A note on the scene,\n- on two lines\n:END:\n\\ and more (settled)',
          },
        ],
      },
      {
        element: 'kinds',
        words: 'say "this"',
        resolved: false,
        notes: [
          { author: 'Anna', date: '2026-10-14', text: '' },
          { author: 'Bob ] "B"', date: '', text: 'on "this": not words\n' },
          { author: 'Cy', date: '2026-10-15', text: ': a colon, (settled)\n- and a dash' },
        ],
      },
    ],
    references: [
      {
        id: 'r1',
        key: 'nagy1979',
        type: 'book',
        fields: {},
        names: {},
        modified: '',
        authors: 'Nagy',
        year: '1979',
        title: 'The Best of the Achaeans',
        container: '',
      },
      {
        id: 'r2',
        key: 'west2001',
        type: 'book',
        fields: {},
        names: {},
        modified: '',
        authors: 'West',
        year: '2001',
        title: 'Studies',
        container: '',
      },
    ],
  };
}
