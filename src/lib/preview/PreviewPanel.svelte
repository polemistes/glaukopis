<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import PackageX from '@lucide/svelte/icons/package-x';
  import Palette from '@lucide/svelte/icons/palette';
  import Printer from '@lucide/svelte/icons/printer';
  import ScanEye from '@lucide/svelte/icons/scan-eye';
  import Share from '@lucide/svelte/icons/share';
  import Tag from '@lucide/svelte/icons/tag';
  import TextCursorInput from '@lucide/svelte/icons/text-cursor-input';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import { isBackendError } from '$lib/api/backend';
  import {
    documentPreview,
    documentPreviewPages,
    documentPreviewStop,
    documentPrintPages,
    type DocumentFormat,
    type Place,
    type Preview,
    type PreviewPage,
    type Spot,
    type TextRun,
  } from '$lib/api/documents';
  import { isMade, lookFor, PAGE, readWhat, spotsOn, whatIs } from './spots';
  import { generatedPartWords } from '$lib/document/templates';
  import { kindName } from '$lib/editor/kinds';
  import { partOf } from '$lib/project/parts';
  // The writer's settings; `settings` below are those of the document.
  import { settings as writerSettings } from '$lib/state/settings.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Template } from '$lib/api/templates';
  import { lookUi } from '$lib/look/look.svelte';
  import { documents } from './documents.svelte';
  import { t } from '$lib/i18n';
  import { keysFor, shortcuts } from '$lib/shell/keys.svelte';
  import { panes } from '$lib/project/panes.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { clampZoom, percent, PX_PER_PT, stepped, ZOOMS } from './zoom';
  import { countWords, documentMark, leanDocument } from '$lib/project/model/document';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, toasts } from '$lib/ui/toast.svelte';
  import { printPages, svgSize, type PrintablePage } from '$lib/print/pages';
  import { testHook } from '$lib/shell/testing';
  import { documentRequest, looksWithin, templateUsed } from './documents.svelte';
  import ExportDialog from './ExportDialog.svelte';

  interface Props {
    project: Project;
    projectId: string;
    /** The element in view: its branch is the document. */
    at: string;
    onclose: () => void;
    /** Whether the Look column stands beside the pages. */
    look: boolean;
    /** Opens or closes the Look column. */
    onlook: () => void;
    /** Shows an element in the text: the one at the place in the pages that is looked at. */
    ongo: (element: string) => void;
    /** The element the text is at, so that its place in the pages can be shown. */
    current: () => string | null;
  }

  let { project, projectId, at, onclose, look, onlook, ongo, current }: Props = $props();

  /**
   * A page as it is shown: what it holds, the address it is shown from, the
   * making it is of, and its text, laid over it; and where the text ends at
   * the right, in percent of the width of the page, so that the chip that
   * names a line stands in the margin beside it.
   */
  interface Shown {
    svg: string;
    url: string;
    made: number;
    lines: Line[];
    right: number;
  }

  /**
   * A line of the text on a page, laid over the drawn page so that it can be
   * selected and copied. Its place is in percent of the page; the runs on it
   * follow one another, each as wide as it was set, with the room before it
   * as a margin, so that the browser copies a line as one line. Sizes of
   * type are in hundredths of the width of the page (`cqw`). What the line
   * is (a quotation, a heading, a note…) is read from the spots of its page
   * by its baseline, in points.
   */
  interface Line {
    left: number;
    top: number;
    width: number;
    height: number;
    size: number;
    baseline: number;
    what: string;
    runs: { gap: number; width: number; size: number; text: string }[];
  }

  /**
   * Lays the runs of a page in lines: those on one baseline are one line,
   * named by the spots of the page (`number`) that hold the baseline of its first run.
   */
  function linesOf(
    texts: TextRun[],
    page: { width: number; height: number },
    number: number,
    spots: Spot[],
  ): Line[] {
    const runs = texts
      .filter((r) => r.text && r.width > 0 && r.size > 0)
      .sort((a, b) => a.baseline - b.baseline || a.x - b.x);
    const groups: TextRun[][] = [];
    for (const run of runs) {
      const last = groups[groups.length - 1];
      if (last && Math.abs(last[0].baseline - run.baseline) <= run.size * 0.3) last.push(run);
      else groups.push([run]);
    }
    return groups.map((group) => {
      group.sort((a, b) => a.x - b.x);
      const left = Math.min(...group.map((r) => r.x));
      const right = Math.max(...group.map((r) => r.x + r.width));
      const top = Math.min(...group.map((r) => r.baseline - r.size * 0.8));
      const bottom = Math.max(...group.map((r) => r.baseline + r.size * 0.3));
      const wide = Math.max(right - left, 0.01);
      let end = left;
      const baseline = group[0].baseline;
      return {
        left: (left / page.width) * 100,
        top: (top / page.height) * 100,
        width: (wide / page.width) * 100,
        height: (Math.max(bottom - top, 0.01) / page.height) * 100,
        size: (Math.max(...group.map((r) => r.size)) / page.width) * 100,
        baseline,
        what: whatIs(spots, number, baseline),
        runs: group.map((r, i) => {
          const gap = ((r.x - end) / wide) * 100;
          end = r.x + r.width;
          const next = group[i + 1];
          // Words set apart, with room between them, are copied with a space between them.
          const apart =
            next && next.x - end > r.size * 0.12 && !/\s$/.test(r.text) && !/^\s/.test(next.text);
          return {
            gap,
            width: (r.width / wide) * 100,
            size: (r.size / page.width) * 100,
            text: apart ? `${r.text} ` : r.text,
          };
        }),
      };
    });
  }

  /** At most so many pages are kept: those nearest to what is looked at. */
  const KEPT = 40;
  /** So many pages before and after those in view are fetched with them. */
  const BESIDE = 2;
  /** The programs the core may say are missing, by the names it gives them in every language. */
  const PROGRAMS = ['Pandoc', 'Typst', 'LaTeX'];

  /** So many pages are asked of the core at a time for printing. */
  const PRINT_BATCH = 24;

  /** How many pages the document has. */
  let count = $state(0);
  /** The size of a page, in points. */
  let size = $state.raw({ width: 595, height: 842 });
  /**
   * The pages that are there, by their numbers. Only those that are looked
   * at, and those near them, are fetched and drawn: a long document has
   * hundreds of pages, each a quarter of a megabyte.
   */
  let shown = $state.raw(new Map<number, Shown>());
  /** Where each element of the document begins in the pages, in the order of the text. */
  let places = $state.raw<Place[]>([]);
  /** What stands where on the pages: by these each line is named. */
  let spots = $state.raw<Spot[]>([]);
  /** The page that is pointed out for a moment, when the place of the text is shown. */
  let marked = $state<number | null>(null);
  let marking: ReturnType<typeof setTimeout> | undefined;
  /** Rises with every making of the document: pages of an earlier one are shown until those of this one are there. */
  let made = 0;
  /** What the pages that are shown were made from. */
  let shownFrom = '';
  /** The stamps of the texts that were sent, and are kept where the pages are made. */
  let sent = new Set<string>();
  let status = $state<'waiting' | 'working' | 'shown' | 'failed'>('waiting');
  let error = $state<{ kind: string; message: string } | null>(null);
  let warnings = $state.raw<string[]>([]);
  let missing = $state.raw<string[]>([]);
  let substitute = $state<string | null>(null);
  let format = $state.raw<DocumentFormat | null>(null);
  /** The template the pages were made by: what it requires is counted against. */
  let template = $state.raw<Template | null>(null);
  let exporting = $state(false);
  let scroller = $state<HTMLDivElement>();
  /** Whether the pages are being made. Never twice at once. */
  let making = false;
  /** Whether something has changed while the pages were being made. */
  let again = false;
  /** Whether the preview has been closed. */
  let gone = false;
  /** How long the last making took, in milliseconds. */
  let took = 0;
  /** Those that wait for the making of the pages to be over: printing. */
  let whenMade: (() => void)[] = [];
  /** Whether the pages are being printed: never twice at once. */
  let printing = $state(false);

  /** What is said of the element as a document, with what it inherits from those over it. */
  const settings = $derived(project.documentOf(at).settings);
  const choice = $derived(documents.choice(settings, project));
  /**
   * The words of the document, a moment behind the writing: what is shown
   * under the pages is not written anew at every key, which would have the
   * window paint all between the line that is written and the count.
   */
  let words = $state.raw(untrack(() => countWords(project, at)));
  function recount() {
    const now = countWords(project, at);
    if (now.text !== words.text || now.withNotes !== words.withNotes) words = now;
  }
  // Counted at once for another element, and for the writing when it pauses.
  $effect(() => {
    void at;
    untrack(recount);
    return project.onChange(recount, 600);
  });

  $effect(() => {
    documents.load();
  });

  /** The document whole, for what is made of all of it: an export, the sample of a layout. */
  const request = () => documentRequest(project, projectId, at);

  /** The room between two pages, and around all of them, as the style sheet has them. */
  const GAP = 16;
  const AROUND = { top: 20, side: 22 };
  /** The widest a page is shown. */
  const WIDEST = 820;

  /** How far the pages have been moved, and the room they are shown in. */
  let moved = $state(0);
  let room = $state.raw({ width: 0, height: 0 });

  $effect(() => {
    const el = scroller;
    if (!el) return;
    const watch = new ResizeObserver(() => {
      if (el.clientWidth !== room.width || el.clientHeight !== room.height)
        room = { width: el.clientWidth, height: el.clientHeight };
    });
    watch.observe(el);
    return () => watch.disconnect();
  });

  /** How wide a page is fitted to the pane, in pixels. */
  const fitted = $derived(Math.max(1, Math.min(WIDEST, room.width - 2 * AROUND.side)));
  /**
   * How wide a page is shown, in pixels: as wide as the pane, or as the
   * zoom of the window says, its size on paper times the factor (a hundred
   * percent being as large as on paper). The text over it and the chips are
   * measured in its width, and follow.
   */
  const pageWidth = $derived(
    panes.zoom === null ? fitted : Math.max(1, size.width * PX_PER_PT * panes.zoom),
  );
  /** The factor the pages are shown at, fitted or zoomed: what the button of the zoom says. */
  const factor = $derived(pageWidth / Math.max(1, size.width * PX_PER_PT));
  /** Whether the pages are wider than the pane, and are moved sideways. */
  const wide = $derived(panes.zoom !== null && pageWidth > room.width - 2 * AROUND.side);

  /** How high a page is as it is shown, with the room after it. */
  const each = $derived((pageWidth * size.height) / Math.max(1, size.width) + GAP);

  /**
   * The pages that have a place in the window: those in view and those
   * beside them. Of a long document the others have none, and empty room
   * stands for them: hundreds of places, though empty, are felt in all
   * that the window does.
   */
  const span = $derived.by(() => {
    if (!count || !room.height) return { from: 1, to: Math.min(count, 3) };
    const top = moved - AROUND.top;
    const from = Math.max(1, Math.floor(top / each) + 1 - BESIDE);
    const to = Math.min(count, Math.floor((top + room.height) / each) + 1 + BESIDE);
    return { from: Math.min(from, Math.max(1, to)), to: Math.max(to, 1) };
  });

  /** The pages that are in view, and those beside them. */
  function near(): number[] {
    const out: number[] = [];
    for (let n = span.from; n <= span.to && out.length < 10; n++) out.push(n);
    // Before the pages have their places, the first are what is looked at.
    return out.length ? out : [1, 2, 3].filter((n) => !count || n <= count);
  }

  /**
   * The lines of a page named again by its spots; the same lines where
   * none is named otherwise. A page may look as it did and hold other
   * kinds: a passage given a kind that looks as the one before.
   */
  function renamed(lines: Line[], number: number, on: Spot[]): Line[] {
    let changed = false;
    const out = lines.map((line) => {
      const what = whatIs(on, number, line.baseline);
      if (what === line.what) return line;
      changed = true;
      return { ...line, what };
    });
    return changed ? out : lines;
  }

  /** Takes pages that were made. A page that is as it was is left as it is, so that only what has changed is drawn again. */
  function take(pages: PreviewPage[]) {
    const next = new Map(shown);
    const let_go: string[] = [];
    for (const page of pages) {
      const before = next.get(page.number);
      const on = spotsOn(spots, page.number);
      if (before?.svg === page.svg) {
        next.set(page.number, { ...before, made, lines: renamed(before.lines, page.number, on) });
        continue;
      }
      if (before) let_go.push(before.url);
      const url = URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' }));
      const lines = linesOf(page.texts ?? [], size, page.number, on);
      const right = Math.max(0, ...lines.map((l) => l.left + l.width));
      next.set(page.number, { svg: page.svg, url, made, lines, right });
    }
    // Pages that are no longer there, and those farthest from what is looked at.
    const wanted = near();
    const middle = wanted[Math.floor(wanted.length / 2)] ?? 1;
    const far = [...next.keys()]
      .filter((n) => n > count || !wanted.includes(n))
      .sort((x, y) => Math.abs(y - middle) - Math.abs(x - middle));
    for (const n of far) {
      if (n <= count && next.size <= KEPT) break;
      let_go.push(next.get(n)!.url);
      next.delete(n);
    }
    // The chip of a page that is no longer there goes with it.
    if (pointed && !next.has(pointed.page)) pointed = null;
    shown = next;
    // What was replaced is let go when what is in its place has been drawn.
    if (let_go.length) setTimeout(() => let_go.forEach((url) => URL.revokeObjectURL(url)), 2000);
  }

  /**
   * Makes the pages anew, if what they are made from has changed. Much that
   * changes in a project changes nothing in the document: where an element
   * stands in the diagram, whether a branch is folded.
   *
   * The pages are never made twice at once: what changes while they are
   * made is seen to when they are there.
   */
  async function refresh(force = false) {
    if (making) {
      again = true;
      forced ||= force;
      return;
    }
    making = true;
    try {
      do {
        const must = force || forced;
        again = false;
        forced = false;
        force = false;
        // The layout as the document uses it: with its changes, and its lines numbered where it says.
        const f = await documents.formatFor(project, at);
        // The template as the document uses it: with what it turns on or off and requires otherwise.
        const tp = $state.snapshot(await templateUsed(project, at)) as Template;
        // The looks of the elements under it that have their own (ADR 0059).
        const looks = await looksWithin(project, at);
        const lean = () => ({
          ...leanDocument(project, at, sent),
          ...(looks.length ? { looks } : {}),
        });
        let document = lean();
        // With what has been changed under the same name: a style saved anew is made anew.
        const from = `${documents.changed}\n${choice.style}\n${JSON.stringify(f)}\n${JSON.stringify(tp)}\n${JSON.stringify(looks)}\n${documentMark(document)}`;
        if (!must && from === shownFrom && status === 'shown') continue;
        status = count ? 'working' : 'waiting';
        format = f;
        template = tp;
        const began = performance.now();
        const asked = { style: choice.style, format: f, template: tp, key: projectId };
        let preview: Preview;
        try {
          preview = await documentPreview({ ...asked, document }, near());
        } catch (e) {
          if (!isBackendError(e) || e.kind !== 'lacking') throw e;
          // What was sent before is not kept: all of it is sent.
          sent = new Set();
          document = lean();
          preview = await documentPreview({ ...asked, document }, near());
        }
        if (gone) return;
        took = performance.now() - began;
        sent = new Set(document.sections.map((s) => s.stamp).filter((s) => !s.startsWith('?')));
        made++;
        count = preview.count;
        size = { width: preview.width, height: preview.height };
        places = preview.places ?? [];
        spots = preview.spots ?? [];
        take(preview.pages);
        shownFrom = from;
        warnings = preview.warnings;
        missing = preview.missing;
        substitute = preview.substitute;
        error = null;
        status = 'shown';
        // The pages may have been moved through meanwhile.
        void fetchNear();
      } while (again && !gone);
    } catch (e) {
      if (gone || (isBackendError(e) && e.kind === 'stopped')) return;
      error = isBackendError(e)
        ? e
        : { kind: 'unknown', message: describeError(e) ?? t('preview-failed-message') };
      status = 'failed';
    } finally {
      making = false;
      for (const told of whenMade.splice(0)) told();
    }
  }
  let forced = false;

  /**
   * The pages as the document is now: made at once where they were to be
   * made a moment later, waited for where they are being made.
   */
  async function madeNow(): Promise<void> {
    await documents.load();
    clearTimeout(waiting);
    if (making) await new Promise<void>((told) => whenMade.push(told));
    // Made anew only where something changed meanwhile.
    if (!gone) await refresh();
  }

  /**
   * Prints the document the pane shows (record 0075): every page as it is
   * set, through the system's dialog. The pages are waited for where they are
   * being made; where they could not be made, the pane says why and nothing
   * is printed. With `toFile`, to a PDF there with no dialog, for the e2e
   * scripts. What was printed: how many pages, and the size of the first.
   */
  export async function print(
    toFile?: string,
  ): Promise<{ count: number; width: number; height: number } | null> {
    if (printing) return null;
    printing = true;
    let notice: number | null = null;
    const urls: string[] = [];
    try {
      await madeNow();
      if (gone || status !== 'shown' || !count) return null;
      notice = toasts.show({ kind: 'info', message: t('preview-print-preparing', { count }) }, 0);
      const pages: PrintablePage[] = [];
      for (let from = 1; from <= count; from += PRINT_BATCH) {
        const got = await documentPrintPages(
          projectId,
          from,
          Math.min(count, from + PRINT_BATCH - 1),
        );
        if (gone) return null;
        for (const page of got) {
          const url = URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' }));
          urls.push(url);
          const [width, height] = svgSize(page.svg) ?? [size.width, size.height];
          pages.push({ url, width, height });
        }
      }
      toasts.dismiss(notice);
      notice = null;
      // The pictures are the printing's from here: it lets go of them when it is over.
      urls.length = 0;
      await printPages(pages, project.node(at)?.title || t('preview-file-name'), { toFile });
      return { count: pages.length, width: pages[0]?.width ?? 0, height: pages[0]?.height ?? 0 };
    } catch (e) {
      notifyError(t('preview-print-failed'), e);
      return null;
    } finally {
      if (notice !== null) toasts.dismiss(notice);
      for (const url of urls) URL.revokeObjectURL(url);
      printing = false;
    }
  }

  // The e2e scripts print to a file, where the dialog cannot be pressed.
  onMount(() => {
    testHook('__glaukopisPrint', { toFile: (path: string) => print(path) });
    return () => testHook('__glaukopisPrint', undefined);
  });

  /** Fetches the pages that have come into view and are not there, or are of an earlier making. */
  let fetching = false;
  async function fetchNear() {
    if (fetching || gone || !count) return;
    const lacking = near().filter((n) => shown.get(n)?.made !== made);
    if (!lacking.length) return;
    fetching = true;
    const of = made;
    try {
      const got = await documentPreviewPages(projectId, lacking);
      if (gone) return;
      // Made anew meanwhile: the pages are of what was, and are asked for again.
      if (of === made) {
        count = got.count;
        take(got.pages);
        // A page that was asked for and is not there is not asked for again and again.
        const came = new Set(got.pages.map((p) => p.number));
        if (lacking.some((n) => !came.has(n))) return;
      }
    } catch (error) {
      // The pages stay as they are; they are asked for again when the preview is moved.
      console.warn('the pages of the preview could not be fetched', error);
      return;
    } finally {
      fetching = false;
    }
    void fetchNear();
  }

  let settled: ReturnType<typeof setTimeout> | undefined;
  function onscroll() {
    if (scroller) moved = scroller.scrollTop;
    clearTimeout(settled);
    settled = setTimeout(() => void fetchNear(), 120);
  }

  function release() {
    for (const page of shown.values()) URL.revokeObjectURL(page.url);
  }

  // ---- the pages and the text, brought to the same place ----

  /** The page the middle of the view is on, and how far down it, in points. */
  function looked(): { page: number; y: number } {
    const pagePx = each - GAP;
    const mid = moved + room.height / 2 - AROUND.top;
    const page = Math.max(1, Math.min(count, Math.floor(mid / each) + 1));
    const within = Math.max(0, Math.min(pagePx, mid - (page - 1) * each));
    return { page, y: (within / pagePx) * size.height };
  }

  /** Shows in the text the element whose place in the pages is looked at: the last that begins before the middle of the view. */
  function goToText() {
    if (!places.length) return;
    const at = looked();
    let found = places[0];
    for (const p of places) if (p.page < at.page || (p.page === at.page && p.y <= at.y)) found = p;
    ongo(found.element);
  }

  /** Moves the pages to where the element the text is at begins, and points the page out for a moment. */
  function showText() {
    const element = current();
    const place = element ? places.find((p) => p.element === element) : undefined;
    if (!place || !scroller) return;
    const pagePx = each - GAP;
    const top = AROUND.top + (place.page - 1) * each + place.y * (pagePx / size.height);
    scroller.scrollTop = Math.max(0, top - 40);
    marked = place.page;
    clearTimeout(marking);
    marking = setTimeout(() => (marked = null), 1000);
  }

  // ---- the zoom of the pages ----

  /** The pane: its keys of the zoom hold while it has the focus or the pointer. */
  let pane = $state<HTMLElement>();
  let pointerIn = false;
  const here = () => pointerIn || !!pane?.contains(document.activeElement);

  /**
   * Zooms the pages to a factor of their size on paper, or with none to
   * the width of the pane. What was in the middle of the view stays there.
   */
  async function zoomTo(to: number | null) {
    const next = to === null ? null : clampZoom(to);
    if (next === panes.zoom) return;
    const at = count && room.height ? looked() : null;
    panes.zoom = next;
    await tick();
    if (!scroller || !at) return;
    const pagePx = each - GAP;
    const top = AROUND.top + (at.page - 1) * each + at.y * (pagePx / size.height);
    scroller.scrollTop = Math.max(0, top - room.height / 2);
    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
    moved = scroller.scrollTop;
  }
  /** Zooms by so many tenths, from the factor the pages are shown at, fitted or not. */
  const zoomBy = (steps: number) => zoomTo(stepped(factor, steps));

  // Ctrl with the wheel over the pages zooms them, a tenth at a time; the
  // turns of a touchpad, many and small, a tenth for each pause between them.
  $effect(() => {
    const el = scroller;
    if (!el) return;
    let last = 0;
    const onwheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      if (event.timeStamp - last < 60) return;
      last = event.timeStamp;
      void zoomBy(event.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => el.removeEventListener('wheel', onwheel);
  });

  // Bound once, while the pane is there: binding changes what is bound, which an effect would follow.
  onMount(() =>
    shortcuts.bind({
      'preview-zoom-in': { run: () => void zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => void zoomBy(1), when: here },
      'preview-zoom-out': { run: () => void zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => void zoomTo(null), when: here },
    }),
  );

  /** The menu of the zoom: the width of the pane, and the steps. */
  function zoomMenu(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('preview-zoom-fit'),
          checked: panes.zoom === null,
          shortcut: keysFor('preview-zoom-fit'),
          action: () => void zoomTo(null),
        },
        { kind: 'separator' },
        ...ZOOMS.map((z) => ({
          label: t('preview-zoom', { percent: String(percent(z)) }),
          checked: panes.zoom === z,
          action: () => void zoomTo(z),
        })),
      ],
      { side: 'bottom', align: 'end' },
    );
  }

  // ---- what a line is, named at the edge of its page ----

  /** Whether a press on the page shows a chip that names what was pressed: the writer's setting, on unless turned off. */
  const chips = $derived(writerSettings.value.pageChips !== false);
  /**
   * What was pressed, while its chip is shown: a line, or the page itself
   * where no line was pressed (ADR 0056); its page, what it is, and where
   * the chip stands, in percent of the height of the page. The chip stays
   * until the same thing is pressed again, something else is pressed and
   * the chip moves there, the page is left, or Escape.
   */
  let pointed = $state.raw<{ page: number; what: string; top: number } | null>(null);
  /** Where the pointer went down on a page, to tell a press from a drag that selects text. */
  let pressed: { x: number; y: number } | null = null;

  function press(event: PointerEvent) {
    pressed = { x: event.clientX, y: event.clientY };
  }
  /**
   * A press on a page, released where it began: on a line, the chip of what
   * the line is; elsewhere, the chip of the page at that height. The same
   * thing pressed again at the same place takes the chip away; pressed
   * elsewhere, the chip follows. A drag, which selects text, shows nothing.
   */
  function pick(event: MouseEvent, page: number) {
    const target = event.target as Element | null;
    if (!pressed || target?.closest?.('.chip')) return;
    const moved = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 4;
    pressed = null;
    const selection = getSelection();
    if (moved || (selection && !selection.isCollapsed)) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const line = target?.closest<HTMLElement>('.line');
    const what = line?.dataset.what || PAGE;
    const top = line
      ? parseFloat(line.style.top)
      : Math.max(0, Math.min(97, ((event.clientY - box.top) / box.height) * 100));
    const same = pointed?.page === page && pointed.what === what && Math.abs(pointed.top - top) < 2;
    pointed = same ? null : { page, what, top };
  }
  /** A press outside the pages, or Escape, takes the chip away. */
  function leave(event: Event) {
    if (!pointed) return;
    if (event instanceof KeyboardEvent) {
      if (event.key === 'Escape') pointed = null;
      return;
    }
    if (!(event.target as Element | null)?.closest?.('.preview .page')) pointed = null;
  }

  /** What a line is, in words: the name of its kind or part, or of its level of heading. */
  function wordsOf(what: string): string {
    const read = readWhat(what);
    switch (read.sort) {
      case 'kind':
        return kindName(read.id, project.passageKinds);
      case 'part':
        if (isMade(read.id)) return generatedPartWords(read.id);
        return project.kind(read.id)?.name || partOf(project, read.id)?.label() || read.id;
      case 'heading':
        return t('preview-what-heading', { level: read.level });
      default:
        return t(`preview-what-${read.sort}`);
    }
  }

  /** The element a place on a page stands in: the last that begins before it (ADR 0059). */
  function elementAt(page: number, y: number): string | undefined {
    let found: string | undefined;
    for (const p of places) if (p.page < page || (p.page === page && p.y <= y)) found = p.element;
    return found;
  }

  /** Opens Look at what a line is, with the element it stands in. */
  function lookAt(what: string) {
    const at = pointed;
    pointed = null;
    const element = at ? elementAt(at.page, (at.top / 100) * size.height) : undefined;
    lookUi.open({ ...lookFor(what), ...(element ? { element } : {}) });
  }

  // The preview follows the text, a moment behind it: the longer the pages
  // take to make, the longer it waits for the writing to pause.
  let waiting: ReturnType<typeof setTimeout> | undefined;
  function later() {
    clearTimeout(waiting);
    if (!documents.loaded) return;
    waiting = setTimeout(refresh, count ? Math.max(900, Math.min(2500, took * 0.4)) : 50);
  }
  $effect(() => project.onChange(later));
  // And it is made anew for another element, template, layout or style.
  $effect(() => {
    void at;
    void choice.style;
    void choice.format;
    void choice.template;
    void project.templates;
    void documents.loaded;
    void documents.changed;
    untrack(later);
  });

  $effect(() => () => {
    gone = true;
    clearTimeout(waiting);
    clearTimeout(settled);
    clearTimeout(marking);
    release();
    // What is being made is no longer wanted.
    void documentPreviewStop(projectId).catch(() => {});
  });

  /** The most words the template allows; nothing where it says none. */
  const wordsMost = $derived(template?.requirements.words ?? null);
  const over = $derived(!!wordsMost && words.text > wordsMost);

  /** The button the remarks are shown beside, while they are shown. */
  let remarking = $state<HTMLElement | null>(null);

  const issueCount = $derived(warnings.length + missing.length + (substitute ? 1 : 0));
