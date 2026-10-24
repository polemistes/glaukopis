/** What can be done to elements, wherever they are shown: the menu, and what is dragged. */

import Copy from '@lucide/svelte/icons/copy';
import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
import EyeOff from '@lucide/svelte/icons/eye-off';
import FileText from '@lucide/svelte/icons/file-text';
import FileInput from '@lucide/svelte/icons/file-input';
import GitCompare from '@lucide/svelte/icons/git-compare';
import CircleDashed from '@lucide/svelte/icons/circle-dashed';
import Clock from '@lucide/svelte/icons/clock';
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
import type { SaidWords } from '$lib/timeline/solve';
import { keysFor } from '$lib/shell/keys.svelte';
import { commentsUi } from '$lib/comments/ui.svelte';
import { aboutDocumentUi } from '$lib/document/about-document.svelte';
import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
import { goThrough } from '$lib/found/found.svelte';
import { truncate } from '$lib/library/format';
import { confirm } from '$lib/ui/confirm.svelte';
import { sayWhen } from '$lib/timeline/when.svelte';
import { kindColour } from './kinds';
import { manageKinds, newKind } from './kinds.svelte';
import { PARTS, partsAmong, type PartSpec } from './parts';
import { documents } from '$lib/preview/documents.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { compareCopy } from './copies.svelte';
import { canPaste } from './clipboard.svelte';
import { notify, notifyError, toasts } from '$lib/ui/toast.svelte';
import { openProject, projects } from '$lib/state/projects.svelte';
import { lastStep, openElsewhere, openProjectId, removeCarried, type Elsewhere } from './elsewhere';
import { router } from '$lib/state/router.svelte';
import type { ProjectInfo } from '$lib/api/projects';
import { makePortable, portable } from './model/portable';
import type { Project } from './model/project.svelte';
import { PROJECT, STATUSES } from './model/types';
import { subtree, topmost, type Tree } from './model/tree';
import { carriedWithin, pickElement } from './picker.svelte';
import { sideApis } from './side-api.svelte';
import { sides } from './sides.svelte';

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
  /** Begin a comment on the element, or on a passage of it, as the view does it; where the view does not say, on the element. */
  comment?: (id: string) => void;
  /** The element in view where the menu is opened: the picker of a target opens the way to it. */
  at?: string;
  /** Brings a document in, as a branch under the element; where the view does not say, the menu does it itself. */
  documentInto?: (id: string) => void;
}

/**
 * A document chosen among the files is brought in as a branch under an
 * element, and shown in the text of the side that shows the project, the
 * active one where both do; a document of found citations is gone through.
 */
async function documentInto(project: Project, id: string) {
  const path = await chooseDocument();
  if (!path) return;
  const brought = await bringIn(path, project, id);
  if (!brought) return;
  const spec = [sides.active, ...sides.sides].find((s) => {
    const api = s ? sideApis.get(s.key) : undefined;
    return api?.open.project === project;
  });
  if (spec) sideApis.get(spec.key)?.goTo(brought.top, { mode: 'text' });
  if (brought.goThrough) goThrough(brought.top);
}

