/** What can be done to elements, wherever they are shown: the menu, and what is dragged. */

import Copy from '@lucide/svelte/icons/copy';
import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
import EyeOff from '@lucide/svelte/icons/eye-off';
import FileInput from '@lucide/svelte/icons/file-input';
import GitBranchPlus from '@lucide/svelte/icons/git-branch-plus';
import GitCompare from '@lucide/svelte/icons/git-compare';
import CircleDashed from '@lucide/svelte/icons/circle-dashed';
import Clock from '@lucide/svelte/icons/clock';
import Heading from '@lucide/svelte/icons/heading';
import LayoutGrid from '@lucide/svelte/icons/layout-grid';
import Link2 from '@lucide/svelte/icons/link-2';
import MessageSquare from '@lucide/svelte/icons/message-square';
import MoveRight from '@lucide/svelte/icons/move-right';
import Pencil from '@lucide/svelte/icons/pencil';
import Plus from '@lucide/svelte/icons/plus';
import Scissors from '@lucide/svelte/icons/scissors';
import Tag from '@lucide/svelte/icons/tag';
import Trash2 from '@lucide/svelte/icons/trash-2';
import Unlink from '@lucide/svelte/icons/unlink';
import { languages, t } from '$lib/i18n';
import { commentsUi } from '$lib/comments/ui.svelte';
import { truncate } from '$lib/library/format';
import { confirm } from '$lib/ui/confirm.svelte';
import { describeWhen } from '$lib/timeline/solve';
import { sayWhen } from '$lib/timeline/when.svelte';
import { kindColour } from './kinds';
import { manageKinds, newKind } from './kinds.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { compareCopy } from './copies.svelte';
import { notify, toasts } from '$lib/ui/toast.svelte';
import type { Project } from './model/project.svelte';
import { STATUSES } from './model/types';
import { subtree, topmost, type Tree } from './model/tree';

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
  /**
   * Make a new element after the one given, or under it, and begin its name,
   * as the view does it; where the view does not say, the menu does it itself.
   */
  add?: (id: string, where: 'after' | 'under') => void;
  /** Begin an association from the element: the next element clicked is its other end. */
  link?: (id: string) => void;
  /** Show a map, after elements went to it or it was made. */
  openMap?: (id: string) => void;
}

// ---- moving an element by the keys, in the diagram and in the text ----

/** Puts an element under the one before it. Returns whether it moved. */
/** The words with which a placement in time is said. */
export function saidWords() {
  return {
    after: t('when-said-after'),
    before: t('when-said-before'),
    during: t('when-said-during'),
    to: t('when-said-to'),
    approx: t('when-said-approx'),
  };
}

export function indent(project: Project, tree: Tree, id: string): boolean {
  const parent = tree.parent.get(id) ?? null;
  if (!parent) return false;
  const siblings = tree.children.get(parent) ?? [];
  const i = siblings.indexOf(id);
  if (i <= 0) return false;
  project.checkpoint();
  project.move([id], siblings[i - 1], undefined, { pos: null });
  project.checkpoint();
  return true;
}

/** Puts an element beside its parent, after it. Returns whether it moved. */
export function outdent(project: Project, tree: Tree, id: string): boolean {
  const parent = tree.parent.get(id) ?? null;
  if (!parent || parent === tree.root) return false;
  const grand = tree.parent.get(parent) ?? null;
  if (!grand) return false;
  const list = tree.children.get(grand) ?? [];
  project.checkpoint();
  project.move([id], grand, list.indexOf(parent) + 1, { pos: null });
  project.checkpoint();
  return true;
}

