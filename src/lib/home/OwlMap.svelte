<script lang="ts">
  /**
   * The owl map (ADR 0037): the third form of the page of projects. The owl
   * stands at the centre as a picture; under it the folders, as plain
   * labels, nesting as they do; and the projects, as cards, in them or
   * hanging from the owl. It is laid out as a map's centre is, balanced to
   * both sides, and panned and zoomed as the diagram is; but it must not be
   * taken for the map of a project, so nothing in it is a box like an
   * element. A folder of many projects starts folded, and the view starts
   * fitted to what is shown.
   */
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Scan from '@lucide/svelte/icons/scan';
  import type { ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { fitting, wheeled, zoomedAt, type View } from '$lib/project/diagram/camera';
  import { layout, type Size } from '$lib/project/diagram/layout';
  import { linesOf } from '$lib/project/diagram/lines';
  import type { NodeRecord } from '$lib/project/model/types';
  import Mark from '$lib/shell/Mark.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { openContextMenu, openMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { listUi } from './list.svelte';
  import { owlTree } from './owl';
  import type { ProjectActions } from './project-actions.svelte';
  import ProjectBadge from './ProjectBadge.svelte';

  interface Props {
    /** The menus of a project, as the cards and the list have them. */
    actions: ProjectActions;
    /** Opens a project. */
    open: (p: ProjectInfo) => void;
  }

  let { actions, open }: Props = $props();

  const owl = $derived(owlTree(projects.folders, projects.list, listUi.owlFolds));
  const empty = $derived(!projects.folders.length && !projects.list.length);

  /** The size of each thing on the map, as it is drawn. */
  const sizes = new SvelteMap<string, Size>();
  const lay = $derived(
    layout(owl.tree, owl.nodes as unknown as ReadonlyMap<string, NodeRecord>, sizes),
  );
  const lines = $derived(linesOf(lay, new Set()));

  let viewport = $state<HTMLDivElement>();
  let width = $state(0);
  let height = $state(0);
  let cam = $state<View>({ x: 0, y: 0, k: 1 });
  /** Whether the view has been fitted to the map, once all of it is measured. */
  let fitted = $state(false);
  let panning = $state(false);
  /**
   * A folder that was folded or unfolded, and where it stood on the screen:
   * it is kept there while what is under it comes and goes, until the view
   * is moved.
   */
  let anchor: { key: string; sx: number; sy: number } | null = null;
  /** Whether the pointer moved the view since it was pressed: the click that ends it is no click. */
  let dragged = false;

  /** Measures a thing on the map, as long as it is there. */
  function measured(node: HTMLElement, key: string) {
    let at = key;
    const report = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const old = sizes.get(at);
      if (!old || old.w !== w || old.h !== h) sizes.set(at, { w, h });
    };
    const observer = new ResizeObserver(report);
    observer.observe(node);
    report();
    return {
      update(next: string) {
        sizes.delete(at);
        at = next;
        report();
      },
      destroy() {
        observer.disconnect();
        sizes.delete(at);
      },
    };
  }

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const resized = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === width && h === height) return;
      untrack(() => {
        // What was in the middle stays in the middle.
        if (fitted && width && height) {
          cam = { ...cam, x: cam.x + (w - width) / 2, y: cam.y + (h - height) / 2 };
        }
        width = w;
        height = h;
      });
    };
    const observer = new ResizeObserver(() => requestAnimationFrame(resized));
    observer.observe(el);
    resized();
    return () => observer.disconnect();
  });

  // Fitted once what is shown is measured; or soon, whatever is not.
  $effect(() => {
    if (fitted || !width || !height) return;
    const all = lay.order.every((key) => sizes.has(key));
    const fit = () => {
      if (fitted) return;
      cam = fitting(lay.bounds, width, height);
      fitted = true;
    };
    if (all) {
      untrack(fit);
      return;
    }
    const timer = setTimeout(fit, 400);
    return () => clearTimeout(timer);
  });

  // A folder folded or unfolded stays where it stood on the screen.
  $effect(() => {
    const placed = lay.placed;
    untrack(() => {
      if (!anchor) return;
      const p = placed.get(anchor.key);
      if (p) cam = { ...cam, x: anchor.sx - p.x * cam.k, y: anchor.sy - p.y * cam.k };
    });
  });

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const onwheel = (event: WheelEvent) => {
      event.preventDefault();
      anchor = null;
      const rect = el.getBoundingClientRect();
      cam = wheeled(cam, event, event.clientX - rect.left, event.clientY - rect.top);
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => el.removeEventListener('wheel', onwheel);
  });

  function fit() {
    anchor = null;
    if (width && height) cam = fitting(lay.bounds, width, height);
  }

  function zoomBy(factor: number) {
    anchor = null;
    cam = zoomedAt(cam, width / 2, height / 2, cam.k * factor);
  }

  /** The view is moved by dragging anywhere on it, over a card or a folder too. */
  function pointerdown(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return;
    if ((event.target as HTMLElement).closest('.menu, .controls')) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: cam.x, y: cam.y };
    dragged = false;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragged && Math.hypot(dx, dy) < 4) return;
      dragged = true;
      panning = true;
      anchor = null;
      cam = { ...cam, x: origin.x + dx, y: origin.y + dy };
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      panning = false;
      // The click that ends a drag comes at once, or not at all.
      setTimeout(() => (dragged = false));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /** A click that ended a drag of the view opens and folds nothing. */
  function clickcapture(event: MouseEvent) {
    if (!dragged) return;
    dragged = false;
    event.stopPropagation();
    event.preventDefault();
  }

  function fold(key: string, id: string, folded: boolean) {
    const p = lay.placed.get(key);
    anchor = p ? { key, sx: cam.x + p.x * cam.k, sy: cam.y + p.y * cam.k } : null;
    listUi.owlFold(id, !folded);
  }

  function trees(p: ProjectInfo): string {
    return p.maps.length ? t('home-maps', { count: p.maps.length }) : t('home-not-begun');
  }

  const items = (p: ProjectInfo) => actions.items(p);