/** The words with which a placement in time is said, in the language of the interface. */
export function saidWords(): SaidWords {
  return {
    after: (name) => t('when-said-after-name', { name }),
    before: (name) => t('when-said-before-name', { name }),
    during: (name) => t('when-said-during-name', { name }),
    between: t('ui-list-between'),
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
  // Read before the removal: after it the element is no longer there to ask.
  const hadText = !(project.node(tops[0])?.empty ?? true);
  project.checkpoint();
  const gone = project.remove(tops, { keepChildren });
  project.checkpoint();
  if (gone > 1 || under > 0 || hadText) {
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

/** The element in view, as the place says. */
function routeAt(): string | undefined {
  const route = router.route;
  return route.view === 'project' ? route.at : undefined;
}

/** The projects other than this one, as the list of projects has them: this one may be the one beside. */
function otherProjects(project: Project): ProjectInfo[] {
  if (!projects.loaded) void projects.load();
  const here = openProjectId(project);
  return projects.list.filter((p) => p.id !== here);
}

/**
 * Copies elements, each with all under it, to the end of an element of
 * another project, or of the project itself where none is named; that
 * project, where it is not open, is opened, written, saved and closed
 * again. A move then removes them here, in one step that undo takes back
 * here; to a project open beside, that step and the one there are one.
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
  /** The step that made them there, where that project is open beside. */
  let step: ReturnType<typeof lastStep>;
  const written = (async () => {
    try {
      const under = to.at ?? PROJECT;
      if (!there.project.node(under)) throw new Error(t('project-send-no-element'));
      // A project open beside keeps its undo: what was made there is a step
      // of its own, paired below with the step that removes it here.
      if (there.here) there.project.checkpoint();
      const made = makePortable(there.project, carried, { under });
      if (there.here) {
        there.project.checkpoint();
        step = made.length ? lastStep(there.project) : undefined;
      } else there.project.undoManager.clear();
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
    // To a project open beside, the two steps are one, as for a drag: undone
    // in either, the elements are back in the other (ADR 0053).
    if (there.here && there.project !== project)
      removeCarried(there.project, step, project, movable);
    else {
      project.checkpoint();
      project.remove(movable);
      project.checkpoint();
    }
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

  // The original of a clone, entered as the view enters an element; where the view does not say, in the side that shows the project.
  const goToOriginal = (id: string) => {
    if (actions.enter) return actions.enter(id);
    const spec = [sides.active, ...sides.sides].find(
      (s) => s && sideApis.get(s.key)?.open.project === project,
    );
    if (spec) sideApis.get(spec.key)?.goTo(id);
  };

  // Any element of the project, chosen in its tree, but itself and what would loop; of a clone, its original.
  const chooseIncluded = async (id: string) => {
    const target = await pickElement(project, {
      title: t('project-pick-clone-title', { name: nameOf(id) }),
      action: t('project-pick-clone'),
      refuse: (e) => {
        const original = project.originalOf(e);
        return e === id || original === id
          ? t('project-pick-clone-self')
          : !original || project.wouldLoop(id, original)
            ? t('project-pick-loop')
            : null;
      },
      at: project.node(id)?.include ?? inView,
    });
    if (target) project.setInclude(id, target);
  };

  const items: MenuItem[] = [];

  // A clone has nothing of its own but its name (ADR 0065).
  const clone = !!one?.include;

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
        label: t('project-add-child'),
        icon: CornerDownRight,
        shortcut: keysFor('tree-new-under'),
        disabled: clone,
        action: () => add('under'),
      },
      // The project itself has no siblings: one item adds under it.
      ...(isProject
        ? []
        : [
            {
              label: t('project-add-sibling'),
              icon: Plus,
              shortcut: keysFor('tree-new'),
              action: () => add('after'),
            },
          ]),
      { kind: 'separator' },
    );
    if (actions.edit)
      items.push({
        label: t('project-write-text'),
        icon: Pencil,
        shortcut: keysFor('tree-open'),
        disabled: clone,
        action: () => actions.edit!(one.id),
      });
    if (actions.rename)
      items.push({
        label: t('common-rename'),
        shortcut: keysFor('tree-rename'),
        action: () => actions.rename!(one.id),
      });
    // What the document of the element is, and a document brought in under it.
    items.push(
      {
        label: t('about-menu'),
        icon: FileText,
        shortcut: keysFor('document-settings'),
        action: () => aboutDocumentUi.open({ project, at: one.id }),
      },
      {
        label: t('project-document-into'),
        icon: FileInput,
        action: () =>
          actions.documentInto ? actions.documentInto(one.id) : void documentInto(project, one.id),
      },
    );
    if (actions.link)
      items.push({
        label: t('project-associate'),
        icon: Link2,
        action: () => actions.link!(one.id),
      });
    items.push({
      label: t('comments-comment-on'),
      icon: MessageSquare,
      shortcut: keysFor('comment'),
      action: () => (actions.comment ? actions.comment(one.id) : commentsUi.begin(one.id)),
    });
    items.push({
      label: t('when-stamp'),
      icon: Clock,
      action: () => sayWhen(one.id),
    });
    items.push({ kind: 'separator' });
  }

  // What kind of element what is chosen is: a kind of the project; a kind
  // of the catalogue of parts of a document that the template of the
  // first element puts in hand, or that the project uses already; any of
  // the catalogue, by group, under "More…" (ADR 0038).
  const kindSaid = nodes.every((n) => n.kind === nodes[0].kind) ? nodes[0].kind : undefined;
  const chosen = documents.choice(project.documentOf(first.id).settings, project).template;
  const template = documents.templateCached(chosen) ?? project.templateCopy(chosen);
  const inHand = partsAmong([
    ...(template?.kinds ?? []),
    ...(template?.contents ?? []).flatMap((c) => ('kind' in c ? [c.kind] : [])),
    ...project.catalogueKindsInUse(),
  ]);
  const partItem = (p: PartSpec): MenuItem => ({
    label: p.label(),
    checked: kindSaid === p.id,
    action: () => project.setKind(ids, p.id),
  });
  const separator = { kind: 'separator' } as MenuItem;
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
      ...(project.kinds.length && inHand.length ? [separator] : []),
      ...inHand.map(partItem),
      ...(project.kinds.length || inHand.length ? [separator] : []),
      {
        kind: 'submenu',
        label: t('parts-more'),
        items: PARTS.map(partItem),
      },
      separator,
      {
        label: t('kinds-none-of-them'),
        checked: kindSaid === null,
        action: () => project.setKind(ids, null),
      },
      separator,
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
    const allOut = nodes.every((n) => n.excluded);
    items.push({
      label: t('project-leave-out'),
      icon: EyeOff,
      checked: allOut,
      action: () =>
        project.transact(() => nodes.forEach((n) => project.setExcluded(n.id, !allOut))),
    });
    if (one?.include) {
      const original = one.include;
      items.push({
        kind: 'submenu',
        label: t('project-clone-of', { name: nameOf(original) }),
        icon: FileInput,
        items: [
          {
            label: t('project-clone-choose'),
            icon: ListTree,
            action: () => void chooseIncluded(one.id),
          },
          { label: t('project-clone-go'), action: () => goToOriginal(original) },
          { kind: 'separator' },
          { label: t('project-clone-none'), action: () => project.setInclude(one.id, null) },
        ],
      });
    } else if (one) {
      // Only an element without text or sub-elements can become a clone.
      items.push({
        label: t('project-clone-other'),
        icon: FileInput,
        disabled: !one.empty || hasChildren,
        action: () => void chooseIncluded(one.id),
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
        shortcut: keyed ? keysFor('diagram-cut') : undefined,
        action: () => actions.cut?.(movable),
      });
    if (movable.length)
      items.push({
        label: t('project-copy'),
        icon: Copy,
        shortcut: keyed ? keysFor('diagram-copy') : undefined,
        action: () => actions.copy?.(movable),
      });
    if (one)
      items.push({
        label: t('project-paste-under'),
        icon: ClipboardPaste,
        shortcut: keyed ? keysFor('diagram-paste') : undefined,
        disabled: clone || !canPaste(project),
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
        label: t('project-delete-promote'),
        icon: Scissors,
        action: () => removeElements(project, ids, true),
      });
    }
    // What goes with them is said where there is any.
    const withChildren = movable.some((id) => (tree.children.get(id)?.length ?? 0) > 0);
    items.push({
      label: withChildren ? t('project-delete-with') : t('common-delete'),
      icon: Trash2,
      danger: true,
      shortcut: keysFor('tree-delete'),
      action: () => removeElements(project, ids),
    });
  }
  return items;
}
