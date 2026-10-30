/**
 * Where a file is shown from (ADR 0069, 0072): from the library, a
 * reference, the images, a citation or the references of a document, it
 * goes among the sources beside the text: to the file side there is, as a
 * tab, or to its tab where it has one; else the other side becomes a file
 * side of the project beside it. The text one writes never gives way to the
 * source one reads.
 *
 * From the library, a file is added to the tabs of a project chosen from a
 * menu, and nothing on screen changes (ADR 0074): the notice that says so
 * shows it there.
 */

import type { ProjectInfo } from '$lib/api/projects';
import { t } from '$lib/i18n';
import { sides } from '$lib/project/sides.svelte';
import { testHook } from '$lib/shell/testing';
import { projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';
import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { toasts } from '$lib/ui/toast.svelte';
import { withFile } from './sources';
import { sourcesStore } from './sources.svelte';

/** Shows a file of the library among the sources; the window comes back for it. */
export function showFile(hash: string, page?: number) {
  const place = page ? { page, at: 0 } : undefined;
  if (router.route.view === 'project' || router.route.view === 'file') {
    sides.showFile(hash, place);
    return;
  }
  // The window is laid out as it was kept, with the file among its sources.
  router.go({ view: 'file', file: hash, page });
}

/**
 * Adds files to the tabs of a project, in the order given, each after the
 * tab shown and the last of them shown; a file among them already is not
 * given twice. Nothing on screen changes: a notice says what was done, and
 * its *Show* opens the project with the last of them.
 */
export function addToTabs(project: string, hashes: string[]) {
  if (!hashes.length) return;
  sourcesStore.change(
    project,
    (s) => hashes.reduce((tabs, hash) => withFile(tabs, hash).sources, s),
    (before, after) => {
      const name = projects.list.find((p) => p.id === project)?.name ?? '';
      const added = after.tabs.length > before.tabs.length;
      toasts.show({
        kind: 'ok',
        message: t(added ? 'files-added-to-tabs' : 'files-already-in-tabs', { project: name }),
        action: {
          label: t('files-show-tabs'),
          run: () => router.go({ view: 'file', file: hashes[hashes.length - 1], project }),
        },
      });
    },
  );
}

/** The project the window was last in, where it is still there. */
function lastProject(): string | null {
  const last = router.lastProject;
  return sides.lastProject ?? (last?.view === 'project' ? last.project : null);
}

/**
 * The projects to add files to, as items of a menu: the one the window was
 * last in first, then the others by name.
 */
export function tabsItems(hashes: string[]): MenuItem[] {
  const item = (p: ProjectInfo): MenuItem => ({
    label: p.name,
    action: () => addToTabs(p.id, hashes),
  });
  const last = projects.list.find((p) => p.id === lastProject());
  const rest = projects.list
    .filter((p) => p !== last)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item);
  if (!last && !rest.length)
    return [{ label: t('files-tabs-no-project'), disabled: true, action: () => {} }];
  if (!last) return rest;
  return [item(last), ...(rest.length ? [{ kind: 'separator' } as MenuItem] : []), ...rest];
}

/** Opens the menu of projects to add files to, from what was pressed. */
export async function addToTabsMenu(anchor: HTMLElement, hashes: string[]) {
  if (!projects.loaded) await projects.load();
  openMenu(anchor, tabsItems(hashes), { align: 'start' });
}

/** Whether there is a project to add files to; the projects are read where they were not. */
export function anyProject(): boolean {
  if (!projects.loaded) void projects.load();
  return projects.list.length > 0;
}

/** A second tab of a file: at the place of its tab where it has one, else the file shown. For the scripts. */
function again(hash: string) {
  for (const side of sides.sides) {
    const tab = sides.tabs(side.key).tabs.find((t) => t.file === hash);
    if (tab) {
      sides.again(side.key, tab.id);
      return;
    }
  }
  showFile(hash);
}

testHook('__glaukopisViewer', { show: showFile, beside: showFile, again, addToTabs });
