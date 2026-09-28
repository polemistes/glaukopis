<script lang="ts">
  import { TextSelection } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { tick, untrack } from 'svelte';
  import { prosemirrorToYXmlFragment } from 'y-prosemirror';
  import * as Y from 'yjs';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Merge from '@lucide/svelte/icons/merge';
  import Pencil from '@lucide/svelte/icons/pencil';
  import SplitSquareVertical from '@lucide/svelte/icons/split-square-vertical';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { widthFor } from '$lib/editor/commands';
  import type { KeyAction } from '$lib/editor/plugins';
  import type RichText from '$lib/editor/RichText.svelte';
  import type { FocusAt } from '$lib/editor/RichText.svelte';
  import { bodySchema } from '$lib/editor/schema';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { plural, truncate } from '$lib/library/format';
  import { drag, dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import { pointRect } from '$lib/ui/floating';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { elementMenu, type ElementActions, type ElementsPayload } from '../elements';
  import type { Project } from '../model/project.svelte';
  import { isAncestor } from '../model/tree';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import TextSection, { type Part } from './TextSection.svelte';

  interface Props {
    project: Project;
    mapId: string;
    onkeep: (id: string) => void;
    onopenmap: (id: string) => void;
    /** An element to bring into view when the map appears. */
    reveal?: string | null;
  }

  let { project, mapId, onkeep, onopenmap, reveal = null }: Props = $props();

  const KEPT_ACTIVE = 10;

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
  let labelling = $state<{ id: string; value: string; top: number } | null>(null);

  const editors = new Map<
    string,
    { title?: ReturnType<typeof RichText>; body?: ReturnType<typeof RichText> }
  >();

  const tree = $derived(project.tree(mapId));

  interface Row {
    id: string;
    level: number;
    excluded: boolean;
    loose: boolean;
  }

  const rows = $derived.by(() => {
    const out: Row[] = [];
    const walk = (id: string, level: number, excluded: boolean, loose: boolean, top: boolean) => {
      const node = project.nodes.get(id);
      if (!node) return;
      const out_ = excluded || node.excluded;
      out.push({ id, level, excluded: out_, loose: loose && top });
      // An element whose name is not printed does not deepen what is under it.
      const next = top && !loose ? 1 : node.heading ? level + 1 : level;
      for (const c of tree.children.get(id) ?? []) walk(c, Math.max(1, next), out_, loose, false);
    };
    if (tree.root) walk(tree.root, 0, false, false, true);
    for (const id of tree.loose) walk(id, 2, true, true, true);
    return out;
  });

  const firstLoose = $derived(rows.findIndex((r) => r.loose));

  const totals = $derived.by(() => {
    let words = 0;
    let notes = 0;
    const cited = new Set<string>();
    for (const r of rows) {
      if (r.excluded) continue;
      const n = project.nodes.get(r.id);
      if (!n) continue;
      words += n.words;
      notes += n.notes;
      for (const c of n.cited) cited.add(c);
    }
    return { words, notes, cited: cited.size };
  });

  // ---- activation and focus ----

  function activate(id: string, part: Part, at: FocusAt) {
    const mounted = editors.get(id)?.[part];
    current = id;
    if (active.includes(id) && mounted) {
      mounted.focus(at);
      return;
    }
    focus = { id, part, at };
    const kept = active.filter((a) => a !== id);
    // The one with the focus is never let go.
    while (kept.length >= KEPT_ACTIVE) kept.shift();
    active = [...kept, id];
  }

  async function go(id: string | undefined | null, part: Part, at: FocusAt) {
    if (!id) return;
    activate(id, part, at);
    await tick();
    scroller
      ?.querySelector(`[data-section="${id}"] [data-part="${part}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
  }

  $effect(() => {
    // What is active must exist.
    const present = active.filter((id) => project.nodes.get(id)?.map === mapId);
    if (present.length !== active.length) active = present;
  });

  $effect(() => {
    const id = reveal;
    if (!id) return;
    untrack(async () => {
      await tick();
      scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'start' });
      current = id;
    });
  });

  function indexOf(id: string): number {
    return rows.findIndex((r) => r.id === id);
  }

  // ---- changes of structure from the text ----

  function indent(id: string) {
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

  function outdent(id: string) {
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

  function shift(id: string, by: -1 | 1) {
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

  /** What follows the cursor becomes a new element, after this one. */
  function split(id: string, view: EditorView) {
    const { state } = view;
    const { from } = state.selection;
    const end = state.doc.content.size;
    const atEnd = from >= TextSelection.atEnd(state.doc).from;
    const rest = atEnd ? null : state.doc.slice(from, end);

    project.checkpoint();
    const made = project.transact(() => {
      const hasChildren = (tree.children.get(id)?.length ?? 0) > 0;
      const isRoot = id === tree.root;
      const newId =
        isRoot || hasChildren ? project.addChild(id, { index: 0 }) : project.addSibling(id);
      if (!newId) return null;
      if (rest && rest.content.size) {
        const doc = bodySchema.topNodeType.createAndFill(null, rest.content);
        const target = project.fragment(newId, 'body');
        if (doc && target) prosemirrorToYXmlFragment(doc, target);
      }
      return newId;
    });
    if (made && rest) {
      view.dispatch(state.tr.delete(from, end));
    }
    project.checkpoint();
    if (made) go(made, 'title', 'start');
  }

  /** Joins an element to the one before it in the text. Its name, if it has one, becomes a paragraph. */
  function merge(id: string) {
    const i = indexOf(id);
    const node = project.node(id);
    if (i <= 0 || !node || (tree.children.get(id)?.length ?? 0) > 0) return;
    const before = rows[i - 1];
    if (before.loose !== rows[i].loose && !rows[i].loose) return;
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
        if (part === 'title') go(id, 'body', 'start');
        else if (rows[i + 1]) go(rows[i + 1].id, 'title', 'start');
        else return false;
        return true;
      case 'up-out':
        if (part === 'body') go(id, 'title', 'end');
        else if (rows[i - 1]) go(rows[i - 1].id, 'body', 'end');
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
          if (previous) go(previous.id, 'body', 'end');
          return true;
        }
        if (rows[i - 1]) {
          go(rows[i - 1].id, 'body', 'end');
          return true;
        }
        return false;
      }
      case 'delete-at-end':
        return false;
      case 'tab':
        if (part === 'title') return indent(id) || true;
        return false;
      case 'shift-tab':
        if (part === 'title') return outdent(id) || true;
        return false;
      case 'escape':
        if (editorUi.picking || editorUi.citation) return false;
        (view.dom as HTMLElement).blur();
        return true;
    }
    return false;
  }

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    const section = (event.target as HTMLElement).closest<HTMLElement>('[data-section]');
    const id = section?.dataset.section;
    if (!id) return;

    if (mod && event.key === 'Enter' && !event.shiftKey) {
      const part = (event.target as HTMLElement).closest<HTMLElement>('[data-part]')?.dataset
        .part as Part;
      const view = editors.get(id)?.[part === 'title' ? 'body' : 'body']?.getView();
      event.preventDefault();
      event.stopPropagation();
      if (part === 'body' && view) split(id, view);
      else {
        // From a name: a new element after this one.
        project.checkpoint();
        const made = id === tree.root ? project.addChild(id, { index: 0 }) : project.addSibling(id);
        project.checkpoint();
        if (made) go(made, 'title', 'start');
      }
      return;
    }

    if (event.altKey && event.shiftKey) {
      let done = false;
      if (event.key === 'ArrowUp') done = shift(id, -1);
      else if (event.key === 'ArrowDown') done = shift(id, 1);
      else if (event.key === 'ArrowRight') done = indent(id);
      else if (event.key === 'ArrowLeft') done = outdent(id);
      else return;
      event.preventDefault();
      event.stopPropagation();
      if (done) {
        tick().then(() =>
          scroller?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'nearest' }),
        );
      }
    }
  }

  // ---- the menu of an element ----

  const actions: ElementActions = {
    rename: (id) => go(id, 'title', 'all'),
    edit: (id) => go(id, 'body', 'end'),
    select: (ids) => ids[0] && go(ids[0], 'title', 'start'),
    link: (id) => (linkFrom = id),
    openMap: (id) => onopenmap(id),
  };

  function menuFor(id: string, anchor: HTMLElement | null): MenuItem[] {
    const base = elementMenu(project, [id], actions, anchor).filter(
      (item) => !('label' in item) || (item.label !== 'Write its text' && item.label !== 'Rename'),
    );
    const i = indexOf(id);
    const view = editors.get(id)?.body?.getView();
    const extra: MenuItem[] = [];
    if (view && view.hasFocus()) {
      extra.push({
        label: 'Split here',
        icon: SplitSquareVertical,
        shortcut: 'Ctrl+Enter',
        hint: 'What follows the cursor becomes a new element',
        action: () => split(id, view),
      });
    }
    if (i > 0 && id !== tree.root && !(tree.children.get(id)?.length ?? 0)) {
      extra.push({
        label: 'Join to the element above',
        icon: Merge,
        action: () => merge(id),
      });
    }
    if (extra.length) extra.push({ kind: 'separator' });
    return [...extra, ...base];
  }

  function onmenu(id: string, event: MouseEvent, anchor: HTMLElement) {
    current = id;
    openMenu(anchor, menuFor(id, anchor), { side: 'bottom', align: 'start' });
    event.stopPropagation();
  }

  function oncontextmenu(event: MouseEvent) {
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
      if (id === tree.root) return null;
      const data: ElementsPayload = { project, map: mapId, ids: [id], grab: { x: 0, y: 0 } };
      return { kind: 'elements', data, label: project.node(id)?.title || 'Untitled' };
    });
  }

  function targetAt(event: DropEvent): { id: string; where: 'before' | 'after' | 'inside' } | null {
    const el = document.elementFromPoint(event.x, event.y)?.closest<HTMLElement>('[data-section]');
    const id = el?.dataset.section;
    if (!el || !id) return null;
    // A picture goes to the end of the text of the element it is dropped on.
    if (event.payload.kind === PICTURES_DRAGGED) return { id, where: 'after' };
    // And so does a reference, which is cited there.
    if (event.payload.kind === 'references') return { id, where: 'after' };
    const payload = event.payload.data as ElementsPayload;
    if (payload.map === mapId) {
      for (const dragged of payload.ids) {
        if (dragged === id || isAncestor(tree, dragged, id)) return null;
      }
    }
    const rect = el.getBoundingClientRect();
    const upper = event.y < rect.top + Math.min(rect.height / 2, 60);
    const hasChildren = (tree.children.get(id)?.length ?? 0) > 0;
    if (id === tree.root) return { id, where: 'inside' };
    if (upper) return { id, where: 'before' };
    return { id, where: hasChildren ? 'inside' : 'after' };
  }

  function ondrop(event: DropEvent) {
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
      current = target.id;
      return;
    }
    if (event.payload.kind === 'references') {
      const ids = event.payload.data as string[];
      project.checkpoint();
      project.cite(target.id, ids);
      project.checkpoint();
      for (const id of ids) onkeep(id);
      current = target.id;
      return;
    }
    const payload = event.payload.data as ElementsPayload;
    if (payload.project !== project) return;
    const parent = target.where === 'inside' ? target.id : (tree.parent.get(target.id) ?? null);
    const list = parent ? (tree.children.get(parent) ?? []) : tree.loose;
    const index =
      target.where === 'inside' ? 0 : list.indexOf(target.id) + (target.where === 'after' ? 1 : 0);
    project.checkpoint();
    const options = parent ? { pos: null } : { map: mapId };
    const made = event.copy
      ? project.copy(payload.ids, parent, index, options)
      : project.move(payload.ids, parent, index, options);
    project.checkpoint();
    if (made[0]) {
      current = made[0];
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

  interface Bracket {
    id: string;
    from: string;
    to: string;
    top: number;
    bottom: number;
    lane: number;
    label: string;
    path: string;
  }

  const LANE = 9;
  const FIRST = 10;

  const brackets = $derived.by(() => {
    const spans = project
      .linksOf(mapId)
      .map((l) => {
        const a = anchors.get(l.from);
        const b = anchors.get(l.to);
        if (a === undefined || b === undefined) return null;
        const upper = a <= b ? l.from : l.to;
        const lower = a <= b ? l.to : l.from;
        return {
          id: l.id,
          from: upper,
          to: lower,
          top: Math.min(a, b),
          bottom: Math.max(a, b),
          label: l.label,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      // Short ones innermost.
      .sort((x, y) => x.bottom - x.top - (y.bottom - y.top) || x.top - y.top);

    const lanes: { top: number; bottom: number }[][] = [];
    const out: Bracket[] = [];
    for (const s of spans) {
      let lane = 0;
      for (;;) {
        const taken = lanes[lane] ?? (lanes[lane] = []);
        if (!taken.some((t) => s.top <= t.bottom + 6 && s.bottom >= t.top - 6)) {
          taken.push({ top: s.top, bottom: s.bottom });
          break;
        }
        lane++;
      }
      const x = FIRST + lane * LANE;
      const r = Math.min(5, (s.bottom - s.top) / 2);
      const path =
        s.bottom - s.top < 2
          ? `M 0 ${s.top} H ${x}`
          : `M 0 ${s.top} H ${x - r} Q ${x} ${s.top} ${x} ${s.top + r} V ${s.bottom - r} Q ${x} ${s.bottom} ${x - r} ${s.bottom} H 0`;
      out.push({ ...s, lane, path });
    }
    return out;
  });

  const marginWidth = $derived(
    Math.max(40, FIRST + (Math.max(-1, ...brackets.map((b) => b.lane)) + 1) * LANE + 12),
  );

  let hoveredLink = $state<string | null>(null);

  function linkWords(b: Bracket): string {
    const a = project.node(b.from)?.title || 'Untitled';
    const z = project.node(b.to)?.title || 'Untitled';
    return `${truncate(a, 40)} ↔ ${truncate(z, 40)}${b.label ? ` · ${b.label}` : ''}`;
  }

  function linkMenu(event: MouseEvent, b: Bracket) {
    event.preventDefault();
    const end = (id: string): MenuItem => ({
      label: `Go to “${truncate(project.node(id)?.title || 'Untitled', 36)}”`,
      icon: ArrowRight,
      action: () => {
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
        label: b.label ? 'Change the label…' : 'Add a label…',
        icon: Pencil,
        action: () => (labelling = { id: b.id, value: b.label, top: (b.top + b.bottom) / 2 }),
      },
      {
        label: 'Remove the association',
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

<div class="text-view" bind:this={root} style:--margin="{marginWidth}px">
  <div class="tools"><div class="inner"><WritingTools scope={root} /></div></div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={scroller}
    class="scroller"
    use:dropTarget={{
      accepts: (p) =>
        (p.kind === 'elements' && (p.data as ElementsPayload).project === project) ||
        p.kind === PICTURES_DRAGGED ||
        p.kind === 'references',
      ondrop,
      onover: (e) => (drop = e ? targetAt(e) : null),
    }}
    onkeydowncapture={onkeydown}
    {oncontextmenu}
  >
    <div class="page">
      <!-- The associations stand in the left margin, beside the names they join. -->
      <div class="margin" aria-label="Associations">
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
            placeholder="How they are related"
            aria-label="Label of the association"
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
        {#each rows as row, i (row.id)}
          {@const node = project.nodes.get(row.id)}
          {#if i === firstLoose}
            <div class="loose-heading">
              <span class="overline">Loose elements</span>
              <span>Thoughts that have no place yet. They are not part of the document.</span>
            </div>
          {/if}
          {#if node}
            <TextSection
              {project}
              {node}
              level={row.level}
              active={active.includes(row.id)}
              focus={focus?.id === row.id ? focus : null}
              selected={current === row.id}
              excluded={row.excluded && !row.loose}
              loose={row.loose}
              drop={drop?.id === row.id && drag.payload ? drop.where : null}
              linkable={!!linkFrom && linkFrom !== row.id}
              others={project.othersAt(row.id)}
              onactivate={activate}
              {onaction}
              onfocused={(id) => (current = id)}
              {ongrip}
              {onmenu}
              onpick={pick}
              {onkeep}
              {onopenmap}
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
      <span class="linking"
        >Click the name of the element to associate with · <kbd>Esc</kbd> to leave it</span
      >
    {:else}
      <span>{plural(totals.words, 'word')}</span>
      {#if totals.cited}<span>{plural(totals.cited, 'work')} cited</span>{/if}
      {#if totals.notes}<span>{plural(totals.notes, 'note')}</span>{/if}
      <span class="keys"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> new element · <kbd>@</kbd> cite</span>
    {/if}
  </footer>
</div>

<style>
  .text-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--paper);
  }
  /* The tools stand over the text, and begin where the text begins. */
  .tools {
    flex: none;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .tools .inner {
    max-width: calc(780px + var(--margin));
    margin: 0 auto;
    padding: 5px 40px 5px calc(12px + var(--margin) + 35px);
  }
  .scroller {
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
    margin: 0 auto;
    padding: 56px 40px 40vh 12px;
    font-size: var(--text-size, 17px);
  }
  .column {
    min-width: 0;
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
  .loose-heading {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 4em 0 0 44px;
    padding-top: 1.2em;
    border-top: 1px solid var(--line);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--ink-3);
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
  }
  .keys {
    margin-left: auto;
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
