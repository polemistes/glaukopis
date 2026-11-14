<script lang="ts">
  import type { Snippet } from 'svelte';
  /**
   * The images at the side of a project: those its figures show, or all of
   * the library (ADR 0070, record 0095). An image is dragged from here into
   * a text, where it becomes a figure.
   */
  import { onMount, untrack } from 'svelte';
  import type { EditorView } from 'prosemirror-view';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Plus from '@lucide/svelte/icons/plus';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import Search from '@lucide/svelte/icons/search';
  import SquarePen from '@lucide/svelte/icons/square-pen';
  import X from '@lucide/svelte/icons/x';
  import { insertFigure } from '$lib/editor/commands';
  import { editorUi } from '$lib/editor/ui.svelte';
  import {
    pictureMatches,
    pictures,
    PICTURES_DRAGGED,
    type Picture,
  } from '$lib/figures/pictures.svelte';
  import { t } from '$lib/i18n';
  import { addPictures, type PictureScope } from '$lib/figures/images.svelte';
  import { files, storedOf } from '$lib/files/store.svelte';
  import PictureTextDialog from '$lib/ocr/PictureTextDialog.svelte';
  import Thumb from '$lib/files/Thumb.svelte';
  import { router } from '$lib/state/router.svelte';
  import { dropTarget, startDrag } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import type { Project } from './model/project.svelte';
  import { arrivals, arrive, dropOnList } from './pane-adding.svelte';

  interface Props {
    project: Project;
    /** The element in view, for the text read of an image to be made an element at. */
    at: string;
    /** Which pictures are shown. */
    scope?: PictureScope;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
    /** Enters an element made of the text of an image. */
    onenter?: (id: string) => void;
  }

  let { project, at, scope = $bindable('project'), onclose, head, onenter }: Props = $props();

  /** A picture as it stands in the list: one the project uses may not have arrived in the store. */
  interface Row {
    hash: string;
    extension: string;
    name: string;
    picture?: Picture;
  }

  let query = $state('');
  let selected = $state<string | null>(null);
  /** The image whose text is being read, to be copied or made an element of here. */
  let reading = $state<string | null>(null);
  const readingFile = $derived(reading ? files.get(reading) : undefined);
  let list = $state<HTMLDivElement>();
  /** The image to bring into view as soon as the list has it. */
  let revealing = $state<string | null>(null);
  /** The text that had the cursor last: where a picture is put when that is asked for. */
  let written: EditorView | null = null;

  onMount(() => {
    void pictures.load();
  });

  $effect(() => {
    const s = editorUi.selection;
    if (s?.kind === 'body') written = s.view;
  });

  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  const rows = $derived.by((): Row[] => {
    if (scope === 'library')
      return pictures.all.map((p) => ({
        hash: p.hash,
        extension: p.extension,
        name: p.name,
        picture: p,
      }));
    return project
      .usedPictures()
      .map((used) => {
        const picture = pictures.get(used.hash);
        return {
          hash: used.hash,
          extension: picture?.extension ?? used.extension,
          name: picture?.name ?? used.name,
          picture,
        };
      })
      .sort((a, b) => collator.compare(a.name, b.name));
  });
  const shown = $derived(
    rows.filter((r) =>
      r.picture
        ? pictureMatches(r.picture, query)
        : query
            .toLowerCase()
            .split(/\s+/)
            .every((w) => r.name.toLowerCase().includes(w)),
    ),
  );
  const absent = $derived(
    pictures.loaded && scope !== 'library' ? rows.filter((r) => !r.picture).length : 0,
  );

  // What came into the library through a list of the pane and stands among
  // the images is shown: all of the library, nothing searched for, what came
  // selected and in view (record 0095). It depends on what waits alone.
  $effect(() => {
    const arrived = arrivals.waiting;
    if (arrived?.tab !== 'images') return;
    untrack(() => {
      arrivals.waiting = null;
      scope = 'library';
      query = '';
      selected = revealing = arrived.ids[arrived.ids.length - 1];
    });
  });

  // The image to bring into view is scrolled to once the list is there with
  // it: the list is made as the images are shown, or as they come.
  $effect(() => {
    if (!revealing || !list || !shown.some((r) => r.hash === revealing)) return;
    const hash = revealing;
    revealing = null;
    reveal(hash);
  });

  /** An image is looked at, named and given its words where every file is: among the files of the library. */
  function open(hash: string) {
    router.go({ view: 'files', file: hash });
  }

  /** The text a picture is put into when that is asked for: the one that has the cursor, or had it last. */
  function text(): EditorView | null {
    const s = editorUi.selection;
    if (s?.kind === 'body') return s.view;
    return written && !written.isDestroyed && written.dom.isConnected ? written : null;
  }

  /** Puts a figure of the image into the text, of the file a figure shows: itself, or a copy made of it. */
  async function put(picture: Picture) {
    const view = text();
    if (!view) return;
    const shown = await pictures.forFigure(picture.hash);
    if (!shown || view.isDestroyed) return;
    insertFigure(shown)(view.state, view.dispatch);
    view.focus();
  }

  async function add() {
    arrive(
      'images',
      (await addPictures()).map((p) => p.hash),
    );
  }

  function onpointerdown(event: PointerEvent, row: Row) {
    if (event.button !== 0) return;
    selected = row.hash;
    startDrag(event, () =>
      row.picture ? { kind: PICTURES_DRAGGED, data: [row.hash], label: row.name } : null,
    );
  }

  function context(event: MouseEvent, row: Row) {
    selected = row.hash;
    const picture = row.picture;
    openContextMenu(event, [
      ...(picture
        ? [{ label: t('project-open-picture'), icon: SquarePen, action: () => open(row.hash) }]
        : []),
      ...(picture && text()
        ? [{ label: t('project-put-into-text'), icon: ImagePlus, action: () => void put(picture) }]
        : []),
      ...(picture && picture.extension !== 'svg'
        ? [{ label: t('files-read-text'), icon: ScanText, action: () => (reading = row.hash) }]
        : []),
    ]);
  }

  function reveal(hash: string) {
    list?.querySelector(`[data-hash="${hash}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function onkeydown(event: KeyboardEvent) {
    if (!shown.length || event.ctrlKey || event.metaKey || event.altKey) return;
    const current = shown.findIndex((r) => r.hash === selected);
    let next = current;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(shown.length - 1, current + 1);
        break;
      case 'ArrowUp':
        next = current < 0 ? 0 : Math.max(0, current - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = shown.length - 1;
        break;
      case 'Enter':
        if (current >= 0 && shown[current].picture) open(shown[current].hash);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) return;
    selected = shown[next].hash;
    reveal(selected);
  }
</script>

<aside
  class="panel"
  aria-label={t('project-pictures')}
  data-beside-text
  use:dropTarget={{
    accepts: (p) => p.kind === 'files',
    ondrop: (e) => void dropOnList(e.payload.data as string[], 'images'),
  }}
>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('project-pictures')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
    <div class="row">
      <Segmented
        bind:value={scope}
        label={t('project-which-pictures')}
        size="sm"
        options={[
          { value: 'project', label: t('project-pictures-used') },
          { value: 'library', label: t('project-all') },
        ]}
      />
      <span class="spring"></span>
      <IconButton label={t('project-add-pictures')} size="sm" onclick={add}>
        <Plus size={15} />
      </IconButton>
    </div>
    <div class="search">
      <Search size={14} />
      <input
        bind:value={query}
        type="search"
        placeholder={t('common-search')}
        aria-label={t('project-search-pictures')}
        spellcheck="false"
      />
    </div>
  </div>

  <div class="body">
    {#if shown.length}
      <!-- The rows leave the cursor in the text that is being written. -->
      <div
        bind:this={list}
        class="list"
        role="listbox"
        aria-label={t('project-pictures')}
        tabindex="0"
        {onkeydown}
      >
        {#each shown as row (row.hash)}
          {@const said = row.picture?.alt ?? ''}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="row"
            class:absent={!row.picture}
            role="option"
            tabindex="-1"
            aria-selected={selected === row.hash}
            data-hash={row.hash}
            onmousedown={(e) => {
              if (editorUi.selection) e.preventDefault();
            }}
            onpointerdown={(e) => onpointerdown(e, row)}
            ondblclick={() => row.picture && open(row.hash)}
            oncontextmenu={(e) => context(e, row)}
          >
            <div class="frame">
              <Thumb hash={row.hash} extension={row.extension} small />
            </div>
            <div class="text">
              <div class="first">
                <span class="name truncate">{row.name || t('project-a-picture')}</span>
              </div>
              <div class="second truncate">
                {#if !row.picture}
                  <span class="missing">{t('project-not-on-computer')}</span>
                {:else if said}
                  <span class="said">{said}</span>
                {:else}
                  <span class="unsaid">{t('project-nothing-said')}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if query}
      <EmptyState compact title={t('project-nothing-found')} />
    {:else if scope === 'library'}
      <EmptyState
        compact
        title={t('project-library-no-images')}
        text={t('project-library-no-images-hint')}
      />
    {:else}
      <EmptyState compact title={t('project-no-pictures')} text={t('project-no-pictures-hint')} />
    {/if}
  </div>

  <footer>
    {t('project-pictures-drag')}
    {#if absent}
      <br />{t('project-pictures-absent-project', { count: absent })}
    {/if}
  </footer>
</aside>

{#if readingFile}
  <PictureTextDialog
    file={storedOf(readingFile)}
    {project}
    {at}
    {onenter}
    onclose={() => (reading = null)}
  />
{/if}

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
  }
  .panel:global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    flex: none;
    padding: 0 8px 0 16px;
  }
  h2 {
    flex: 1;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 2px 12px 10px;
    border-bottom: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .spring {
    flex: 1;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 28px;
    padding: 0 9px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    color: var(--ink-3);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
  }
  .search input::-webkit-search-cancel-button {
    display: none;
  }
  .body {
    flex: 1;
    min-height: 0;
  }
  .list {
    height: 100%;
    overflow-y: auto;
    outline: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 56px;
    padding: 0 14px;
    border-bottom: 1px solid var(--line);
    cursor: default;
  }
  .row:hover {
    background: var(--paper-hover);
  }
  .row[aria-selected='true'] {
    background: var(--accent-soft);
    border-bottom-color: transparent;
  }
  .list:focus-visible .row[aria-selected='true'] {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .frame {
    width: 44px;
    height: 40px;
    flex: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .frame :global(.thumb) {
    border-radius: 0;
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .first {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 550;
    color: var(--ink);
  }
  .absent .name {
    color: var(--ink-2);
  }
  .second {
    margin-top: 1px;
    color: var(--ink-2);
  }
  .said {
    font-family: var(--font-text);
    font-size: 14px;
  }
  .unsaid,
  .missing {
    font-size: var(--text-sm);
    color: var(--ink-4);
  }
  footer {
    flex: none;
    padding: 8px 16px 10px;
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
</style>
