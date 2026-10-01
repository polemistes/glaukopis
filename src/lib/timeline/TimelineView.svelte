<script lang="ts">
  /**
   * A map as a timeline: lanes, one for each chosen branch, with the placed
   * elements of the branch along an axis of time. A written time stands
   * where it was written, and as long as it was written (a year, a
   * century); what is relative is drawn where it was solved to be, dashed,
   * with the window of what it may be as a faint band. Where nothing is
   * written at all, the elements are in order, without a scale.
   */
  import { untrack } from 'svelte';
  import Minus from '@lucide/svelte/icons/minus';
  import Maximize from '@lucide/svelte/icons/maximize';
  import Plus from '@lucide/svelte/icons/plus';
  import Rows3 from '@lucide/svelte/icons/rows-3';
  import TableProperties from '@lucide/svelte/icons/table-properties';
  import { notifyOk } from '$lib/ui/toast.svelte';
  import { addChronology } from './chronology';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { t } from '$lib/i18n';
  import { elementMenu } from '$lib/project/elements';
  import { kindColour } from '$lib/project/kinds';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { NodeRecord } from '$lib/project/model/types';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { timelineOf, type Event } from './lanes';
  import LanesDialog from './LanesDialog.svelte';
  import { describeWhen, type Placed } from './solve';
  import { writeYear } from './time';

  interface Props {
    project: Project;
    mapId: string;
    /** Opens an element in the text. */
    ongo: (element: string) => void;
    /** An element to bring into view when the timeline opens. */
    reveal?: string | null;
  }

  let { project, mapId, ongo, reveal = null }: Props = $props();

  const LABEL_WIDTH = 190;
  const LANE_HEAD = 28;
  const ROW = 26;
  const AXIS = 34;
  const LABEL_MOST = 180;

  const colourOf = (node: NodeRecord) => {
    const kind = project.kind(node.kind);
    return kind ? kindColour(kind.colour).ink : null;
  };
  const timeline = $derived(timelineOf(project, mapId, colourOf));
  const settings = $derived(project.map(mapId)?.timeline ?? {});
  const unit = $derived(settings.unit?.trim() || '');

  // ---- the scale: pixels for each unit of time, and where the left edge is ----

  let viewport = $state<HTMLDivElement>();
  let width = $state(800);
  /** Pixels for one unit of the axis. */
  let scale = $state(10);
  /** The time at the left edge of the lanes. */
  let origin = $state(0);
  let fitted = false;

  /** The range that is drawn: what is placed, with room at both ends. */
  const range = $derived.by((): [number, number] => {
    const r = timeline.solved.range;
    if (!r) return [0, 10];
    const span = Math.max(r[1] - r[0], timeline.solved.scaled ? 1 : 1);
    return [r[0] - span * 0.08, r[1] + span * 0.08];
  });

  function fit() {
    const [from, to] = range;
    // Room for the label of the last event as well.
    const room = Math.max(width - LABEL_WIDTH - LABEL_MOST - 20, 200);
    scale = room / Math.max(to - from, 1e-9);
    origin = from;
    fitted = true;
  }

  $effect(() => {
    void range;
    void width;
    untrack(() => {
      if (!fitted) fit();
    });
  });

  const x = (value: number) => LABEL_WIDTH + (value - origin) * scale;
  const value = (px: number) => origin + (px - LABEL_WIDTH) / scale;

  function zoomBy(factor: number, at?: number) {
    const centre = at ?? LABEL_WIDTH + (width - LABEL_WIDTH) / 2;
    const keep = value(centre);
    scale = Math.min(Math.max(scale * factor, 1e-6), 1e7);
    origin = keep - (centre - LABEL_WIDTH) / scale;
  }

  function onwheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      zoomBy(
        event.deltaY < 0 ? 1.15 : 1 / 1.15,
        event.clientX - (viewport?.getBoundingClientRect().left ?? 0),
      );
    } else if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
      origin += (event.deltaX || event.deltaY) / scale;
    }
  }

  // Dragging the background moves along the axis.
  let dragging: { x: number; origin: number } | null = null;
  function onpointerdown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.event, .lane-name, button'))
      return;
    dragging = { x: event.clientX, origin };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function onpointermove(event: PointerEvent) {
    if (!dragging) return;
    origin = dragging.origin - (event.clientX - dragging.x) / scale;
  }
  function onpointerup() {
    dragging = null;
  }

  // ---- the ticks of the axis ----

  const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  const FINE = [1 / 12, 1 / 4, 1 / 2];

  const ticks = $derived.by(() => {
    const visible = (width - LABEL_WIDTH) / scale;
    const wanted = visible / Math.max((width - LABEL_WIDTH) / 90, 1);
    let step =
      STEPS.find((s) => s >= wanted) ?? STEPS[STEPS.length - 1] * Math.ceil(wanted / 10000);
    if (timeline.axis === 'dates' && wanted < 1) step = FINE.find((s) => s >= wanted) ?? 1;
    if (!timeline.solved.scaled) step = Math.max(1, Math.round(step));
    const out: { at: number; label: string }[] = [];
    const first = Math.floor(origin / step) * step;
    for (let v = first; v <= origin + visible + step; v += step) {
      const px = x(v);
      if (px < LABEL_WIDTH - 1) continue;
      out.push({ at: px, label: labelOf(v, step) });
      if (out.length > 200) break;
    }
    return out;
  });

  function labelOf(v: number, step: number): string {
    if (!timeline.solved.scaled) return String(Math.round(v));
    if (timeline.axis === 'units') {
      const n = step < 1 ? v.toFixed(1) : String(Math.round(v));
      return unit ? `${unit} ${n}` : n;
    }
    if (step < 1) {
      // Months within a year.
      const year = Math.floor(v + 1e-9);
      const month = Math.round((v - year) * 12);
      return month === 0
        ? writeYear(year, t('when-bc'))
        : t('when-month-of', { month: month + 1, year: writeYear(year, t('when-bc')) });
    }
    return writeYear(v, t('when-bc'));
  }

  // ---- the rows of each lane: events that would overlap stand in rows of their own ----

  interface Drawn {
    event: Event;
    row: number;
    left: number;
    right: number;
    /** Where the label stands and how wide it is thought to be. */
    labelLeft: number;
    labelWidth: number;
  }

  const CHAR = 6.6;

  function labelWidth(name: string): number {
    return Math.min((name || t('project-untitled')).length * CHAR + 10, LABEL_MOST);
  }

  const lanes = $derived.by(() => {
    const laid: {
      id: string;
      name: string;
      colour: string | null;
      own: Placed | null;
      rows: number;
      drawn: Drawn[];
    }[] = [];
    const all = [...timeline.lanes];
    if (timeline.elsewhere.length)
      all.push({
        id: '',
        name: t('timeline-elsewhere'),
        colour: null,
        own: null,
        events: timeline.elsewhere,
      });
    for (const lane of all) {
      const ends: number[] = [];
      const drawn: Drawn[] = [];
      const placed = lane.events
        .filter((e) => Number.isFinite(e.placed.from))
        .sort((a, b) => a.placed.from - b.placed.from);
      for (const event of placed) {
        const left = x(event.placed.from);
        const right = Math.max(x(event.placed.to), left + 8);
        const lw = labelWidth(event.name);
        const labelLeft = event.placed.span && right - left > lw ? left + 4 : right + 6;
        const extent = Math.max(right, labelLeft + lw);
        let row = ends.findIndex((end) => end < left - 2);
        if (row < 0) {
          row = ends.length;
          ends.push(extent);
        } else ends[row] = extent;
        drawn.push({ event, row, left, right, labelLeft, labelWidth: lw });
      }
      laid.push({ ...lane, rows: Math.max(ends.length, 1), drawn });
    }
    return laid;
  });

  const unplaced = $derived(
    [...timeline.lanes.flatMap((l) => l.events), ...timeline.elsewhere].filter(
      (e) => !Number.isFinite(e.placed.from),
    ),
  );

  // ---- what is chosen, and said of it ----

  let selected = $state<string | null>(null);

  const words = $derived({
    after: t('when-said-after'),
    before: t('when-said-before'),
    during: t('when-said-during'),
    to: t('when-said-to'),
    approx: t('when-said-approx'),
  });
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  function tipOf(e: Event): string {
    const said = e.node.when ? describeWhen(e.node.when, nameOf, words) : '';
    const problem =
      e.placed.problem === 'contradiction'
        ? ` — ${t('timeline-contradiction')}`
        : e.placed.problem === 'unknown'
          ? ` — ${t('timeline-unknown')}`
          : '';
    return `${e.name || t('project-untitled')}: ${said}${problem}`;
  }

  function menu(event: MouseEvent, id: string) {
    event.preventDefault();
    selected = id;
    openContextMenu(
      event,
      elementMenu(project, [id], {
        select: (ids) => (selected = ids[0] ?? null),
        edit: (which) => ongo(which),
      }),
    );
  }

  $effect(() => {
    const id = reveal;
    if (!id) return;
    untrack(() => {
      selected = id;
      const p = timeline.solved.placed.get(id);
      if (p && Number.isFinite(p.from)) origin = p.from - (width - LABEL_WIDTH) / scale / 3;
    });
  });

  let lanesOpen = $state(false);

  const total = $derived(lanes.reduce((n, l) => n + LANE_HEAD + l.rows * ROW, 0));
