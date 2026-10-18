/**
 * The files of the library as the interface holds them: the folders, and
 * what is known of each file, with the references it belongs to. The files
 * view, the pane of a reference and the pictures change them through what is
 * here, so that the files and the references are brought up to date
 * together.
 */

import FileIcon from '@lucide/svelte/icons/file';
import { SvelteSet } from 'svelte/reactivity';
import FileText from '@lucide/svelte/icons/file-text';
import FileType from '@lucide/svelte/icons/file-type';
import ImageIcon from '@lucide/svelte/icons/image';
import {
  fileAssign,
  fileMove,
  fileRename,
  filesList,
  filesExport,
  filesStop,
  filesTakeIn,
  fileToPicture,
  fileUnassign,
  filesLeftEmpty,
  filesMove,
  filesRemove,
  filesUnassign,
  onFilesProgress,
  type FileFolder,
  type FileKind,
  type FileView,
  type ExportSelection,
  type Exported,
  type Proposal,
  type TakenIn,
} from '$lib/api/files';
import { open } from '@tauri-apps/plugin-dialog';
import { revealPath } from '$lib/api/system';
import { isBackendError } from '$lib/api/backend';
import { libraryRemove, type StoredFile, type Summary } from '$lib/api/library';
import type { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { bringIn } from '$lib/documents/bringing.svelte';
import { pictures } from '$lib/figures/pictures.svelte';
import { goThroughWhenOpen } from '$lib/found/found.svelte';
import { descendants } from '$lib/home/folders';
import { t } from '$lib/i18n';
import { shortLabel } from '$lib/library/format';
import { dialogs } from '$lib/library/references.svelte';
import { fold, library } from '$lib/state/library.svelte';
import { router } from '$lib/state/router.svelte';
import { ask, confirm } from '$lib/ui/confirm.svelte';
import { describeError, notifyError, notifyOk, toasts } from '$lib/ui/toast.svelte';
import { newId } from '$lib/util/id';
import { forgetChanged, forgetStale } from './kept';

/** What files dragged from the list are, for what takes them. Not 'files': that is what comes from the desktop. */
export const FILES_DRAGGED = 'library-files';

class FilesState {
  loaded = $state(false);
  folders = $state.raw<FileFolder[]>([]);
  files = $state.raw<FileView[]>([]);

  #byHash = $derived(new Map(this.files.map((f) => [f.hash, f])));
  #folderIds = $derived(new Set(this.folders.map((f) => f.id)));
  #loading: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return this.reload();
  }

  reload(): Promise<void> {
    if (!this.#loading) {
      this.#loading = filesList()
        .then((listing) => {
          // What was found out and decided is kept for the session; only what no longer holds goes.
          forgetStale(this.files, listing.files, proposals, decisions);
          this.folders = listing.folders;
          this.files = listing.files;
          this.loaded = true;
        })
        .catch((error) => {
          notifyError(t('files-unread'), error);
        })
        .finally(() => {
          this.#loading = null;
        });
    }
    return this.#loading;
  }

  get(hash: string | null | undefined): FileView | undefined {
    return hash ? this.#byHash.get(hash) : undefined;
  }

  folder(id: string | null | undefined): FileFolder | undefined {
    return id ? this.folders.find((f) => f.id === id) : undefined;
  }

  /** The folder a file stands in, where that is a folder that exists; else the top. */
  folderOf(file: FileView): string | null {
    return file.folder && this.#folderIds.has(file.folder) ? file.folder : null;
  }

  /** The folder and every folder under it, by id. */
  descendants(id: string): Set<string> {
    return descendants(this.folders, id);
  }

  /**
   * The files of a folder, or of the top where it is null; with `below`,
   * those of the folders under it too, which for the top is all of them.
   */
  inFolder(id: string | null, below = true): FileView[] {
    if (id === null) return below ? this.files : this.files.filter((f) => !this.folderOf(f));
    const ids = below ? this.descendants(id) : new Set([id]);
    return this.files.filter((f) => {
      const at = this.folderOf(f);
      return at !== null && ids.has(at);
    });
  }

  /** After a file was changed, or taken in. */
  put(view: FileView) {
    // A file given to a reference, or taken from one, has its going-through to come anew.
    forgetChanged(this.get(view.hash), view, decisions);
    const i = this.files.findIndex((f) => f.hash === view.hash);
    if (i >= 0) {
      const next = this.files.slice();
      next[i] = view;
      this.files = next;
    } else {
      this.files = [...this.files, view];
    }
  }

  forget(hash: string) {
    proposals.delete(hash);
    decisions.delete(hash);
    this.files = this.files.filter((f) => f.hash !== hash);
  }

  setFolders(folders: FileFolder[]) {
    this.folders = folders;
  }
}