</script>

<svelte:document onpointerdown={leave} onkeydown={leave} />

<!-- Focusable, so that the keys of the zoom hold while it has the focus. -->
<aside
  class="preview"
  aria-label={t('preview-title')}
  data-template={choice.template}
  tabindex="-1"
  bind:this={pane}
  onpointerenter={() => (pointerIn = true)}
  onpointerleave={() => (pointerIn = false)}
>
  <header>
    <!-- The Look column beside the pages, opened and closed. -->
    <button
      type="button"
      class="look-button"
      class:on={look}
      aria-pressed={look}
      data-look
      use:tooltip={{ text: t('look-title'), shortcut: keysFor('side-look') }}
      onclick={onlook}
    >
      <Palette size={14} />
      <span>{t('look-title')}</span>
    </button>
    <span class="grow"></span>
    <!-- How large the pages are: as wide as the pane, or a percentage of their size on paper. -->
    <button
      type="button"
      class="zoom-button"
      data-zoom
      aria-label={t('preview-zoom-label')}
      aria-haspopup="menu"
      use:tooltip={{ text: t('preview-zoom-label') }}
      onclick={zoomMenu}
    >
      <span
        >{panes.zoom === null
          ? t('preview-zoom-fit')
          : t('preview-zoom', { percent: String(percent(factor)) })}</span
      >
      <ChevronDown size={12} />
    </button>
    <IconButton label={t('preview-go-to-text')} disabled={!places.length} onclick={goToText}>
      <TextCursorInput size={15} />
    </IconButton>
    <IconButton label={t('preview-show-text')} disabled={!places.length} onclick={showText}>
      <ScanEye size={15} />
    </IconButton>
    <button
      type="button"
      class="look-button"
      data-print
      disabled={printing || status !== 'shown'}
      use:tooltip={{ text: t('preview-print'), shortcut: keysFor('print') }}
      onclick={() => void print()}
    >
      <Printer size={14} />
      <span>{t('preview-print')}</span>
    </button>
    <Button variant="primary" size="sm" onclick={() => (exporting = true)}>
      {#snippet icon()}<Share size={13} />{/snippet}
      {t('preview-export')}
    </Button>
    <IconButton label={t('preview-hide')} shortcut={keysFor('preview')} onclick={onclose}
      ><X size={15} /></IconButton
    >
  </header>

  <div
    class="pages"
    class:working={status === 'working'}
    class:wide
    data-count={count}
    bind:this={scroller}
    {onscroll}
  >
    {#if status === 'failed' && error}
      {#if error.kind === 'missing-program'}
        {@const program = PROGRAMS.find((p) => error?.message.includes(p))}
        <EmptyState
          icon={PackageX}
          title={program ? t('preview-program-missing', { program }) : error.message}
          text={t('preview-programs-needed')}
        >
          <Button onclick={() => documents.lookAgain().then(() => refresh(true))}
            >{t('preview-look-again')}</Button
          >
        </EmptyState>
      {:else}
        <EmptyState icon={TriangleAlert} title={t('preview-failed')}>
          <pre class="selectable">{error.message}</pre>
          <Button onclick={() => refresh(true)}>{t('common-try-again')}</Button>
        </EmptyState>
      {/if}
    {:else if !count}
      <div class="centre"><Spinner size={22} /></div>
    {:else}
      <!-- The pages that are looked at have their places; room stands for those before and after. -->
      {#if span.from > 1}
        <div class="room" style:height="{(span.from - 1) * each - GAP}px"></div>
      {/if}
      {#each { length: span.to - span.from + 1 } as _, i (span.from + i)}
        {@const n = span.from + i}
        {@const page = shown.get(n)}
        <div
          class="page"
          class:marked={marked === n}
          class:zoomed={panes.zoom !== null}
          data-page={n}
          style:aspect-ratio="{size.width} / {size.height}"
          style:width={panes.zoom === null ? undefined : `${pageWidth}px`}
          aria-label={t('preview-page', { number: String(n) })}
          onpointerdown={chips ? press : undefined}
          onclick={chips ? (e) => pick(e, n) : undefined}
          role="presentation"
        >
          {#if page}<img
              src={page.url}
              alt={t('preview-page', { number: String(n) })}
              draggable="false"
            />
            <!-- The text, over the drawn page and unseen, so that it can be selected and copied. -->
            <div class="texts">
              <!-- A line is text to select; pressed without dragging, its chip is shown beside it (the page listens). -->
              {#each page.lines as line}<div
                  class="line"
                  role="presentation"
                  data-what={line.what}
                  style:left="{line.left}%"
                  style:top="{line.top}%"
                  style:width="{line.width}%"
                  style:height="{line.height}%"
                  style:font-size="{line.size}cqw"
                >
                  {#each line.runs as run}<span
                      style:margin-left="{run.gap}%"
                      style:width="{run.width}%"
                      style:font-size="{run.size}cqw">{run.text}</span
                    >{/each}<br />
                </div>{/each}
            </div>
            {#if chips && pointed?.page === n}
              {@const what = pointed.what}
              {@const words = wordsOf(what)}
              <!-- What was pressed, in the margin beside it, over no text: it opens Look at it. -->
              <button
                type="button"
                class="chip"
                data-what={what}
                style:top="{pointed.top}%"
                style:max-width="{Math.max(4, 98.5 - page.right)}%"
                aria-label={t('preview-what-open', { what: words })}
                onclick={() => lookAt(what)}>{words}</button
              >
            {/if}{/if}
        </div>
      {/each}
      {#if span.to < count}
        <div class="room" style:height="{(count - span.to) * each - GAP}px"></div>
      {/if}
    {/if}
  </div>

  <footer>
    {#if status === 'working'}<Spinner size={11} />{/if}
    {#if count}<span>{t('preview-pages', { count })}</span>{/if}
    <span class:over>
      {wordsMost
        ? t('preview-words-of', { count: words.text, limit: wordsMost })
        : t('preview-words', { count: words.text })}
    </span>
    {#if words.withNotes !== words.text}
      <span>{t('preview-words-with-notes', { count: words.withNotes })}</span>
    {/if}
    {#if issueCount}
      <button type="button" class="issues" onclick={(e) => (remarking = e.currentTarget)}>
        <TriangleAlert size={12} />
        {t('preview-remarks-count', { count: issueCount })}
      </button>
    {/if}
    <!-- Whether a chip at the edge of a page names the line the pointer rests on. -->
    <button
      type="button"
      class="chip-switch"
      aria-pressed={chips}
      aria-label={chips ? t('preview-chips-off') : t('preview-chips')}
      use:tooltip={{ text: chips ? t('preview-chips-off') : t('preview-chips'), side: 'top' }}
      onclick={() => writerSettings.set('pageChips', !chips)}><Tag size={12} /></button
    >
  </footer>
</aside>

<Popover
  open={!!remarking}
  anchor={remarking}
  side="top"
  align="start"
  width={400}
  label={t('preview-remarks')}
  onclose={() => (remarking = null)}
>
  <div class="remarks selectable">
    {#if substitute}
      <section>
        <h3 class="overline">{t('preview-remarks-font')}</h3>
        <p><strong>{t('preview-font-missing', { font: format?.font.family ?? '' })}</strong></p>
        <p>{t('preview-font-substitute', { font: substitute })}</p>
      </section>
    {/if}
    {#if missing.length}
      <section>
        <h3 class="overline">{t('preview-remarks-references')}</h3>
        <p>
          <strong>{t('preview-works-missing', { count: missing.length })}</strong>
          {t('preview-works-missing-where')}
        </p>
      </section>
    {/if}
    {#if warnings.length}
      <section>
        <h3 class="overline">{t('preview-remarks-warnings')}</h3>
        {#each warnings as warning}
          <p>{warning}</p>
        {/each}
      </section>
    {/if}
  </div>
</Popover>

{#if exporting}
  <ExportDialog
    {request}
    targets={template?.outputs.find((o) => o.id === 'document')?.targets}
    name={project.node(at)?.title || t('preview-file-name')}
    onclose={() => (exporting = false)}
  />
{/if}

<style>
  .remarks {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 60vh;
    padding: 14px 16px;
    overflow-y: auto;
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .remarks section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .remarks h3 {
    margin: 0 0 2px;
  }
  .remarks p {
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .remarks strong {
    color: var(--ink);
    font-weight: 600;
  }
  .preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-sunken);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  /* The Look column's button, lit while the column is open. */
  .look-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 28px;
    padding: 0 9px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .look-button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .look-button:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .look-button.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    color: var(--accent-strong);
  }
  .grow {
    flex: 1;
    min-width: 4px;
  }
  /* The zoom: its percentage, or Fit the width, opening its menu. */
  .zoom-button {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: none;
    height: 28px;
    padding: 0 6px 0 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
  }
  .zoom-button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .preview:focus {
    outline: none;
  }
  /* The pages are a region of their own: what is written in the text
     beside them changes nothing in them, and they are not laid out and
     painted again for it. */
  .pages {
    contain: strict;
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 20px 22px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transition: opacity var(--slow) var(--ease);
  }
  /* Pages zoomed wider than the pane begin at its left, and are moved sideways. */
  .pages.wide {
    align-items: flex-start;
  }
  /* A page that is not looked at is not drawn. It has its size of the
     width it is given and the shape of the page. */
  .page {
    contain: layout paint style;
    /* The text over the page is sized by the width the page is drawn at. */
    container-type: inline-size;
    position: relative;
    flex: none;
    display: block;
    width: 100%;
    max-width: 820px;
    height: auto;
    background: #fff;
    /* A line and a light shadow: a wide soft one is painted anew whenever
       anything near it changes, which is felt where the pages are many. */
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.07),
      0 1px 3px rgba(0, 0, 0, 0.14);
    user-select: none;
    transition: box-shadow var(--slow) var(--ease);
  }
  /* Zoomed, a page is as wide as the zoom says, whatever the pane. */
  .page.zoomed {
    max-width: none;
  }
  /* The page the text is at, pointed out for a moment. */
  .page.marked {
    box-shadow:
      0 0 0 2px var(--accent),
      0 1px 3px rgba(0, 0, 0, 0.14);
  }
  /* The text of the page lies over the drawing, unseen but for its
     selection: it is what is selected and copied, while the drawing is
     what is seen. */
  .texts {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: auto;
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
    color: transparent;
    font-family: var(--font-text);
    line-height: 1;
  }
  /* Room between the tags of the markup falls at the ends of a line, where it is dropped. */
  /* The break at the end of a line is what copies as a newline; it is not seen, the line being as high as its text. */
  .line {
    position: absolute;
    white-space: nowrap;
    overflow: hidden;
  }
  .line span {
    display: inline-block;
    vertical-align: baseline;
    white-space: pre;
  }
  .texts ::selection,
  .texts::selection {
    background: var(--selection);
    color: transparent;
  }
  /* What the line the pointer rests on is: a chip in the margin at the
     right of the page, at the height of the line, never wider than the
     margin beside the text. */
  .chip {
    position: absolute;
    right: 0.75%;
    min-width: 0;
    height: 17px;
    padding: 0 7px;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 9px;
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    color: var(--ink-2);
    font: 500 10.5px/15px var(--font-ui);
    white-space: nowrap;
    text-overflow: ellipsis;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }
  .chip:hover,
  .chip:focus-visible {
    border-color: var(--accent);
    color: var(--accent-strong);
    outline: none;
  }
  .room {
    flex: none;
    width: 1px;
  }
  .page img {
    display: block;
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
  }
  .centre {
    flex: 1;
    display: flex;
    align-items: center;
  }
  pre {
    max-width: 100%;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--danger-soft);
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 11.5px;
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
    height: 28px;
    padding: 0 14px;
    border-top: 1px solid var(--line);
    background: var(--paper);
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .over {
    color: var(--danger);
    font-weight: 600;
  }
  .issues {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding: 2px 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--warn);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .issues:hover {
    background: var(--gold-soft);
  }
  /* The switch of the chips stands last, at the right, after the remarks where there are any. */
  .chip-switch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
  }
  .issues + .chip-switch {
    margin-left: 0;
  }
  .chip-switch:hover {
    background: var(--paper-hover);
    color: var(--ink-2);
  }
  .chip-switch[aria-pressed='true'] {
    color: var(--accent);
  }
</style>