/** Moves an element one place up or down among those beside it. Returns whether it moved. */
export function shift(project: Project, tree: Tree, id: string, by: -1 | 1): boolean {
  const parent = tree.parent.get(id) ?? null;
  const list = parent ? (tree.children.get(parent) ?? []) : tree.loose;
  const i = list.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return false;
  project.checkpoint();
  // `move` counts places in the list as it is: to go down, past the next one.
  project.move([id], parent, by > 0 ? j + 1 : j, parent ? { pos: null } : {});
  project.checkpoint();
  return true;
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
  // What another is writing in when it is deleted is lost with it, and no undo brings it back.
  const going = keepChildren ? tops : tops.flatMap((id) => subtree(tree, id));
  const busy = [...new Set(going.flatMap((id) => project.othersAt(id).map((o) => o.name)))];
  if (busy.length) {
    void confirm({
      title: t('project-delete-busy-title'),
      message: t('project-delete-busy-message', {
        count: busy.length,
        names: new Intl.ListFormat(languages.current, { type: 'conjunction' }).format(busy),
      }),
      confirm: t('project-delete-busy-confirm'),
      danger: true,
    }).then((sure) => sure && remove(project, tree, tops, keepChildren));
    return 0;
  }
  return remove(project, tree, tops, keepChildren);
}

function remove(
  project: Project,
  tree: ReturnType<Project['tree']>,
  tops: string[],
  keepChildren: boolean,
): number {
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
  /** Where the menu is opened, for the keys it shows beside adding: the diagram's, or the text's. */
  where: 'diagram' | 'text' = 'diagram',
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
    const add = (how: 'after' | 'under') => {
      if (actions.add) return actions.add(one.id, how);
      project.checkpoint();
      const id = how === 'under' ? project.addChild(one.id) : project.addSibling(one.id);
      if (id) {
        actions.select?.([id]);
        actions.rename?.(id);
      }
    };
    items.push(
      {
        label: t('project-add-under'),
        icon: CornerDownRight,
        shortcut: where === 'text' ? 'Alt+Shift+Enter' : 'Tab',
        action: () => add('under'),
      },
      {
        label: isRoot ? t('project-add') : t('project-add-after'),
        icon: Plus,
        shortcut: where === 'text' ? 'Alt+Enter' : 'Enter',
        action: () => add('after'),
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
    items.push({
      label: t('comments-comment-on'),
      icon: MessageSquare,
      shortcut: 'Ctrl+Alt+C',
      action: () => commentsUi.begin(one.id),
    });
    items.push({
      label: one.when ? t('when-change') : t('when-say'),
      icon: Clock,
      hint: one.when
        ? describeWhen(
            one.when,
            (id) => project.node(id)?.title || t('project-untitled'),
            saidWords(),
          )
        : undefined,
      action: () => sayWhen(one.id),
    });
    items.push({ kind: 'separator' });
  }

  // What kind of element what is chosen is.
  const kindSaid = nodes.every((n) => n.kind === nodes[0].kind) ? nodes[0].kind : undefined;
  items.push({
    kind: 'submenu',
    label: t('kinds-kind'),
    icon: Tag,
    items: [
      ...project.kinds.map((k): MenuItem => ({
        label: k.name,
        colour: kindColour(k.colour).ink,
        checked: kindSaid === k.id,
        action: () => project.setKind(ids, k.id),
      })),
      ...(project.kinds.length
        ? [
            { kind: 'separator' } as MenuItem,
            {
              label: t('kinds-none-of-them'),
              checked: kindSaid === null,
              action: () => project.setKind(ids, null),
            } as MenuItem,
          ]
        : []),
      { kind: 'separator' },
      { label: t('kinds-new-ellipsis'), icon: Plus, action: () => newKind(ids) },
      ...(project.kinds.length
        ? [{ label: t('kinds-manage'), action: () => manageKinds() } as MenuItem]
        : []),
    ],
  });

  // How far the writing of what is chosen has come.
  const said = nodes.every((n) => n.status === nodes[0].status) ? nodes[0].status : undefined;
  items.push(
    {
      kind: 'submenu',
      label: t('status'),
      icon: CircleDashed,
      items: [
        ...STATUSES.map((status): MenuItem => ({
          label: t(`status-${status}`),
          checked: said === status,
          action: () => project.setStatus(ids, status),
        })),
        { kind: 'separator' },
        {
          label: t('status-none'),
          checked: said === null,
          action: () => project.setStatus(ids, null),
        },
      ],
    },
    { kind: 'separator' },
  );

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
  if (one?.origin) {
    items.push({
      label: t('copy-compare'),
      icon: GitCompare,
      action: () => compareCopy(one.id),
    });
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
