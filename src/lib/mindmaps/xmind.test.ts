import { describe, expect, it } from 'vitest';
import { inlineText, type Block } from '$lib/project/model/text';
import { topicsOf } from './crossing';
import { fixture } from './fixtures';
import { notesHtml, notesPlain } from './html';
import type { Topic } from './map';
import { writeOpml } from './opml';
import { readXmind, writeXmind } from './xmind';

const byName = (root: Topic) => new Map([...topicsOf(root)].map((t) => [inlineText(t.name), t]));
const words = (blocks: Block[]) =>
  blocks.map((b) => (b.kind === 'paragraph' ? inlineText(b.content) : b.kind));
const notes = {
  html: (t: Topic) => notesHtml(t.text, null, () => '', {}),
  plain: (t: Topic) => notesPlain(t.text, () => '', {}),
};

describe('a file of XMind of today', () => {
  const { map, leftOut } = readXmind([
    { name: 'content.json', text: fixture('content.json') },
    { name: 'metadata.json', text: '{}' },
  ]);
  const topics = byName(map.root);

  it('makes each of two sheets a topic, named after the sheet, with floating topics under its middle', () => {
    expect(map.name).toBe('');
    expect(map.root.children.map((c) => inlineText(c.name))).toEqual(['Iliad', 'Notes']);
    expect(map.root.children[0].children.map((c) => inlineText(c.name))).toEqual([
      'The quarrel',
      'The battles',
      'The gods',
    ]);
    expect(words(map.root.children[0].text)).toEqual(['The wrath of Achilles.']);
  });

  it('reads notes, markers, labels and folding', () => {
    const quarrel = topics.get('The quarrel')!;
    expect(words(quarrel.text)).toEqual(['Agamemnon takes Briseis.', 'Achilles withdraws.']);
    expect(quarrel.status).toBe('done');
    expect(quarrel.kind).toEqual({ name: 'Episode', colour: null });
    expect(quarrel.when).toEqual({ start: { at: '1184 BC' } });
    expect(topics.get('The battles')!.status).toBe('draft');
    expect(topics.get('The battles')!.folded).toBe(true);
    expect(topics.get('The gods')!.status).toBe('idea');
    expect(topics.get('Patroclus falls')!.excluded).toBe(true);
    expect(topics.get('Agamemnon')!.kind?.name).toBe('Character');
  });

  it('reads the relationships whose ends are there, and counts what has no place', () => {
    expect(map.links).toEqual([{ from: 't-achilles', to: 't-hector', label: 'kills' }]);
    expect(leftOut).toEqual({
      icons: 1,
      labels: 1,
      hyperlinks: 1,
      images: 1,
      boundaries: 1,
      summaries: 1,
      associations: 1,
    });
  });
});

describe('a file of XMind 8', () => {
  const { map, leftOut } = readXmind([{ name: 'content.xml', text: fixture('content.xml') }]);
  const topics = byName(map.root);

  it('is read from its XML: one sheet, its middle the map', () => {
    expect(map.name).toBe('Aeneid');
    expect(map.root.children.map((c) => inlineText(c.name))).toEqual([
      'The fall of Troy',
      'Carthage',
      'Fate',
    ]);
    const troy = topics.get('The fall of Troy')!;
    expect(words(troy.text)).toEqual(['The horse is brought in.', 'Laocoön warns.']);
    const horse = troy.text[0].kind === 'paragraph' ? troy.text[0].content[1] : null;
    expect(horse?.kind === 'text' && horse.marks.em).toBeTruthy();
    expect(troy.status).toBe('draft');
    expect(troy.kind?.name).toBe('Book');
    expect(topics.get('Carthage')!.folded).toBe(true);
    expect(topics.get('Dido')!.status).toBe('done');
    expect(map.links).toEqual([{ from: 'dido', to: 'troy', label: 'remembers' }]);
    expect(leftOut).toEqual({ icons: 1, hyperlinks: 1 });
  });

  it('is written with both forms, and each reads back as it was', () => {
    const entries = writeXmind(map, notes, '0.0.0');
    expect(entries.map((e) => e.name).sort()).toEqual([
      'META-INF/manifest.xml',
      'content.json',
      'content.xml',
      'manifest.json',
      'meta.xml',
      'metadata.json',
    ]);
    const strip = (t: Topic): unknown => ({
      name: inlineText(t.name),
      text: words(t.text),
      folded: t.folded,
      status: t.status,
      kind: t.kind?.name ?? null,
      when: t.when,
      excluded: t.excluded,
      children: t.children.map(strip),
    });
    const fromJson = readXmind(entries.filter((e) => e.name !== 'content.xml'));
    const fromXml = readXmind(entries.filter((e) => e.name !== 'content.json'));
    expect(strip(fromJson.map.root)).toEqual(strip(map.root));
    expect(strip(fromXml.map.root)).toEqual(strip(map.root));
    expect(fromJson.map.links.map((l) => l.label)).toEqual(['remembers']);
    expect(fromXml.map.links.map((l) => l.label)).toEqual(['remembers']);
    expect(fromJson.leftOut).toEqual({});
    expect(fromXml.leftOut).toEqual({});
  });

  it('is written as OPML, names and notes as plain words', () => {
    const opml = writeOpml(map, notes.plain);
    expect(opml).toContain('<title>Aeneid</title>');
    expect(opml).toContain('<outline text="Aeneid">');
    expect(opml).toContain(
      '<outline text="The fall of Troy" _note="The horse is brought in.&#10;&#10;Laocoön warns."/>',
    );
    expect(opml.match(/<outline /g)).toHaveLength(5);
  });
});

describe('what is not a file of XMind', () => {
  it('is refused', () => {
    expect(() => readXmind([{ name: 'other.json', text: '[]' }])).toThrow();
    expect(() => readXmind([{ name: 'content.json', text: '{"a":1}' }])).toThrow();
  });
});
