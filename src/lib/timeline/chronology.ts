/**
 * A chronology: everything placed in time in a map, as a table in the
 * order of time, with when each is and what it is. It is added to the map
 * as an element of its own, under the centre, to be written on and
 * printed with the document; it is a copy of what the timeline knows at
 * the moment, not a view that follows it.
 */

import { t } from '$lib/i18n';
import { saidWords } from '$lib/project/elements';
import { writeBody } from '$lib/project/model/blocks';
import type { Project } from '$lib/project/model/project.svelte';
import type { Block, Inline, TableCell } from '$lib/project/model/text';
import { newId } from '$lib/util/id';
import { timelineOf, type Event } from './lanes';
import { describeWhen } from './solve';

/** Adds the chronology of a map to the map. Returns the id of the element made. */
export function addChronology(project: Project, mapId: string): string | null {
  const map = project.map(mapId);
  if (!map) return null;
  const timeline = timelineOf(project, mapId, () => null);
  const events: Event[] = [
    ...timeline.lanes.flatMap((l) => l.events),
    ...timeline.elsewhere,
  ].filter((e) => Number.isFinite(e.placed.from));
  events.sort((a, b) => a.placed.from - b.placed.from || a.placed.to - b.placed.to);
  const text = (words: string): Inline[] => [{ kind: 'text', text: words, marks: {} }];
  const cell = (content: Inline[], header = false): TableCell => ({
    content: [{ kind: 'paragraph', content }],
    colspan: 1,
    rowspan: 1,
    header,
  });
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');
  const rows: TableCell[][] = [
    [
      cell(text(t('timeline-chronology-when')), true),
      cell(text(t('timeline-chronology-what')), true),
    ],
    ...events.map((e) => [
      cell(text(e.node.when ? describeWhen(e.node.when, nameOf, saidWords()) : '')),
      cell(text(e.name || t('project-untitled'))),
    ]),
  ];
  const table: Block = {
    kind: 'table',
    id: newId(),
    caption: [],
    rows,
    numbered: false,
    width: 0,
  };
  project.checkpoint();
  const id = project.addChild(map.root, { title: t('timeline-chronology-title') });
  if (!id) return null;
  const body = project.fragment(id, 'body');
  if (body) project.transact(() => writeBody(body, [table]));
  project.checkpoint();
  return id;
}
