/** What can be done to elements, wherever they are shown: the menu, and what is dragged. */

import Copy from '@lucide/svelte/icons/copy';
import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
import EyeOff from '@lucide/svelte/icons/eye-off';
import FileInput from '@lucide/svelte/icons/file-input';
import GitBranchPlus from '@lucide/svelte/icons/git-branch-plus';
import Heading from '@lucide/svelte/icons/heading';
import LayoutGrid from '@lucide/svelte/icons/layout-grid';
import Link2 from '@lucide/svelte/icons/link-2';
import MoveRight from '@lucide/svelte/icons/move-right';
import Pencil from '@lucide/svelte/icons/pencil';
import Plus from '@lucide/svelte/icons/plus';
import Scissors from '@lucide/svelte/icons/scissors';
import Trash2 from '@lucide/svelte/icons/trash-2';
import Unlink from '@lucide/svelte/icons/unlink';
import { t } from '$lib/i18n';
import { truncate } from '$lib/library/format';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { notify, toasts } from '$lib/ui/toast.svelte';
import type { Project } from './model/project.svelte';
import { subtree, topmost } from './model/tree';

/** What is dragged when elements are. */
export interface ElementsPayload {
  project: Project;
  map: string;
  ids: string[];
  /** From the centre of the first element to the pointer, on the canvas. */
  grab: { x: number; y: number };
}

export interface ElementActions {
  /** Begin writing the name of the element. */
  rename?: (id: string) => void;
  /** Open the text of the element for writing. */
  edit?: (id: string) => void;
  /** Select elements, after some were made or moved. */
  select?: (ids: string[]) => void;
  /** Begin an association from the element: the next element clicked is its other end. */
  link?: (id: string) => void;
  /** Show a map, after elements went to it or it was made. */
  openMap?: (id: string) => void;
}

/** Removes elements, and says what went, with a way back. */
export function removeElements(project: Project, ids: string[], keepChildren = false): number {
  const first = project.node(ids[0]);
  if (!first) return 0;
  const tree = project.tree(first.map);
  const tops = topmost(tree, ids).filter((id) => id !== tree.root);
  if (!tops.length) {
    if (ids.includes(tree.root ?? ''))
      notify(t('project-centre-stays'), t('project-centre-stays-detail'));
    return 0;
  }
  const name = project.node(tops[0])?.title || t('project-untitled');
  const under = keepChildren ? 0 : tops.reduce((n, id) => n + subtree(tree, id).length - 1, 0);
  project.checkpoint();
  const gone = project.remove(tops, { keepChildren });
  project.checkpoint();
  if (gone > 1 || under > 0 || !(project.node(tops[0])?.empty ?? true)) {
    toasts.show(
      {
        kind: 'info',
        message:
          tops.length === 1
            ? t('project-deleted', { name: truncate(name, 40), under })
            : t('project-deleted-many', { count: gone }),
        action: { label: t('common-undo'), run: () => project.undo() },
      },
      7000,
    );
  }
  return gone;
}

