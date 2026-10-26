<script lang="ts">
  /**
   * A side of the window (ADR 0064): a project of its own, opened as the
   * sides share it (`open-projects`), at an element, as diagram, text or
   * timeline, with its outline and its bar. It registers itself by its key,
   * so that what is of the window acts on it (`side-api`). Where the element
   * in view goes, deleted or taken back by undo, it turns to the nearest
   * element over it; where it was left is kept with the project while it is
   * the active side.
   */
  import { onDestroy, tick, untrack } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CloudDownload from '@lucide/svelte/icons/cloud-download';
  import { bringIn } from '$lib/documents/bringing.svelte';
  import { keepReference } from '$lib/editor/references.svelte';
  import { goThrough } from '$lib/found/found.svelte';
  import PastView from '$lib/history/PastView.svelte';
  import type { Looking } from '$lib/history/looking';
  import { toList } from '$lib/home/list.svelte';
  import { t } from '$lib/i18n';
  import type { MapMode } from '$lib/state/router.svelte';
  import TimelineView from '$lib/timeline/TimelineView.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import { drag, dropTarget } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import MapDiagram from './diagram/MapDiagram.svelte';
  import { filesDropped, mapOfIt } from './drops';
  import type { ElementsPayload } from './elements';
  import type { Project } from './model/project.svelte';
  import { PROJECT } from './model/types';
  import { openProjects } from './open-projects.svelte';
  import { outlineItems } from './outline';
  import { panes } from './panes.svelte';
  import SideBar from './SideBar.svelte';
  import { sideApis, type SideApi } from './side-api.svelte';
  import { sides, type MapSide } from './sides.svelte';
  import MapText from './text/MapText.svelte';
  import Outline from './text/Outline.svelte';

  interface Props {
    spec: MapSide;
    /** Its place among the sides. */
    index: number;
    /** How many sides there are. */
    count: number;
    /** Whether it has the focus. */
    active: boolean;
    /** The project of the other side, where it shows another: elements dragged across are carried there. */
    other: Project | null;
    /** How much of the width it takes, of two. */
    grow: number;
    /** A moment of the history looked at, in the side it is looked at in. */
    looking: Looking | null;
    onlooked: () => void;
    /** Closes this side. */
    onclose: () => void;
  }

  let { spec, index, count, active, other, grow, looking, onlooked, onclose }: Props = $props();

  // A side shows one project throughout: another project in its place is another side.
  // svelte-ignore state_referenced_locally
  const key = spec.key;
  // svelte-ignore state_referenced_locally
  const projectId = spec.project;
  const open = openProjects.acquire(projectId);

  const project = $derived(open.project);
  const at = $derived(spec.at ?? PROJECT);

  let el = $state<HTMLDivElement>();
  let text = $state<ReturnType<typeof MapText>>();
  let diagram = $state<ReturnType<typeof MapDiagram>>();
  /** An element to show when the side turns to it by a jump. */
  let reveal = $state<string | null>(null);
  /** The element at the top of the text, for the outline. */
  let top = $state<string | null>(null);

  // Where nothing was asked, the side shows the project as it was left. It
  // depends on the project being open and on the element it holds, which a
  // joined project gets when it is fetched.
  $effect(() => {
    if (open.state !== 'open' || !project?.node(PROJECT) || spec.at !== null) return;
    untrack(() => {
      const left = open.where();
      spec.at = left.at;
      // The view asked for stands; where none was, that it was left in.
      if (spec.fresh) spec.mode = left.mode;
      delete spec.fresh;
    });
  });

  // Where the project was left is where its active side is. It depends on
  // whether this is the active side, and on its element and view.
  $effect(() => {
    if (!active || !spec.at || open.state !== 'open') return;
    const left = { at: spec.at, mode: spec.mode };
    untrack(() => {
      if (open.left?.at === left.at && open.left?.mode === left.mode) return;
      open.left = left;
      openProjects.changed(open);
    });
  });

  // What the project keeps of how it was looked at is saved a moment after
  // it changes: each camera (by its entry, which reading the record alone
  // would not see), each top, the outline's width, what is folded.
  $effect(() => {
    if (open.state !== 'open') return;
    void Object.values(open.cameras);
    void Object.values(open.tops);
    void open.outlineWidth;
    const folding = open.folding;
    void folding.folded.size;
    void [...folding.folded];
    untrack(() => openProjects.changed(open));
  });

  // An element that is gone, deleted or taken back by undo, cannot be in
  // view: the side turns to the nearest element over it that is there, else
  // to the project. The way to the element in view is remembered for that,
  // since a gone element no longer says where it stood. It depends on the
  // shape of the project and on the element in view.
  let way: string[] = [];
  $effect(() => {
    const p = project;
    if (!p || !p.node(PROJECT) || !spec.at) return;
    void p.structure;
    const here = spec.at;
    if (p.node(here)) {
      way = p.pathTo(here);
      return;
    }
    const back = [...way].reverse().find((id) => p.node(id)) ?? PROJECT;
    untrack(() => sides.show(key, back));
  });

  /** Enters an element: the element in view of this side; with an element within it, that one is shown. */
  function show(target: string, options: { element?: string; mode?: MapMode } = {}) {
    // Set anew, so that an element asked for again is shown again.
    reveal = null;
    reveal = options.element ?? null;
    sides.show(key, target, options.mode);
    sides.focus(key);
  }

  function holding(element: string): string {
    const p = project;
    if (!p) return PROJECT;
    if (p.tree(at).depth.has(element)) return at;
    return p.pathTo(element)[1] ?? PROJECT;
  }

  function goTo(element: string, options: { mode?: MapMode } = {}) {
    show(holding(element), { ...options, element });
  }

  function up() {
    const p = project;
    if (!p) return;
    const parent = p.tree().parent.get(at);
    if (parent) show(parent, { element: at });
    else if (at === PROJECT) toList(projectId);
  }

  function find(replacing: boolean) {
    if (spec.mode !== 'text') sides.setMode(key, 'text');
    void tick().then(() => text?.find(replacing));
  }

  /** Documents are brought in one after another, each a branch under the element in view; the last that was made is shown in the text. */
  async function documentsIn(paths: (string | null)[]) {
    for (const path of paths) {
      const p = project;
      if (!path || !p) continue;
      const brought = await bringIn(path, p, at);
      if (brought) goTo(brought.top, { mode: 'text' });
      if (brought?.goThrough) goThrough(brought.top);
    }
  }

  const keep = (id: string) => {
    if (project) void keepReference(project, id);
  };

  const api: SideApi = {
    key,
    open,
    get el() {
      return el;
    },
    show,
    holding,
    goTo,
    up,
    text: () => text,
    diagram: () => diagram,
    find,
    documentsIn,
  };
  sideApis.set(key, api);

  onDestroy(() => {
    if (sideApis.get(key) === api) sideApis.delete(key);
    // The typesetting pane that showed this side closes with it.
    panes.sideGone(key);
    void openProjects.release(projectId);
  });

  /**
   * The text the side is read from when an element is shown in it: where it
   * was read when it was last shown, unless an element is to be shown, which
   * the text goes to. It depends on the element in view and the view, not on
   * the tops, which change as the text is read.
   */
  const restoring = $derived.by(() => {
    void at;
    void spec.mode;
    return untrack(() => (reveal ? null : (open.tops[at] ?? null)));
  });

  /** Whether an element has anything to show as a timeline: one within it that says when it is, or settings. */
  function timed(element: string): boolean {
    const p = project;
    if (!p) return false;
    const settings = p.node(element)?.timeline;
    if (settings && (settings.axis || settings.lanes?.length)) return true;
    for (const id of p.tree(element).sequence) if (p.node(id)?.when) return true;
    return false;
  }

  /** Elements dragged from the other side, of another project, over this one: what a drop will do. */
  const carrying = $derived.by(() => {
    const d = drag.payload;
    if (!other || !project || d?.kind !== 'elements' || !drag.welcome) return null;
    if ((d.data as ElementsPayload).project !== other) return null;
    const r = el?.getBoundingClientRect();
    if (!r) return null;
    if (drag.x < r.left || drag.x > r.right || drag.y < r.top || drag.y > r.bottom) return null;
    return { name: project.name, copy: drag.copy };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="pane"
  bind:this={el}
  data-side-key={key}
  style:flex-grow={grow}
  class:focused={count > 1 && active}
  onpointerdowncapture={() => sides.focus(key)}
  onfocusin={() => sides.focus(key)}
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => {
      if (project) filesDropped(e, { project, documentsIn, keep });
    },
  }}
