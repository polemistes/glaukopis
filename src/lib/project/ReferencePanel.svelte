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
  }

  let { project, mapId, onclose, head }: Props = $props();

  let scope = $state<'map' | 'project' | 'library'>('project');
  let query = $state('');
  let selection = $state<string[]>([]);

  onMount(() => {
    library.load();
  });

  const used = $derived(new Set(project.usedReferences(scope === 'map' ? mapId : undefined)));
  const pool = $derived(
    scope === 'library' ? library.entries : library.entries.filter((e) => used.has(e.id)),
  );
  const shown = $derived(sortEntries(search(pool, query), 'authors', false));
  const foreign = $derived([...used].filter((id) => !library.get(id)).length);

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
    <IconButton label={t('project-new-reference')} size="sm" onclick={() => newReference()}
      ><Plus size={15} /></IconButton
    >
    <IconButton label={t('project-import-file')} size="sm" onclick={() => importFile()}
      ><FileUp size={14} /></IconButton
    >
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
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
  footer {
    flex: none;
    padding: 8px 16px 10px;
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
</style>
