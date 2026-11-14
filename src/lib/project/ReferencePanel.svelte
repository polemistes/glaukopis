<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Eye from '@lucide/svelte/icons/eye';
  import { libraryGet } from '$lib/api/library';
  import { showFile } from '$lib/viewer/show';
  import type { Snippet } from 'svelte';
  import { onMount, tick, untrack } from 'svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import type { Summary } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { addingItems } from '$lib/library/adding';
  import { copyReferences } from '$lib/library/copying';
  import ReferenceList from '$lib/library/ReferenceList.svelte';
  import { editReference, newReference } from '$lib/library/references.svelte';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { library, search, sortEntries } from '$lib/state/library.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { openContextMenu, openMenu } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import type { Project } from './model/project.svelte';
  import { arrivals, arrive, dropOnList } from './pane-adding.svelte';
  import { PROJECT, type NodeRecord } from './model/types';

  interface Props {
    project: Project;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
    /** Goes to an element where a reference is cited. */
    ongo?: (element: string) => void;
    /** A reference to show at once, with where it is cited. */
    show?: string | null;
  }

  let { project, onclose, head, ongo, show = null }: Props = $props();

  /** The references the project cites, or all of the library's. */
  let scope = $state<'project' | 'library'>('project');
  let query = $state('');
  // svelte-ignore state_referenced_locally
  let selection = $state<string[]>(show ? [show] : []);
  let list = $state<ReturnType<typeof ReferenceList>>();
  /** The reference to bring into view as soon as the list has it. */
  let revealing = $state<string | null>(null);

  onMount(() => {
    library.load();
  });

  const used = $derived(new Set(project.usedReferences()));
  const pool = $derived(
    scope === 'library' ? library.entries : library.entries.filter((e) => used.has(e.id)),
  );
  const shown = $derived(sortEntries(search(pool, query), 'authors', false));
  const foreign = $derived([...used].filter((id) => !library.get(id)).length);

  // What came into the library through a list of the pane and stands among
  // the references is shown: all of the library, nothing searched for, what
  // came selected and in view (record 0095). It depends on what waits alone.
  $effect(() => {
    const arrived = arrivals.waiting;
    if (arrived?.tab !== 'references') return;
    untrack(() => {
      arrivals.waiting = null;
      scope = 'library';
      query = '';
      selection = arrived.ids;
      revealing = arrived.ids[arrived.ids.length - 1];
    });
  });

  // The reference to bring into view is scrolled to once the list is there
  // with it: the list is made as the references are shown, or as they come.
  $effect(() => {
    if (!revealing || !list || !shown.some((e) => e.id === revealing)) return;
    const id = revealing;
    revealing = null;
    void tick().then(() => list?.scrollTo(id));
  });

  /** The one reference chosen, and where it is cited: the elements, by the tree under the project each stands in. */
  const chosen = $derived(selection.length === 1 ? selection[0] : null);
  const citing = $derived.by(() => {
    if (!chosen) return [];
    const groups = new Map<string, { top: string; elements: NodeRecord[] }>();
    for (const n of project.citing(chosen)) {
      const top = project.pathTo(n.id)[1] ?? PROJECT;
      let group = groups.get(top);
      if (!group) groups.set(top, (group = { top, elements: [] }));
      group.elements.push(n);
    }
    return [...groups.values()];
  });

  /** A new reference is shown among all, as those that are brought in are. */
  async function add() {
    const added = await newReference();
    if (added) arrive('references', [added.id]);
  }

  /** The menu of the Library page for adding, beside a new reference. */
  function addMenu(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        { label: t('library-new-reference'), icon: Plus, action: () => void add() },
        { kind: 'separator' },
        ...addingItems(null, (outcome) => arrive('references', outcome?.added ?? [])),
      ],
      { align: 'end' },
    );
  }

  async function context(event: MouseEvent, entries: Summary[]) {
    const one = entries.length === 1 ? entries[0] : null;
    // A work's files that can be shown, beside the map (ADR 0069): one item each, named where there are several.
    const files = one?.attachments
      ? await libraryGet(one.id)
          .then((r) =>
            r.files.filter((f) => f.exists && (f.kind === 'pdf' || f.kind === 'picture')),
          )
          .catch(() => [])
      : [];
    openContextMenu(event, [
      ...(one
        ? [{ label: t('project-edit-reference'), action: () => void editReference(one.id) }]
        : []),
      {
        label: t('project-copy'),
        icon: Copy,
        shortcut: keysFor('library-copy'),
        action: () => void copyReferences(entries.map((e) => e.id)),
      },
      ...files.map((f) => ({
        label:
          files.length === 1
            ? t('project-show-file')
            : t('project-show-file-named', { name: f.name }),
        icon: Eye,
        action: () => showFile(f.hash),
      })),
    ]);
  }
</script>

<aside
  class="panel"
  aria-label={t('project-references')}
  use:dropTarget={{
    accepts: (p) => p.kind === 'files',
    ondrop: (e) => void dropOnList(e.payload.data as string[], 'references'),
  }}
>
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
          { value: 'project', label: t('project-references-cited') },
          { value: 'library', label: t('project-all') },
        ]}
      />
      <span class="spring"></span>
      <IconButton label={t('project-add-references')} size="sm" onclick={addMenu}
        ><Plus size={15} /></IconButton
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
        bind:this={list}
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
      {#each citing as group (group.top)}
        <div class="tree">
          <span class="tree-name">{project.node(group.top)?.title || t('project-untitled')}</span>
          {#each group.elements as element (element.id)}
            <button
              type="button"
              class="element"
              data-element={element.id}
              onclick={() => ongo?.(element.id)}
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
  .tree + .tree {
    margin-top: 8px;
  }
  .tree-name {
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