export function elementMenu(
  project: Project,
  ids: string[],
  actions: ElementActions,
  anchor: HTMLElement | null = null,
): MenuItem[] {
  const first = project.node(ids[0]);
  if (!first) return [];
  const tree = project.tree(first.map);
  const one = ids.length === 1 ? first : null;
  const isRoot = ids.includes(tree.root ?? '');
  const movable = topmost(tree, ids).filter((id) => id !== tree.root);
  const nodes = ids.map((id) => project.node(id)!).filter(Boolean);
  const otherMaps = project.maps.filter((m) => m.id !== first.map);
  const hasChildren = one ? (tree.children.get(one.id)?.length ?? 0) > 0 : false;
  const pinned = nodes.some((n) => n.pos && tree.parent.get(n.id));
  const branchPinned =
    pinned || ids.some((id) => subtree(tree, id).some((d) => d !== id && project.node(d)?.pos));

  const toMap = (copy: boolean): MenuItem[] => [
    ...otherMaps.map((m): MenuItem => ({
      label: m.name,
      action: () => {
        project.checkpoint();
        const target = m.root;
        const made = copy
          ? project.copy(movable.length ? movable : ids, target)
          : project.move(movable, target);
        project.checkpoint();
        if (made.length) {
          toasts.show({
            kind: 'ok',
            message: copy
              ? t('project-copied-to', { name: m.name })
              : t('project-moved-to', { name: m.name }),
            action: { label: t('common-show'), run: () => actions.openMap?.(m.id) },
          });
        }
      },
    })),
  ];

  const includes: MenuItem[] = one
    ? [
        ...project.maps
          .filter((m) => m.id !== one.map)
          .map((m): MenuItem => ({
            label: m.name,
            checked: one.include === m.id,
            disabled: one.include !== m.id && project.wouldLoop(one.map, m.id),
            action: () => {
              project.setInclude(one.id, one.include === m.id ? null : m.id);
            },
          })),
      ]
    : [];

  const items: MenuItem[] = [];

  if (one) {
    items.push(
      {
        label: t('project-add-under'),
        icon: CornerDownRight,
        shortcut: 'Tab',
        action: () => {
          project.checkpoint();
          const id = project.addChild(one.id);
          if (id) {
            actions.select?.([id]);
            actions.rename?.(id);
          }
        },
      },
      {
        label: isRoot ? t('project-add') : t('project-add-after'),
        icon: Plus,
        shortcut: 'Enter',
        action: () => {
          project.checkpoint();
          const id = project.addSibling(one.id);
          if (id) {
            actions.select?.([id]);
            actions.rename?.(id);
          }
        },
      },
      { kind: 'separator' },
    );
    if (actions.edit)
      items.push({
        label: t('project-write-text'),
        icon: Pencil,
        shortcut: t('project-double-click'),
        action: () => actions.edit!(one.id),
      });
    if (actions.rename)
      items.push({
        label: t('common-rename'),
        shortcut: 'F2',
        action: () => actions.rename!(one.id),
      });
    if (actions.link)
      items.push({
        label: t('project-associate'),
        icon: Link2,
        hint: t('project-associate-hint'),
        action: () => actions.link!(one.id),
      });
    items.push({ kind: 'separator' });
  }

  if (!isRoot) {
    const allPlain = nodes.every((n) => !n.heading);
    const allOut = nodes.every((n) => n.excluded);
    items.push(
      {
        label: t('project-heading'),
        icon: Heading,
        hint: t('project-heading-hint'),
        checked: !allPlain,
        action: () =>
          project.transact(() => nodes.forEach((n) => project.setHeading(n.id, allPlain))),
      },
      {
        label: t('project-leave-out'),
        icon: EyeOff,
        hint: t('project-leave-out-hint'),
        checked: allOut,
        action: () =>
          project.transact(() => nodes.forEach((n) => project.setExcluded(n.id, !allOut))),
      },
    );
    if (one && (includes.length || one.include)) {
      items.push({
        kind: 'submenu',
        label: one.include
          ? t('project-stands-for', { name: project.map(one.include)?.name ?? '?' })
          : t('project-stand-for'),
        icon: FileInput,
        items: [
          { kind: 'heading', label: t('project-stand-for-heading') },
          ...includes,
          ...(one.include
            ? ([
                { kind: 'separator' },
                {
                  label: t('project-stand-for-none'),
                  action: () => project.setInclude(one.id, null),
                },
              ] as MenuItem[])
            : []),
        ],
      });
    }
    items.push({ kind: 'separator' });
  }

  if (movable.length || (one && !otherMaps.length)) {
    if (otherMaps.length) {
      items.push(
        { kind: 'submenu', label: t('project-copy-to-map'), icon: Copy, items: toMap(true) },
        {
          kind: 'submenu',
          label: t('project-move-to-map'),
          icon: MoveRight,
          disabled: !movable.length,
          items: toMap(false),
        },
      );
    }
  }
  if (one && !isRoot) {
    items.push({
      label: t('project-map-from-branch'),
      icon: GitBranchPlus,
      hint: t('project-map-from-branch-hint'),
      action: () => {
        const id = project.mapFromBranch(one.id);
        if (id) actions.openMap?.(id);
      },
    });
  }
  if (one && !isRoot && tree.parent.get(one.id)) {
    items.push({
      label: t('project-detach'),
      icon: Unlink,
      hint: t('project-detach-hint'),
      action: () => {
        project.checkpoint();
        project.move([one.id], null);
        project.checkpoint();
      },
    });
  }
  if (branchPinned) {
    items.push({
      label: one && hasChildren ? t('project-tidy-branch') : t('project-place-automatically'),
      icon: LayoutGrid,
      action: () => {
        project.checkpoint();
        project.tidy(ids);
        project.checkpoint();
      },
    });
  }

  if (movable.length) {
    items.push({ kind: 'separator' });
    if (one && hasChildren) {
      items.push({
        label: t('project-delete-keeping'),
        icon: Scissors,
        action: () => removeElements(project, ids, true),
      });
    }
    items.push({
      label: t('common-delete'),
      icon: Trash2,
      danger: true,
      shortcut: 'Del',
      action: () => removeElements(project, ids),
    });
  }
  return items;
}