>
  <!-- the bar -->
  <div
    class="pane-bar"
    use:dropTarget={{
      accepts: (d) => d.kind === 'files' && (d.data as string[]).some(mapOfIt),
      ondrop: (e) => documentsIn((e.payload.data as string[]).filter(mapOfIt)),
    }}
  >
    <SideBar
      {spec}
      project={project ?? null}
      focused={active}
      scope={el}
      timed={timed(at)}
      onview={(mode) => sides.setMode(key, mode)}
      onoutline={() => sides.toggleOutline(key)}
    />
  </div>
  <!-- /the bar -->
  <div class="pane-body">
    {#if open.state === 'failed'}
      <EmptyState
        icon={CircleAlert}
        title={t('project-open-failed')}
        text={open.failure || t('project-open-failed-detail')}
      >
        <Button onclick={onclose}>{t('project-close-side')}</Button>
      </EmptyState>
    {:else if project && !project.node(PROJECT) && open.sharing?.shared}
      <!-- A project joined, on its way from the others. -->
      <EmptyState
        icon={CloudDownload}
        title={t('project-fetching')}
        text={t('project-fetching-on-the-way')}
      >
        <Button onclick={onclose}>{t('project-close-side')}</Button>
      </EmptyState>
    {:else if !project || !project.node(PROJECT) || !spec.at}
      <div class="centre"><Spinner size={20} /></div>
    {:else}
      {#if spec.outline}
        <Outline
          {project}
          {at}
          items={outlineItems(project, at, open.folding)}
          current={spec.mode === 'text' ? top : null}
          ongo={(id) => (spec.mode === 'text' && text ? text.goTo(id) : goTo(id))}
          onclose={() => sides.toggleOutline(key)}
          width={open.outlineWidth}
        />
        <Divider
          label={t('text-outline-between')}
          onmove={(dx) =>
            (open.outlineWidth = Math.max(160, Math.min(520, open.outlineWidth + dx)))}
          onreset={() => (open.outlineWidth = 240)}
        />
      {/if}
      <div class="view">
        {#key `${at}:${spec.mode}`}
          {#if looking && looking.pane === index}
            <PastView {project} {at} {looking} onback={onlooked} />
          {:else if spec.mode === 'timeline'}
            <TimelineView
              {project}
              {at}
              ongo={(element) => goTo(element, { mode: 'text' })}
              reveal={active ? reveal : null}
            />
          {:else if spec.mode === 'diagram'}
            <MapDiagram
              bind:this={diagram}
              {project}
              {at}
              camera={open.cameras[at] ?? null}
              oncamera={(c) => (open.cameras[at] = c)}
              onkeep={keep}
              onenter={(id) => show(id)}
              onleave={project.tree().parent.get(at) ? up : undefined}
              reveal={active ? reveal : null}
              besideProject={other}
            />
          {:else}
            <MapText
              bind:this={text}
              {project}
              {at}
              onkeep={keep}
              onenter={(id) => show(id)}
              onleave={project.tree().parent.get(at) ? up : undefined}
              reveal={active ? reveal : null}
              focused={active}
              folding={open.folding}
              outline={spec.outline}
              top={restoring}
              ontop={(id) => {
                top = id;
                if (id) open.tops[at] = id;
              }}
              besideProject={other}
            />
          {/if}
        {/key}
        {#if carrying}
          <!-- What a drop of elements from the other project will do, before it is done. -->
          <div class="carrying" role="status">
            {carrying.copy
              ? t('project-copy-to-project', { name: carrying.name })
              : t('project-move-to-project', { name: carrying.name })}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
  }
  .pane-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    min-height: 40px;
    flex: none;
    padding: 4px 8px 4px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .pane-bar :global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .pane-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .pane-body > .centre {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
  /* The view beside the outline, where that is shown. */
  .pane-body > .view {
    flex: 1;
    min-width: 0;
    min-height: 0;
    position: relative;
  }
  .pane-body > .view > .carrying {
    position: absolute;
    top: 10px;
    left: 50%;
    z-index: 5;
    max-width: calc(100% - 24px);
    transform: translateX(-50%);
    padding: 5px 12px;
    border-radius: 20px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    box-shadow: var(--shadow-2);
  }
</style>
