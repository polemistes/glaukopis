<script lang="ts">
  import { untrack } from 'svelte';
  import FileText from '@lucide/svelte/icons/file-text';
  import PackageX from '@lucide/svelte/icons/package-x';
  import Share from '@lucide/svelte/icons/share';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import { isBackendError } from '$lib/api/backend';
  import {
    documentPreview,
    documentPreviewPages,
    documentPreviewStop,
    type DocumentFormat,
    type DocumentRequest,
    type Preview,
    type PreviewPage,
  } from '$lib/api/documents';
  import { t } from '$lib/i18n';
  import {
    buildDocument,
    countWords,
    documentMark,
    leanDocument,
  } from '$lib/project/model/document';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, toasts } from '$lib/ui/toast.svelte';
  import DocumentDetails from './DocumentDetails.svelte';
  import { documents, formatKindWords, kindWords } from './documents.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import FormatEditor from './FormatEditor.svelte';
  import StyleEditor from './StyleEditor.svelte';
  import StyleBrowser from './StyleBrowser.svelte';

  interface Props {
    project: Project;
    projectId: string;
    mapId: string;
    onclose: () => void;
  }

  let { project, projectId, mapId, onclose }: Props = $props();

  /** A page as it is shown: what it holds, the address it is shown from, and the making it is of. */
  interface Shown {
    svg: string;
    url: string;
    made: number;
  }

  /** At most so many pages are kept: those nearest to what is looked at. */
  const KEPT = 40;
  /** So many pages before and after those in view are fetched with them. */
  const BESIDE = 2;
  /** The programs the core may say are missing, by the names it gives them in every language. */
  const PROGRAMS = ['Pandoc', 'Typst', 'LaTeX'];

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
  let browsing = $state(false);
  let detailing = $state(false);
  let exporting = $state(false);
  let editingFormat = $state<string | null>(null);
  let editingStyle = $state<string | null>(null);
  let scroller = $state<HTMLDivElement>();
  /** Whether the pages are being made. Never twice at once. */
  let making = false;
  /** Whether something has changed while the pages were being made. */
  let again = false;
  /** Whether the preview has been closed. */
  let gone = false;
  /** How long the last making took, in milliseconds. */
  let took = 0;

  const map = $derived(project.map(mapId));
  const choice = $derived(documents.choice(map?.document ?? {}));
  /**
   * The words of the document, a moment behind the writing: what is shown
   * under the pages is not written anew at every key, which would have the
   * window paint all between the line that is written and the count.
   */
  let words = $state.raw(untrack(() => countWords(project, mapId)));
  function recount() {
    const now = countWords(project, mapId);
    if (now.text !== words.text || now.withNotes !== words.withNotes) words = now;
  }
  // Counted at once for another map, and for the writing when it pauses.
  $effect(() => {
    void mapId;
    untrack(recount);
    return project.onChange(recount, 600);
  });

  $effect(() => {
    documents.load();
  });

  /** The document whole, for what is made of all of it: an export, the sample of a format. */
  async function request(): Promise<DocumentRequest> {
    const f = await documents.format(choice.format);
    return {
      document: buildDocument(project, mapId),
      style: choice.style,
      format: $state.snapshot(f) as DocumentFormat,
      key: projectId,
    };
  }

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

  /** How high a page is as it is shown, with the room after it. */
  const each = $derived.by(() => {
    const wide = Math.max(1, Math.min(WIDEST, room.width - 2 * AROUND.side));
    return (wide * size.height) / Math.max(1, size.width) + GAP;
  });

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

  /** Takes pages that were made. A page that is as it was is left as it is, so that only what has changed is drawn again. */
  function take(pages: PreviewPage[]) {
    const next = new Map(shown);
    const let_go: string[] = [];
    for (const page of pages) {
      const before = next.get(page.number);
      if (before?.svg === page.svg) {
        next.set(page.number, { ...before, made });
        continue;
      }
      if (before) let_go.push(before.url);
      const url = URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' }));
      next.set(page.number, { svg: page.svg, url, made });
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
        const f = $state.snapshot(await documents.format(choice.format)) as DocumentFormat;
        let document = leanDocument(project, mapId, sent);
        const from = `${choice.style}\n${JSON.stringify(f)}\n${documentMark(document)}`;
        if (!must && from === shownFrom && status === 'shown') continue;
        status = count ? 'working' : 'waiting';
        format = f;
        const began = performance.now();
        const asked = { style: choice.style, format: f, key: projectId };
        let preview: Preview;
        try {
          preview = await documentPreview({ ...asked, document }, near());
        } catch (e) {
          if (!isBackendError(e) || e.kind !== 'lacking') throw e;
          // What was sent before is not kept: all of it is sent.
          sent = new Set();
          document = leanDocument(project, mapId, sent);
          preview = await documentPreview({ ...asked, document }, near());
        }
        if (gone) return;
        took = performance.now() - began;
        sent = new Set(document.sections.map((s) => s.stamp).filter((s) => !s.startsWith('?')));
        made++;
        count = preview.count;
        size = { width: preview.width, height: preview.height };
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
    }
  }
  let forced = false;

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
    } catch {
      // The pages stay as they are; they are asked for again when the preview is moved.
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

  // The preview follows the text, a moment behind it: the longer the pages
  // take to make, the longer it waits for the writing to pause.
  let waiting: ReturnType<typeof setTimeout> | undefined;
  function later() {
    clearTimeout(waiting);
    if (!documents.loaded) return;
    waiting = setTimeout(refresh, count ? Math.max(900, Math.min(2500, took * 0.4)) : 50);
  }
  $effect(() => project.onChange(later));
  // And it is made anew for another map, format or style.
  $effect(() => {
    void mapId;
    void choice.style;
    void choice.format;
    void documents.loaded;
    void documents.changed;
    untrack(later);
  });

  $effect(() => () => {
    gone = true;
    clearTimeout(waiting);
    clearTimeout(settled);
    release();
    // What is being made is no longer wanted.
    void documentPreviewStop(projectId).catch(() => {});
  });

  function setStyle(id: string) {
    project.setDocument(mapId, { style: id });
  }

  async function setFormat(id: string) {
    const before = choice.style;
    project.checkpoint();
    project.setDocument(mapId, { format: id });
    // A publisher's format goes with a reference style: it is taken with it.
    try {
      const f = await documents.format(id);
      if (f.style && f.style !== before && documents.style(f.style)) {
        project.setDocument(mapId, { style: f.style });
        toasts.show({
          kind: 'info',
          message: t('preview-style-taken', { style: documents.style(f.style)?.title ?? '' }),
          detail: t('preview-style-taken-why'),
          action: {
            label: t('preview-style-keep-other'),
            run: () => project.setDocument(mapId, { style: before }),
          },
        });
      }
    } catch {
      // The format will be reported as missing by the preview.
    }
    project.checkpoint();
  }

  const styleGroups = $derived.by(() => {
    const groups = new Map<string, typeof documents.styles>();
    const other = t('style-kind-other');
    for (const s of documents.styles) {
      const name = kindWords(s.kind) || other;
      groups.set(name, [...(groups.get(name) ?? []), s]);
    }
    const order = [
      ...['note', 'author-date', 'numeric', 'label', 'author'].map((kind) => kindWords(kind)),
      other,
    ];
    return [...groups].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  });

  const formatGroups = $derived.by(() => {
    const order = ['own', 'general', 'style-guide', 'publisher', 'journal'];
    return order
      .map((kind) => ({
        name: formatKindWords(kind) ?? kind,
        formats: documents.formats.filter((f) => f.kind === kind),
      }))
      .filter((g) => g.formats.length);
  });

  const over = $derived(!!format?.limits.words && words.text > format.limits.words);

  /** The button the remarks are shown beside, while they are shown. */
  let remarking = $state<HTMLElement | null>(null);

  const issueCount = $derived(warnings.length + missing.length + (substitute ? 1 : 0));
</script>

<aside class="preview" aria-label={t('preview')}>
  <header>
    <div class="choices">
      <label>
        <span>{t('preview-format')}</span>
        <select
          value={choice.format}
          onchange={(e) => setFormat(e.currentTarget.value)}
          aria-label={t('preview-format-label')}
        >
          {#each formatGroups as group (group.name)}
            <optgroup label={group.name}>
              {#each group.formats as f (f.id)}
                <option value={f.id}>{f.name}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </label>
      <label>
        <span>{t('preview-style')}</span>
        <select
          value={choice.style}
          onchange={(e) => {
            const v = e.currentTarget.value;
            if (v === '…') {
              e.currentTarget.value = choice.style;
              browsing = true;
            } else setStyle(v);
          }}
          aria-label={t('preview-style-label')}
        >
          {#each styleGroups as [name, styles] (name)}
            <optgroup label={name}>
              {#each styles as s (s.id)}
                <option value={s.id}>{s.title}</option>
              {/each}
            </optgroup>
          {/each}
          {#if !documents.style(choice.style)}
            <option value={choice.style}>{choice.style}</option>
          {/if}
          <option value="…">{t('preview-style-more')}</option>
        </select>
      </label>
    </div>
    <IconButton
      label={t('preview-change')}
      onclick={(e) =>
        openMenu(
          e.currentTarget as HTMLElement,
          [
            {
              label: t('preview-change-format'),
              hint: t('preview-change-format-hint'),
              action: () => (editingFormat = choice.format),
            },
            {
              label: t('preview-change-style'),
              hint: t('preview-change-style-hint'),
              action: () => (editingStyle = choice.style),
            },
          ],
          { align: 'end' },
        )}
    >
      <SlidersHorizontal size={15} />
    </IconButton>
    <IconButton label={t('preview-details')} onclick={() => (detailing = true)}>
      <FileText size={15} />
    </IconButton>
    <Button variant="primary" size="sm" onclick={() => (exporting = true)}>
      {#snippet icon()}<Share size={13} />{/snippet}
      {t('preview-export')}
    </Button>
    <IconButton label={t('preview-hide')} shortcut="Ctrl+P" onclick={onclose}
      ><X size={15} /></IconButton
    >
  </header>

  <div
    class="pages"
    class:working={status === 'working'}
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
          data-page={n}
          style:aspect-ratio="{size.width} / {size.height}"
          aria-label={t('preview-page', { number: String(n) })}
        >
          {#if page}<img
              src={page.url}
              alt={t('preview-page', { number: String(n) })}
              draggable="false"
            />{/if}
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
      {format?.limits.words
        ? t('preview-words-of', { count: words.text, limit: format.limits.words })
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

{#if browsing}
  <StyleBrowser
    onchoose={(id) => {
      browsing = false;
      setStyle(id);
    }}
    onclose={() => (browsing = false)}
  />
{/if}
{#if detailing}
  <DocumentDetails
    {project}
    {mapId}
    limits={format
      ? { abstractWords: format.limits.abstractWords, keywords: format.limits.keywords }
      : undefined}
    onclose={() => (detailing = false)}
  />
{/if}
{#if editingFormat}
  <FormatEditor
    id={editingFormat}
    {request}
    onsaved={(id) => {
      editingFormat = null;
      project.setDocument(mapId, { format: id });
      // What a style or a format holds may have changed under the same name.
      void refresh(true);
    }}
    onclose={() => (editingFormat = null)}
  />
{/if}
{#if editingStyle}
  <StyleEditor
    id={editingStyle}
    references={project.usedReferences(mapId)}
    language={map?.document.language}
    onsaved={(id) => {
      editingStyle = null;
      project.setDocument(mapId, { style: id || undefined });
      // What a style or a format holds may have changed under the same name.
      void refresh(true);
    }}
    onclose={() => (editingStyle = null)}
  />
{/if}
{#if exporting}
  <ExportDialog
    {request}
    name={map?.name ?? t('preview-file-name')}
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
    align-items: flex-end;
    gap: 4px;
    flex: none;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .choices {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  label span {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 26px;
    padding: 0 6px 0 0;
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    font-weight: 500;
    text-overflow: ellipsis;
    cursor: pointer;
    outline: none;
  }
  select:hover,
  select:focus-visible {
    border-bottom-color: var(--accent);
  }
  /* The pages are a region of their own: what is written in the text
     beside them changes nothing in them, and they are not laid out and
     painted again for it. */
  .pages {
    contain: strict;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 22px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transition: opacity var(--slow) var(--ease);
  }
  /* A page that is not looked at is not drawn. It has its size of the
     width it is given and the shape of the page. */
  .page {
    contain: layout paint style;
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
</style>
