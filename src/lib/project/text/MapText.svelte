<script lang="ts">
  import { notify, notifyOk } from '$lib/ui/toast.svelte';
  import {
    canPaste,
    copyElements,
    cutElements,
    pasteElements,
    pastesUnderItself,
  } from '../clipboard.svelte';
  import { TextSelection } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { prosemirrorToYXmlFragment } from 'y-prosemirror';
  import * as Y from 'yjs';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ChevronsDownUp from '@lucide/svelte/icons/chevrons-down-up';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import FoldVertical from '@lucide/svelte/icons/fold-vertical';
  import MapIcon from '@lucide/svelte/icons/map';
  import UnfoldVertical from '@lucide/svelte/icons/unfold-vertical';
  import Merge from '@lucide/svelte/icons/merge';
  import Pencil from '@lucide/svelte/icons/pencil';
  import SplitSquareVertical from '@lucide/svelte/icons/split-square-vertical';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { widthFor } from '$lib/editor/commands';
  import type { KeyAction } from '$lib/editor/plugins';
  import type RichText from '$lib/editor/RichText.svelte';
  import type { FocusAt } from '$lib/editor/RichText.svelte';
  import { bodySchema } from '$lib/editor/schema';
  import { editorUi, viewsByDom } from '$lib/editor/ui.svelte';
  import { citationLabel } from '$lib/editor/references.svelte';
  import { numbering, pointerText } from '$lib/figures/numbering.svelte';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { takeJump, type Jump } from '$lib/search/everything.svelte';
  import SearchBar from '$lib/search/SearchBar.svelte';
  import { remembered, TextSearch, type Surface } from '$lib/search/text.svelte';
  import { truncate } from '$lib/library/format';
  import { t } from '$lib/i18n';
  import { keyLabel, keyOf, keysFor } from '$lib/shell/keys.svelte';
  import { selectedPassage } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import { drag, dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import { pointRect } from '$lib/ui/floating';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import {
    elementMenu,
    indent as indentElement,
    outdent as outdentElement,
    shift as shiftElement,
    type ElementActions,
    type ElementsPayload,
  } from '../elements';
  import { openDrawnWordMenu } from '$lib/spelling/drawn';
  import { replaceWhenShown } from '$lib/spelling/menu';
  import { carryAcross } from '../elsewhere';
  import type { Project } from '../model/project.svelte';
  import { isAncestor } from '../model/tree';
  import { pieces } from '../pieces';
  import type { Folding } from './folding.svelte';
  import { headingAt, nameDoc } from './heading';
  import {
    bracketsOf,
    depthAt,
    dropChoices,
    dropIndent,
    GUTTER,
    joinable as joinableIn,
    lineBetween,
    marginWidth as marginFor,
    nearestChoice,
    outlineNumbers,
    placeAt,
    textRows,
    totalsOf,
    type Bracket,
    type Row,
  } from './layout';
  import TextSection, { type Part } from './TextSection.svelte';
  import { progressOf, progressWords } from '../status';
  import { settings } from '$lib/state/settings.svelte';
  import { reviewing } from '$lib/review/context';
  import type { Change } from '$lib/review/grouping';

  interface Props {
    project: Project;
    /** The element in view: the title of the document, whose branch is the text. */
    at: string;
    onkeep: (id: string) => void;
    /** Enters an element: it becomes the one in view. */
    onenter: (id: string) => void;
    /** Goes up, to the element over the one in view, where there is one to go up to. */
    onleave?: () => void;
    /** Whether the pane of the text has the focus: only there is the cursor put in an empty text when it is shown. */
    focused?: boolean;
    /** An element to bring into view when the map appears. */
    reveal?: string | null;
    /** What is folded away in the text of the project. */
    folding: Folding;
    /** Whether the outline of the map stands beside the text, which then wants to know what is at the top. */
    outline?: boolean;
    /**
     * Called with the element at the top of what is in view, for the outline
     * and for the view as it is kept: when it changes, not at every scroll.
     */
    ontop?: (id: string | null) => void;
    /**
     * The element the text was read at when the view was left: brought to the
     * top as the text is first shown, neither selected nor marked; once.
     */
    top?: string | null;
    /**
     * Another project, shown in the other pane: elements dragged from it
     * are carried here, copied, or moved and taken away there (ADR 0037).
     */
    besideProject?: Project | null;
  }

  let {
    project,
    at,
    onkeep,
    onenter,
    onleave,
    focused = true,
    reveal = null,
    folding,
    outline = false,
    ontop,
    top = null,
    besideProject = null,
  }: Props = $props();

  /** Whether what is dragged is elements this text takes: its own, or those of the project beside. */
  function takes(data: ElementsPayload): boolean {
    return data.project === project || (!!besideProject && data.project === besideProject);
  }

  /** How wide the outline is, as it was last dragged. */

  const KEPT_ACTIVE = 10;

  interface DropSlot {
    /** Where the elements go: under which, at which place among those under it. */
    parent: string;
    index: number;
    /** How deep they would stand, from one, for the elements under the one in view. */
    depth: number;
    label: string;
    /** Where the line is drawn in the column, and how far in. */
    top: number;
    indent: number;
  }

  let root = $state<HTMLDivElement>();
  let scroller = $state<HTMLDivElement>();
  let column = $state<HTMLDivElement>();
  /** Elements whose editors are there, the most recently used last. */
  let active = $state<string[]>([]);
  let focus = $state<{ id: string; part: Part; at: FocusAt } | null>(null);
  let current = $state<string | null>(null);

  // The others are told which element this user is at.
  $effect(() => {
    project.at(current);
  });
  let linkFrom = $state<string | null>(null);
  let drop = $state<{ id: string; where: 'before' | 'after' | 'inside' } | null>(null);
  /** Where elements dragged in the text would go, if dropped now: see `slotAt`. */
  let slot = $state<DropSlot | null>(null);
  let labelling = $state<{ id: string; value: string; top: number } | null>(null);

  const editors = new Map<
    string,
    { title?: ReturnType<typeof RichText>; body?: ReturnType<typeof RichText> }
  >();

  const tree = $derived(project.tree(at));
  /** How far the writing of the branch has come, where its elements say. */
  const progress = $derived(progressOf(project, at));

  /** Every element of the branch, the one in view first, those that are folded away as well. */
  const all = $derived(
    textRows(
      tree,
      (id) => project.nodes.get(id),
      (id) => folding.has(id),
    ),
  );

  /** The elements that are shown. */
  const rows = $derived(all.filter((r) => !r.away));

  /** How deep each element stands is shown, on the screen only: see `Settings.textDepth`. */
  const depthShown = $derived(settings.value.textDepth ?? 'numbers');

  /**
   * The numbers of the elements, as in an outline: 1, 1.2, 1.2.3, counted
   * among those whose names are printed as headings, what is folded away
   * as well, so that they do not change as it is folded.
   */
  const numbers = $derived(
    depthShown === 'numbers'
      ? outlineNumbers(all, (id) => !!project.nodes.get(id)?.heading)
      : new Map<string, string>(),
  );

  // ---- the element at the top of what is in view, for the outline ----

  let atTop = $state<string | null>(null);
  let topFrame = 0;
  /** Until when the element gone to from the outline stays marked, whatever is at the top. */
  let heldUntil = 0;
  /** Looked for where the text begins, a little under the top: one point, however long the text. */
  function findTop() {
    cancelAnimationFrame(topFrame);
    topFrame = requestAnimationFrame(() => {
      // The end of a text cannot be scrolled to the top: the element gone to stays marked.
      if (!scroller || !column || performance.now() < heldUntil) return;
      const box = scroller.getBoundingClientRect();
      const x = column.getBoundingClientRect().left + 8;
      for (const dy of [24, 64, 128, 256]) {
        const at = document
          .elementFromPoint(x, box.top + dy)
          ?.closest<HTMLElement>('[data-section]')?.dataset.section;
        if (at) {
          atTop = at;
          return;
        }
      }
    });
  }
  $effect(() => {
    if (outline) untrack(findTop);
  });
  $effect(() => {
    const top = atTop;
    untrack(() => ontop?.(top));
  });

  /**
   * As the text is first shown: the element it was read at when the view was
   * left, at the top, as the outline brings it there but neither selected nor
   * unfolded; not where another element is to be shown. One look-up, however
   * long the text.
   */
  async function readFromTop() {
    const id = untrack(() => top);
    if (!id || untrack(() => reveal)) return;
    await tick();
    const section = scroller?.querySelector(`[data-section="${id}"]`);
    if (!section) return;
    heldUntil = performance.now() + 400;
    section.scrollIntoView({ block: 'start' });
    atTop = id;
  }

  /** From the outline: the element, at the top of the view, unfolded where it was folded away. */
  export async function goTo(id: string) {
    if (folding.reveal(tree, id)) await tick();
    heldUntil = performance.now() + 400;
    scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'start' });
    atTop = id;
  }

  // What is folded away is counted as well: it is in the document.
  const totals = $derived(totalsOf(all, (id) => project.nodes.get(id)));

  /**
   * What is counted, as it is shown under the text: a moment behind the
   * writing, so that the window does not paint at every key all that
   * stands between the line that is written and the count.
   */
  let counted = $state.raw(untrack(() => totals));
  $effect(() => {
    const now = totals;
    if (now.words === counted.words && now.notes === counted.notes) return;
    const timer = setTimeout(() => (counted = now), 500);
    return () => clearTimeout(timer);
  });

  // What is said under the text besides the count, with the keys shown as keys.
  const keysHint = $derived(
    pieces((m) => t('text-keys', m), {
      alt: keyLabel('Alt'),
      shift: keyLabel('Shift'),
      enter: keyLabel('Enter'),
      at: '@',
    }),
  );
  const linkingHint = $derived(pieces((m) => t('text-hint-linking', m), { esc: keyLabel('Esc') }));

  // ---- activation and focus ----

  function activate(id: string, part: Part, at: FocusAt) {
    const mounted = editors.get(id)?.[part];
    current = id;
    const was = active.includes(id);
    if (was && mounted) {
      mounted.focus(at);
      return;
    }
    focus = { id, part, at };
    const kept = active.filter((a) => a !== id);
    // The one with the focus is never let go.
    while (kept.length >= KEPT_ACTIVE) kept.shift();
    active = [...kept, id];
    // Its editors are there, or being made, but not yet known here: one that
    // is made already does not look at where the cursor is to go again, so
    // it is put there when it is known.
    if (was) {
      void tick().then(() => {
        if (focus?.id !== id || focus.part !== part) return;
        editors.get(id)?.[part]?.focus(at);
      });
    }
  }

  async function go(id: string | undefined | null, part: Part, at: FocusAt) {
    if (!id) return;
    // What is folded away is shown before the cursor goes there.
    let opened = folding.reveal(tree, id);
    if (part === 'body' && folding.has(id)) {
      folding.open(id);
      opened = true;
    }
    if (opened) await tick();
    activate(id, part, at);
    await tick();
    scroller
      ?.querySelector(`[data-section="${id}"] [data-part="${part}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
  }

  $effect(() => {
    // What is active must be in view.
    const inside = new Set(tree.sequence);
    const present = active.filter((id) => inside.has(id));
    if (present.length !== active.length) active = present;
  });

  $effect(() => {
    const id = reveal;
    if (!id) return;
    untrack(async () => {
      folding.reveal(tree, id);
      await tick();
      scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'start' });
      current = id;
    });
  });

  // ---- folding away what is under an element ----

  /** Folds what is under an element away, or opens it; with `all`, opens all that is folded under it. */
  function fold(id: string, everything = false) {
    if (everything) folding.openAll(tree, id);
    else folding.toggle(tree, id);
    if (!folding.hides(tree, id)) return;
    // The cursor does not stay in what is no longer shown: in the name of
    // the element folded, as after Tab there, it stays.
    const at = document.activeElement as HTMLElement | null;
    const inName =
      current === id &&
      at?.closest<HTMLElement>('[data-part]')?.dataset.part === 'title' &&
      at.closest<HTMLElement>('[data-section]')?.dataset.section === id;
    if (current && !inName && (current === id || folding.under(tree, id).includes(current))) {
      if (at && scroller?.contains(at)) at.blur();
      current = id;
    }
    tick().then(() =>
      scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'nearest' }),
    );
  }

  /**
   * Shift+Tab: where anything under the element in view is folded, unfolds
   * all of it; else folds everything at the first level, as the diagram
   * does. The cursor, where it would be folded away, goes to the name it is
   * folded under.
   */
  function foldEverything() {
    const root = tree.root;
    if (folding.anyFoldedUnder(tree, root)) folding.openAll(tree, root);
    else
      for (const child of tree.children.get(root) ?? [])
        if (folding.can(tree, child)) folding.fold(child);
    const under = current ? folding.hiddenUnder(tree, current) : null;
    if (under) void go(under, 'title', 'end');
  }

  /** Whether its text is not shown: folded away, or empty, when it is closed until it is pressed or Enter is pressed in the name. */
  function textClosed(id: string): boolean {
    return folding.hides(tree, id) || !!project.node(id)?.empty;
  }

  /** Where the cursor lands in an element it comes to from below: at the end of its text, or of its name when that is all that is shown. */
  function endOf(id: string): Part {
    return textClosed(id) ? 'title' : 'body';
  }

  /** Those of the others who are at an element, or at what is folded away under it. */
  function othersAt(row: Row) {
    const own = project.othersAt(row.id);
    if (!row.hidden || !project.others.length) return own;
    return [...own, ...row.hidden.ids.flatMap((id) => project.othersAt(id))];
  }

  function indexOf(id: string): number {
    return rows.findIndex((r) => r.id === id);
  }

  // ---- changes of structure from the text ----

  const indent = (id: string) => indentElement(project, tree, id);
  const outdent = (id: string) => outdentElement(project, tree, id);
  const shift = (id: string, by: -1 | 1) => shiftElement(project, tree, id, by);

  /** Where a new element made from the text of another goes: the first under it, where it has elements under it or is the one in view, so that it stands where the cursor was; else after it. */
  function madeFrom(id: string, under: boolean): string | null {
    const hasChildren = (tree.children.get(id)?.length ?? 0) > 0;
    return under || id === tree.root || hasChildren
      ? project.addChild(id, { index: 0 })
      : project.addSibling(id);
  }

  /**
   * A heading at the cursor (see `heading.ts`): what follows the cursor in
   * its paragraph becomes the name of a new element, where a name can hold
   * it, and the paragraphs below it the new element's text; after this
   * element, or with `under` the first under it.
   */
  function split(id: string, view: EditorView, under = false) {
    const { state } = view;
    const heading = headingAt(state.doc, state.selection.from);
    const body = heading.body.size
      ? bodySchema.topNodeType.createAndFill(null, heading.body)
      : null;
    // What could not be made a text of its own is not cut from this one.
    if (heading.body.size && !body) return;
    const name = heading.name?.size ? heading.name : null;

    project.checkpoint();
    const made = project.transact(() => {
      const newId = madeFrom(id, under);
      if (!newId) return null;
      const title = name ? project.fragment(newId, 'title') : null;
      if (name && title) prosemirrorToYXmlFragment(nameDoc(name), title);
      const target = body ? project.fragment(newId, 'body') : null;
      if (body && target) prosemirrorToYXmlFragment(body, target);
      return newId;
    });
    if (made && heading.cutFrom < TextSelection.atEnd(state.doc).from) {
      view.dispatch(state.tr.delete(heading.cutFrom, state.doc.content.size));
    }
    project.checkpoint();
    if (!made) return;
    if (heading.keptAsParagraph) notify(t('text-heading-kept'));
    go(made, 'title', name ? 'end' : 'start');
  }

  /**
   * In a name, with the cursor before its end: the rest of the name becomes
   * the name of a new element after this one, or the first under it, and
   * the text stays where it is. Whether there was a rest to take.
   */
  function splitName(id: string, view: EditorView, under: boolean): boolean {
    const { state } = view;
    const { from } = state.selection;
    const cursor = state.selection.$from;
    if (!cursor.parent.isTextblock) return false;
    const rest = cursor.parent.content.cut(cursor.parentOffset);
    if (!rest.size) return false;
    project.checkpoint();
    const made = project.transact(() => {
      const newId =
        under || id === tree.root ? project.addChild(id, { index: 0 }) : project.addSibling(id);
      const title = newId ? project.fragment(newId, 'title') : null;
      if (title) prosemirrorToYXmlFragment(nameDoc(rest), title);
      return newId;
    });
    if (made) view.dispatch(state.tr.delete(from, cursor.end()));
    project.checkpoint();
    if (made) go(made, 'title', 'start');
    return true;
  }

  /** A new element after this one, the cursor in its name. The centre has nothing beside it: the first under it. */
  function addAfter(id: string) {
    project.checkpoint();
    const made = id === tree.root ? project.addChild(id, { index: 0 }) : project.addSibling(id);
    project.checkpoint();
    if (made) go(made, 'title', 'start');
  }

  /** A new element under this one, the first, right after its text: the cursor in its name. */
  function addUnder(id: string) {
    project.checkpoint();
    const made = project.addChild(id, { index: 0 });
    project.checkpoint();
    if (made) go(made, 'title', 'start');
  }

  /**
   * A new element where the cursor is, after the element or under it: in a
   * text, a heading at the cursor; in a name, with the rest of the name, or
   * at its end with nothing in it.
   */
  function addHere(id: string, part: Part | undefined, under = false) {
    const view = part ? editors.get(id)?.[part]?.getView() : undefined;
    if (part === 'body' && view) return split(id, view, under);
    if (part === 'title' && view && splitName(id, view, under)) return;
    if (under) addUnder(id);
    else addAfter(id);
  }

  /**
   * From the tools over the text: a new element after the one the cursor is
   * in, under it, or from the cursor on. Before the cursor has been anywhere,
   * the first element is the one.
   */
  export function newElement(what: 'after' | 'under' | 'split') {
    const id = current ?? rows[0]?.id;
    if (!id) return;
    if (what === 'under') return addUnder(id);
    if (what === 'after') return addAfter(id);
    const view = editors.get(id)?.body?.getView();
    if (view && view.hasFocus()) split(id, view);
    else addAfter(id);
  }

  /** Whether an element can be joined to the one shown before it: see `joinable` in `layout`. */
  const joinable = (id: string) => joinableIn(rows, tree, id);

  /** Joins an element to the one before it in the text. Its name, if it has one, becomes a paragraph. */
  function merge(id: string) {
    const i = indexOf(id);
    const node = project.node(id);
    if (!node || !joinable(id)) return;
    const before = rows[i - 1];
    const target = project.fragment(before.id, 'body');
    const source = project.fragment(id, 'body');
    if (!target || !source) return;
    project.checkpoint();
    project.transact(() => {
      const blocks: (Y.XmlElement | Y.XmlText)[] = source
        .toArray()
        .map((b) => b.clone() as Y.XmlElement);
      if (node.title) {
        const name = new Y.XmlElement('paragraph');
        name.insert(0, [new Y.XmlText(node.title)]);
        blocks.unshift(name);
      }
      target.insert(target.length, blocks);
      project.remove([id]);
    });
    project.checkpoint();
    go(before.id, 'body', 'end');
  }

  function onaction(id: string, part: Part, action: KeyAction, view: EditorView): boolean {
    const i = indexOf(id);
    switch (action) {
      case 'enter':
        // In a name: on to the text.
        if (part === 'title') {
          go(id, 'body', 'start');
          return true;
        }
        return false;
      case 'down-out':
        // Past a text that is folded away or empty, which the arrows do not open.
        if (part === 'title' && !textClosed(id)) go(id, 'body', 'start');
        else if (rows[i + 1]) go(rows[i + 1].id, 'title', 'start');
        else return false;
        return true;
      case 'up-out':
        if (part === 'body') go(id, 'title', 'end');
        else if (rows[i - 1]) go(rows[i - 1].id, endOf(rows[i - 1].id), 'end');
        else return false;
        return true;
      case 'backspace-at-start': {
        if (part === 'body') {
          go(id, 'title', 'end');
          return true;
        }
        // In an empty name of an empty element: the element goes.
        const node = project.node(id);
        if (
          node &&
          !node.title &&
          node.empty &&
          id !== tree.root &&
          !(tree.children.get(id)?.length ?? 0)
        ) {
          const previous = rows[i - 1];
          project.checkpoint();
          project.remove([id]);
          project.checkpoint();
          if (previous) go(previous.id, endOf(previous.id), 'end');
          return true;
        }
        if (rows[i - 1]) {
          go(rows[i - 1].id, endOf(rows[i - 1].id), 'end');
          return true;
        }
        return false;
      }
      case 'delete-at-end':
        return false;
      // In a name, Tab folds what is under the element, or unfolds it, and
      // Shift+Tab all under the element in view; in a text, Tab that nothing
      // else takes does nothing: the cursor stays in the text.
      case 'tab':
        if (part === 'title') fold(id);
        return true;
      case 'shift-tab':
        if (part === 'title') foldEverything();
        return true;
      case 'escape':
        if (editorUi.picking || editorUi.citation) return false;
        // The search over the text is closed first; the cursor stays where it is.
        if (searching) {
          closeSearch(false);
          return true;
        }
        (view.dom as HTMLElement).blur();
        return true;
    }
    return false;
  }

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    // Ctrl+F searches the text and Ctrl+H replaces; F3 goes on to the next that is found.
    const letter = keyOf(event);
    const plain = mod && !event.altKey && !event.shiftKey;
    if (event.key === 'F3' || (plain && (letter === 'f' || letter === 'h'))) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key !== 'F3') find(letter === 'h');
      else if (!searching) find(false);
      else if (event.shiftKey) searching.previous();
      else searching.next();
      return;
    }
    const section = (event.target as HTMLElement).closest<HTMLElement>('[data-section]');
    const id = section?.dataset.section;
    if (!id) return;

    // Alt+Enter a new element after this one, and Alt+Shift+Enter one under
    // it, as in the diagram: in a text, a heading at the cursor.
    if (event.key === 'Enter' && event.altKey && !mod) {
      const part = (event.target as HTMLElement).closest<HTMLElement>('[data-part]')?.dataset
        .part as Part | undefined;
      event.preventDefault();
      event.stopPropagation();
      addHere(id, part, event.shiftKey);
      return;
    }

    // F2 goes to the name of the element the cursor is in, the name selected.
    if (event.key === 'F2' && !mod && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      void go(id, 'title', 'all');
      return;
    }

    // Alt+Shift and the arrows down and up go in and out: down makes the
    // element the one in view; up, to the element over the one in view, is
    // the view's, and is let through to it. Sideways they do nothing here.
    const alt = event.altKey && !mod;
    if (alt && event.shiftKey && event.key.startsWith('Arrow')) {
      if (event.key === 'ArrowUp') return;
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'ArrowDown' && id !== tree.root) onenter(id);
      return;
    }

    // Alt and the arrows move the element, as in the diagram: up and down
    // among those beside it, right deeper and left less deep. The cursor
    // stays where it is in the text.
    if (alt && event.key.startsWith('Arrow')) {
      let done = false;
      if (event.key === 'ArrowUp') done = shift(id, -1);
      else if (event.key === 'ArrowDown') done = shift(id, 1);
      else if (event.key === 'ArrowRight') done = indent(id);
      else if (event.key === 'ArrowLeft') done = outdent(id);
      else return;
      event.preventDefault();
      event.stopPropagation();
      if (done) {
        // The section is moved in the page, which takes the focus from its
        // editor: it is given back, the cursor where it was.
        const part = (event.target as HTMLElement).closest<HTMLElement>('[data-part]')?.dataset
          .part as Part | undefined;
        const view = part ? editors.get(id)?.[part]?.getView() : undefined;
        tick().then(() => {
          if (view && !view.isDestroyed && !view.hasFocus()) view.focus();
          scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'nearest' });
        });
      }
    }
  }

  // ---- searching the text ----

  let searching = $state<TextSearch | null>(null);
  let bar = $state<ReturnType<typeof SearchBar>>();

  /** The elements that are in view, and those a screen above and below it: only they are marked. */
  function inView(): Set<string> {
    const out = new Set<string>();
    if (!column || !scroller) return out;
    const box = scroller.getBoundingClientRect();
    const top = box.top - box.height;
    const bottom = box.bottom + box.height;
    const list = column.children;
    let low = 0;
    let high = list.length - 1;
    let first = list.length;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (list[mid].getBoundingClientRect().bottom >= top) {
        first = mid;
        high = mid - 1;
      } else low = mid + 1;
    }
    for (let i = first; i < list.length; i++) {
      const el = list[i] as HTMLElement;
      if (el.getBoundingClientRect().top > bottom) break;
      if (el.dataset.section) out.add(el.dataset.section);
    }
    return out;
  }

  /**
   * Shows an element in which something was found: what it is folded away
   * under is opened, and it is given its editors, without the cursor.
   */
  async function editorFor(id: string, part: Part): Promise<EditorView | null> {
    let opened = folding.reveal(tree, id);
    if (part === 'body' && folding.has(id)) {
      folding.open(id);
      opened = true;
    }
    if (opened) await tick();
    current = id;
    if (!active.includes(id)) {
      const kept = [...active];
      while (kept.length >= KEPT_ACTIVE) kept.shift();
      active = [...kept, id];
    }
    for (let i = 0; i < 40; i++) {
      await tick();
      const view = editors.get(id)?.[part]?.getView();
      if (view) return view;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return null;
  }

  const surface: Surface = {
    get project() {
      return project;
    },
    elements: () => project.tree(at).sequence,
    labels: () => ({
      citation: citationLabel,
      crossref: (target, form) =>
        pointerText(
          numbering.of(project, at).byId.get(target),
          form,
          numbering.countingOf(project, at),
        ),
    }),
    holder: (element, part) =>
      scroller?.querySelector<HTMLElement>(`[data-section="${element}"] [data-part="${part}"]`) ??
      null,
    inView,
    reveal: editorFor,
    where: (view) => {
      if (!scroller?.contains(view.dom)) return null;
      const element = view.dom.closest<HTMLElement>('[data-section]')?.dataset.section;
      const part = view.dom.closest<HTMLElement>('[data-part]')?.dataset.part;
      return element && (part === 'title' || part === 'body') ? { element, part } : null;
    },
    looked: () => current ?? [...inView()][0] ?? null,
    scroller: () => scroller ?? null,
  };

  /** The surface on which what is searched for is shown, for what else is to be shown in the text: a citation that was found. */
  export function searchSurface(): Surface {
    return surface;
  }

  /** The element the text is at: the one whose editor has the focus, or the last that had it. */
  export function currentElement(): string | null {
    return current;
  }

  /** Opens the search over the text, or turns to it; with `replacing`, to the field of what replaces. */
  export function find(replacing = false) {
    const at = document.activeElement?.closest('.ProseMirror');
    const view = at && scroller?.contains(at) ? (viewsByDom.get(at) ?? null) : null;
    if (!searching) searching = new TextSearch(surface);
    searching.open(replacing, view);
    tick().then(() => (replacing ? bar?.focusReplace() : bar?.focusQuery()));
  }

  function closeSearch(focus: boolean) {
    const s = searching;
    searching = null;
    void s?.close(focus);
  }

  /**
   * Which elements are shown. The rows are made anew whenever a text is
   * changed; this is the same while the same elements are shown.
   */
  const shownIds = $derived(rows.map((r) => r.id).join(' '));

  // What is marked follows what is shown: an element folded or opened, one given its editors.
  $effect(() => {
    void shownIds;
    void active.length;
    untrack(() => searching?.scrolled());
  });

  onDestroy(() => void searching?.close(false));

  // What was found by the search through everything is gone to when the map is shown.
  onMount(() => {
    const jump = takeJump(at);
    if (jump) void tick().then(() => jumpTo(jump));
    else {
      beginEmpty();
      void readFromTop();
    }
  });

  /**
   * An element in view that has no text yet is written in at once: the
   * cursor is put in its text when it is shown, unless another element is
   * to be shown, or another pane has the focus.
   */
  function beginEmpty() {
    const root = tree.root;
    const node = project.node(root);
    if (!focused || !node?.empty || node.include || folding.has(root)) return;
    if (reveal && reveal !== root) return;
    void go(root, 'body', 'start');
  }

  /**
   * A press between the elements, or under the last: the cursor goes to the
   * end of the element before it, rather than the focus being lost.
   */
  function pressBetween(event: MouseEvent) {
    if (event.button !== 0 || linkFrom || !column) return;
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && target !== column) return;
    const sections = column.querySelectorAll<HTMLElement>(':scope > [data-section]');
    if (!sections.length) return;
    let before = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top > event.clientY) break;
      before = section;
    }
    const id = before.dataset.section;
    if (!id) return;
    event.preventDefault();
    // An empty text is opened by the press, under the name it belongs to.
    if (before.getBoundingClientRect().top > event.clientY) void go(id, 'title', 'start');
    else void go(id, folding.hides(tree, id) ? 'title' : 'body', 'end');
  }

  async function jumpTo(jump: Jump) {
    if (!jump.element) return;
    if (!jump.part) {
      // Not in a text, as an association: the element is shown.
      if (folding.reveal(tree, jump.element)) await tick();
      scroller
        ?.querySelector(`[data-section="${jump.element}"]`)
        ?.scrollIntoView({ block: 'center' });
      current = jump.element;
      return;
    }
    remembered.query = jump.words;
    Object.assign(remembered.options, jump.options);
    searching = new TextSearch(surface);
    searching.open(false, null);
    searching.beginAt(jump.element, jump.part, jump.passage, jump.start);
  }

  // ---- the change that is reviewed ----

  const review = reviewing();

  // The change looked at is brought into view, and opened where it is folded away.
  $effect(() => {
    const r = review?.review;
    if (!r) return;
    void r.shown;
    untrack(() => {
      const change = r.current;
      if (change && r.at === at) void showChange(change);
    });
  });

  async function showChange(change: Change) {
    const element =
      change.stretches[change.stretches.length - 1]?.passage.place.element ?? change.element;
    if (!project.node(element)) return;
    let opened = folding.reveal(tree, element);
    if (folding.has(element) && change.kind !== 'element') {
      folding.open(element);
      opened = true;
    }
    if (opened) await tick();
    current = element;
    const frames = async (n: number) => {
      for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
    };
    const find = () =>
      scroller?.querySelector(`[data-change="${CSS.escape(change.key)}"]`) ??
      scroller?.querySelector(`[data-section="${element}"]`);
    // The section first: its text is marked once it is in view.
    find()?.scrollIntoView({ block: 'center' });
    await frames(3);
    find()?.scrollIntoView({ block: 'center' });
  }

  // ---- the menu of an element ----

  const actions: ElementActions = {
    rename: (id) => go(id, 'title', 'all'),
    edit: (id) => go(id, 'body', 'end'),
    select: (ids) => ids[0] && go(ids[0], 'title', 'start'),
    add: (id, where) => (where === 'under' ? addUnder(id) : addAfter(id)),
    link: (id) => (linkFrom = id),
    enter: (id) => onenter(id),
    copy: (ids) => holdElements(ids, false),
    cut: (ids) => holdElements(ids, true),
    paste: (id) => pasteUnder(id),
  };

  /** Holds elements, each with all under it, copied or cut, and says how many. */
  function holdElements(ids: string[], cut: boolean) {
    const n = cut ? cutElements(project, ids) : copyElements(project, ids);
    if (n) notifyOk(t(cut ? 'diagram-cut' : 'diagram-copied', { count: n }));
  }

  /** Pastes what is held under an element, at the end of what is under it. */
  function pasteUnder(id: string) {
    if (!canPaste(project)) return;
    if (pastesUnderItself(project, id)) {
      notify(t('project-pick-itself'));
      return;
    }
    project.checkpoint();
    const made = pasteElements(project, { under: id });
    project.checkpoint();
    if (made[0]) void go(made[0], 'title', 'start');
  }

  function menuFor(id: string, anchor: HTMLElement | null): MenuItem[] {
    const view = editors.get(id)?.body?.getView();
    // Text selected where the menu is opened is what a comment is on: taken now, before the menu takes the focus.
    const passage = view && view.hasFocus() ? selectedPassage(view) : null;
    const comment = (element: string) => commentsUi.begin(element, element === id ? passage : null);
    const base = elementMenu(project, [id], { ...actions, comment }, anchor, 'text').filter(
      (item) =>
        !('label' in item) ||
        (item.label !== t('project-write-text') && item.label !== t('common-rename')),
    );
    const extra: MenuItem[] = [];
    if (view && view.hasFocus()) {
      extra.push({
        label: t('text-split'),
        icon: SplitSquareVertical,
        shortcut: keysFor('tree-new'),
        hint: t('text-split-hint'),
        action: () => split(id, view),
      });
    }
    if (joinable(id)) {
      extra.push({
        label: t('text-join'),
        icon: Merge,
        action: () => merge(id),
      });
    }
    if (id !== tree.root) {
      extra.push({
        label: t('text-open-as-map'),
        icon: MapIcon,
        shortcut: keysFor('tree-enter'),
        hint: t('text-open-as-map-hint'),
        action: () => onenter(id),
      });
    }
    if (extra.length) extra.push({ kind: 'separator' });
    const folds: MenuItem[] = [];
    if (folding.can(tree, id)) {
      const folded = folding.hides(tree, id);
      folds.push({
        label: folded ? t('text-open') : t('text-fold'),
        icon: folded ? UnfoldVertical : FoldVertical,
        shortcut: keysFor('tree-fold'),
        action: () => fold(id),
      });
      if (folding.anyFolded(tree, id))
        folds.push({
          label: t('text-open-all-under'),
          icon: ChevronsUpDown,
          action: () => fold(id, true),
        });
      if (folding.anyOpen(tree, id))
        folds.push({
          label: t('text-fold-all-under'),
          icon: ChevronsDownUp,
          hint: t('text-fold-all-under-hint'),
          action: () => folding.foldAll(tree, id),
        });
      folds.push({ kind: 'separator' });
    }
    return [...extra, ...folds, ...base];
  }

  function onmenu(id: string, event: MouseEvent, anchor: HTMLElement) {
    current = id;
    openMenu(anchor, menuFor(id, anchor), { side: 'bottom', align: 'start' });
    event.stopPropagation();
  }

  function oncontextmenu(event: MouseEvent) {
    // A misspelt word in text that is not being written has its own menu. What
    // is chosen in its place is put in by the editor, which is opened there.
    const spelt = openDrawnWordMenu(event, (drawn, at, word, by) => {
      activate(drawn.element, drawn.part, at);
      replaceWhenShown(() => editors.get(drawn.element)?.[drawn.part]?.getView(), at, word, by);
    });
    if (spelt) return;
    const section = (event.target as HTMLElement).closest<HTMLElement>('[data-section]');
    if (!section) return;
    // Within text that is selected, the menu is about the text: left to the system.
    const id = section.dataset.section!;
    current = id;
    openContextMenu(event, menuFor(id, section));
  }

  // ---- dragging ----

  function ongrip(id: string, event: PointerEvent) {
    if (event.button !== 0) return;
    startDrag(event, () => {
      // The element in view stays where it is.
      if (id === tree.root) return null;
      const data: ElementsPayload = { project, at, ids: [id], grab: { x: 0, y: 0 } };
      return { kind: 'elements', data, label: project.node(id)?.title || t('project-untitled') };
    });
  }

  /** For a picture or a reference: the element it is dropped on, whose text takes it. */
  function targetAt(event: DropEvent): { id: string; where: 'before' | 'after' | 'inside' } | null {
    const el = document.elementFromPoint(event.x, event.y)?.closest<HTMLElement>('[data-section]');
    const id = el?.dataset.section;
    return el && id ? { id, where: 'after' } : null;
  }

  /**
   * Where elements dragged in the text would go. The pointer's height says
   * between which two elements, as they are shown; how far it is to the
   * right says how deep among the depths that place allows: under the
   * element above, beside it, or beside one over it, as far out as beside
   * the element below. Moving sideways never changes the place between the
   * two. The choice is made in `layout`; here the column is measured.
   */
  function slotAt(event: DropEvent): DropSlot | null {
    if (!column) return null;
    const payload = event.payload.data as ElementsPayload;
    const sections = [...column.querySelectorAll<HTMLElement>(':scope > [data-section]')];
    if (!sections.length) return null;
    // The element above the place, and the one below it.
    const above = placeAt(event.y, sections.length, (i) => sections[i].getBoundingClientRect());
    const a = sections[above].dataset.section!;
    const b = sections[above + 1]?.dataset.section ?? null;
    // Elements are not put into themselves.
    const inside = (id: string) =>
      payload.project === project && payload.ids.some((d) => d === id || isAncestor(tree, d, id));
    const choices = dropChoices(tree, a, b, inside);
    if (!choices.length) return null;
    const box = column.getBoundingClientRect();
    const chosen = nearestChoice(choices, depthAt(event.x, box.left + GUTTER));
    const name = project.node(chosen.name)?.title || t('project-untitled');
    const ra = sections[above].getBoundingClientRect();
    const rb = sections[above + 1]?.getBoundingClientRect();
    return {
      parent: chosen.parent,
      index: chosen.index,
      depth: chosen.depth,
      label:
        chosen.say === 'under'
          ? t('text-drop-under', { name })
          : chosen.say === 'before'
            ? t('text-drop-before', { name })
            : t('text-drop-after', { name }),
      top: lineBetween(ra, rb, box.top),
      indent: dropIndent(chosen.depth, column.offsetWidth),
    };
  }

  function ondrop(event: DropEvent) {
    if (event.payload.kind === 'elements') {
      const at = slotAt(event);
      slot = null;
      if (at) dropElements(event, at);
      return;
    }
    const target = drop ?? targetAt(event);
    drop = null;
    if (!target) return;
    if (event.payload.kind === PICTURES_DRAGGED) {
      // Where a text is being written, the text itself takes the picture.
      project.checkpoint();
      for (const hash of event.payload.data as string[]) {
        const picture = pictures.get(hash);
        if (picture) project.addFigure(target.id, picture, widthFor(picture));
      }
      project.checkpoint();
      // What was put into a text that is folded away is shown.
      folding.open(target.id);
      current = target.id;
      return;
    }
    if (event.payload.kind === 'references') {
      const ids = event.payload.data as string[];
      project.checkpoint();
      project.cite(target.id, ids);
      project.checkpoint();
      for (const id of ids) onkeep(id);
      folding.open(target.id);
      current = target.id;
      return;
    }
  }

  /** Puts the elements dragged where the place chosen says. */
  function dropElements(event: DropEvent, place: DropSlot) {
    const payload = event.payload.data as ElementsPayload;
    if (!takes(payload)) return;
    const { parent, index } = place;
    let made: string[];
    if (payload.project !== project) {
      // From the project beside: made here, and with a move taken away there.
      made = carryAcross(
        payload.project,
        payload.ids,
        project,
        { under: parent, index },
        !event.copy,
      );
    } else {
      project.checkpoint();
      made = event.copy
        ? project.copy(payload.ids, parent, index, { pos: null })
        : project.move(payload.ids, parent, index, { pos: null });
      project.checkpoint();
    }
    if (made[0]) {
      current = made[0];
      folding.reveal(project.tree(at), made[0]);
      tick().then(() =>
        scroller
          ?.querySelector(`[data-section="${made[0]}"]`)
          ?.scrollIntoView({ block: 'nearest' }),
      );
    }
  }

  // ---- associations, in the margin ----

  let anchors = $state.raw(new Map<string, number>());
  let columnHeight = $state(0);

  function measure() {
    if (!column) return;
    const base = column.getBoundingClientRect().top;
    const next = new Map<string, number>();
    for (const el of column.querySelectorAll<HTMLElement>('[data-section]')) {
      const heading = el.querySelector<HTMLElement>('[data-part="title"]');
      if (!heading) continue;
      const r = heading.getBoundingClientRect();
      next.set(el.dataset.section!, Math.round(r.top - base + Math.min(r.height / 2, 16)));
    }
    anchors = next;
    columnHeight = column.offsetHeight;
  }

  $effect(() => {
    if (!column) return;
    void rows;
    void project.links;
    // Measured in the next frame: a change made while sizes are being
    // reported would be reported as a loop.
    let frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(column);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  // The end of an association is the element itself, or what it is folded away under.
  const brackets = $derived(
    bracketsOf(project.linksOf(at), anchors, (id) => folding.hiddenUnder(tree, id) ?? id),
  );

  const marginWidth = $derived(marginFor(brackets));

  let hoveredLink = $state<string | null>(null);

  function linkWords(b: Bracket): string {
    const a = project.node(b.from)?.title || t('project-untitled');
    const z = project.node(b.to)?.title || t('project-untitled');
    return `${truncate(a, 40)} ↔ ${truncate(z, 40)}${b.label ? ` · ${b.label}` : ''}`;
  }

  function linkMenu(event: MouseEvent, b: Bracket) {
    event.preventDefault();
    const end = (id: string): MenuItem => ({
      label: t('text-go-to', {
        name: truncate(project.node(id)?.title || t('project-untitled'), 36),
      }),
      icon: ArrowRight,
      action: async () => {
        if (folding.reveal(tree, id)) await tick();
        scroller
          ?.querySelector(`[data-section="${id}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        current = id;
      },
    });
    openMenu(pointRect(event.clientX, event.clientY), [
      end(b.from),
      end(b.to),
      { kind: 'separator' },
      {
        label: b.label ? t('text-change-label') : t('text-add-label'),
        icon: Pencil,
        action: () => (labelling = { id: b.id, value: b.label, top: (b.top + b.bottom) / 2 }),
      },
      {
        label: t('text-remove-association'),
        icon: Trash2,
        danger: true,
        action: () => {
          project.checkpoint();
          project.removeLink(b.id);
          project.checkpoint();
        },
      },
    ]);
  }

  function pick(id: string) {
    if (linkFrom && linkFrom !== id) {
      project.checkpoint();
      project.addLink(linkFrom, id);
      project.checkpoint();
    }
    linkFrom = null;
  }

  function commitLabel() {
    if (!labelling) return;
    project.setLinkLabel(labelling.id, labelling.value);
    labelling = null;
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && linkFrom) linkFrom = null;
  }}
