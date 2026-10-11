/** What can be done to elements, wherever they are shown: the menu, and what is dragged. */

import Copy from '@lucide/svelte/icons/copy';
import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
import EyeOff from '@lucide/svelte/icons/eye-off';
import FileInput from '@lucide/svelte/icons/file-input';
import GitCompare from '@lucide/svelte/icons/git-compare';
import CircleDashed from '@lucide/svelte/icons/circle-dashed';
import Clock from '@lucide/svelte/icons/clock';
import Heading from '@lucide/svelte/icons/heading';
import LayoutGrid from '@lucide/svelte/icons/layout-grid';
import ListTree from '@lucide/svelte/icons/list-tree';
import Link2 from '@lucide/svelte/icons/link-2';
import MessageSquare from '@lucide/svelte/icons/message-square';
import MoveRight from '@lucide/svelte/icons/move-right';
import Pencil from '@lucide/svelte/icons/pencil';
import Plus from '@lucide/svelte/icons/plus';
import Scissors from '@lucide/svelte/icons/scissors';
import Tag from '@lucide/svelte/icons/tag';
import Trash2 from '@lucide/svelte/icons/trash-2';
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
import { canPaste } from './clipboard.svelte';
import { notify, notifyError, toasts } from '$lib/ui/toast.svelte';
import { openProject, projects } from '$lib/state/projects.svelte';
import { idOf, openElsewhere, type Elsewhere } from './elsewhere';
import { router } from '$lib/state/router.svelte';
import type { ProjectInfo } from '$lib/api/projects';
import { makePortable, portable } from './model/portable';
import type { Project } from './model/project.svelte';
import { PROJECT, STATUSES } from './model/types';
import { subtree, topmost, type Tree } from './model/tree';
import { carriedWithin, pickElement } from './picker.svelte';

/** What is dragged when elements are. */
export interface ElementsPayload {
  project: Project;
  /** The element in view where the drag began. */
  at: string;
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
  /** Hold the elements, to be pasted, copied or cut; paste what is held under the element. */
  copy?: (ids: string[]) => void;
  cut?: (ids: string[]) => void;
  paste?: (id: string) => void;
  /** Enter an element, making it the one in view: after elements went to it. */
  enter?: (id: string) => void;
  /** The element in view where the menu is opened: the picker of a target opens the way to it. */
  at?: string;
}

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

// ---- moving an element by the keys, in the diagram and in the text ----
//
// The tree is the one in view: its root, the element in view, stays where
// it is, as the project itself does, whatever the keys say.

/** Puts an element under the one before it. Returns whether it moved. */
export function indent(project: Project, tree: Tree, id: string): boolean {
  if (id === tree.root) return false;
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
  if (id === tree.root) return false;
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
  if (id === tree.root) return false;
  const parent = tree.parent.get(id) ?? null;
  if (!parent) return false;
  const list = tree.children.get(parent) ?? [];
  const i = list.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return false;
  project.checkpoint();
  // `move` counts places in the list as it is: to go down, past the next one.
  project.move([id], parent, by > 0 ? j + 1 : j, { pos: null });
  project.checkpoint();
  return true;
}

