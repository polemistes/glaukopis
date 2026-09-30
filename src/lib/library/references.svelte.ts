/**
 * Adding, editing and importing references, from anywhere in the application.
 *
 * The dialogs are mounted once, by `ReferenceHost.svelte`. Any code opens them
 * through the functions here and awaits the result, so the library, the text
 * editor and the map all use the same form and the same import.
 */

import { open } from '@tauri-apps/plugin-dialog';
import {
  emptyDraft,
  importApply,
  importBibFile,
  importBibText,
  libraryGet,
  type Draft,
  type ImportOutcome,
  type ImportPlan,
  type Reference,
} from '$lib/api/library';
import { isBackendError } from '$lib/api/backend';
import { importPdfs, importPdfsStop, onPdfsProgress } from '$lib/api/sources';
import { newId } from '$lib/util/id';
import { t } from '$lib/i18n';
import { library } from '$lib/state/library.svelte';
import { notify, notifyError, notifyOk } from '$lib/ui/toast.svelte';

export interface FormRequest {
  mode: 'new' | 'edit';
  draft: Draft;
  /** The entry being edited. */
  reference?: Reference;
  /** A collection to put a new entry in. */
  collection?: string | null;
  /** What was being searched for where the form was opened from: put into its lookup. */
  lookup?: string;
  resolve: (result: Reference | null) => void;
}

export interface ImportRequest {
  plan: ImportPlan;
  collection?: string | null;
  resolve: (result: ImportOutcome | null) => void;
}

export interface ZoteroRequest {
  collection?: string | null;
  resolve: (result: ImportOutcome | null) => void;
}

export interface PasteRequest {
  collection?: string | null;
  resolve: (result: ImportOutcome | null) => void;
}

class Dialogs {
  form = $state<FormRequest | null>(null);
  importing = $state<ImportRequest | null>(null);
  pasting = $state<PasteRequest | null>(null);
  zotero = $state<ZoteroRequest | null>(null);
  busy = $state(false);
  /** What is being done that takes a while, in words. */
  working = $state<string | null>(null);
  /** What stops what is being done, where it can be stopped. */
  stop = $state<(() => void) | null>(null);
}

export const dialogs = new Dialogs();

/** The type last chosen for a new reference, offered again. */
let lastType = 'book';

export function rememberType(type: string) {
  lastType = type;
}

/** Opens the form for a new reference. Resolves to the entry added, or null. */
export function newReference(
  options: { draft?: Draft; collection?: string | null; lookup?: string } = {},
): Promise<Reference | null> {
  return new Promise((resolve) => {
    dialogs.form?.resolve(null);
    dialogs.form = {
      mode: 'new',
      draft: options.draft ?? emptyDraft(lastType),
      collection: options.collection,
      lookup: options.lookup,
      resolve,
    };
  });
}

/** Opens the form for an entry of the library. Resolves to the entry as changed, or null. */
export async function editReference(id: string): Promise<Reference | null> {
  let reference: Reference;
  try {
    reference = await libraryGet(id);
  } catch (error) {
    notifyError(t('library-open-failed'), error);
    return null;
  }
  return new Promise((resolve) => {
    dialogs.form?.resolve(null);
    dialogs.form = {
      mode: 'edit',
      reference,
      draft: {
        key: reference.key,
        type: reference.type,
        fields: { ...reference.fields },
        names: structuredClone(reference.names),
      },
      resolve,
    };
  });
}

/** The references of a plan that are in the library already, for certain, and gain nothing by it. */
function allKnown(plan: ImportPlan): string[] | null {
  const ids: string[] = [];
  for (const item of plan.items) {
    const match = item.matches[0];
    if (
      item.action.kind !== 'skip' ||
      !match ||
      match.certainty !== 'certain' ||
      match.gains.length
    )
      return null;
    ids.push(match.id);
  }
  return ids.length ? ids : null;
}

function review(
  plan: ImportPlan,
  collection?: string | null,
  options: { quietWhenKnown?: boolean } = {},
): Promise<ImportOutcome | null> {
  const known = options.quietWhenKnown ? allKnown(plan) : null;
  if (known) {
    // There is nothing to decide.
    notify(t('library-known', { count: known.length }));
    return Promise.resolve({
      added: [],
      updated: [],
      concerned: [...new Set(known)],
      skipped: known.length,
      files: 0,
      problems: [],
    });
  }
  if (!plan.items.length) {
    notify(
      t('library-nothing-to-import'),
      plan.warnings.length ? plan.warnings.slice(0, 3).join(' ') : t('library-none-found'),
    );
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    dialogs.importing?.resolve(null);
    dialogs.importing = { plan, collection, resolve };
  });
}

/** Asks for a `.bib` file and imports it. */
export async function importFile(collection?: string | null): Promise<ImportOutcome | null> {
  const path = await open({
    title: t('library-import-title'),
    multiple: false,
    filters: [
      { name: t('library-filter-bib'), extensions: ['bib', 'bibtex', 'biblatex'] },
      { name: t('library-filter-all'), extensions: ['*'] },
    ],
  });
  if (!path || Array.isArray(path)) return null;
  return importPath(path, collection);
}

export async function importPath(
  path: string,
  collection?: string | null,
): Promise<ImportOutcome | null> {
  dialogs.busy = true;
  try {
    const plan = await importBibFile(path);
    dialogs.busy = false;
    return review(plan, collection);
  } catch (error) {
    notifyError(t('library-files-read-failed', { count: 1 }), error);
    return null;
  } finally {
    dialogs.busy = false;
  }
}

