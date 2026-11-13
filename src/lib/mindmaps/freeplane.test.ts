import { describe, expect, it } from 'vitest';
import { inlineText, type Block } from '$lib/project/model/text';
import { fixture } from './fixtures';
import { readFreeplane, writeFreeplane } from './freeplane';
import { notesHtml } from './html';
import { topicsOf } from './crossing';
import type { Topic } from './map';

const byName = (root: Topic) => new Map([...topicsOf(root)].map((t) => [inlineText(t.name), t]));
const words = (blocks: Block[]) =>
  blocks.map((b) => (b.kind === 'paragraph' ? inlineText(b.content) : b.kind));

describe('a map of Freeplane', () => {
  const { map, leftOut } = readFreeplane(fixture('odyssey.mm'));
  const topics = byName(map.root);

  it('is read as a tree, with the name in the middle as the map’s', () => {
    expect(map.name).toBe('The Odyssey');
    expect(map.root.children.map((c) => inlineText(c.name))).toEqual([
      'Telemachy',
      'The wanderings of Odysseus',
      'Summary',
    ]);
    expect(words(map.root.text)).toEqual(['The return of Odysseus, told in twenty-four books.']);
  });

  it('reads the name with its marks, the notes with their lists, folding and sides', () => {
    const wanderings = topics.get('The wanderings of Odysseus')!;
    expect(wanderings.name.map((i) => (i.kind === 'text' ? Object.keys(i.marks) : []))).toEqual([
      [],
      ['em'],
      [],
      ['smallcaps'],
    ]);
    expect(wanderings.folded).toBe(true);
    expect(wanderings.side).toBe('left');
    const telemachy = topics.get('Telemachy')!;
    expect(telemachy.side).toBe('right');
    expect(words(telemachy.text)).toEqual([
      'Telemachus goes in search of news of his father.',
      'Ithaca',
      'Pylos',
      'Nestor',
    ]);
    const kinds = telemachy.text.map((b) => (b.kind === 'paragraph' ? [b.name, b.indent] : []));
    expect(kinds).toEqual([
      ['text', 0],
      ['item', 0],
      ['item', 0],
      ['item', 1],
    ]);
  });

  it('reads how far the writing has come from the icons, and the rest from the attributes', () => {
    const telemachy = topics.get('Telemachy')!;
    expect(telemachy.status).toBe('done');
    expect(telemachy.kind).toEqual({ name: 'Part', colour: '#0e7490' });
    expect(telemachy.when).toEqual({ start: { at: '1200 BC' }, end: { at: '1180 BC' } });
    expect(topics.get('Athena in disguise')!.status).toBe('idea');
    expect(topics.get('The wanderings of Odysseus')!.status).toBe('draft');
    expect(topics.get('Odysseus')!.kind).toEqual({ name: 'Character', colour: null });
    expect(topics.get('The Cyclops')!.excluded).toBe(true);
  });

  it('reads the arrows with their words, and counts what has no place', () => {
    // Freeplane's head at the end, `ENDARROW="DEFAULT"`, is an arrow to the end.
    expect(map.links).toEqual([{ from: 'ID_2', to: 'ID_5', label: 'helps', arrow: 'to' }]);
    expect(leftOut).toEqual({
      hyperlinks: 1,
      clouds: 1,
      icons: 1,
      attributes: 1,
      images: 1,
      summaries: 1,
      associations: 1,
    });
  });

  it('reads back as it was written', () => {
    const notes = (t: Topic) => notesHtml(t.text, null, () => '', {});
    const written = writeFreeplane(map, notes);
    expect(written).toMatch(/^<map version="freeplane [\d.]+">\n/);
    expect(written.match(/<node /g)).toHaveLength(8);
    expect(written).toContain('MIDDLE_LABEL="helps"');
    const again = readFreeplane(written);
    const strip = (t: Topic): unknown => ({
      name: t.name,
      text: words(t.text),
      folded: t.folded,
      status: t.status,
      kind: t.kind,
      when: t.when,
      excluded: t.excluded,
      children: t.children.map(strip),
    });
    expect(strip(again.map.root)).toEqual(strip(map.root));
    expect(again.map.links.map((l) => l.label)).toEqual(['helps']);
    expect(again.leftOut).toEqual({});
  });

  it('writes and reads the heads, the colour and the lines of the words of an arrow', () => {
    const notes = () => '';
    const [a, b, c] = [...topicsOf(map.root)].slice(1, 4).map((t) => t.id);
    const links = [
      { from: a, to: b, label: 'one\ntwo', arrow: 'both' as const, colour: '#be185d' },
      { from: b, to: c, label: '', arrow: 'from' as const },
      { from: c, to: a, label: 'none' },
    ];
    const written = writeFreeplane({ ...map, links }, notes);
    expect(written).toContain(
      'COLOR="#be185d" STARTARROW="DEFAULT" ENDARROW="DEFAULT" MIDDLE_LABEL="one&#10;two"/>',
    );
    expect(written).toContain('STARTARROW="NONE" ENDARROW="NONE" MIDDLE_LABEL="none"/>');
    const read = readFreeplane(written).map;
    // The topics are written with ids of their own, in the same order.
    const order = [...topicsOf(map.root)].map((t) => t.id);
    const there = new Map([...topicsOf(read.root)].map((t, i) => [order[i], t.id]));
    expect(read.links).toEqual(
      links.map((l) => ({ ...l, from: there.get(l.from), to: there.get(l.to) })),
    );
  });

  it('reads an arrow whose heads are not said as Freeplane draws it, and those of FreeMind', () => {
    const xml = (arrow: string) =>
      `<map version="1.0.1"><node TEXT="m" ID="m"><node TEXT="a" ID="a"><arrowlink DESTINATION="b" ${arrow}/></node><node TEXT="b" ID="b"/></node></map>`;
    const arrow = (said: string) => readFreeplane(xml(said)).map.links[0].arrow;
    expect(arrow('')).toBe('to');
    expect(arrow('STARTARROW="Default" ENDARROW="None"')).toBe('from');
    expect(arrow('ENDARROW="None"')).toBeUndefined();
    expect(arrow('STARTARROW="Default"')).toBe('both');
    expect(readFreeplane(xml('COLOR="red"')).map.links[0].colour).toBeUndefined();
  });
});

describe('a map of FreeMind', () => {
  it('is read, plain as it is', () => {
    const { map, leftOut } = readFreeplane(fixture('freemind.mm'));
    expect(map.name).toBe('Plans & projects');
    const topics = byName(map.root);
    expect([...topics.keys()]).toEqual([
      'Plans & projects',
      'Garden',
      'Roses',
      'Beans',
      'House',
      'The front door',
    ]);
    expect(words(topics.get('House')!.text)).toEqual(['Paint the door.']);
    const door = topics.get('The front door')!;
    expect(door.name.map((i) => (i.kind === 'text' ? Object.keys(i.marks) : []))).toEqual([
      [],
      ['em'],
      [],
    ]);
    expect(leftOut).toEqual({});
  });

  it('is not what other XML is', () => {
    expect(() => readFreeplane('<opml version="2.0"><body/></opml>')).toThrow();
  });
});
