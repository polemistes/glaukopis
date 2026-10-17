/**
 * The changes of folders and projects made on the home, in the list, the
 * pane and the owl map alike: each is made, said in a message, and
 * remembered with its way back, so that it can be undone from the message
 * or by the keys (see `undo.svelte.ts`). A change that fails is said where
 * it is asked for: those that ask for a name throw, so that the dialog or
 * the field can say why; the others say it themselves.
 */

import type { Folder, ProjectInfo } from '$lib/api/projects';
import { projectTrash } from '$lib/api/projects';
import { sharingRename } from '$lib/api/sharing';
import { t } from '$lib/i18n';
import { projects } from '$lib/state/projects.svelte';
import { confirm } from '$lib/ui/confirm.svelte';
import type { DragPayload } from '$lib/ui/drag.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { ancestors, descendants, folderOf, parentOf } from './folders';
import { listUi } from './list.svelte';
import { homeUndo } from './undo.svelte';

const folderName = (id: string | null) => (id ? projects.folder(id)?.name : undefined);
const projectNamed = (id: string) => projects.list.find((p) => p.id === id);
const shown = (folder: string | null) => listUi.reveal(ancestors(projects.folders, folder));

async function nameProject(p: ProjectInfo, name: string) {
  await projects.rename(p.id, name);
  // Those who share it are told the name by the server; the server itself takes no harm from failing.
  if (p.sharing?.owner) sharingRename(p.id, name).catch(() => {});
}

/** Renames a project. */
export async function renameProject(p: ProjectInfo, name: string) {
  const old = p.name;
  if (name === old) return;
  await nameProject(p, name);
  homeUndo.remember({
    message: t('home-renamed', { old, name }),
    undo: () => nameProject(p, old),
    redo: () => nameProject(p, name),
  });
}

/** Renames a folder. */
export async function renameFolder(f: Folder, name: string) {
  const old = f.name;
  if (name === old) return;
  await projects.renameFolder(f.id, name);
  homeUndo.remember({
    message: t('home-renamed', { old, name }),
    undo: () => projects.renameFolder(f.id, old),
    redo: () => projects.renameFolder(f.id, name),
  });
}

/** Brings a project back from the trash, the last it went there: what undoes its making or its deletion. */
async function bringBack(id: string) {
  const entry = (await projectTrash()).find((x) => x.info.id === id);
  if (!entry) throw new Error(t('home-not-in-trash'));
  await projects.restore(entry.entry);
}

/** Makes a project, in a folder or in none. */
export async function makeProject(name: string, folder: string | null): Promise<ProjectInfo> {
  const made = await projects.create(name, folder);
  shown(folder);
  homeUndo.remember({
    message: t('home-project-made', { name: made.name }),
    undo: () => projects.remove(made.id),
    redo: () => bringBack(made.id),
  });
  return made;
}

/** Makes a copy of a project, beside it. */
export async function copyProject(p: ProjectInfo, name: string): Promise<ProjectInfo> {
  const made = await projects.duplicate(p.id, name);
  homeUndo.remember({
    message: t('home-project-made', { name: made.name }),
    undo: () => projects.remove(made.id),
    redo: () => bringBack(made.id),
  });
  return made;
}

/** Makes a folder, in another or at the top. */
export async function makeFolder(name: string, parent: string | null): Promise<Folder> {
  const made = await projects.createFolder(name, parent);
  shown(parent);
  homeUndo.remember({
    message: t('home-folder-made', { name: made.name }),
    undo: () => projects.deleteFolder(made.id),
    redo: async () => {
      await projects.createFolder(made.name, parent, made.id);
    },
  });
  return made;
}

/** What is moved: projects and folders, by id. */
export interface Things {
  projects: string[];
  folders: string[];
}

/** What is dragged when several are: the projects and folders of the selection on the owl map. */
export const THINGS = 'home-things';

/** What a payload dragged on the home carries: one project, one folder, or several of both. */
export function thingsOf(payload: DragPayload): Things | null {
  if (payload.kind === 'project') return { projects: [payload.data as string], folders: [] };
  if (payload.kind === 'folder') return { projects: [], folders: [payload.data as string] };
  if (payload.kind === THINGS) return payload.data as Things;
  return null;
}

/** Whether anything of what is dragged would move, dropped into a folder or at the top. */
export function wouldMove(things: Things, into: string | null): boolean {
  const folders = projects.folders;
  return (
    things.projects.some((id) => {
      const p = projectNamed(id);
      return !!p && folderOf(folders, p) !== into;
    }) ||
    things.folders.some((id) => {
      const f = projects.folder(id);
      return !!f && parentOf(folders, f) !== into && !(into && descendants(folders, id).has(into));
    })
  );
}

/**
 * Moves projects and folders into a folder, or out of all folders. What is
 * there already stays, and a folder is not put into itself or into what
 * lies under it. One change, undone as one. Whether anything moved.
 */