/** Opens a box to paste BibLaTeX into. */
export function importPasted(collection?: string | null): Promise<ImportOutcome | null> {
  return new Promise((resolve) => {
    dialogs.pasting?.resolve(null);
    dialogs.pasting = { collection, resolve };
  });
}

export async function importText(
  text: string,
  collection?: string | null,
): Promise<ImportOutcome | null> {
  try {
    return review(await importBibText(text), collection);
  } catch (error) {
    notifyError(t('library-text-read-failed'), error);
    return null;
  }
}

/**
 * Makes references of PDF files: each is read for its DOI or ISBN, which is
 * looked up, and the file is kept with the reference. Asks for the files if
 * none are given.
 */
export async function importPdfFiles(
  paths?: string[],
  collection?: string | null,
): Promise<ImportOutcome | null> {
  let files = paths;
  if (!files) {
    const chosen = await open({
      title: t('library-add-pdfs-title'),
      multiple: true,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!chosen) return null;
    files = Array.isArray(chosen) ? chosen : [chosen];
  }
  if (!files.length) return null;
  const ticket = newId();
  dialogs.working = t('library-pdfs-working', { count: files.length });
  dialogs.stop = () => void importPdfsStop(ticket).catch(() => {});
  const unlisten = await onPdfsProgress(ticket, ({ done, total, name }) => {
    if (total > 1)
      dialogs.working = t('library-pdfs-progress', { done: done + 1, count: total, name });
  });
  try {
    const plan = await importPdfs(files, true, ticket);
    dialogs.working = null;
    dialogs.stop = null;
    return review(plan, collection, { quietWhenKnown: true });
  } catch (error) {
    if (!(isBackendError(error) && error.kind === 'stopped'))
      notifyError(t('library-files-read-failed', { count: files.length }), error);
    return null;
  } finally {
    unlisten();
    dialogs.working = null;
    dialogs.stop = null;
  }
}

/** Takes in files that were dropped on the window, each according to its kind. */
export async function importDropped(
  paths: string[],
  collection?: string | null,
): Promise<ImportOutcome | null> {
  const kind = (path: string) => path.split('.').pop()?.toLowerCase() ?? '';
  const pdfs = paths.filter((p) => kind(p) === 'pdf');
  const bibs = paths.filter((p) => ['bib', 'bibtex', 'biblatex'].includes(kind(p)));
  if (!pdfs.length && !bibs.length) {
    notify(t('library-nothing-to-import'), t('library-import-kinds'));
    return null;
  }
  let outcome: ImportOutcome | null = null;
  for (const bib of bibs) outcome = join(outcome, await importPath(bib, collection));
  if (pdfs.length) outcome = join(outcome, await importPdfFiles(pdfs, collection));
  return outcome;
}

function join(a: ImportOutcome | null, b: ImportOutcome | null): ImportOutcome | null {
  if (!a || !b) return a ?? b;
  return {
    added: [...a.added, ...b.added],
    updated: [...a.updated, ...b.updated],
    concerned: [...(a.concerned ?? []), ...(b.concerned ?? [])],
    skipped: a.skipped + b.skipped,
    files: a.files + b.files,
    problems: [...a.problems, ...b.problems],
  };
}

/** Opens the dialog for importing from Zotero. */
export function importFromZotero(collection?: string | null): Promise<ImportOutcome | null> {
  return new Promise((resolve) => {
    dialogs.zotero?.resolve(null);
    dialogs.zotero = { collection, resolve };
  });
}

/** Shows a plan made elsewhere (a lookup, Zotero, a PDF) for review. */
export function importPlan(
  plan: ImportPlan,
  collection?: string | null,
): Promise<ImportOutcome | null> {
  return review(plan, collection);
}

/** Carries out a plan and tells the user what came of it. */
export async function carryOut(
  plan: ImportPlan,
  collection?: string | null,
): Promise<ImportOutcome> {
  if (collection) {
    const c = library.collection(collection);
    if (c) {
      // The path of names from the top to the collection.
      const path: string[] = [];
      let at: typeof c | undefined = c;
      while (at) {
        path.unshift(at.name);
        at = library.collection(at.parent);
      }
      for (const item of plan.items) item.candidate.collections.push(path);
    }
  }
  const outcome = await importApply(plan);
  // Those that were there already are among what the import was about.
  const known = plan.items.flatMap((item) =>
    item.action.kind === 'skip' && item.matches[0]?.certainty === 'certain'
      ? [item.matches[0].id]
      : [],
  );
  outcome.concerned = [...new Set([...outcome.added, ...outcome.updated, ...known])];
  await library.reload();
  // What came of it, as a list of what was done.
  const parts: string[] = [];
  if (outcome.added.length)
    parts.push(t('library-imported-added', { count: outcome.added.length }));
  if (outcome.updated.length)
    parts.push(t('library-imported-completed', { count: outcome.updated.length }));
  if (outcome.skipped) parts.push(t('library-imported-skipped', { count: outcome.skipped }));
  if (outcome.files) parts.push(t('library-imported-files', { count: outcome.files }));
  const summary = parts.join(', ') || t('library-imported-nothing');
  if (outcome.problems.length) {
    notifyError(summary, outcome.problems.slice(0, 4).join('\n'));
  } else {
    notifyOk(summary);
  }
  return outcome;
}