export const files = new FilesState();

/** What a file of the going-through is to become: the proposal, another reference, a new one, or nothing yet. */
export interface Decision {
  choice: 'this' | 'other' | 'new' | 'later';
  /** Which of the proposal's matches, where it has several. */
  match: number;
  /** The reference chosen by hand, or made, for 'other' and 'new'. */
  chosen: Summary | null;
}

/** What was found out of each file in this session, by hash: not found out again. */
export const proposals = new Map<string, Proposal>();
/** What was decided of each, by hash, so that a going-through closed and opened again shows it. */
export const decisions = new Map<string, Decision>();

/** What the last going-through did, while the application is open, so that it can be undone at once. */
export interface Done {
  /**
   * The files given to references, each with the reference it went to; an
   * empty `id` where it went to a reference made from the services'
   * description, which `made` takes back.
   */
  assigned: { hash: string; id: string }[];
  /** The references made in the going-through. */
  made: string[];
}

/** Files are to be exported: whether a references.bib goes with them is asked, before the folder is. */
export interface ExportRequest {
  selection: ExportSelection;
  /** How many files are to be written. */
  count: number;
  resolve: (withBib: boolean | null) => void;
}

/** The dialogs of the files, which the files view shows. */
class FilesUi {
  /** The files being gone through (`GoThroughDialog.svelte`). */
  going = $state.raw<string[] | null>(null);
  exporting = $state.raw<ExportRequest | null>(null);
  /** What the last going-through did, to be undone at once; `null` once it is undone. */
  lastDone = $state.raw<Done | null>(null);
  /** The message that offers to undo it, while it stands. */
  lastToast: number | null = null;
  /** The folders whose bar of unassigned files is hidden for the session; `null` is the top. */
  barHidden = new SvelteSet<string | null>();
}

export const filesUi = new FilesUi();

/** Opens the going-through over these files, in the files view. */
export function goThrough(hashes: string[]) {
  if (!hashes.length) return;
  if (router.route.view !== 'files') router.go({ view: 'files' });
  filesUi.going = hashes;
}

/** The files of a folder and those under it, or of all, that belong to no reference. */
export function unassignedIn(folder: string | null): string[] {
  return files
    .inFolder(folder, true)
    .filter((f) => !f.references.length)
    .map((f) => f.hash);
}

/** Whether a references.bib went with the last export, offered again. */
let lastWithBib = true;

/** What came of an export, in words. */
export function exportedWords(out: Exported): string {
  const parts = [t('files-exported', { count: out.files })];
  if (out.folders) parts.push(t('files-exported-folders', { count: out.folders }));
  if (out.bib) parts.push(t('files-exported-bib'));
  if (out.stopped) parts.push(t('files-exported-stopped', { count: out.total - out.files }));
  if (out.problems.length) parts.push(t('files-problems', { count: out.problems.length }));
  return parts.join(', ');
}

/**
 * Exports files into a folder: what is written, and whether a references.bib
 * goes with it, is said and asked first; then the folder is asked for. The
 * folders of the store become folders on disk, and each file is named by its
 * reference. How far it has come is shown at the foot of the window, where
 * it can be stopped.
 */
