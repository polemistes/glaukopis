/**
 * Where what is dropped on a project from the desktop goes. Pictures become
 * figures and files that hold tables become tables: where they were
 * dropped, in a text that is being written, or else at the end of the
 * element they were dropped on. Documents become maps of their own. The
 * rest is taken into the library, and where it was dropped on an element,
 * what it is is cited at the end of its text.
 */

import { isDocumentPath, isPlainTextPath } from '$lib/api/imported';
import { isReadPath } from '$lib/api/ocr';
import { insertFigure, widthFor } from '$lib/editor/commands';
import { viewsByDom } from '$lib/editor/ui.svelte';
import { isPicturePath, pictures } from '$lib/figures/pictures.svelte';
import { t } from '$lib/i18n';
import { importDropped } from '$lib/library/references.svelte';
import { tablesDropped } from '$lib/tables/ask';
import type { DropEvent } from '$lib/ui/drag.svelte';
import { notify } from '$lib/ui/toast.svelte';
import type { Project } from './model/project.svelte';

/** What the view does with what was dropped. */
export interface Dropping {
  project: Project | null;
  /** Makes maps of documents. */
  documentsIn(paths: string[]): Promise<void>;
  /** Keeps a copy of a reference that was cited in the project. */
  keep(id: string): void;
}

/**
 * What becomes a map when it is dropped on the tabs of the maps: a
 * document, and a PDF or a picture, whose text is read. Elsewhere a PDF is
 * taken into the library, and a picture becomes a figure.
 */
export const mapOfIt = (path: string) =>
  isDocumentPath(path) || isPlainTextPath(path) || isReadPath(path);

/** Takes in files dropped from the desktop, where they were dropped. */
export async function filesDropped(event: DropEvent, into: Dropping) {
  const under = document.elementFromPoint(event.x, event.y);
  const at = under?.closest<HTMLElement>('[data-node], [data-section]');
  const element = at?.dataset.node ?? at?.dataset.section ?? null;
  const all = event.payload.data as string[];
  const shown = all.filter(isPicturePath);
  const p = into.project;
  if (shown.length && p) {
    // Pictures become figures: where they were dropped, in a text that is
    // being written; otherwise at the end of the element they were dropped on.
    const written = under?.closest('.ProseMirror.body');
    const view = written ? viewsByDom.get(written) : undefined;
    if (!view && !(element && p.node(element))) {
      notify(t('project-drop-picture'));
    } else {
      let where = view?.posAtCoords({ left: event.x, top: event.y })?.pos;
      for (const path of shown) {
        const picture = await pictures.addFile(path);
        if (!picture) continue;
        if (view && !view.isDestroyed) {
          insertFigure(picture, where)(view.state, view.dispatch);
          where = undefined;
        } else if (element) {
          p.checkpoint();
          p.addFigure(element, picture, widthFor(picture));
          p.checkpoint();
        }
      }
    }
  }
  // Files that hold tables become tables, in the same places.
  const body = under?.closest('.ProseMirror.body');
  const text = body ? viewsByDom.get(body) : undefined;
  const rest = await tablesDropped(
    all.filter((path) => !isPicturePath(path)),
    {
      view: text,
      at: text?.posAtCoords({ left: event.x, top: event.y })?.pos,
      project: p,
      element,
    },
  );
  // Documents become maps of their own; text without marks is one when nothing else claims it.
  const written = (path: string) => isDocumentPath(path) || isPlainTextPath(path);
  if (p) await into.documentsIn(rest.filter(written));
  const others = rest.filter((path) => !written(path));
  if (!others.length) return;
  const outcome = await importDropped(others);
  if (!outcome?.concerned?.length || !element || !p || !p.node(element)) return;
  p.checkpoint();
  p.cite(element, outcome.concerned);
  p.checkpoint();
  for (const id of outcome.concerned) into.keep(id);
  const name = p.node(element)?.title;
  const count = outcome.concerned.length;
  notify(name ? t('project-cited-in', { count, name }) : t('project-cited-in-element', { count }));
}
