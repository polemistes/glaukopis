/**
 * Asking for a table: by its size, or from a file. What is asked in is
 * shown over the rest, and is gone when it has been answered.
 */

import { open as openFile } from '@tauri-apps/plugin-dialog';
import type { EditorView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import * as Y from 'yjs';
import { tableRead, type Sheet } from '$lib/api/tables';
import { placeForBlock } from '$lib/editor/commands';
import { bodySchema } from '$lib/editor/schema';
import { rectAt } from '$lib/editor/ui.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import { notify, notifyError } from '$lib/ui/toast.svelte';
import { emptyTable, insertTable, tableNode, type TableOf } from './commands';
import TableFromFile from './TableFromFile.svelte';
import TableSize from './TableSize.svelte';

/** The endings of files that tables are read from. */
export const TABLE_ENDINGS = ['csv', 'tsv', 'tab', 'txt', 'ods', 'xlsx', 'xlsm', 'xlsb', 'xls'];

const ending = (path: string) => path.split('.').pop()?.toLowerCase() ?? '';

export function isTablePath(path: string): boolean {
  return TABLE_ENDINGS.includes(ending(path));
}

/** What a file is called, without where it is. */
const nameOf = (path: string) => path.split(/[\\/]/).pop() ?? path;

/** Shows something over the rest until it is answered. */
function ask<T>(show: (host: HTMLElement, done: (answer: T | null) => void) => object) {
  return new Promise<T | null>((resolve) => {
    const host = document.createElement('div');
    host.style.display = 'contents';
    document.body.append(host);
    let answered = false;
    let shown: object | null = null;
    const done = (answer: T | null) => {
      if (answered) return;
      answered = true;
      if (shown) void unmount(shown);
      host.remove();
      resolve(answer);
    };
    shown = show(host, done);
  });
}

/**
 * Asks how many rows and columns, and puts the table where the cursor is.
 * The cursor goes into its first cell.
 */
export async function askForTable(view: EditorView) {
  const type = view.state.schema.nodes.tabular;
  if (!type || !view.editable) return;
  if (!placeForBlock(view.state, type)) {
    notify('A table cannot stand here');
    return;
  }
  const anchor = rectAt(view, view.state.selection.from);
  const size = await ask<{ rows: number; columns: number; headings: boolean }>((host, done) =>
    mount(TableSize, {
      target: host,
      props: {
        anchor,
        onpick: (rows: number, columns: number, headings: boolean) =>
          done({ rows, columns, headings }),
        onclose: () => done(null),
      },
    }),
  );
  if (view.isDestroyed) return;
  if (size)
    insertTable(emptyTable(size.rows, size.columns, size.headings))(view.state, view.dispatch);
  view.focus();
}

/** Where a table that was read from a file is to go. */
export interface Place {
  /** The text that is being written, and where in it, when not where the cursor is. */
  view?: EditorView;
  at?: number;
  /** Otherwise: the end of the text of an element. */
  project?: Project | null;
  element?: string | null;
}

/** Shows what was read, and gives what it is to become. */
function review(path: string, sheets: Sheet[]) {
  return ask<TableOf>((host, done) =>
    mount(TableFromFile, {
      target: host,
      props: { file: nameOf(path), sheets, onpick: done, onclose: () => done(null) },
    }),
  );
}

/** A table at the end of the text of an element, where no text is being written. */
export function addTable(project: Project, element: string, given: TableOf): boolean {
  const body = project.fragment(element, 'body');
  const node = tableNode(bodySchema, given);
  if (!body || !node) return false;
  // As the editor would keep it.
  const held = new Y.Doc().getXmlFragment('table');
  prosemirrorToYXmlFragment(bodySchema.node('doc', null, [node]), held);
  const made = held.get(0);
  if (!(made instanceof Y.XmlElement)) return false;
  project.checkpoint();
  project.transact(() => {
    // An empty paragraph at the end gives way.
    const last = body.length ? body.get(body.length - 1) : null;
    const at =
      last instanceof Y.XmlElement && last.nodeName === 'paragraph' && last.length === 0
        ? body.length - 1
        : body.length;
    body.insert(at, [made.clone()]);
  });
  project.checkpoint();
  return true;
}

function put(given: TableOf, place: Place): boolean {
  const { view } = place;
  if (view && !view.isDestroyed) {
    const done = insertTable(given, place.at)(view.state, view.dispatch);
    view.focus();
    return done;
  }
  if (place.project && place.element) return addTable(place.project, place.element, given);
  return false;
}

/**
 * Reads a file, shows what was read, and puts the table into the text.
 * Returns whether a table was made.
 */
export async function tableFromFile(path: string, place: Place): Promise<boolean> {
  let sheets: Sheet[];
  try {
    sheets = await tableRead(path);
  } catch (error) {
    notifyError(`${nameOf(path)} could not be read as a table`, error);
    return false;
  }
  const given = await review(path, sheets);
  if (!given) {
    place.view?.focus();
    return false;
  }
  if (put(given, place)) return true;
  notify('A table cannot stand here');
  return false;
}

/** Asks for a file among those of this computer, and makes a table of it where the cursor is. */
export async function chooseTable(view: EditorView) {
  const path = await openFile({
    title: 'A table',
    multiple: false,
    filters: [{ name: 'Tables', extensions: TABLE_ENDINGS }],
  });
  if (typeof path !== 'string' || view.isDestroyed) return;
  await tableFromFile(path, { view });
}

/**
 * Files that were dropped: those that hold tables become tables, one
 * after the other. Returns the files that are none. A file of plain text
 * is taken for a table when its lines are parted into columns.
 */
export async function tablesDropped(paths: string[], place: Place): Promise<string[]> {
  const others: string[] = [];
  for (const path of paths) {
    if (!isTablePath(path)) {
      others.push(path);
      continue;
    }
    const written = place.view && !place.view.isDestroyed;
    const known = place.project && place.element && place.project.node(place.element);
    let sheets: Sheet[];
    try {
      sheets = await tableRead(path);
    } catch (error) {
      if (ending(path) === 'txt') others.push(path);
      else notifyError(`${nameOf(path)} could not be read as a table`, error);
      continue;
    }
    if (ending(path) === 'txt' && (sheets[0]?.rows[0]?.length ?? 0) < 2) {
      others.push(path);
      continue;
    }
    if (!written && !known) {
      notify('Drop a table on the text it belongs to');
      continue;
    }
    const given = await review(path, sheets);
    if (!given) continue;
    if (!put(given, place)) notify('A table cannot stand here');
    // Those that follow stand after it.
    place = { ...place, at: undefined };
  }
  return others;
}
