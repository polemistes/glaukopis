import { describe, expect, it } from 'vitest';
import { makePortable, portable } from '$lib/project/model/portable';
import { Project } from '$lib/project/model/project.svelte';
import { inlineText } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';
import { associationColour, intoPortable, mindMapOf, nearestColour, topicsOf } from './crossing';
import { fixture } from './fixtures';
import { readFreeplane, writeFreeplane } from './freeplane';
import { notesHtml } from './html';
import { timeOfWords, timeWords, type Topic } from './map';

/** A project made of a map, as a mind map opened makes one. */
function projectOf(xml: string) {
  const { map } = readFreeplane(xml);
  const p = new Project(null);
  p.begin(map.name);
  makePortable(p, intoPortable(map), { under: PROJECT, keepFolded: true });
  return { p, map };
}

describe('a mind map made into a project', () => {
  const { p } = projectOf(fixture('odyssey.mm'));
  const byName = new Map(
    [...p.nodes.values()].map((n) => [n.title.replace(/\s+/g, ' ').trim(), n] as const),
  );

  it('has the elements of the map under the project, with what is said of them', () => {
    expect(
      p
        .tree()
        .children.get(PROJECT)
        ?.map((id) => p.node(id)?.title),
    ).toEqual(['Telemachy', 'The wanderings of Odysseus', 'Summary']);
    const telemachy = byName.get('Telemachy')!;
    expect(telemachy.status).toBe('done');
    expect(p.kind(telemachy.kind)?.name).toBe('Part');
    expect(p.kind(telemachy.kind)?.colour).toBe('teal');
    expect(telemachy.when).toEqual({ start: { at: '1200 BC' }, end: { at: '1180 BC' } });
    expect(byName.get('The wanderings of Odysseus')!.collapsed).toBe(true);
    expect(byName.get('The Cyclops')!.excluded).toBe(true);
    expect(p.kind(byName.get('Odysseus')!.kind)?.name).toBe('Character');
    expect(p.links.map((l) => [p.node(l.from)?.title, p.node(l.to)?.title, l.label])).toEqual([
      ['Athena in disguise', 'Odysseus', 'helps'],
    ]);
  });

  it('is written as a map again with the same tree and the same facts', () => {
    const under = p.tree().children.get(PROJECT) ?? [];
    const map = mindMapOf('The Odyssey', { id: PROJECT, name: [], text: [] }, portable(p, under));
    const xml = writeFreeplane(map, (t: Topic) => notesHtml(t.text, null, () => '', {}));
    const again = readFreeplane(xml).map;
    const names = (root: Topic) => [...topicsOf(root)].map((t) => inlineText(t.name));
    expect(names(again.root).slice(1)).toEqual(
      names(projectOf(fixture('odyssey.mm')).map.root).slice(1),
    );
    expect(again.links.map((l) => l.label)).toEqual(['helps']);
    // The first of the map stand on either side, as the diagram divides them.
    expect(again.root.children.map((c) => c.side)).toEqual(['right', 'left', 'left']);
  });
});

describe('the associations of a map', () => {
  it('cross with their arrows, their colours brought to the nearest of the kinds, and their lines', () => {
    const { map } = readFreeplane(fixture('odyssey.mm'));
    const [link] = map.links;
    map.links = [{ ...link, label: 'helps\nin disguise', arrow: 'both', colour: '#ff0000' }];
    const p = new Project(null);
    p.begin(map.name);
    makePortable(p, intoPortable(map), { under: PROJECT });
    expect(p.links.map(({ label, arrow, colour }) => ({ label, arrow, colour }))).toEqual([
      { label: 'helps\nin disguise', arrow: 'both', colour: 'rust' },
    ]);

    const under = p.tree().children.get(PROJECT) ?? [];
    const back = mindMapOf('The Odyssey', { id: PROJECT, name: [], text: [] }, portable(p, under));
    expect(back.links.map(({ label, arrow, colour }) => ({ label, arrow, colour }))).toEqual([
      { label: 'helps\nin disguise', arrow: 'both', colour: '#c2410c' },
    ]);
  });

  it('have no colour where the file gives them black or a grey, as a connector nobody coloured has', () => {
    expect(associationColour('#000000')).toBeNull();
    expect(associationColour('#808080')).toBeNull();
    expect(associationColour('#ffffff')).toBeNull();
    expect(associationColour(null)).toBeNull();
    // The bluish grey of the kinds is a colour, and so is one near it.
    expect(associationColour('#475569')).toBe('slate');
    expect(associationColour('#ff0000')).toBe('rust');

    const { map } = readFreeplane(fixture('odyssey.mm'));
    const [link] = map.links;
    map.links = [{ ...link, colour: '#000000' }];
    const p = new Project(null);
    p.begin(map.name);
    makePortable(p, intoPortable(map), { under: PROJECT });
    expect(p.links.map((l) => l.colour)).toEqual([undefined]);
  });
});

describe('the colours and times of a map', () => {
  it('takes the colour of the kinds nearest the one in the file', () => {
    expect(nearestColour('#0e7490')).toBe('teal');
    expect(nearestColour('#ff0000')).toBe('rust');
    expect(nearestColour(null)).toBeNull();
    expect(nearestColour('red')).toBeNull();
  });

  it('writes a time in its words where it says little, and as the record where it says more', () => {
    const isTime = (s: string) => /^\d+( BC)?$/.test(s);
    expect(timeWords({ start: { at: '1814' } })).toBe('1814');
    expect(timeOfWords('1814 – 1905', isTime)).toEqual({
      start: { at: '1814' },
      end: { at: '1905' },
    });
    const relative = { start: { after: 'x1' } };
    expect(timeOfWords(timeWords(relative), isTime)).toEqual(relative);
    expect(timeOfWords('soon', isTime)).toBeNull();
  });
});