export async function moveThings(things: Things, into: string | null): Promise<boolean> {
  const folders = projects.folders;
  const moves: { kind: 'project' | 'folder'; id: string; from: string | null; name: string }[] = [];
  for (const id of things.projects) {
    const p = projectNamed(id);
    if (!p) continue;
    const from = folderOf(folders, p);
    if (from !== into) moves.push({ kind: 'project', id, from, name: p.name });
  }
  for (const id of things.folders) {
    const f = projects.folder(id);
    if (!f) continue;
    const from = parentOf(folders, f);
    if (from === into || (into && descendants(folders, id).has(into))) continue;
    moves.push({ kind: 'folder', id, from, name: f.name });
  }
  if (!moves.length) return false;
  const put = async (kind: 'project' | 'folder', id: string, folder: string | null) => {
    if (kind === 'project') await projects.moveToFolder(id, folder);
    else await projects.moveFolder(id, folder);
  };
  const done: typeof moves = [];
  try {
    for (const m of moves) {
      await put(m.kind, m.id, into);
      done.push(m);
    }
  } catch (error) {
    notifyError(t('home-move-failed'), error);
    if (!done.length) return false;
  }
  shown(into);
  const target = folderName(into);
  homeUndo.remember({
    message:
      done.length === 1
        ? target
          ? t('home-moved-to', { name: done[0].name, folder: target })
          : t('home-moved-out', { name: done[0].name })
        : target
          ? t('home-moved-many-to', { count: done.length, folder: target })
          : t('home-moved-many-out', { count: done.length }),
    undo: async () => {
      for (const m of done.slice().reverse()) await put(m.kind, m.id, m.from);
    },
    redo: async () => {
      for (const m of done) await put(m.kind, m.id, into);
    },
  });
  return true;
}

/** A folder as it was before it was deleted, and what lay right in it. */
interface Deleted {
  folder: Folder;
  parent: string | null;
  folders: string[];
  projects: string[];
}

function asItWas(f: Folder): Deleted {
  const folders = projects.folders;
  return {
    folder: f,
    parent: parentOf(folders, f),
    folders: folders.filter((x) => parentOf(folders, x) === f.id).map((x) => x.id),
    projects: projects.list.filter((p) => folderOf(folders, p) === f.id).map((p) => p.id),
  };
}

/** Makes a deleted folder again as it was, under its own id, and puts back what was in it. */
async function makeAgain(d: Deleted) {
  await projects.createFolder(d.folder.name, d.parent, d.folder.id);
  for (const id of d.folders) await projects.moveFolder(id, d.folder.id);
  for (const id of d.projects) await projects.moveToFolder(id, d.folder.id);
}

/**
 * Deletes projects and folders, when that is confirmed: the projects go to
 * the trash, and what is in a folder moves up to where the folder was. One
 * change, undone as one. Whether anything was deleted.
 */
export async function deleteThings(things: Things): Promise<boolean> {
  const folders = things.folders.map((id) => projects.folder(id)).filter((f) => !!f);
  const list = things.projects.map(projectNamed).filter((p) => !!p);
  if (!folders.length && !list.length) return false;
  if (folders.length && !(await askFolders(folders))) return false;
  if (list.length && !(await askProjects(list))) return false;

  const gone: Deleted[] = [];
  const trashed: ProjectInfo[] = [];
  try {
    // One at a time, each as the folders then stand: a folder in another
    // that is deleted too has moved up by then.
    for (const f of folders) {
      const now = projects.folder(f.id);
      if (!now) continue;
      const d = asItWas(now);
      await projects.deleteFolder(f.id);
      gone.push(d);
    }
    for (const p of list) {
      await projects.remove(p.id);
      trashed.push(p);
    }
  } catch (error) {
    notifyError(t('home-delete-failed'), error);
    if (!gone.length && !trashed.length) return false;
  }
  const message =
    gone.length + trashed.length > 1
      ? t('home-deleted-many', { count: gone.length + trashed.length })
      : gone.length
        ? t('home-folder-deleted', { name: gone[0].folder.name })
        : t('home-deleted', { name: trashed[0].name });
  homeUndo.remember({
    message,
    undo: async () => {
      for (const p of trashed) await bringBack(p.id);
      for (const d of gone.slice().reverse()) await makeAgain(d);
    },
    redo: async () => {
      for (const d of gone) await projects.deleteFolder(d.folder.id);
      for (const p of trashed) await projects.remove(p.id);
    },
  });
  return true;
}

function askFolders(folders: Folder[]): Promise<boolean> {
  return confirm(
    folders.length === 1
      ? {
          title: t('home-folder-delete-title', { name: folders[0].name }),
          message: t('home-folder-delete-message'),
          confirm: t('home-folder-delete-confirm'),
          danger: true,
        }
      : {
          title: t('home-folders-delete-title', { count: folders.length }),
          message: t('home-folders-delete-message'),
          confirm: t('home-folders-delete-confirm'),
          danger: true,
        },
  );
}

function askProjects(list: ProjectInfo[]): Promise<boolean> {
  if (list.length === 1) {
    const p = list[0];
    return confirm({
      title: t('home-delete-title', { name: p.name }),
      message: p.sharing
        ? p.sharing.owner
          ? t('home-delete-owner')
          : t('home-delete-member')
        : t('home-delete-message'),
      confirm: t('home-delete-confirm'),
      danger: true,
    });
  }
  return confirm({
    title: t('home-delete-many-title', { count: list.length }),
    message: list.some((p) => p.sharing)
      ? t('home-delete-many-shared')
      : t('home-delete-many-message'),
    confirm: t('home-delete-many-confirm'),
    danger: true,
  });
}
