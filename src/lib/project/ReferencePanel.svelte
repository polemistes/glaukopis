<script lang="ts">
  import { onMount } from 'svelte';
  import FileUp from '@lucide/svelte/icons/file-up';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import type { Summary } from '$lib/api/library';
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
  }

  let { project, mapId, onclose }: Props = $props();

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
      ...(one ? [{ label: 'Edit the reference…', action: () => void editReference(one.id) }] : []),
    ]);
  }
</script>

<aside class="panel" aria-label="References">
  <header>
    <h2>References</h2>
    <IconButton label="New reference" size="sm" onclick={() => newReference()}
      ><Plus size={15} /></IconButton
    >
    <IconButton label="Import a file" size="sm" onclick={() => importFile()}
      ><FileUp size={14} /></IconButton
    >
    <IconButton label="Close" size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
    <Segmented
      bind:value={scope}
      label="Which references"
      size="sm"
      options={[
        { value: 'map', label: 'This map' },
        { value: 'project', label: 'Project' },
        { value: 'library', label: 'Library' },
      ]}
    />
    <div class="search">
      <Search size={14} />
      <input
        bind:value={query}
        type="search"
        placeholder="Search"
        aria-label="Search references"
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
      <EmptyState compact title="Nothing found" />
    {:else if scope === 'library'}
      <EmptyState
        compact
        title="Your library is empty"
        text="Add a reference, or import those you have."
      />
    {:else}
      <EmptyState
        compact
        title="No references yet"
        text={'Type @ while writing to cite a work, or drag references from the library onto an element.'}
      />
    {/if}
  </div>

  <footer>
    Drag a reference into the text to cite it, or onto an element to attach it.
    {#if foreign && scope !== 'library'}
      <br />{foreign} in this project {foreign === 1 ? 'is' : 'are'} not in your library.
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
    border-left: 1px solid var(--line);
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
