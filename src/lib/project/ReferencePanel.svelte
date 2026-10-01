<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import FileUp from '@lucide/svelte/icons/file-up';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import type { Summary } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import ReferenceList from '$lib/library/ReferenceList.svelte';
  import { editReference, importFile, newReference } from '$lib/library/references.svelte';
  import { library, search, sortEntries } from '$lib/state/library.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    /** The map in view: "In this map" counts its references. */
    mapId: string;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
    /** Goes to an element where a reference is cited. */
    ongo?: (map: string, element: string) => void;
    /** A reference to show at once, with where it is cited. */
    show?: string | null;
  }

  let { project, mapId, onclose, head, ongo, show = null }: Props = $props();

  let scope = $state<'map' | 'project' | 'library'>('project');
  let query = $state('');
  // svelte-ignore state_referenced_locally
  let selection = $state<string[]>(show ? [show] : []);

  onMount(() => {
    library.load();
  });

  const used = $derived(new Set(project.usedReferences(scope === 'map' ? mapId : undefined)));
  const pool = $derived(
    scope === 'library' ? library.entries : library.entries.filter((e) => used.has(e.id)),
  );
  const shown = $derived(sortEntries(search(pool, query), 'authors', false));
  const foreign = $derived([...used].filter((id) => !library.get(id)).length);

  /** The one reference chosen, and where it is cited. */
  const chosen = $derived(selection.length === 1 ? selection[0] : null);
  const citing = $derived(chosen ? project.citing(chosen) : []);

  function context(event: MouseEvent, entries: Summary[]) {
    const one = entries.length === 1 ? entries[0] : null;
    openContextMenu(event, [
      ...(one
        ? [{ label: t('project-edit-reference'), action: () => void editReference(one.id) }]
        : []),
    ]);
  }
</script>

<aside class="panel" aria-label={t('project-references')}>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('project-references')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
    <div class="row">
      <Segmented
        bind:value={scope}
        label={t('project-which-references')}
        size="sm"
        options={[
          { value: 'map', label: t('project-this-map') },
          { value: 'project', label: t('project-project') },
          { value: 'library', label: t('project-library') },
        ]}
      />
      <span class="spring"></span>
      <IconButton label={t('project-new-reference')} size="sm" onclick={() => newReference()}
        ><Plus size={15} /></IconButton
      >
      <IconButton label={t('project-import-file')} size="sm" onclick={() => importFile()}
        ><FileUp size={14} /></IconButton
      >
    </div>
    <div class="search">
      <Search size={14} />
      <input
        bind:value={query}
        type="search"
        placeholder={t('common-search')}
        aria-label={t('project-search-references')}
        spellcheck="false"
      />
    </div>
  </div>

  <div class="body">
    {#if shown.length}
      <ReferenceList
        entries={shown}
        bind:selection
        compact
        onopen={(e) => void editReference(e.id)}
        oncontext={context}
      />
    {:else if query}
      <EmptyState compact title={t('project-nothing-found')} />
    {:else if scope === 'library'}
      <EmptyState
        compact
        title={t('project-library-empty')}
        text={t('project-library-empty-hint')}
      />
    {:else}
      <EmptyState
        compact
        title={t('project-no-references')}
        text={t('project-no-references-hint')}
      />
    {/if}
  </div>

  {#if chosen}
    <section class="cited" aria-label={t('project-cited-in-heading')}>
      <h3 class="overline">{t('project-cited-in-heading')}</h3>
      {#each citing as { map, elements } (map.id)}
        <div class="map">
          <span class="map-name">{map.name}</span>
          {#each elements as element (element.id)}
            <button
              type="button"
              class="element"
              data-element={element.id}
              onclick={() => ongo?.(map.id, element.id)}
            >
              {element.title || t('project-untitled')}
            </button>
          {/each}
        </div>
      {:else}
        <p class="none">{t('project-not-cited')}</p>
      {/each}
    </section>
  {/if}

  <footer>
    {t('project-references-drag')}
    {#if foreign && scope !== 'library'}
      <br />{t('project-references-foreign', { count: foreign })}
    {/if}
  </footer>
</aside>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
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
  .cited {
    flex: none;
    max-height: 38%;
    overflow-y: auto;
    padding: 10px 16px 12px;
    border-top: 1px solid var(--line);
  }
  .cited h3 {
    margin-bottom: 6px;
  }
  .map + .map {
    margin-top: 8px;
  }
  .map-name {
    display: block;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ink-3);
  }
  .element {
    display: block;
    width: 100%;
    padding: 3px 6px;
    margin-left: -6px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .element:hover {
    background: var(--paper-sunken);
    text-decoration: underline;
  }
  .element:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }
  .none {
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