</script>

<div class="timeline" bind:this={viewport} bind:clientWidth={width}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="scroller"
    role="application"
    aria-label={t('timeline-title')}
    {onwheel}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
  >
    <div class="axis" style:height="{AXIS}px">
      <div class="corner" style:width="{LABEL_WIDTH}px">
        {#if !timeline.solved.scaled}<span class="ordered">{t('timeline-ordered')}</span>{/if}
      </div>
      {#each ticks as tick (tick.at)}
        <div class="tick" style:left="{tick.at}px"><span>{tick.label}</span></div>
      {/each}
    </div>

    <div class="lanes" style:height="{total}px">
      {#each ticks as tick (tick.at)}
        <div class="rule" style:left="{tick.at}px"></div>
      {/each}
      {#each lanes as lane, i (lane.id || `elsewhere-${i}`)}
        {@const top = lanes.slice(0, i).reduce((n, l) => n + LANE_HEAD + l.rows * ROW, 0)}
        {@const height = LANE_HEAD + lane.rows * ROW}
        <div class="lane" style:top="{top}px" style:height="{height}px">
          {#if lane.own && Number.isFinite(lane.own.from)}
            <div
              class="own"
              class:floating={!lane.own.fixed}
              style:left="{x(lane.own.from)}px"
              style:width="{Math.max(x(lane.own.to) - x(lane.own.from), 4)}px"
              style:--lane={lane.colour ?? 'var(--ink-4)'}
            ></div>
          {/if}
          <button
            type="button"
            class="lane-name truncate"
            style:width="{LABEL_WIDTH}px"
            style:--lane={lane.colour ?? 'var(--ink-3)'}
            disabled={!lane.id}
            onclick={() => lane.id && ongo(lane.id)}
            oncontextmenu={(e) => lane.id && menu(e, lane.id)}
          >
            {#if lane.colour}<span class="dot" style:background={lane.colour}></span>{/if}
            {lane.name || t('project-untitled')}
          </button>
          {#each lane.drawn as d (d.event.id)}
            {@const p = d.event.placed}
            {@const y = LANE_HEAD + d.row * ROW}
            {#if p.window}
              {@const wFrom = Number.isFinite(p.window.start[0])
                ? x(p.window.start[0])
                : LABEL_WIDTH}
              {@const wTo = Number.isFinite(p.window.end[1]) ? x(p.window.end[1]) : width + 400}
              <div
                class="window"
                style:left="{wFrom}px"
                style:width="{Math.max(wTo - wFrom, 2)}px"
                style:top="{y + 4}px"
              ></div>
            {/if}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <div
              class="event"
              class:span={p.span}
              class:point={!p.span}
              class:floating={!p.fixed}
              class:approx={p.approx}
              class:chosen={selected === d.event.id}
              class:trouble={!!p.problem}
              style:left="{d.left}px"
              style:width="{d.right - d.left}px"
              style:top="{y + 3}px"
              style:--event={d.event.colour ?? 'var(--accent)'}
              use:tooltip={{ text: tipOf(d.event), side: 'top' }}
              onclick={() => (selected = d.event.id)}
              ondblclick={() => ongo(d.event.id)}
              oncontextmenu={(e) => menu(e, d.event.id)}
            >
              {#if !p.span}<span class="mark"></span>{/if}
              {#if p.problem}<span class="warn"><TriangleAlert size={11} /></span>{/if}
            </div>
            <div
              class="label truncate"
              class:inside={d.labelLeft < d.right}
              style:left="{d.labelLeft}px"
              style:max-width="{d.labelWidth}px"
              style:top="{y + 3}px"
            >
              {d.event.name || t('project-untitled')}
            </div>
          {/each}
        </div>
      {/each}
      {#if !lanes.length}
        <div class="empty">{t('timeline-empty')}</div>
      {/if}
    </div>
  </div>

  {#if unplaced.length}
    <div class="unplaced">
      <TriangleAlert size={13} />
      <span>{t('timeline-unplaced', { count: unplaced.length })}</span>
      {#each unplaced as e (e.id)}
        <button type="button" onclick={() => ongo(e.id)}>{e.name || t('project-untitled')}</button>
      {/each}
    </div>
  {/if}

  <div class="controls" role="group" aria-label={t('timeline-view')}>
    <IconButton
      label={t('timeline-chronology')}
      size="sm"
      side="top"
      onclick={() => {
        const made = addChronology(project, mapId);
        if (made) {
          notifyOk(t('timeline-chronology-made'));
          ongo(made);
        }
      }}
    >
      <TableProperties size={14} />
    </IconButton>
    <IconButton label={t('timeline-lanes')} size="sm" side="top" onclick={() => (lanesOpen = true)}>
      <Rows3 size={14} />
    </IconButton>
    <span class="rule-v"></span>
    <IconButton label={t('diagram-zoom-out')} size="sm" side="top" onclick={() => zoomBy(1 / 1.3)}>
      <Minus size={14} />
    </IconButton>
    <IconButton label={t('diagram-zoom-in')} size="sm" side="top" onclick={() => zoomBy(1.3)}>
      <Plus size={14} />
    </IconButton>
    <IconButton label={t('diagram-show-all')} size="sm" side="top" onclick={fit}>
      <Maximize size={14} />
    </IconButton>
  </div>
</div>

{#if lanesOpen}
  <LanesDialog {project} {mapId} onclose={() => (lanesOpen = false)} />
{/if}

<style>
  .timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--canvas);
    user-select: none;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .scroller {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .axis {
    position: sticky;
    top: 0;
    z-index: 3;
    border-bottom: 1px solid var(--line);
    background: var(--paper-raised);
    overflow: hidden;
  }
  .corner {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    padding-left: 12px;
    background: var(--paper-raised);
    border-right: 1px solid var(--line);
  }
  .ordered {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .tick {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid var(--line);
  }
  .tick span {
    position: absolute;
    left: 5px;
    bottom: 6px;
    white-space: nowrap;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .lanes {
    position: relative;
    min-height: 120px;
  }
  .rule {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px dashed color-mix(in srgb, var(--line) 70%, transparent);
  }
  .lane {
    position: absolute;
    left: 0;
    right: 0;
    border-bottom: 1px solid var(--line);
  }
  .lane-name {
    position: sticky;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 12px;
    border: none;
    border-right: 1px solid var(--line);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .lane-name:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .lane-name .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .own {
    position: absolute;
    top: 0;
    bottom: 0;
    background: color-mix(in srgb, var(--lane) 10%, transparent);
    border-left: 2px solid color-mix(in srgb, var(--lane) 50%, transparent);
    border-right: 2px solid color-mix(in srgb, var(--lane) 50%, transparent);
  }
  .own.floating {
    border-left-style: dashed;
    border-right-style: dashed;
  }
  .window {
    position: absolute;
    height: 18px;
    background: color-mix(in srgb, var(--gold) 12%, transparent);
    border-radius: 3px;
  }
  .event {
    position: absolute;
    height: 20px;
    cursor: pointer;
  }
  .event.span {
    border-radius: 4px;
    background: color-mix(in srgb, var(--event) 24%, var(--paper-raised));
    border: 1.5px solid var(--event);
  }
  .event.floating.span {
    border-style: dashed;
    background: color-mix(in srgb, var(--event) 10%, var(--paper-raised));
  }
  .event.point .mark {
    position: absolute;
    left: -5px;
    top: 5px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--event);
    border: 1.5px solid var(--paper-raised);
  }
  .event.point {
    border-bottom: 3px solid color-mix(in srgb, var(--event) 45%, transparent);
    border-radius: 2px;
    height: 12px;
    margin-top: 1px;
  }
  .event.point.floating .mark {
    background: var(--paper-raised);
    border: 1.5px dashed var(--event);
  }
  .event.approx {
    opacity: 0.85;
  }
  .event.chosen {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .event.trouble {
    --event: var(--danger);
  }
  .warn {
    position: absolute;
    right: -16px;
    top: 1px;
    color: var(--danger);
  }
  .label {
    position: absolute;
    height: 20px;
    line-height: 20px;
    pointer-events: none;
    color: var(--ink);
  }
  .label.inside {
    color: var(--ink);
    font-weight: 500;
  }
  .empty {
    padding: 40px;
    color: var(--ink-3);
    text-align: center;
  }
  .unplaced {
    flex: none;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding: 6px 12px;
    border-top: 1px solid var(--line);
    background: var(--paper-raised);
    color: var(--danger);
    font-size: var(--text-xs);
  }
  .unplaced button {
    padding: 1px 7px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .controls {
    position: absolute;
    right: 14px;
    bottom: 14px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
  }
  .rule-v {
    width: 1px;
    height: 16px;
    margin: 0 3px;
    background: var(--line);
  }
</style>
