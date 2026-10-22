<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Search from '@lucide/svelte/icons/search';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { PROJECT } from './model/types';
  import { findElements, picker, pickRows, type Picking } from './picker.svelte';

  interface Props {
    /** What is asked, and how it is answered. */
    picking: Picking;
  }

  let { picking }: Props = $props();

  const project = $derived(picking.project);
  const tree = $derived(project.tree());

  const nameOf = (id: string) =>
    id === PROJECT
      ? project.name || t('project-untitled')
      : project.node(id)?.title || t('project-untitled');
  const reasonOf = (id: string) => picking.refuse?.(id) ?? null;

  // The way to the element in view stands open, and it is chosen first where it may be.
  const start = untrack(() => {
    const at = picking.at && picking.project.node(picking.at) ? picking.at : null;
    return { at, way: at ? picking.project.pathTo(at) : [] };
  });
  const opened = new SvelteSet<string>(start.way);
  let chosen = $state<string | null>(start.at && !reasonOf(start.at) ? start.at : null);
  let query = $state('');
  let listEl = $state<HTMLDivElement>();

  const searching = $derived(query.trim().length > 0);
  const rows = $derived(searching ? [] : pickRows(tree, (id) => opened.has(id)));
  const found = $derived(searching ? findElements(tree, nameOf, query) : []);
  /** What is shown, in the order the arrows go through it. */
  const shown = $derived(searching ? found.map((f) => f.id) : rows.map((r) => r.id));
  const chosenReason = $derived(chosen ? reasonOf(chosen) : null);
  const can = $derived(!!chosen && !!project.node(chosen) && !chosenReason);

  /** Answers the question, if it is still the one asked. */
  function answer(id: string | null) {
    if (picker.current === picking) picker.answer(id);
  }
  function choose(id: string | null = chosen) {
    if (!id || !project.node(id) || reasonOf(id)) return;
    answer(id);
  }
  const cancel = () => answer(null);

  function toggle(id: string) {
    if (id === PROJECT) return;
    if (opened.has(id)) opened.delete(id);
    else opened.add(id);
  }

  function oninput(event: Event) {
    // Read from the field itself, whichever of the two is told first.
    query = (event.currentTarget as HTMLInputElement).value;
    if (searching) {
      // What is written chooses the first element found that may be chosen.
      chosen = found.find((f) => !reasonOf(f.id))?.id ?? found[0]?.id ?? null;
    } else if (chosen) {
      // Back in the tree, what was found stands open to be seen.
      for (const id of project.pathTo(chosen).slice(0, -1)) opened.add(id);
    }
  }

  function step(by: number) {
    if (!shown.length) return;
    const i = chosen ? shown.indexOf(chosen) : -1;
    const j =
      i < 0 ? (by > 0 ? 0 : shown.length - 1) : Math.max(0, Math.min(shown.length - 1, i + by));
    chosen = shown[j];
  }

  function onkeydown(event: KeyboardEvent) {
    const row = !searching && chosen ? rows.find((r) => r.id === chosen) : undefined;
    if (event.key === 'ArrowDown') step(1);
    else if (event.key === 'ArrowUp') step(-1);
    else if (event.key === 'PageDown') step(10);
    else if (event.key === 'PageUp') step(-10);
    else if (event.key === 'Enter') choose();
    else if (event.key === 'ArrowRight' && row && !query) {
      if (row.holds && !row.open) toggle(row.id);
      else if (row.open) step(1);
    } else if (event.key === 'ArrowLeft' && row && !query) {
      if (row.open && row.id !== PROJECT) toggle(row.id);
      else chosen = tree.parent.get(row.id) ?? chosen;
    } else return;
    event.preventDefault();
  }

  // What is chosen is kept in sight.
  $effect(() => {
    const id = chosen;
    if (!id || !listEl) return;
    void tick().then(() =>
      listEl
        ?.querySelector(`[data-pick="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ block: 'nearest' }),
    );
  });
</script>

<Dialog open title={picking.title} width={500} padded={false} onclose={cancel}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="picker" {onkeydown}>
    <div class="find">
      <TextField
        bind:value={query}
        size="sm"
        placeholder={t('project-pick-find')}
        aria-label={t('project-pick-find')}
        data-autofocus
        {oninput}
      >
        {#snippet leading()}<Search size={14} />{/snippet}
      </TextField>
    </div>

    <div
      class="list"
      bind:this={listEl}
      role={searching ? 'listbox' : 'tree'}
      aria-label={picking.title}
    >
      {#if searching}
        {#each found as f (f.id)}
          {@const reason = reasonOf(f.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="row found"
            class:chosen={f.id === chosen}
            class:refused={!!reason}
            role="option"
            tabindex="-1"
            aria-selected={f.id === chosen}
            aria-disabled={reason ? true : undefined}
            data-pick={f.id}
            use:tooltip={reason}
            onclick={() => (chosen = f.id)}
            ondblclick={() => choose(f.id)}
          >
            <span class="name serif truncate">{nameOf(f.id)}</span>
            {#if f.path.length}
              <span class="path truncate">{f.path.join(' › ')}</span>
            {/if}
          </div>
        {:else}
          <p class="none">{t('project-pick-none')}</p>
        {/each}
      {:else}
        {#each rows as row (row.id)}
          {@const reason = reasonOf(row.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="row"
            class:top={row.id === PROJECT}
            class:chosen={row.id === chosen}
            class:refused={!!reason}
            class:here={row.id === picking.at}
            role="treeitem"
            tabindex="-1"
            aria-level={row.depth + 1}
            aria-expanded={row.holds ? row.open : undefined}
            aria-selected={row.id === chosen}
            aria-disabled={reason ? true : undefined}
            data-pick={row.id}
            style:padding-left="{8 + row.depth * 16}px"
            use:tooltip={reason}
            onclick={() => (chosen = row.id)}
            ondblclick={() => choose(row.id)}
          >
            {#if row.id === PROJECT}
              <span class="sign"><BookOpen size={14} /></span>
            {:else}
              <button
                type="button"
                class="fold"
                class:open={row.open}
                class:hidden={!row.holds}
                tabindex="-1"
                aria-label={row.open ? t('home-fold') : t('home-unfold')}
                onclick={(e) => {
                  e.stopPropagation();
                  toggle(row.id);
                }}
                ondblclick={(e) => e.stopPropagation()}
              >
                <ChevronRight size={12} />
              </button>
            {/if}
            <span class="name serif truncate">{nameOf(row.id)}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <span class="why">{chosenReason ?? ''}</span>
    <Button variant="ghost" onclick={cancel}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!can} onclick={() => choose()}>{picking.action}</Button>
  {/snippet}
</Dialog>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .find {
    padding: var(--space-1) var(--space-5) var(--space-2);
  }
  .list {
    height: min(420px, 56vh);
    overflow: auto;
    padding: 0 var(--space-3) var(--space-3);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding-right: 8px;
    border-radius: var(--radius-s);
    color: var(--ink-2);
    cursor: pointer;
    user-select: none;
  }
  .row:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .row.chosen {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .row.chosen .name {
    font-weight: 550;
  }
  .row.top .name {
    font-size: var(--text-md);
    color: var(--ink);
  }
  .row.here:not(.chosen) .name {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 3px;
  }
  .row.refused {
    color: var(--ink-4);
    cursor: default;
  }
  .row.refused .name {
    color: var(--ink-4);
  }
  .row.refused.chosen {
    background: var(--paper-hover);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
  }
  .found {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 0;
    min-height: 40px;
    padding: 3px 8px;
  }
  .found .name {
    flex: none;
  }
  .path {
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .sign {
    display: inline-flex;
    flex: none;
    width: 16px;
    justify-content: center;
    color: var(--ink-3);
  }
  .fold {
    display: inline-flex;
    flex: none;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    transition: transform var(--fast) var(--ease);
  }
  .fold:hover {
    background: var(--paper-raised);
    color: var(--ink);
  }
  .fold.open {
    transform: rotate(90deg);
  }
  .fold.hidden {
    visibility: hidden;
  }
  .none {
    padding: 20px 8px;
    color: var(--ink-4);
    text-align: center;
  }
  .why {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