export async function exportFiles(selection: ExportSelection, count: number): Promise<void> {
  if (!count) return;
  const withBib = await new Promise<boolean | null>((resolve) => {
    filesUi.exporting?.resolve(null);
    filesUi.exporting = { selection, count, resolve };
  });
  filesUi.exporting = null;
  if (withBib === null) return;
  lastWithBib = withBib;
  const into = await open({ title: t('files-export-folder-title'), directory: true });
  if (!into || Array.isArray(into)) return;
  const ticket = newId();
  dialogs.working = t('files-exporting', { count });
  dialogs.stop = () => void filesStop(ticket).catch(() => {});
  const unlisten = await onFilesProgress(ticket, ({ done, total, name }) => {
    if (name && total > 1)
      dialogs.working = t('files-exporting-progress', { done: done + 1, count: total, name });
  });
  try {
    const out = await filesExport(selection, into, withBib, ticket);
    toasts.show(
      {
        kind: out.problems.length ? 'error' : 'ok',
        message: exportedWords(out),
        detail: out.problems.length ? out.problems.slice(0, 4).join('\n') : undefined,
        action: {
          label: t('files-exported-show'),
          run: () => void revealPath(into).catch((e) => notifyError(t('files-reveal-failed'), e)),
        },
      },
      out.problems.length ? 9000 : 6000,
    );
  } catch (error) {
    notifyError(t('files-export-failed'), error);
  } finally {
    unlisten();
    dialogs.working = null;
    dialogs.stop = null;
  }
}

/** Whether a references.bib is offered as going with the export, as it did last. */
export function withBibAtFirst(): boolean {
  return lastWithBib;
}

/** The icon of each kind of file. */
export const KIND_ICONS: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  picture: ImageIcon,
  document: FileType,
  other: FileIcon,
};

export function kindWords(kind: FileKind): string {
  return t(`files-kind-${kind}`);
}

/** A file of the library as the dialogs of a reference's files take it. */
export function storedOf(file: FileView): StoredFile {
  return {
    path: file.path,
    name: file.name,
    size: file.size,
    exists: file.exists,
    hash: file.hash,
    kind: file.kind,
  };
}

/** "Nagy 1979": a reference as a file's line names it. */
export function referenceWords(reference: Summary): string {
  return shortLabel(reference);
}

/**
 * Whether a file answers to what is searched for: every word, as a word or
 * the beginning of one, in its name, where it came from, or the authors
 * and the title of a reference it belongs to.
 */
