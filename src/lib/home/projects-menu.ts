/**
 * The menu of all projects, which the chevron at the start of a path opens
 * (ADR 0063): the folders as submenus and the projects as items, in the
 * order the list at the left has them, the projects shown in the sides
 * marked.
 */

import Book from '@lucide/svelte/icons/book';
import FolderIcon from '@lucide/svelte/icons/folder';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { t } from '$lib/i18n';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { byName, folderOf, parentOf } from './folders';

export interface ProjectsMenuOptions {
  /** The projects shown in the sides, by id: marked. */
  shown: readonly string[];
  /** A project is chosen. */
  choose: (project: string) => void;
  /** A folder whose menu alone is wanted, as a folder of a path opens it. */
  at?: string | null;
}

/**
 * The folders as submenus and the projects as items, in the list's order:
 * under each folder its folders, then its projects, each by name. A folder
 * `at` gives the menu of that folder alone. An empty folder is a disabled
 * submenu that says so.
 */
export function projectsMenu(
  folders: readonly Folder[],
  list: readonly ProjectInfo[],
  options: ProjectsMenuOptions,
): MenuItem[] {
  const all = folders as Folder[];
  const walk = (parent: string | null, seen: Set<string>): MenuItem[] => {
    const out: MenuItem[] = [];
    for (const f of all.filter((f) => parentOf(all, f) === parent).sort(byName)) {
      // A folder that would lie in itself, which the folders on disk should never say, is not followed round.
      if (seen.has(f.id)) continue;
      const items = walk(f.id, new Set([...seen, f.id]));
      out.push({
        kind: 'submenu',
        label: f.name,
        icon: FolderIcon,
        disabled: !items.length,
        items: items.length
          ? items
          : [{ label: t('home-folder-empty'), disabled: true, action: () => {} }],
      });
    }
    for (const p of list.filter((p) => folderOf(all, p) === parent).sort(byName))
      out.push({
        label: p.name,
        icon: Book,
        checked: options.shown.includes(p.id),
        action: () => options.choose(p.id),
      });
    return out;
  };
  const at = options.at && all.some((f) => f.id === options.at) ? options.at : null;
  const items = walk(at, new Set(at ? [at] : []));
  return items.length || !at
    ? items
    : [{ label: t('home-folder-empty'), disabled: true, action: () => {} }];
}
