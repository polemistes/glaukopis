<script lang="ts">
  /**
   * A side of the window that shows files of the library in tabs (ADR 0069,
   * 0072): the sources of a project, each tab a PDF, page by page, or an
   * image, as one page, at a place of its own. Its bar holds what a file
   * needs: the page, a field to go to one, and the zoom. An image can be edited in it (ADR
   * 0071): a row of controls under the bar, the image showing the edit over
   * a lighter copy, kept as a new file of the library made from the one in
   * view, which the side then shows.
   */
  import { onDestroy, onMount, untrack } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import FileX from '@lucide/svelte/icons/file-x';
  import Lock from '@lucide/svelte/icons/lock';
  import {
    fileEditFacts,
    fileEditKeep,
    fileEditPreview,
    fileSmallerCopy,
    type Crop,
    type Edit,
    type EditFacts,
  } from '$lib/api/files';
  import { isBackendError } from '$lib/api/backend';
  import { attachmentOpen } from '$lib/api/library';
  import { ocrStop } from '$lib/api/ocr';
  import { printPaper } from '$lib/api/printing';
  import { filePage } from '$lib/api/viewer';
  import { printPages, type PrintablePage } from '$lib/print/pages';
  import { newId } from '$lib/util/id';
  import FileChooser from '$lib/files/FileChooser.svelte';
  import { files } from '$lib/files/store.svelte';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { t } from '$lib/i18n';
  import type { FileSide } from '$lib/project/sides.svelte';
  import { sides } from '$lib/project/sides.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { testHook } from '$lib/shell/testing';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { describeError, notifyError, notifyOk, toasts } from '$lib/ui/toast.svelte';
  import CropFrame from './CropFrame.svelte';
  import { isNothing, nothing } from './editing';
  import EditRow from './EditRow.svelte';
  import ImageView from './ImageView.svelte';
  import PdfView from './PdfView.svelte';
  import PlacesPopover from './PlacesPopover.svelte';
  import PrintRangeDialog from './PrintRangeDialog.svelte';
  import { activeTab, START } from './sources';
  import TabRow from './TabRow.svelte';
  import ViewerBar from './ViewerBar.svelte';
  import { viewers } from './viewers.svelte';

  interface Props {
    spec: FileSide;
    /** How many sides there are. */
    count: number;
    /** Whether it has the focus. */
    active: boolean;
    /** How much of the width it takes, of two. */
    grow: number;
    onclose: () => void;
  }

  let { spec, count, active, grow, onclose }: Props = $props();

  /** The tabs, and the one shown. */
  const sources = $derived(sides.tabs(spec.key));
  const tab = $derived(activeTab(sources));
  const file = $derived(tab?.file ?? '');

  // The facts of the file, once for each file the side shows. It depends on the file alone.
  $effect(() => {
    const key = spec.key;
    const shown = file;
    // What the fetching reads and writes of what is known is not what this depends on.
    if (shown) untrack(() => void viewers.fetch(key, shown));
  });

  /** The page at the middle of the view, as the bar says it: from the tab's place until the view tells. */
  let middle = $state(1);
  /** The tab shown, by its id alone: a change of its zoom is not another tab. */
  const tabId = $derived(tab?.id);
  $effect(() => {
    void tabId;
    middle = untrack(() => tab?.place.page ?? 1);
  });
  // The side's key lasts while it is shown.
  // svelte-ignore state_referenced_locally
  const key = spec.key;
  onDestroy(() => viewers.forget(key));

  const viewed = $derived(viewers.get(spec.key));
  const facts = $derived(file && viewed?.file === file ? viewed.facts : null);

  let view = $state<PdfView | ImageView>();
  /** The zoom as the bar shows it, in percent: what the view says it shows at. */
  const percent = $derived.by(() => {
    void tab?.zoom;
    void middle;
    return view?.percent() ?? 100;
  });

  function zoomTo(zoom: number | null) {
    if (view && 'zoomed' in view) view.zoomed(zoom);
    else if (tab) sides.setTabZoom(spec.key, tab.id, zoom);
  }

  /** Goes to a page of the file shown, its top at the top of the view. */
  function goToPage(page: number) {
    if (view && 'goToPlace' in view) view.goToPlace({ page, at: 0 });
  }

  // ---- the tabs (ADR 0072) ----

  let choosing = $state(false);

  /** Whether the tab shown may be left: an edit not kept is asked about first. */
  async function mayLeave(): Promise<boolean> {
    if (!editing) return true;
    if (isNothing(editing.edit)) {
      endEditing();
      return true;
    }
    await cancelEditing();
    return !editing;
  }

  async function activate(id: string) {
    if (id === sources.active) return;
    if (await mayLeave()) sides.activate(spec.key, id);
  }
  async function closeTab(id: string) {
    if (id === sources.active && !(await mayLeave())) return;
    sides.closeTab(spec.key, id);
  }
  async function closeOthers(id: string) {
    if (id !== sources.active && !(await mayLeave())) return;
    sides.closeOtherTabs(spec.key, id);
  }
  async function again(id: string) {
    if (await mayLeave()) sides.again(spec.key, id);
  }
  async function step(by: 1 | -1) {
    if (sources.tabs.length > 1 && (await mayLeave())) sides.stepTab(spec.key, by);
  }
  async function add(hash: string) {
    if (await mayLeave()) sides.showFileIn(spec.key, hash);
  }

  /** Several files chosen at once: each a tab after the one shown, in the order chosen, the last shown. */
  async function addAll(hashes: string[]) {
    if (!hashes.length || !(await mayLeave())) return;
    for (const hash of hashes) sides.showFileIn(spec.key, hash);
  }

  // ---- the bookmarks and the contents (ADR 0072) ----

  let pane = $state<HTMLDivElement>();
  let placesAt = $state<HTMLElement | null>(null);
  let marking = $state(false);

  function openPlaces(anchor: HTMLElement, mark = false) {
    marking = mark;
    placesAt = anchor;
  }

  /** The place a bookmark marks: the page the bar says, and where in it the view begins. */
  const placeNow = () => (view && 'markPlace' in view ? view.markPlace() : { page: middle, at: 0 });

  function goToPlace(place: { page: number; at: number }) {
    if (view && 'goToPlace' in view) view.goToPlace(place);
  }

  /** Closes the tab shown, as Ctrl+W does on a file side; the side with its last. */
  export function closeShown() {
    if (tab) void closeTab(tab.id);
    else onclose();
  }

  // ---- printing (record 0075) ----

  /** The resolution the pages of a file are drawn at for printing, and a picture is taken to have. */
  const PRINT_DPI = 300;
  /** So many pages are drawn at once, as the view draws them. */
  const PRINT_AT_ONCE = 2;
  /** A4, in points: the paper of a picture where the system says none. */
  const A4: [number, number] = [595.28, 841.89];
  /** Whether the file is being drawn or printed: never twice at once. */
  let printing = $state(false);
  /** Whether the pages of a PDF to print are being asked. */
  let askingRange = $state(false);

  /**
   * Prints the file shown, as Print… and Ctrl+P do: a PDF once the pages to
   * print are chosen, since they must be drawn; a picture as it is.
   */
  export function print() {
    if (printing || !file || !facts || facts.locked || facts.pages < 1) return;
    if (facts.picture) void printFile(1, 1);
    else askingRange = true;
  }

  /**
   * Draws the pages `from` to `to` of the file shown at the resolution print
   * wants, and prints them through the system's dialog: a PDF on paper of its
   * first page's size, a picture on the system's paper, fitted where it is
   * larger. With `toFile`, to a PDF there with no dialog, for the e2e
   * scripts. What was printed: how many pages, and the size of the first.
   */
  async function printFile(
    from: number,
    to: number,
    toFile?: string,
  ): Promise<{ count: number; width: number; height: number } | null> {
    const hash = file;
    const shown = facts;
    if (printing || !hash || !shown) return null;
    printing = true;
    const ticket = newId();
    let stopped = false;
    const numbers = Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
    const notice = toasts.show(
      {
        kind: 'info',
        message: t('viewer-print-drawing', { count: numbers.length }),
        action: {
          label: t('viewer-print-stop'),
          run: () => {
            stopped = true;
            void ocrStop(ticket).catch(() => {});
          },
        },
      },
      0,
    );
    const drawn = new Map<number, PrintablePage>();
    try {
      let next = 0;
      const drawing = async () => {
        while (!stopped && next < numbers.length) {
          const n = numbers[next++];
          const [w, h] = shown.sizes[n - 1] ?? shown.sizes[0];
          // A page of a PDF is measured in points; a picture, in its pixels.
          const dots = shown.picture ? Math.round(w) : Math.round((w / 72) * PRINT_DPI);
          const bytes = await filePage(hash, n, dots, ticket);
          const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
          const size = shown.picture ? [(w * 72) / PRINT_DPI, (h * 72) / PRINT_DPI] : [w, h];
          drawn.set(n, { url, width: size[0], height: size[1] });
        }
      };
      await Promise.all(Array.from({ length: PRINT_AT_ONCE }, drawing));
      if (stopped) return null;
      toasts.dismiss(notice);
      const pages = numbers.map((n) => drawn.get(n)!);
      // The pictures are the printing's from here: it lets go of them when it is over.
      drawn.clear();
      const paper = shown.picture ? await printPaper().catch(() => null) : null;
      await printPages(pages, files.get(hash)?.name ?? shown.name, {
        toFile,
        ...(shown.picture ? { paper: paper ? [paper.width, paper.height] : A4 } : {}),
      });
      return { count: pages.length, width: pages[0].width, height: pages[0].height };
    } catch (e) {
      if (!stopped && !(isBackendError(e) && e.kind === 'stopped'))
        notifyError(t('viewer-print-failed'), e);
      return null;
    } finally {
      toasts.dismiss(notice);
      for (const page of drawn.values()) URL.revokeObjectURL(page.url);
      printing = false;
    }
  }

  // The e2e scripts print to a file, where neither dialog can be pressed.
  onMount(() => {
    testHook('__glaukopisFilePrint', {
      toFile: (path: string, from: number, to: number) => printFile(from, to, path),
    });
    return () => testHook('__glaukopisFilePrint', undefined);
  });

  onMount(() =>
    shortcuts.bind({
      'viewer-tab-next': { run: () => void step(1), when: () => active || count === 1 },
      'viewer-tab-previous': { run: () => void step(-1), when: () => active || count === 1 },
      'viewer-bookmark': {
        run: () => {
          const button = pane?.querySelector<HTMLElement>('[data-viewer-places]');
          if (button) openPlaces(button, true);
        },
        when: () => (active || count === 1) && !!facts && !facts.picture && !facts.locked,
      },
    }),
  );

  // ---- editing an image (ADR 0071) ----

  interface Editing {
    /** The file being edited: the one in view when editing began. */
    file: string;
    facts: EditFacts;
    edit: Edit;
    /** The lighter copy shown while it is edited, as a URL of its own. */
    preview: string;
    cropping: boolean;
    keeping: boolean;
  }
  let editing = $state<Editing | null>(null);
  /** Whether a question is being asked: Escape is the question's then. */
  let asking = false;

  /** An image with pixels can be edited; a drawing cannot. */
  const editable = $derived(
    !!facts?.picture && !(files.get(file)?.name ?? '').toLowerCase().endsWith('.svg'),
  );

  /** Begins to edit the image in view: a smaller copy first, where it is too large. */
  async function beginEditing() {
    if (editing) return;
    let hash = file;
    let known: EditFacts;
    try {
      known = await fileEditFacts(hash);
    } catch (e) {
      notifyError(t('viewer-edit-not-opened'), e);
      return;
    }
    if (!known.editable) return;
    if (known.tooLarge) {
      asking = true;
      const smaller = await confirm({
        title: t('viewer-edit-too-large-title'),
        message: t('viewer-edit-too-large-message', { most: 50 }),
        confirm: t('viewer-edit-make-smaller'),
      }).finally(() => (asking = false));
      if (!smaller) return;
      try {
        const copy = await fileSmallerCopy(hash);
        await files.reload();
        sides.setFile(spec.key, copy.hash);
        hash = copy.hash;
        known = await fileEditFacts(hash);
      } catch (e) {
        notifyError(t('viewer-edit-not-kept'), e);
        return;
      }
    }
    let preview: string;
    try {
      const bytes = await fileEditPreview(hash);
      preview = URL.createObjectURL(new Blob([bytes as BlobPart]));
    } catch (e) {
      notifyError(t('viewer-edit-not-opened'), e);
      return;
    }
    // The side may have gone to another file while the copy was being made.
    if (file !== hash) {
      URL.revokeObjectURL(preview);
      return;
    }
    editing = {
      file: hash,
      facts: known,
      edit: nothing(),
      preview,
      cropping: false,
      keeping: false,
    };
    if (tab) sides.setTabZoom(spec.key, tab.id, null);
  }

  /** Ends the editing, keeping nothing. */
  function endEditing() {
    if (editing) URL.revokeObjectURL(editing.preview);
    editing = null;
  }

  /** Leaves the editing: after asking, where something was changed. */
  async function cancelEditing() {
    if (!editing || editing.keeping) return;
    if (!isNothing(editing.edit)) {
      asking = true;
      const leave = await confirm({
        title: t('viewer-edit-leave-title'),
        message: t('viewer-edit-leave-message'),
        confirm: t('viewer-edit-leave'),
        danger: true,
      }).finally(() => (asking = false));
      if (!leave) return;
    }
    endEditing();
  }

  /** Keeps the edit as a new file of the library, which the side then shows. */
  async function keepEditing() {
    const now = editing;
    if (!now || now.keeping || isNothing(now.edit)) return;
    now.keeping = true;
    try {
      const made = await fileEditKeep(now.file, $state.snapshot(now.edit));
      await files.reload();
      endEditing();
      sides.setFile(spec.key, made.hash);
      notifyOk(t('viewer-edit-kept', { name: made.name }));
    } catch (e) {
      now.keeping = false;
      notifyError(t('viewer-edit-not-kept'), e);
    }
  }

  function changeEdit(edit: Edit) {
    if (editing && !editing.keeping) editing.edit = edit;
  }
  function changeCrop(crop: Crop) {
    if (editing && !editing.keeping) editing.edit = { ...editing.edit, crop };
  }

  // The side going to another file, or away, drops what was being edited.
  $effect(() => {
    if (editing && editing.file !== file) untrack(endEditing);
  });
  onDestroy(endEditing);

  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !editing || asking || event.defaultPrevented) return;
    if (!active && count > 1) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    void cancelEditing();
  }

  // For the scripts: the edit of the active side set exactly, rather than by dragging.
  $effect(() => {
    if (!active && count > 1) return;
    testHook('__glaukopisImageEditing', {
      begin: () => beginEditing(),
      set: (part: Partial<Edit>) => editing && changeEdit({ ...editing.edit, ...part }),
      cropping: (on: boolean) => editing && (editing.cropping = on),
      keep: () => keepEditing(),
      cancel: () => cancelEditing(),
      edit: () => (editing ? $state.snapshot(editing.edit) : null),
    });
  });

  async function openElsewhere() {
    const path = files.get(file)?.path;
    if (!path) return;
    await attachmentOpen(path).catch((e) => notifyError(t('library-file-open-failed'), e));
  }