/>

<div
  class="text-view"
  bind:this={root}
  style:--margin="{marginWidth}px"
  data-at-top={atTop ?? undefined}
>
  {#if searching}
    <SearchBar bind:this={bar} search={searching} onclose={() => closeSearch(true)} />
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={scroller}
    class="scroller"
    onscroll={() => {
      searching?.scrolled();
      // What is at the top is kept with the view, whether the outline is there or not.
      findTop();
    }}
    use:dropTarget={{
      accepts: (p) =>
        (p.kind === 'elements' && takes(p.data as ElementsPayload)) ||
        p.kind === PICTURES_DRAGGED ||
        p.kind === 'references',
      ondrop,
      onover: (e) => {
        drop = e && e.payload.kind !== 'elements' ? targetAt(e) : null;
        slot = e && e.payload.kind === 'elements' ? slotAt(e) : null;
      },
    }}
    onkeydowncapture={onkeydown}
    {oncontextmenu}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="page" onmousedown={pressBetween}>
      <!-- The associations stand in the left margin, beside the names they join. -->
      <div class="margin" aria-label={t('text-associations')}>
        <svg width={marginWidth} height={columnHeight} aria-hidden="true">
          <!-- Drawn from the edge of the text outwards: mirrored, so that the edge is at nought. -->
          <g transform="translate({marginWidth} 0) scale(-1 1)">
            {#each brackets as b (b.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
              <g
                class="bracket"
                class:hot={hoveredLink === b.id || current === b.from || current === b.to}
                onpointerenter={() => (hoveredLink = b.id)}
                onpointerleave={() => (hoveredLink = null)}
                onclick={(e) => linkMenu(e, b)}
                oncontextmenu={(e) => linkMenu(e, b)}
                use:tooltip={{ text: linkWords(b), side: 'right' }}
              >
                <path d={b.path} class="hit" />
                <path d={b.path} class="line" />
                <circle cx="1.5" cy={b.top} r="2.2" />
                <circle cx="1.5" cy={b.bottom} r="2.2" />
              </g>
            {/each}
          </g>
        </svg>
        {#if labelling}
          <input
            class="label-input"
            style:top="{labelling.top - 13}px"
            bind:value={labelling.value}
            placeholder={t('project-link-placeholder')}
            aria-label={t('project-link-label')}
            onblur={commitLabel}
            onkeydown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commitLabel();
              else if (e.key === 'Escape') labelling = null;
            }}
            {@attach (el: HTMLInputElement) => el.focus()}
          />
        {/if}
      </div>

      <div class="column" bind:this={column} data-notes>
        {#if slot && drag.payload}
          <!-- Where what is dragged would go: the line indented as deep as it would stand. -->
          <div class="drop-line" style:top="{slot.top}px" style:left="{slot.indent}px">
            <span>{slot.label}</span>
          </div>
        {/if}
        {#each rows as row (row.id)}
          {@const node = project.nodes.get(row.id)}
          {#if node}
            <TextSection
              {project}
              {at}
              {node}
              level={row.level}
              {depthShown}
              number={numbers.get(row.id) ?? null}
              active={active.includes(row.id)}
              focus={focus?.id === row.id ? focus : null}
              selected={current === row.id}
              excluded={row.excluded}
              drop={drop?.id === row.id && drag.payload ? drop.where : null}
              linkable={!!linkFrom && linkFrom !== row.id}
              others={othersAt(row)}
              foldable={row.foldable}
              hidden={row.hidden
                ? { parts: row.hidden.ids.length, text: row.hidden.text, words: row.hidden.words }
                : null}
              openable={row.foldable && folding.anyFoldedUnder(tree, row.id)}
              onfold={fold}
              onactivate={activate}
              {onaction}
              onfocused={(id) => (current = id)}
              {ongrip}
              {onmenu}
              onpick={pick}
              {onkeep}
              {onenter}
              onleave={row.id === tree.root ? onleave : undefined}
              onready={(id, e) => {
                if (e) editors.set(id, e);
                else editors.delete(id);
              }}
            />
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <footer>
    {#if linkFrom}
      <span class="linking">
        {#each linkingHint as piece, i (i)}
          {#if piece.name}<kbd>{piece.text}</kbd>{:else}{piece.text}{/if}
        {/each}
      </span>
    {:else}
      <span>{t('project-words', { count: counted.words })}</span>
      {#if counted.notes}<span>{t('text-notes', { count: counted.notes })}</span>{/if}
      {#if progress}<span class="progress">{progressWords(progress).join(' · ')}</span>{/if}
      <span class="keys">
        {#each keysHint as piece, i (i)}
          {#if piece.name}<kbd>{piece.text}</kbd>{:else}{piece.text}{/if}
        {/each}
      </span>
    {/if}
  </footer>
</div>

<style>
  /* The sheet of the text lies on a desk of another shade, where no text goes. */
  .text-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--desk);
  }
  /* The text is a region of its own: how large it is does not follow from
     what is written in it, and what is written changes nothing outside
     it. Without this being said, every key has the whole window laid out
     and painted anew, the preview beside the text with it. */
  .scroller {
    contain: strict;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-padding: 80px 0;
  }
  .page {
    display: grid;
    grid-template-columns: var(--margin) minmax(0, 1fr);
    max-width: calc(780px + var(--margin));
    min-height: 100%;
    margin: 0 auto;
    padding: 56px 40px 40vh 12px;
    font-size: var(--text-size, 17px);
    background: var(--paper);
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
  }
  .column {
    position: relative;
    min-width: 0;
    /* The text is set in by the width it has: see `TextSection`. */
    container-type: inline-size;
  }
  .drop-line {
    position: absolute;
    right: 0;
    height: 2px;
    margin-top: -1px;
    border-radius: 2px;
    background: var(--accent);
    pointer-events: none;
    z-index: 3;
  }
  .drop-line::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }
  .drop-line span {
    position: absolute;
    left: 10px;
    bottom: 4px;
    padding: 1px 6px;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    white-space: nowrap;
  }
  .margin {
    position: relative;
  }
  .margin svg {
    display: block;
    overflow: visible;
  }
  .bracket {
    cursor: pointer;
    pointer-events: stroke;
  }
  .bracket .line {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.15;
    opacity: 0.6;
    transition:
      opacity var(--fast) var(--ease),
      stroke-width var(--fast) var(--ease);
  }
  .bracket .hit {
    fill: none;
    stroke: transparent;
    stroke-width: 10;
  }
  .bracket circle {
    fill: var(--gold);
    opacity: 0.6;
    pointer-events: none;
  }
  .bracket.hot .line {
    opacity: 1;
    stroke-width: 2;
  }
  .bracket.hot circle {
    opacity: 1;
  }
  .label-input {
    position: absolute;
    z-index: 2;
    left: 0;
    width: 200px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--gold);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    font-size: var(--text-sm);
    outline: none;
    box-shadow: var(--shadow-2);
  }
  footer {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: none;
    height: 28px;
    padding: 0 16px;
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-3);
    white-space: nowrap;
  }
  /* The keys give way first where the line is narrow. */
  .keys {
    margin-left: auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--ink-4);
  }
  .keys kbd {
    font-size: 10.5px;
    padding: 0 4px;
    min-width: 0;
  }
  .linking {
    color: var(--gold);
    font-weight: 500;
  }
</style>
