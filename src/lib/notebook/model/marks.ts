/**
 * The words of a note taken in one passage, as they stand in its text:
 * found, read as they read now, made the writer's own (the mark taken
 * away), and brought back to how they read when they were taken. The text
 * is changed in the document itself, as y-prosemirror keeps it: a mark is
 * an attribute of the runs of an `XmlText` (record 0101).
 */

import * as Y from 'yjs';

/** The name of a mark as the schema has it: y-prosemirror may keep one under its name and eight signs after `--`. */
const plainMark = (name: string) => /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(name)?.[1] ?? name;

/** The name the mark `taken` of a passage is kept under in the attributes of a run, where it is that passage's. */
function takenKey(attributes: Record<string, unknown> | undefined, passage: string): string | null {
  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (plainMark(name) !== 'taken' || !value || typeof value !== 'object') continue;
    if ((value as { passage?: unknown }).passage === passage) return name;
  }
  return null;
}

/** A stretch of marked words within one `XmlText`, or a line break among them. */
type Segment =
  | {
      kind: 'text';
      text: Y.XmlText;
      index: number;
      length: number;
      key: string;
      attributes: Record<string, unknown>;
    }
  | { kind: 'break'; element: Y.XmlElement };

/** Words of one passage that stand together: in one part of the text, with nothing of another between them. */
export interface Run {
  /** The part of the text that holds the words: a paragraph, or what is said of a figure. */
  container: Y.XmlElement | Y.XmlFragment;
  segments: Segment[];
  words: string;
}

/** The runs of a passage's words in a text, in the order they stand. */
export function runsOf(fragment: Y.XmlFragment, passage: string): Run[] {
  const runs: Run[] = [];
  const visit = (container: Y.XmlElement | Y.XmlFragment) => {
    let run: Run | null = null;
    const end = () => {
      if (run) {
        // A line break at the end of the words is none of them.
        while (run.segments.at(-1)?.kind === 'break') run.segments.pop();
        run.words = run.words.replace(/\n+$/, '');
        if (run.segments.length) runs.push(run);
      }
      run = null;
    };
    for (const child of container.toArray()) {
      if (child instanceof Y.XmlText) {
        let index = 0;
        for (const op of child.toDelta() as {
          insert: unknown;
          attributes?: Record<string, unknown>;
        }[]) {
          const length = typeof op.insert === 'string' ? op.insert.length : 1;
          const key = typeof op.insert === 'string' ? takenKey(op.attributes, passage) : null;
          if (key) {
            run ??= { container, segments: [], words: '' };
            run.segments.push({
              kind: 'text',
              text: child,
              index,
              length,
              key,
              attributes: { ...op.attributes },
            });
            run.words += op.insert as string;
          } else if (typeof op.insert !== 'string' || op.insert) end();
          index += length;
        }
      } else if (child instanceof Y.XmlElement) {
        if (child.nodeName === 'hard_break' && run) {
          (run as Run).segments.push({ kind: 'break', element: child });
          (run as Run).words += '\n';
          continue;
        }
        end();
        visit(child);
      }
    }
    end();
  };
  visit(fragment);
  return runs;
}

/** The words of a passage as they read now in a text: runs in one part joined by a space, parts by a line break. */
export function readsNow(fragment: Y.XmlFragment, passage: string): string {
  let out = '';
  let last: Run['container'] | null = null;
  for (const run of runsOf(fragment, passage)) {
    if (last) out += run.container === last ? ' ' : '\n';
    out += run.words;
    last = run.container;
  }
  return out;
}

/** Takes the mark of a passage away from its words in a text: they stay, the writer's own. */
export function unmark(fragment: Y.XmlFragment, passage: string) {
  for (const run of runsOf(fragment, passage))
    for (const s of run.segments)
      if (s.kind === 'text') s.text.format(s.index, s.length, { [s.key]: null });
}

/** Whether a part of a text holds nothing at all. */
function holdsNothing(container: Y.XmlElement): boolean {
  return container.toArray().every((c) => c instanceof Y.XmlText && c.length === 0);
}

function remove(element: Y.XmlElement) {
  const parent = element.parent as Y.XmlElement | Y.XmlFragment | null;
  if (!parent) return;
  const index = parent.toArray().indexOf(element);
  if (index >= 0) parent.delete(index, 1);
}

/**
 * Brings the words of a passage back to how they read when they were
 * taken: the first run of them takes the first reading, keeping its mark,
 * and the other runs go. Where the reading is of several paragraphs, those
 * after the first follow the paragraph of the first run. A paragraph left
 * with nothing in it goes. Returns whether there were words to bring back.
 */
export function bringBack(fragment: Y.XmlFragment, passage: string, reading: string): boolean {
  const runs = runsOf(fragment, passage);
  const first = runs[0];
  const head = first?.segments.find((s) => s.kind === 'text');
  if (!first || !head || head.kind !== 'text') return false;
  const emptied = new Set<Y.XmlElement>();
  const drop = (segments: Segment[]) => {
    // From the last: what stands before keeps its place.
    for (const s of [...segments].reverse()) {
      if (s.kind === 'text') s.text.delete(s.index, s.length);
      else remove(s.element);
    }
  };
  for (const run of runs.slice(1).reverse()) {
    drop(run.segments);
    if (run.container instanceof Y.XmlElement && run.container !== first.container)
      emptied.add(run.container);
  }
  drop(first.segments.filter((s) => s !== head));
  const container = first.container;
  const paragraphs = container instanceof Y.XmlElement && container.nodeName === 'paragraph';
  const lines = reading
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const [line = '', ...rest] = paragraphs ? lines : [lines.join(' ')];
  head.text.delete(head.index, head.length);
  head.text.insert(head.index, line, head.attributes);
  if (paragraphs && rest.length) {
    const parent = container.parent as Y.XmlElement | Y.XmlFragment;
    const at = parent.toArray().indexOf(container) + 1;
    parent.insert(
      at,
      rest.map(() => {
        const el = new Y.XmlElement('paragraph');
        el.setAttribute('kind', (container.getAttribute('kind') as string | undefined) ?? 'text');
        el.setAttribute('indent', (container.getAttribute('indent') ?? 0) as unknown as string);
        el.insert(0, [new Y.XmlText()]);
        return el;
      }),
    );
    rest.forEach((words, i) => {
      const el = parent.get(at + i) as Y.XmlElement;
      (el.get(0) as Y.XmlText).insert(0, words, { [head.key]: { passage } });
    });
  }
  for (const el of emptied) {
    const parent = el.parent as Y.XmlElement | Y.XmlFragment | null;
    if (el.nodeName === 'paragraph' && parent && parent.length > 1 && holdsNothing(el)) remove(el);
  }
  return true;
}