export function fileMatches(file: FileView, query: string): boolean {
  const words = fold(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  let hay = searched.get(file);
  if (hay === undefined) {
    hay =
      ' ' +
      fold(
        [
          file.name,
          file.origin ?? '',
          ...file.references.flatMap((r) => [r.authors, r.title, r.year]),
        ].join(' '),
      );
    searched.set(file, hay);
  }
  return words.every((w) => hay.includes(' ' + w));
}

/**
 * What is searched in each file, made once: a file is read anew whenever it
 * changes, and folded again for every letter typed in a search over
 * thousands it made the field stutter.
 */
const searched = new WeakMap<FileView, string>();

/** What came of taking files in, in words: the new, those already there, the folders made, the problems. */
export function takenWords(taken: TakenIn): string {
  const parts: string[] = [];
  if (taken.files.length) parts.push(t('files-taken-in', { count: taken.files.length }));
  if (taken.same.length) parts.push(t('files-same', { count: taken.same.length }));
  if (taken.folders) parts.push(t('files-folders-made', { count: taken.folders }));
  if (taken.problems.length) parts.push(t('files-problems', { count: taken.problems.length }));
  return parts.join(', ') || t('files-taken-none');
}

/**
 * Takes files and folders in, into `folder`, a folder with the folders in
 * it where `structure` is asked for. How far it has come is shown at the
 * foot of the window, where it can be stopped; what came of it is told.
 */
export async function takeIn(
  paths: string[],
  folder: string | null,
  structure: boolean,
): Promise<TakenIn | null> {
  if (!paths.length) return null;
  const ticket = newId();
  dialogs.working = t('files-taking-in', { count: paths.length });
  dialogs.stop = () => void filesStop(ticket).catch(() => {});
  const unlisten = await onFilesProgress(ticket, ({ done, total, name }) => {
    if (name && total > 1)
      dialogs.working = t('files-taking-in-progress', { done: done + 1, count: total, name });
  });
  try {
    const taken = await filesTakeIn(paths, folder, structure, ticket);
    await files.reload();
    const words = takenWords(taken);
    // The bar offers to go through what is new, wherever it was hidden.
    if (taken.files.length) filesUi.barHidden.clear();
    if (taken.problems.length) notifyError(words, taken.problems.slice(0, 4).join('\n'));
    else notifyOk(words);
    return taken;
  } catch (error) {
    if (!(isBackendError(error) && error.kind === 'stopped'))
      notifyError(t('files-take-in-failed'), error);
    await files.reload();
    return null;
  } finally {
    unlisten();
    dialogs.working = null;
    dialogs.stop = null;
  }
}

/** Removes a file from the library, after asking, and saying which references it belongs to. */
export function removeFile(file: FileView): Promise<boolean> {
  const names = file.references.map(referenceWords).join(', ');
  return removeAsked(
    [file],
    t('files-remove-title', { name: file.name }),
    file.references.length
      ? t('files-remove-message-assigned', { count: file.references.length, names })
      : t('files-remove-message'),
  );
}

/** Removes several files at once, after asking once. */
export function removeFiles(chosen: FileView[]): Promise<boolean> {
  if (chosen.length === 1) return removeFile(chosen[0]);
  if (!chosen.length) return Promise.resolve(false);
  const assigned = chosen.filter((f) => f.references.length).length;
  return removeAsked(
    chosen,
    t('files-remove-many-title', { count: chosen.length }),
    assigned
      ? t('files-remove-many-assigned', { count: assigned })
      : t('files-remove-many-message'),
  );
}

/**
 * Asks, and removes the files in one step. Where the removal leaves
 * folders empty, the question says how many, and the folders go with the
 * files or stay, as answered; folders that were empty before are not
 * asked about, and stay.
 */
async function removeAsked(chosen: FileView[], title: string, message: string): Promise<boolean> {
  const hashes = chosen.map((f) => f.hash);
  const emptied = await filesLeftEmpty(hashes).catch(() => [] as string[]);
  const answer = await ask({
    title,
    message: emptied.length
      ? `${message} ${t('files-remove-folders-left', { count: emptied.length })}`
      : message,
    confirm: emptied.length ? t('files-remove-with-folders') : t('files-remove'),
    alternative: emptied.length ? t('files-remove-keep-folders') : undefined,
    danger: true,
  });
  if (answer === 'cancel') return false;
  if (chosen.length > 1) dialogs.working = t('files-removing', { count: chosen.length });
  try {
    const removed = await filesRemove(hashes, answer === 'confirm' && emptied.length > 0);
    if (chosen.length > 1 || removed.folders) {
      const parts = [t('files-removed', { count: removed.files })];
      if (removed.folders) parts.push(t('files-removed-folders', { count: removed.folders }));
      notifyOk(parts.join(', '));
    }
    return true;
  } catch (error) {
    notifyError(t('files-remove-failed'), error);
    return false;
  } finally {
    dialogs.working = null;
    await files.reload();
    if (chosen.some((f) => f.references.length)) await library.reload();
  }
}

/** Makes a file one of a reference's. */
export async function assign(file: FileView, id: string): Promise<void> {
  try {
    files.put(await fileAssign(file.hash, id));
    await library.reload();
  } catch (error) {
    notifyError(t('files-assign-failed'), error);
  }
}

/** Takes a file from a reference; it stays among the files. */
export async function unassign(file: FileView, id: string): Promise<void> {
  try {
    files.put(await fileUnassign(file.hash, id));
    await library.reload();
  } catch (error) {
    notifyError(t('files-unassign-failed'), error);
  }
}

/**
 * Keeps what a going-through did as the last, to be undone, with the
 * message that tells of it, and of what went wrong in it, and offers to:
 * the message of the one before is taken away, so that no two offers stand
 * together, and each undoes what it tells of, never what came after it.
 */
export function rememberGoing(done: Done, words: string, problems: string[] = []): void {
  if (filesUi.lastToast !== null) toasts.dismiss(filesUi.lastToast);
  filesUi.lastDone = done;
  if (problems.length) console.error(words, problems);
  filesUi.lastToast = toasts.show(
    {
      kind: problems.length ? 'error' : 'ok',
      message: words,
      detail: problems.length ? problems.slice(0, 4).join('\n') : undefined,
      action: { label: t('files-going-undo'), run: () => void undoLast(done) },
    },
    // It stays until it is dismissed: what was done to many is undone at once.
    0,
  );
}

/**
 * Undoes a going-through, the last where none is named, at once: each file
 * taken back from the reference it was given to, and the references made in
 * it removed, their files staying in the library. What was decided of those
 * files is forgotten, so that a going-through opened again starts from the
 * proposals. Only the last can be undone: one that came before it is not,
 * since what came after may have built on it.
 */
export async function undoLast(done?: Done): Promise<void> {
  const last = filesUi.lastDone;
  if (!last || (done && done !== last)) return;
  filesUi.lastDone = null;
  if (filesUi.lastToast !== null) toasts.dismiss(filesUi.lastToast);
  filesUi.lastToast = null;
  const problems: string[] = [];
  let back = 0;
  for (const { hash } of last.assigned) decisions.delete(hash);
  const pairs = last.assigned.filter((p) => p.id);
  try {
    if (pairs.length) await filesUnassign(pairs);
    back = last.assigned.length;
  } catch (error) {
    problems.push(describeError(error) ?? '');
  }
  let removed = 0;
  if (last.made.length) {
    try {
      removed = await libraryRemove(last.made, false);
    } catch (error) {
      problems.push(describeError(error) ?? '');
    }
  }
  await Promise.all([files.reload(), library.reload()]);
  const parts = [t('files-going-undone', { count: back })];
  if (removed) parts.push(t('files-going-undone-made', { count: removed }));
  const words = parts.join(', ');
  if (problems.length) notifyError(words, problems.slice(0, 4).join('\n'));
  else notifyOk(words);
}

/** Puts files in a folder, or at the top in none. */
export async function moveFiles(hashes: string[], folder: string | null): Promise<void> {
  const moving = hashes.filter((h) => (files.get(h)?.folder ?? null) !== folder);
  if (!moving.length) return;
  try {
    await filesMove(moving, folder);
  } catch (error) {
    notifyError(t('files-move-failed'), error);
  } finally {
    await files.reload();
  }
}

/** What a file is called in the lists. */
export async function renameFile(file: FileView, name: string): Promise<void> {
  const wanted = name.trim();
  if (!wanted || wanted === file.name) return;
  try {
    files.put(await fileRename(file.hash, wanted));
  } catch (error) {
    notifyError(t('files-rename-failed'), error);
  }
}

/** Takes a picture that is a file into the store of pictures, so that it can become a figure. */
export async function toPictures(file: { hash: string }): Promise<void> {
  try {
    const picture = await fileToPicture(file.hash);
    await pictures.reload();
    toasts.show({
      kind: 'ok',
      message: t('files-to-pictures-done', { name: picture.name }),
      action: {
        label: t('files-to-pictures-show'),
        run: () => router.go({ view: 'pictures', picture: picture.hash }),
      },
    });
  } catch (error) {
    notifyError(t('files-to-pictures-failed'), error);
  }
}

/**
 * Brings a document that is a file of the library in as elements: under
 * the element `under` of a project that is open, or as a project of its
 * own, which is then opened.
 */
export async function bringInFile(
  file: { path: string; name: string },
  project: Project | null = null,
  under: string = PROJECT,
): Promise<void> {
  const brought = await bringIn(file.path, project, under, { stored: true, name: file.name });
  if (!brought?.project) return;
  // The citations that were found in it are gone through when the project is open.
  if (brought.goThrough) goThroughWhenOpen(brought.project.id, brought.top);
  router.go({ view: 'project', project: brought.project.id, at: brought.top, mode: 'text' });
}