/** Removes elements, and says what went, with a way back. The project itself stays. */
export function removeElements(project: Project, ids: string[], keepChildren = false): number {
  const tree = project.tree();
  const tops = topmost(
    tree,
    ids.filter((id) => project.node(id)),
  ).filter((id) => id !== PROJECT);
  if (!tops.length) {
    if (ids.includes(PROJECT)) notify(t('project-itself-stays'), t('project-itself-stays-detail'));
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

function remove(project: Project, tree: Tree, tops: string[], keepChildren: boolean): number {
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

// ---- elements to another project (ADR 0033) ----

/** The project that is open, as the place says. */
function hereId(): string | null {
  const route = router.route;
  return route.view === 'project' ? route.project : null;
}

/** The element in view, as the place says. */
function routeAt(): string | undefined {
  const route = router.route;
  return route.view === 'project' ? route.at : undefined;
}

/** The projects other than this one, as the list of projects has them: this one may be the one beside. */
function otherProjects(project: Project): ProjectInfo[] {
  if (!projects.loaded) void projects.load();
  const here = idOf(project) ?? hereId();
  return projects.list.filter((p) => p.id !== here);
}

/**
 * Copies elements, each with all under it, to the end of an element of
 * another project, or of the project itself where none is named; that
 * project is not open: it is opened, written, saved and closed again. A
 * move then removes them here, in one step that undo takes back here.
 * Where writing there fails, nothing is removed here, and the failure is
 * thrown. Returns how many of the topmost went.
 */
export async function sendElements(
  project: Project,
  ids: string[],
  to: { project: string; at?: string },
  move: boolean,
  open: (id: string) => Promise<Elsewhere> = openElsewhere,
): Promise<number> {
  const tree = project.tree();
  const movable = topmost(
    tree,
    ids.filter((id) => project.node(id)),
  ).filter((id) => id !== PROJECT);
  const going = move ? movable : movable.length ? movable : ids;
  const carried = portable(project, going);
  if (!carried.elements.length) return 0;

  const there = await open(to.project);
  const written = (async () => {
    try {
      const under = to.at ?? PROJECT;
      if (!there.project.node(under)) throw new Error(t('project-send-no-element'));
      // A project open beside keeps its undo: what was made there is a step of its own.
      if (there.here) there.project.checkpoint();
      const made = makePortable(there.project, carried, { under });
      if (there.here) there.project.checkpoint();
      else there.project.undoManager.clear();
      await there.project.flush();
      if (there.project.status === 'error') throw new Error(there.project.saveError ?? '');
      return made.length;
    } finally {
      await there.close();
    }
  })();
  // What reads that project from disk meanwhile waits for it.
  projects.closing(to.project, written);
  const count = await written;

  if (move && count) {
    project.checkpoint();
    project.remove(movable);
    project.checkpoint();
  }
  return count;
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
  const tree = project.tree();
  const one = ids.length === 1 ? first : null;
  const isProject = ids.includes(PROJECT);
  const movable = topmost(tree, ids).filter((id) => id !== PROJECT);
  const nodes = ids.map((id) => project.node(id)!).filter(Boolean);
  // The trees of the project, under its own element: those the elements
  // can go to, which is every one but the one they stand in.
  const holding = project.pathTo(first.id)[1];
  const trees = (tree.children.get(PROJECT) ?? []).filter(
    (id) => id !== holding && !ids.includes(id),
  );
  const nameOf = (id: string) =>
    id === PROJECT ? project.name : project.node(id)?.title || t('project-untitled');
  const elsewhere = otherProjects(project);
  // The element in view, as the view says, or as the place says; else where the elements stand.
  const inView =
    [actions.at, routeAt()].find((id) => id && project.node(id)) ??
    tree.parent.get(first.id) ??
    PROJECT;
  const hasChildren = one ? (tree.children.get(one.id)?.length ?? 0) > 0 : false;
  const pinned = nodes.some((n) => n.pos && tree.parent.get(n.id));
  const branchPinned =
    pinned || ids.some((id) => subtree(tree, id).some((d) => d !== id && project.node(d)?.pos));

  // Copies or moves what is chosen to the end of an element of this project.
  const sendHere = (target: string, copy: boolean) => {
    project.checkpoint();
    const made = copy ? project.copy(movable, target) : project.move(movable, target);
    project.checkpoint();
    if (made.length) {
      toasts.show({
        kind: 'ok',
        message: copy
          ? t('project-copied-to', { name: nameOf(target) })
          : t('project-moved-to', { name: nameOf(target) }),
        action: { label: t('common-show'), run: () => actions.enter?.(target) },
      });
    }
  };

  // Any element of the project, chosen in its tree: not one carried, nor one under it.
  const chooseWhere = async (copy: boolean) => {
    const carried = carriedWithin(project.tree(), movable);
    const words = { count: movable.length, name: nameOf(movable[0]) };
    const target = await pickElement(project, {
      title: copy ? t('project-pick-copy-title', words) : t('project-pick-move-title', words),
      action: copy ? t('project-pick-copy') : t('project-pick-move'),
      refuse: (id) => (carried.has(id) ? t('project-pick-itself') : null),
      at: inView,
    });
    if (target) sendHere(target, copy);
  };

  // Where elements can go: anywhere in the tree, the project itself, its
  // other trees, and other projects.
  const targets = (copy: boolean): MenuItem[] => [
    { label: t('project-choose-where'), icon: ListTree, action: () => void chooseWhere(copy) },
    { kind: 'separator' },
    ...[PROJECT, ...trees].map((target): MenuItem => ({
      label: nameOf(target),
      action: () => sendHere(target, copy),
    })),
    ...(elsewhere.length
      ? ([
          { kind: 'separator' },
          { kind: 'heading', label: t('project-other-projects') },
        ] as MenuItem[])
      : []),
    ...elsewhere.map((info): MenuItem => ({
      label: info.name,
      action: () => {
        sendElements(project, ids, { project: info.id }, !copy).then(
          (count) => {
            if (!count) return;
            toasts.show({
              kind: 'ok',
              message: copy
                ? t('project-copied-to', { name: info.name })
                : t('project-moved-to', { name: info.name }),
              action: {
                label: t('common-show'),
                run: () => router.go({ view: 'project', project: info.id }),
              },
            });
          },
          (error) => notifyError(t('project-send-failed', { project: info.name }), error),
        );
      },
    })),
  ];

  // The trees an element can stand for in the document: not its own, and none that would loop.
  const includes: MenuItem[] = one
    ? (tree.children.get(PROJECT) ?? [])
        .filter((id) => id !== one.id && id !== holding)
        .map((id): MenuItem => ({
          label: nameOf(id),
          checked: one.include === id,
          disabled: one.include !== id && project.wouldLoop(one.id, id),
          action: () => {
            project.setInclude(one.id, one.include === id ? null : id);
          },
        }))
    : [];

  // Any element of the project, chosen in its tree, but itself and what would loop.
  const chooseIncluded = async (id: string) => {
    const target = await pickElement(project, {
      title: t('project-pick-stand-title', { name: nameOf(id) }),
      action: t('project-pick-stand'),
      refuse: (e) =>
        e === id
          ? t('project-pick-self')
          : project.wouldLoop(id, e)
            ? t('project-pick-loop')
            : null,
      at: project.node(id)?.include ?? inView,
    });
    if (target) project.setInclude(id, target);
  };

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
        label: isProject ? t('project-add') : t('project-add-after'),
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

  if (!isProject) {
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
    if (one) {
      items.push({
        kind: 'submenu',
        label: one.include
          ? t('project-stands-for', { name: nameOf(one.include) })
          : t('project-stand-for'),
        icon: FileInput,
        items: [
          {
            label: t('project-choose-element'),
            icon: ListTree,
            action: () => void chooseIncluded(one.id),
          },
          ...(includes.length
            ? ([
                { kind: 'separator' },
                { kind: 'heading', label: t('project-stand-for-heading') },
              ] as MenuItem[])
            : []),
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

  // Cut, copy and paste: for every element, the project itself too, which
  // cannot be cut or copied but has what is pasted put under it.
  if (actions.copy && actions.paste) {
    // In the text, the keys cut, copy and paste the text.
    const keyed = where !== 'text';
    if (movable.length && actions.cut)
      items.push({
        label: t('project-cut'),
        icon: Scissors,
        shortcut: keyed ? 'Ctrl+X' : undefined,
        action: () => actions.cut?.(movable),
      });
    if (movable.length)
      items.push({
        label: t('project-copy'),
        icon: Copy,
        shortcut: keyed ? 'Ctrl+C' : undefined,
        action: () => actions.copy?.(movable),
      });
    if (one)
      items.push({
        label: t('project-paste-under'),
        icon: ClipboardPaste,
        shortcut: keyed ? 'Ctrl+V' : undefined,
        disabled: !canPaste(project),
        action: () => actions.paste?.(one.id),
      });
  }
  if (movable.length) {
    items.push(
      { kind: 'submenu', label: t('project-copy-to'), icon: Copy, items: targets(true) },
      { kind: 'submenu', label: t('project-move-to'), icon: MoveRight, items: targets(false) },
    );
  }
  if (one?.origin) {
    items.push({
      label: t('copy-compare'),
      icon: GitCompare,
      action: () => compareCopy(one.id),
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