</script>

{#if empty}
  <div class="alone">
    <Mark size={140} />
    <h2>{t('home-welcome')}</h2>
    <p>{t('home-welcome-text')}</p>
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={viewport}
    class="owl-map"
    class:panning
    data-owl-map
    onpointerdown={pointerdown}
    onclickcapture={clickcapture}
  >
    <div
      class="world"
      class:hidden={!fitted}
      style:transform="translate({cam.x}px, {cam.y}px) scale({cam.k})"
    >
      <svg class="lines" aria-hidden="true">
        {#each lines as l (l.id)}
          <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        {/each}
      </svg>

      {#each lay.order as key (key)}
        {@const item = owl.items.get(key)}
        {@const p = lay.placed.get(key)}
        {#if item && p}
          <div
            class="place"
            style:transform="translate({Math.round(p.x - p.w / 2)}px, {Math.round(
              p.y - p.h / 2,
            )}px)"
          >
            {#if item.kind === 'owl'}
              <div class="owl" use:measured={key} title={t('home-title')}>
                <Mark size={110} />
              </div>
            {:else if item.kind === 'folder'}
              {@const f = item.folder}
              <button
                type="button"
                class="folder"
                class:folded={item.folded}
                data-owl-folder={f.id}
                aria-expanded={item.holds ? !item.folded : undefined}
                use:measured={key}
                use:tooltip={item.holds
                  ? item.folded
                    ? t('home-owl-unfold')
                    : t('home-owl-fold')
                  : null}
                onclick={() => item.holds && fold(key, f.id, item.folded)}
              >
                {#if item.folded}
                  <FolderIcon size={15} strokeWidth={1.7} />
                {:else}
                  <FolderOpen size={15} strokeWidth={1.7} />
                {/if}
                <span class="label">{f.name}</span>
                {#if item.folded}
                  <span class="count">{t('home-folder-projects', { count: item.projects })}</span>
                {/if}
              </button>
            {:else}
              {@const pr = item.project}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                class="card"
                role="button"
                tabindex="0"
                data-owl-project={pr.id}
                use:measured={key}
                onclick={() => open(pr)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open(pr);
                  }
                }}
                oncontextmenu={(e) => openContextMenu(e, items(pr))}
              >
                <div class="head">
                  <ProjectBadge
                    name={pr.name}
                    sharing={pr.sharing ? { owner: pr.sharing.owner } : null}
                    size={18}
                  />
                  <span class="name serif">{pr.name}</span>
                  <button
                    type="button"
                    class="menu"
                    aria-label={t('home-more-for', { name: pr.name })}
                    onclick={(e) => {
                      e.stopPropagation();
                      openMenu(e.currentTarget, items(pr), { align: 'end' });
                    }}
                  >
                    <Ellipsis size={15} />
                  </button>
                </div>
                {#if pr.description}<p class="description">{pr.description}</p>{/if}
                <div class="facts">{trees(pr)}</div>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    <div class="controls" role="group" aria-label={t('diagram-view')}>
      <button
        type="button"
        aria-label={t('diagram-zoom-out')}
        use:tooltip={{ text: t('diagram-zoom-out'), side: 'top' }}
        onclick={() => zoomBy(1 / 1.25)}
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        class="level"
        aria-label={t('diagram-actual-size')}
        use:tooltip={{ text: t('diagram-actual-size'), side: 'top' }}
        onclick={() => zoomBy(1 / cam.k)}
      >
        {t('diagram-zoom', { percent: Math.round(cam.k * 100) })}
      </button>
      <button
        type="button"
        aria-label={t('diagram-zoom-in')}
        use:tooltip={{ text: t('diagram-zoom-in'), side: 'top' }}
        onclick={() => zoomBy(1.25)}
      >
        <Plus size={14} />
      </button>
      <span class="rule"></span>
      <button
        type="button"
        aria-label={t('home-owl-fit')}
        use:tooltip={{ text: t('home-owl-fit'), side: 'top' }}
        onclick={fit}
      >
        <Scan size={14} />
      </button>
    </div>
  </div>
{/if}

<style>
  .alone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 70px 0 40px;
    text-align: center;
  }
  .alone h2 {
    margin-top: 10px;
    font-family: var(--font-text);
    font-size: 28px;
    font-weight: 500;
  }
  .alone p {
    max-width: 46ch;
    color: var(--ink-2);
    font-family: var(--font-text);
    font-size: 16px;
    line-height: 1.6;
  }
  .owl-map {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--paper);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .owl-map.panning {
    cursor: grabbing;
  }
  .world {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    transform-origin: 0 0;
  }
  .world.hidden {
    visibility: hidden;
  }
  .lines {
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    pointer-events: none;
  }
  .lines line {
    stroke: var(--line-strong);
    stroke-width: 1.2;
    stroke-linecap: round;
  }
  .place {
    position: absolute;
    left: 0;
    top: 0;
  }

  /* The owl: a picture, not a box. */
  .owl {
    display: flex;
    padding: 6px;
  }

  /* A folder: a plain label, no box. */
  .folder {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
    font-variant: small-caps;
    letter-spacing: 0.04em;
    white-space: nowrap;
    cursor: pointer;
  }
  .folder:hover {
    color: var(--accent-strong);
  }
  .folder:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .folder .label {
    font-size: var(--text-md);
  }
  .folder .count {
    color: var(--ink-4);
    font-weight: 400;
    font-variant: normal;
    letter-spacing: 0;
  }

  /* A project: a card, as on the page of cards, smaller. */
  .card {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 230px;
    padding: 10px 8px 9px 12px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    transition:
      box-shadow var(--slow) var(--ease),
      border-color var(--slow) var(--ease);
  }
  .card:hover {
    box-shadow: var(--shadow-2);
    border-color: var(--line-strong);
  }
  .card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--ink);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .description {
    margin: 0;
    padding-right: 6px;
    overflow: hidden;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .facts {
    color: var(--ink-4);
    font-size: var(--text-xs);
  }
  .menu {
    display: inline-flex;
    flex: none;
    padding: 3px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .card:hover .menu,
  .card:focus-within .menu {
    opacity: 1;
  }
  .menu:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }

  .controls {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    align-items: center;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    cursor: default;
  }
  .controls button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .controls button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .controls .level {
    min-width: 46px;
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .controls .rule {
    width: 1px;
    height: 14px;
    margin: 0 2px;
    background: var(--line);
  }
</style>
