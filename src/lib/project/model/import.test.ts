import { describe, expect, it } from 'vitest';
import type { Imported, ImportedSection } from '$lib/api/imported';
import { buildDocument } from './document';
import { makeMap, titleOf } from './import';
import { Project } from './project.svelte';
import { inlineText, readBody, readTitle, type Block, type Inline } from './text';

const t = (text: string, marks: Record<string, true> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const p = (...content: Inline[]): Block => ({ kind: 'paragraph', content });

function imported(sections: ImportedSection[], more: Partial<Imported> = {}): Imported {
  return {
    file: 'wrath.md',
    kind: 'Markdown',
    title: [t('Wrath and the '), t('hero', { em: true })],
    subtitle: null,
    authors: [],
    date: null,
    abstract: null,
    keywords: [],
    language: null,
    sections,
    remarks: [],
    counts: {
      parts: sections.filter((s) => s.level > 0).length,
      words: 0,
      notes: 0,
      figures: 0,
      tables: 0,
      equations: 0,
      cited: 0,
      notFound: 0,
      found: 0,
      foundMade: 0,
    },
    pictures: [],
    ...more,
  };
}

const section = (level: number, heading: string, ...blocks: Block[]): ImportedSection => ({
  level,
  heading: heading ? [t(heading)] : [],
  blocks,
});

function outline(project: Project, map: string): string[] {
  const tree = project.tree(map);
  return tree.sequence.map((id) => `${tree.depth.get(id)} ${project.node(id)?.title}`);
}

describe('a document made into a map', () => {
  it('has the title at the centre and the headings as elements, in their order and depth', () => {
    const project = new Project(null);
    project.createMap('The first');
    const made = makeMap(
      project,
      imported(
        [
          section(0, '', p(t('Before the first heading.'))),
          section(1, 'One', p(t('Under one.'))),
          section(2, 'Within', p(t('Deeper.'))),
          section(3, 'Deepest'),
          section(2, 'Beside it'),
          section(1, 'Two', p(t('Under two.'))),
          // Deeper than can be: it stands one under what is before it.
          section(4, 'Too deep'),
        ],
        {
          subtitle: 'A study',
          authors: [{ name: 'A. Scholar', affiliation: 'Oslo' }, { name: ' ' }],
          date: '2026-01-02',
          abstract: 'Short.',
          keywords: ['wrath', ' ', 'epic'],
          language: 'en-GB',
        },
      ),
    );

    expect(project.maps.map((m) => m.name)).toEqual(['The first', 'Wrath and the hero']);
    expect(outline(project, made.map)).toEqual([
      '0 Wrath and the hero',
      '1 One',
      '2 Within',
      '3 Deepest',
      '2 Beside it',
      '1 Two',
      '2 Too deep',
    ]);
    const root = project.map(made.map)!.root;
    expect(made.elements[0]).toBe(root);
    // The marks of the title are those of the name of the centre.
    expect(readTitle(project.fragment(root, 'title')!)).toEqual([
      { kind: 'text', text: 'Wrath and the ', marks: {} },
      { kind: 'text', text: 'hero', marks: { em: {} } },
    ]);
    expect(project.node(root)?.titleHtml).toBe('Wrath and the <em>hero</em>');
    expect(readBody(project.fragment(root, 'body')!)).toEqual([
      {
        kind: 'paragraph',
        content: [{ kind: 'text', text: 'Before the first heading.', marks: {} }],
      },
    ]);
    expect(project.node(made.elements[2])?.words).toBe(1);
    expect(project.map(made.map)?.document).toEqual({
      subtitle: 'A study',
      authors: [{ name: 'A. Scholar', affiliation: 'Oslo' }],
      date: '2026-01-02',
      abstract: 'Short.',
      keywords: ['wrath', 'epic'],
      language: 'en-GB',
    });

    // The way out gives the document that came in.
    const out = buildDocument(project, made.map);
    expect(inlineText(out.title)).toBe('Wrath and the hero');
    expect(
      out.sections.map((s) => `${s.level} ${s.heading ? inlineText(s.heading) : '—'}`),
    ).toEqual(['0 —', '1 One', '2 Within', '3 Deepest', '2 Beside it', '1 Two', '2 Too deep']);
    expect(out.subtitle).toBe('A study');
  });

  it('is taken back by undo as one, and made again by redo', () => {
    const project = new Project(null);
    project.createMap('The first');
    project.undoManager.clear();
    const made = makeMap(
      project,
      imported([section(1, 'One', p(t('Under one.'))), section(1, 'Two')]),
    );
    expect(project.maps).toHaveLength(2);
    expect(project.nodes.size).toBe(4);
    expect(project.undoManager.undoStack).toHaveLength(1);

    project.undo();
    expect(project.maps.map((m) => m.name)).toEqual(['The first']);
    expect(project.nodes.size).toBe(1);
    expect(project.canUndo).toBe(false);

    project.redo();
    expect(outline(project, made.map)).toEqual(['0 Wrath and the hero', '1 One', '1 Two']);
    expect(readBody(project.fragment(made.elements[1], 'body')!)).toHaveLength(1);
  });

  it('has the title it is given, where that is another', () => {
    const project = new Project(null);
    const document = imported([]);
    expect(titleOf(document)).toBe('Wrath and the hero');
    const made = makeMap(project, document, '  The anger of   Achilles ');
    expect(project.map(made.map)?.name).toBe('The anger of Achilles');
    expect(project.node(project.map(made.map)!.root)?.titleHtml).toBe('The anger of Achilles');
    // A document without parts is a map of its centre.
    expect(outline(project, made.map)).toEqual(['0 The anger of Achilles']);
  });

  it('gives what stands by itself ids, and tells what is cited', () => {
    const project = new Project(null);
    const made = makeMap(
      project,
      imported([
        section(
          1,
          'One',
          p(
            t('As '),
            { kind: 'citation', items: [{ id: 'r1', locator: '73' }], mode: 'normal' },
            {
              kind: 'footnote',
              content: [{ kind: 'citation', items: [{ id: 'r2' }, { id: 'r1' }], mode: 'normal' }],
            },
          ),
          { kind: 'equation', id: '', tex: 'x', numbered: false },
          {
            kind: 'figure',
            id: '',
            file: 'a'.repeat(64),
            extension: 'png',
            name: 'shield.png',
            caption: [t('The shield')],
            alt: '',
            width: 50,
            numbered: true,
          },
        ),
      ]),
    );
    expect(made.cited).toEqual(['r1', 'r2']);
    const node = project.node(made.elements[1])!;
    expect(node.cited).toEqual(['r1', 'r2']);
    expect(node.notes).toBe(1);
    expect(node.set.map((s) => s.kind)).toEqual(['equation', 'figure']);
    expect(node.set.every((s) => /^[0-9A-Za-z]{12}$/.test(s.id))).toBe(true);
    expect(project.usedPictures(made.map)).toEqual([
      { hash: 'a'.repeat(64), extension: 'png', name: 'shield.png' },
    ]);
  });

  it('takes a long document in without standing still for long', () => {
    // 2000 paragraphs under 60 headings, every tenth with a note and a citation.
    const words =
      'Sing, goddess, the wrath of Achilles son of Peleus, the accursed wrath which brought countless sorrows upon the Achaeans, and sent down to Hades many valiant souls of warriors. ';
    const sections: ImportedSection[] = [];
    let paragraphs = 0;
    for (let h = 0; h < 60; h++) {
      const blocks: Block[] = [];
      const here = h < 20 ? 34 : 33;
      for (let i = 0; i < here; i++) {
        const content: Inline[] = [t(words.repeat(3)), t('Emphasised.', { em: true })];
        if (paragraphs % 10 === 0) {
          content.push(
            { kind: 'citation', items: [{ id: `r${h}`, locator: String(i) }], mode: 'normal' },
            { kind: 'footnote', content: [t(words)] },
          );
        }
        blocks.push(p(...content));
        paragraphs++;
      }
      sections.push(section(h % 6 === 0 ? 1 : h % 3 === 0 ? 3 : 2, `Part ${h + 1}`, ...blocks));
    }
    expect(paragraphs).toBe(2000);

    const project = new Project(null);
    project.createMap('The first');
    const updates: number[] = [];
    project.doc.on('update', (update: Uint8Array) => updates.push(update.length));
    const before = performance.now();
    const made = makeMap(project, imported(sections));
    const took = performance.now() - before;

    expect(made.elements).toHaveLength(61);
    // One transaction: one change to be saved, and one step of undo.
    expect(updates).toHaveLength(1);
    expect(project.undoManager.undoStack.length).toBeLessThanOrEqual(2);
    const counted = [...project.nodes.values()]
      .filter((n) => n.map === made.map)
      .reduce((n, node) => n + node.words, 0);
    expect(counted).toBe(2000 * (3 * 29 + 1) + 200 * 29);
    console.info(
      `a document of 2000 paragraphs under 60 headings: ${Math.round(took)} ms, ${Math.round(updates[0] / 1024)} kB`,
    );
    expect(took).toBeLessThan(5000);

    const undone = performance.now();
    project.undo();
    expect(project.maps).toHaveLength(1);
    console.info(`taken back in ${Math.round(performance.now() - undone)} ms`);
  });
});