</script>

<svelte:window onkeydown={onEscape} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={pane}
  class="pane file-side"
  data-side-key={spec.key}
  data-file-side={file}
  style:flex-grow={grow}
  class:focused={count > 1 && active}
  onpointerdowncapture={() => sides.focus(spec.key)}
  onfocusin={() => sides.focus(spec.key)}
>
  <TabRow
    {sources}
    onactivate={(id) => void activate(id)}
    onclose={(id) => void closeTab(id)}
    oncloseothers={(id) => void closeOthers(id)}
    onagain={(id) => void again(id)}
    onmove={(id, to) => sides.moveTab(spec.key, id, to)}
    onadd={() => (choosing = true)}
  />
  {#if facts && !facts.locked && facts.pages > 0}
    <ViewerBar
      page={middle}
      count={facts.pages}
      labels={facts.labels}
      picture={facts.picture}
      zoom={tab?.zoom ?? null}
      {percent}
      onpage={goToPage}
      onplaces={(anchor) => openPlaces(anchor)}
      onprint={print}
      {printing}
      onzoom={zoomTo}
      {editable}
      editing={!!editing}
      onedit={() => void beginEditing()}
    />
    {#if editing}
      <EditRow
        edit={editing.edit}
        facts={editing.facts}
        cropping={editing.cropping}
        keeping={editing.keeping}
        onchange={changeEdit}
        oncropping={(on) => editing && (editing.cropping = on)}
        onkeep={() => void keepEditing()}
        oncancel={() => void cancelEditing()}
      />
    {/if}
  {/if}
  {#if !tab}
    <EmptyState icon={FileX} title={t('viewer-tabs-none')}>
      <Button onclick={() => (choosing = true)}>{t('viewer-tab-add')}</Button>
    </EmptyState>
  {:else if viewed?.gone}
    <EmptyState icon={FileX} title={t('viewer-not-found')}>
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if facts?.locked}
    <EmptyState icon={Lock} title={t('viewer-locked')}>
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if viewed?.failure}
    <EmptyState
      icon={CircleAlert}
      title={t('viewer-not-shown')}
      text={describeError(viewed.failure)}
    >
      {#if files.get(file)}
        <Button onclick={openElsewhere}>{t('files-open-elsewhere')}</Button>
      {/if}
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if !facts}
    <div class="centre"><Spinner size={20} /> <span>{t('viewer-loading')}</span></div>
  {:else if facts.picture && viewed?.image}
    {#key tabId}
      {@const id = tabId ?? ''}
      <ImageView
        bind:this={view}
        source={viewed.image}
        size={editing ? [editing.facts.width, editing.facts.height] : facts.sizes[0]}
        name={facts.name}
        zoom={tab?.zoom ?? null}
        onzoom={(z) => sides.setTabZoom(spec.key, id, z)}
        edit={editing?.edit ?? null}
        previewUrl={editing?.preview ?? null}
      >
        {#if editing && (editing.cropping || editing.edit.crop)}
          <CropFrame
            crop={editing.edit.crop ?? { x: 0, y: 0, width: 1, height: 1 }}
            active={editing.cropping && !editing.keeping}
            onchange={changeCrop}
          />
        {/if}
      </ImageView>
    {/key}
  {:else}
    <!-- Each tab its own view, laid out anew at its place; what it tells of its place is of the tab it was made for. -->
    {#key tabId}
      {@const id = tabId ?? ''}
      <PdfView
        bind:this={view}
        {file}
        {facts}
        tab={id}
        place={tab?.place ?? START}
        zoom={tab?.zoom ?? null}
        onplace={(of, place) => sides.setPlace(spec.key, of, place)}
        onmiddle={(n) => (middle = n)}
        onzoom={(z) => sides.setTabZoom(spec.key, id, z)}
      />
    {/key}
  {/if}
</div>

{#if placesAt && facts && file}
  <PlacesPopover
    anchor={placesAt}
    {file}
    labels={facts.labels}
    outline={facts.outline}
    {marking}
    here={placeNow}
    ongo={goToPlace}
    onclose={() => {
      placesAt = null;
      marking = false;
    }}
  />
{/if}

{#if askingRange && facts}
  <PrintRangeDialog
    count={facts.pages}
    page={middle}
    onprint={(from, to) => {
      askingRange = false;
      void printFile(from, to);
    }}
    onclose={() => (askingRange = false)}
  />
{/if}
{#if choosing}
  <FileChooser
    title={t('viewer-tab-add-title')}
    kinds={['pdf', 'picture']}
    except={sides.tabs(spec.key).tabs.map((tab) => tab.file)}
    onpick={(hashes) => {
      choosing = false;
      void addAll(hashes);
    }}
    onclose={() => (choosing = false)}
  />
{/if}

<style>
  .pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    background: var(--canvas);
  }
  .centre {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
