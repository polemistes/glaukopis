<script lang="ts">
  /**
   * A map as a timeline: lanes, one for each chosen branch, with the placed
   * elements of the branch along an axis of time. A written time stands
   * where it was written, and as long as it was written (a year, a
   * century); what is relative is drawn where it was solved to be, dashed,
   * with the window of what it may be as a faint band. Where nothing is
   * written at all, the elements are in order, without a scale.
   *
   * With moving allowed, a written time is dragged along the axis, and the
   * edge of a span changes its start or its end; the time is written anew
   * as finely as it was written. Elements that say nothing of their time
   * can be shown, dragged onto the timeline, or opened to say when they are.
   */
  import { untrack } from 'svelte';
  import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Minus from '@lucide/svelte/icons/minus';
  import Maximize from '@lucide/svelte/icons/maximize';
  import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
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
  import { describeWhen, type Placed, type When } from './solve';
  import {
    precisionOf,
    readDuration,
    readTime,
    snap,
    writeDuration,
    writeTime,
    writeYear,
    type Precision,
  } from './time';
  import { sayWhen } from './when.svelte';

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
    /** How far the margins either side reach, where there are any. */
    fadeLeft: number;
    fadeRight: number;
  }

  const CHAR = 6.6;

  function labelWidth(name: string): number {
    return Math.min((name || t('project-untitled')).length * CHAR + 10, LABEL_MOST);
  }

  /** The lanes whose events are folded away, by the id of the lane; its own span stays. */
  let folded = $state<ReadonlySet<string>>(new Set());
  function fold(id: string) {
    const next = new Set(folded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    folded = next;
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
      const placed = (folded.has(lane.id) ? [] : lane.events)
        .filter((e) => Number.isFinite(e.placed.from))
        .map((e) => (drag?.id === e.id ? { ...e, placed: dragged(e.placed) } : e))
        .sort((a, b) => a.placed.from - b.placed.from);
      for (const event of placed) {
        const left = x(event.placed.from);
        const right = Math.max(x(event.placed.to), left + 8);
        const [before, after] = event.placed.margins;
        const fadeLeft = before > 0 ? x(event.placed.from - before) : left;
        const fadeRight = after > 0 ? Math.max(x(event.placed.to + after), right) : right;
        const lw = labelWidth(event.name);
        const labelLeft = event.placed.span && right - left > lw ? left + 4 : right + 6;
        const extent = Math.max(right, fadeRight, labelLeft + lw);
        let row = ends.findIndex((end) => end < fadeLeft - 2);
        if (row < 0) {
          row = ends.length;
          ends.push(extent);
        } else ends[row] = extent;
        drawn.push({ event, row, left, right, labelLeft, labelWidth: lw, fadeLeft, fadeRight });
      }
      laid.push({ ...lane, rows: folded.has(lane.id) ? 0 : Math.max(ends.length, 1), drawn });
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

  // ---- moving what is placed, and placing what is not ----

  /** Whether elements may be dragged: off, so that nothing moves by mistake. */
  let moving = $state(false);
  /** Whether the elements that say nothing of their time are shown, to be placed. */
  let showWithout = $state(false);

  /** The elements of the map that say nothing of their time, in the order of the text; not the centre. */
  const without = $derived.by(() => {
    if (!showWithout) return [];
    const tree = project.tree(mapId);
    return tree.sequence
      .filter((id) => id !== tree.root && !project.node(id)?.when)
      .map((id) => ({ id, name: project.node(id)?.title || t('project-untitled') }));
  });

  /** A written end as it is dragged: its text, and how finely it was written. */
  interface End {
    text: string;
    precision: Precision;
    /** Where what was written begins on the axis. */
    at: number;
    /** The margin either side, as written. */
    margin: string;
  }

  interface Dragging {
    id: string;
    /**
     * The whole, the start of a span, its end, the margin either side of
     * the start or of the end; or an element without a time, brought onto
     * the timeline.
     */
    mode: 'move' | 'start' | 'end' | 'margin-start' | 'margin-end' | 'new';
    /** Where what is dragged stood when it was taken hold of. */
    from: number;
    to: number;
    x0: number;
    start: End | null;
    end: End | null;
    /** The ends written anew, as the pointer has them; and the margins. */
    draft: { start?: string; end?: string; marginStart?: string; marginEnd?: string };
    name: string;
    /** Where the pointer is, for what follows it. */
    px: number;
    py: number;
  }
  let drag = $state<Dragging | null>(null);

  const endOf = (bound: { at?: string; margin?: string } | undefined): End | null => {
    const text = bound?.at;
    if (!text) return null;
    const precision = precisionOf(text, timeline.axis);
    const time = readTime(text, timeline.axis);
    return precision && time
      ? { text, precision, at: time.from, margin: bound?.margin ?? '' }
      : null;
  };

  /** The placement of what is dragged, as its draft has it. */
  function dragged(placed: Placed): Placed {
    if (!drag || drag.mode === 'new') return placed;
    const start = drag.draft.start ? readTime(drag.draft.start, timeline.axis) : null;
    const end = drag.draft.end ? readTime(drag.draft.end, timeline.axis) : null;
    let from = start ? start.from : placed.from;
    let to = end ? end.to : placed.span ? placed.to : start ? start.to : placed.to;
    if (drag.mode === 'move' && placed.span && !end) to = placed.to + (from - placed.from);
    if (to < from) [from, to] = [to, from];
    const margins: [number, number] = [...placed.margins];
    const m = (text: string | undefined) =>
      text === undefined ? null : (readDuration(text, timeline.axis) ?? 0);
    const ms = m(drag.draft.marginStart);
    const me = m(drag.draft.marginEnd);
    if (ms !== null) margins[0] = ms;
    if (me !== null) margins[1] = me;
    // A point has one margin, either side.
    if (!placed.span && ms !== null) margins[1] = ms;
    if (!placed.span && me !== null) margins[0] = me;
    return { ...placed, from, to, margins };
  }

  function beginDrag(event: PointerEvent, e: Event, mode: Exclude<Dragging['mode'], 'new'>) {
    if (!moving || !timeline.solved.scaled || event.button !== 0 || !e.node.when) return;
    const start = endOf(e.node.when.start);
    const end = endOf(e.node.when.end);
    // Only a written time moves: what is relative stands where it was solved.
    // The margin of a point is the margin of its start, either side.
    const needs = mode === 'end' || (mode === 'margin-end' && e.placed.span) ? end : start;
    if (!needs) return;
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = {
      id: e.id,
      mode,
      x0: event.clientX,
      from: e.placed.from,
      to: e.placed.to,
      start,
      end,
      draft: {},
      name: e.name,
      px: event.clientX,
      py: event.clientY,
    };
  }

  function beginNew(event: PointerEvent, id: string, name: string) {
    if (event.button !== 0 || !timeline.solved.scaled) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = {
      id,
      mode: 'new',
      x0: event.clientX,
      from: NaN,
      to: NaN,
      start: null,
      end: null,
      draft: {},
      name,
      px: event.clientX,
      py: event.clientY,
    };
  }

  function moveDrag(event: PointerEvent) {
    if (!drag) return;
    const delta = (event.clientX - drag.x0) / scale;
    const draft: Dragging['draft'] = {};
    const written = (end: End) =>
      writeTime(snap(end.at + delta, end.precision), end.precision, timeline.axis, end.text);
    if ((drag.mode === 'move' || drag.mode === 'start') && drag.start)
      draft.start = written(drag.start);
    if ((drag.mode === 'move' || drag.mode === 'end') && drag.end) draft.end = written(drag.end);
    // A margin is as far as the pointer is from the end it belongs to, written in the words it had.
    if (drag.mode === 'margin-start' && drag.start) {
      const r = viewport!.getBoundingClientRect();
      const far = Math.max(0, drag.from - value(event.clientX - r.left));
      draft.marginStart = writeDuration(far, timeline.axis, drag.start.margin);
    }
    if (drag.mode === 'margin-end') {
      const r = viewport!.getBoundingClientRect();
      const far = Math.max(0, value(event.clientX - r.left) - drag.to);
      const like = (drag.end ?? drag.start)?.margin ?? '';
      draft.marginEnd = writeDuration(far, timeline.axis, like);
    }
    drag = { ...drag, draft, px: event.clientX, py: event.clientY };
  }

  /** What the dragged time reads now, shown beside the pointer. */
  const readout = $derived.by(() => {
    if (!drag || drag.mode === 'new') return '';
    const { draft } = drag;
    if (drag.mode === 'margin-start' || drag.mode === 'margin-end')
      return `± ${draft.marginStart ?? draft.marginEnd ?? ''}`;
    const start = draft.start ?? drag.start?.text ?? '';
    const end = draft.end ?? drag.end?.text;
    return end ? `${start} ${t('when-said-to')} ${end}` : start;
  });

  /** How finely a time put on the timeline by hand is written: as the axis is looked at. */
  function grainNow(): Precision {
    if (timeline.axis === 'units') return 'unit';
    const visible = (width - LABEL_WIDTH) / scale;
    if (visible < 1.5) return 'day';
    if (visible < 20) return 'month';
    return 'year';
  }

  let scroller = $state<HTMLDivElement>();

  /** Whether the pointer is over the lanes, by a point of the window. */
  function overLanes(clientX: number, clientY: number): boolean {
    const r = scroller?.getBoundingClientRect();
    if (!r) return false;
    return clientX - r.left > LABEL_WIDTH && clientY - r.top > AXIS && clientY < r.bottom;
  }

  /** Whether a dragged element without a time is over the lanes, where it can be put. */
  const canDrop = $derived(!!drag && drag.mode === 'new' && overLanes(drag.px, drag.py));

  function endDrag(event: PointerEvent) {
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.mode === 'new') {
      // Pressed rather than dragged: it says when it is in words.
      if (Math.abs(event.clientX - d.x0) < 4 && !overLanes(event.clientX, event.clientY)) {
        sayWhen(d.id);
        return;
      }
      if (!overLanes(event.clientX, event.clientY)) return;
      const r = viewport!.getBoundingClientRect();
      const grain = grainNow();
      const like = timeline.axis === 'units' && unit ? `${unit} 0` : '';
      const at = writeTime(snap(value(event.clientX - r.left), grain), grain, timeline.axis, like);
      project.checkpoint();
      project.setWhen(d.id, { start: { at } });
      project.checkpoint();
      selected = d.id;
      return;
    }
    const when = project.node(d.id)?.when;
    if (!when) return;
    const next: When = { start: { ...when.start }, ...(when.end ? { end: { ...when.end } } : {}) };
    let changed = false;
    if (d.draft.start && d.draft.start !== when.start.at) {
      next.start.at = d.draft.start;
      changed = true;
    }
    if (d.draft.end && next.end && d.draft.end !== next.end.at) {
      next.end.at = d.draft.end;
      changed = true;
    }
    // A margin dragged to nothing is none.
    const margin = (bound: { margin?: string }, text: string | undefined) => {
      if (text === undefined) return;
      const none = (readDuration(text, timeline.axis) ?? 0) <= 0;
      if (none ? !bound.margin : bound.margin === text) return;
      if (none) delete bound.margin;
      else bound.margin = text;
      changed = true;
    };
    margin(next.start, d.draft.marginStart);
    if (next.end) margin(next.end, d.draft.marginEnd);
    else margin(next.start, d.draft.marginEnd);
    if (!changed) return;
    // A span ends after it begins.
    if (next.end?.at && next.start.at) {
      const a = readTime(next.start.at, timeline.axis);
      const b = readTime(next.end.at, timeline.axis);
      if (a && b && b.to <= a.from) return;
    }
    project.checkpoint();
    project.setWhen(d.id, next);
    project.checkpoint();
  }
</script>

<div class="timeline" class:moving bind:this={viewport} bind:clientWidth={width}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="scroller"
    bind:this={scroller}
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
            aria-expanded={lane.id ? !folded.has(lane.id) : undefined}
            onclick={() => lane.id && fold(lane.id)}
            ondblclick={() => lane.id && sayWhen(lane.id)}
            oncontextmenu={(e) => lane.id && menu(e, lane.id)}
          >
            {#if lane.id}
              <span class="chevron">
                {#if folded.has(lane.id)}<ChevronRight size={13} />{:else}<ChevronDown
                    size={13}
                  />{/if}
              </span>
            {/if}
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
            {#if d.fadeLeft < d.left}
              <div
                class="fade before"
                style:left="{d.fadeLeft}px"
                style:width="{d.left - d.fadeLeft}px"
                style:top="{y + 4}px"
                style:--event={d.event.colour ?? 'var(--accent)'}
              >
                {#if moving}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span
                    class="handle margin start"
                    onpointerdown={(e) => beginDrag(e, d.event, 'margin-start')}
                    onpointermove={moveDrag}
                    onpointerup={endDrag}
                  ></span>
                {/if}
              </div>
            {/if}
            {#if d.fadeRight > d.right}
              <div
                class="fade after"
                style:left="{d.right}px"
                style:width="{d.fadeRight - d.right}px"
                style:top="{y + 4}px"
                style:--event={d.event.colour ?? 'var(--accent)'}
              >
                {#if moving}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span
                    class="handle margin end"
                    onpointerdown={(e) => beginDrag(e, d.event, 'margin-end')}
                    onpointermove={moveDrag}
                    onpointerup={endDrag}
                  ></span>
                {/if}
              </div>
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
              ondblclick={() => sayWhen(d.event.id)}
              oncontextmenu={(e) => menu(e, d.event.id)}
              onpointerdown={(e) => beginDrag(e, d.event, 'move')}
              onpointermove={moveDrag}
              onpointerup={endDrag}
            >
              {#if !p.span}<span class="mark"></span>{/if}
              {#if p.problem}<span class="warn"><TriangleAlert size={11} /></span>{/if}
              {#if moving && p.span}
                <span class="handle start" onpointerdown={(e) => beginDrag(e, d.event, 'start')}
                ></span>
                <span class="handle end" onpointerdown={(e) => beginDrag(e, d.event, 'end')}></span>
              {/if}
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

  {#if showWithout}
    <div class="without" data-without>
      <CalendarPlus size={13} />
      {#if without.length}
        <span>{t('timeline-without-hint')}</span>
        {#each without as e (e.id)}
          <button
            type="button"
            class:dragging={drag?.id === e.id}
            onpointerdown={(ev) => beginNew(ev, e.id, e.name)}
            onpointermove={moveDrag}
            onpointerup={endDrag}>{e.name}</button
          >
        {/each}
      {:else}
        <span>{t('timeline-without-none')}</span>
      {/if}
    </div>
  {/if}
  {#if drag && drag.mode !== 'new' && readout}
    <div class="ghost readout" style:left="{drag.px + 14}px" style:top="{drag.py - 30}px">
      {readout}
    </div>
  {/if}
  {#if drag?.mode === 'new'}
    <div
      class="ghost"
      class:can={canDrop}
      style:left="{drag.px + 12}px"
      style:top="{drag.py - 10}px"
    >
      {drag.name}
    </div>
  {/if}

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
    <IconButton
      label={t('timeline-moving')}
      size="sm"
      side="top"
      active={moving}
      disabled={!timeline.solved.scaled}
      onclick={() => (moving = !moving)}
    >
      <MoveHorizontal size={14} />
    </IconButton>
    <IconButton
      label={t('timeline-without')}
      size="sm"
      side="top"
      active={showWithout}
      onclick={() => (showWithout = !showWithout)}
    >
      <CalendarPlus size={14} />
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
  /* With moving allowed, what is written can be taken hold of; the edges of a span as well. */
  .timeline.moving .event {
    cursor: grab;
  }
  .handle {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 8px;
    cursor: ew-resize;
  }
  .handle.start {
    left: -4px;
  }
  .handle.end {
    right: -4px;
  }
  /* The outer edge of a margin, where it is dragged wider or narrower. */
  .handle.margin {
    pointer-events: auto;
    top: 0;
    bottom: 0;
  }
  .handle.margin.start {
    left: -2px;
  }
  .handle.margin.end {
    right: -2px;
  }
  .readout {
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .chevron {
    flex: none;
    display: inline-flex;
    color: var(--ink-3);
  }
  .ghost {
    position: fixed;
    z-index: 20;
    padding: 2px 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    color: var(--ink-3);
    pointer-events: none;
    white-space: nowrap;
  }
  .ghost.can {
    color: var(--ink);
    border-color: var(--accent);
  }
  .without {
    flex: none;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    /* Room at the right for the controls, which stand over the foot. */
    padding: 6px 250px 6px 12px;
    border-top: 1px solid var(--line);
    background: var(--paper-raised);
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .without button {
    padding: 1px 7px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    cursor: grab;
    touch-action: none;
  }
  .without button.dragging {
    opacity: 0.5;
  }
  /* The margin either side of a time: a band that fades away from it. */
  .fade {
    position: absolute;
    height: 12px;
    border-radius: 6px;
    pointer-events: none;
  }
  .fade.before {
    background: linear-gradient(
      to right,
      transparent,
      color-mix(in srgb, var(--event) 38%, transparent)
    );
  }
  .fade.after {
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--event) 38%, transparent),
      transparent
    );
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
