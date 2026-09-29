<script lang="ts">
  /**
   * The pictures at the side of a project: those of the map in view, of the
   * project, or all of the store. A picture is dragged from here into a text,
   * where it becomes a figure.
   */
  import { onMount } from 'svelte';
  import type { EditorView } from 'prosemirror-view';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import SquarePen from '@lucide/svelte/icons/square-pen';
  import X from '@lucide/svelte/icons/x';
  import { insertFigure } from '$lib/editor/commands';
  import { editorUi } from '$lib/editor/ui.svelte';
  import {
    isPicturePath,
    pictureMatches,
    pictures,
    PICTURES_DRAGGED,
    type Picture,
  } from '$lib/figures/pictures.svelte';
  import { t } from '$lib/i18n';
  import { importDropped } from '$lib/library/references.svelte';
  import PicturePane from '$lib/pictures/PicturePane.svelte';
  import {
    addPictures,
    captionHtml,
    captionWords,
    pictureHasNotes,
    takeIn,
    type PictureScope,
  } from '$lib/pictures/store.svelte';
  import Thumb from '$lib/pictures/Thumb.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    /** The map in view: "This map" shows its pictures. */
    mapId: string;
    /** Which pictures are shown. */
    scope?: PictureScope;
    onclose: () => void;
    onopenmap?: (map: string) => void;
  }

  let { project, mapId, scope = $bindable('project'), onclose, onopenmap }: Props = $props();

  /** A picture as it stands in the list: one the project uses may not have arrived in the store. */
  interface Row {
    hash: string;
    extension: string;
    name: string;
    picture?: Picture;
  }

  let query = $state('');
  let selected = $state<string | null>(null);
  /** The picture whose pane is open. */
  let opened = $state<string | null>(null);
  let list = $state<HTMLDivElement>();
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
    if (scope === 'store')
      return pictures.all.map((p) => ({
        hash: p.hash,
        extension: p.extension,
        name: p.name,
        picture: p,
      }));
    return project
      .usedPictures(scope === 'map' ? mapId : undefined)
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
    pictures.loaded && scope !== 'store' ? rows.filter((r) => !r.picture).length : 0,
  );
  const openedRow = $derived(
    opened
      ? (rows.find((r) => r.hash === opened) ??
          project.usedPictures().find((p) => p.hash === opened) ??
          pictures.get(opened))
      : undefined,
  );

  /** The text a picture is put into when that is asked for: the one that has the cursor, or had it last. */
  function text(): EditorView | null {
    const s = editorUi.selection;
    if (s?.kind === 'body') return s.view;
    return written && !written.isDestroyed && written.dom.isConnected ? written : null;
  }

  function put(picture: Picture) {
    const view = text();
    if (!view) return;
    insertFigure(picture)(view.state, view.dispatch);
    view.focus();
  }

  /** Pictures that were taken in are in the store, and in no text yet: the store is shown. */
  function took(taken: Picture[]) {
    if (!taken.length) return;
    scope = 'store';
    query = '';
    selected = taken[taken.length - 1].hash;
  }

  async function add() {
    took(await addPictures());
  }

  /** Files from the desktop: the pictures among them are taken in, the others go to the library. */
  async function dropped(event: DropEvent) {
    const paths = event.payload.data as string[];
    const others = paths.filter((path) => !isPicturePath(path));
    took(await takeIn(paths));
    if (others.length) void importDropped(others);
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
      { label: t('project-open-picture'), icon: SquarePen, action: () => (opened = row.hash) },
      ...(picture && text()
        ? [{ label: t('project-put-into-text'), icon: ImagePlus, action: () => put(picture) }]
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
        if (current >= 0) opened = shown[current].hash;
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
    accepts: (p) => p.kind === 'files' && (p.data as string[]).some(isPicturePath),
    ondrop: (e) => void dropped(e),
  }}
>
  <header>
    <h2>{t('project-pictures')}</h2>
    <IconButton label={t('project-add-pictures')} size="sm" onclick={add}>
      <Plus size={15} />
    </IconButton>
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
    <Segmented
      bind:value={scope}
      label={t('project-which-pictures')}
      size="sm"
      options={[
        { value: 'map', label: t('project-this-map') },
        { value: 'project', label: t('project-project') },
        { value: 'store', label: t('project-store') },
      ]}
    />
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
          {@const said = captionWords(row.picture)}
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
            ondblclick={() => (opened = row.hash)}
            oncontextmenu={(e) => context(e, row)}
          >
            <div class="frame">
              <Thumb hash={row.hash} extension={row.extension} small />
            </div>
            <div class="text">
              <div class="first">
                <span class="name truncate">{row.name || t('project-a-picture')}</span>
                {#if pictureHasNotes(row.hash, project)}
                  <span class="noted" aria-label={t('project-with-notes')}
                    ><NotebookPen size={12} /></span
                  >
                {/if}
              </div>
              <div class="second truncate">
                {#if !row.picture}
                  <span class="missing">{t('project-not-on-computer')}</span>
                {:else if said}
                  <!-- Made by captionHtml, which escapes all text. -->
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="said">{@html captionHtml(row.picture)}</span>
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
    {:else if scope === 'store'}
      <EmptyState compact title={t('project-store-empty')} text={t('project-store-empty-hint')} />
    {:else}
      <EmptyState
        compact
        title={t('project-no-pictures')}
        text={scope === 'map' ? t('project-no-pictures-map') : t('project-no-pictures-project')}
      />
    {/if}
  </div>

  <footer>
    {t('project-pictures-drag')}
    {#if absent}
      <br />{scope === 'map'
        ? t('project-pictures-absent-map', { count: absent })
        : t('project-pictures-absent-project', { count: absent })}
    {/if}
  </footer>
</aside>

{#if opened}
  <Dialog
    open
    title={openedRow?.name || t('project-a-picture')}
    width={560}
    padded={false}
    onclose={() => (opened = null)}
  >
    {#key opened}
      <PicturePane
        hash={opened}
        {project}
        onremoved={() => (opened = null)}
        onopenmap={(map) => {
          opened = null;
          onopenmap?.(map);
        }}
      />
    {/key}
  </Dialog>
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
  .noted {
    display: inline-flex;
    flex: none;
    color: var(--gold);
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
