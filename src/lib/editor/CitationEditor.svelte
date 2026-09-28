<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { editReference } from '$lib/library/references.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import CitationItem from './CitationItem.svelte';
  import type { CiteItem, CiteMode } from './schema';
  import { editorUi, type CitationRequest } from './ui.svelte';

  interface Props {
    request: CitationRequest;
    oncite: (id: string) => void;
    onclose: () => void;
  }

  let { request, oncite, onclose }: Props = $props();

  // svelte-ignore state_referenced_locally
  let items = $state<CiteItem[]>(structuredClone($state.snapshot(request.items) as CiteItem[]));
  // svelte-ignore state_referenced_locally
  let mode = $state<CiteMode>(request.mode);
  let root = $state<HTMLDivElement>();
  let adding = $state(false);
  let waiting = $state(false);

  function commit() {
    const clean = $state.snapshot(items).map((i) => {
      const out: CiteItem = { id: i.id };
      if (i.locator?.trim()) out.locator = i.locator.trim();
      if (i.label && i.label !== 'page' && out.locator) out.label = i.label;
      if (i.prefix?.trim()) out.prefix = i.prefix.trim();
      if (i.suffix?.trim()) out.suffix = i.suffix.trim();
      if (i.suppressAuthor) out.suppressAuthor = true;
      return out;
    });
    request.onchange(clean, mode);
  }

  $effect(() => {
    const index = request.focus;
    if (index !== undefined && root) {
      root.querySelector<HTMLInputElement>(`[data-item="${index}"] .locator input`)?.focus();
    }
  });

  function remove(i: number) {
    items.splice(i, 1);
    commit();
    if (!items.length) onclose();
  }

  function add(event: MouseEvent) {
    adding = true;
    editorUi.pick({
      anchor: (event.currentTarget as HTMLElement).getBoundingClientRect(),
      exclude: items.map((i) => i.id),
      purpose: 'Add a work to the citation',
      onpick: (id) => {
        editorUi.closePicker(false);
        adding = false;
        items.push({ id });
        oncite(id);
        commit();
        queueMicrotask(() =>
          root
            ?.querySelector<HTMLInputElement>(`[data-item="${items.length - 1}"] .locator input`)
            ?.focus(),
        );
      },
      oncancel: () => (adding = false),
    });
  }

  async function edit(id: string) {
    waiting = true;
    await editReference(id);
    waiting = false;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      onclose();
    }
  }
</script>

<Popover
  open={!adding && !waiting}
  anchor={request.anchor}
  side="bottom"
  align="start"
  gap={8}
  width={440}
  label="Citation"
  {onclose}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="editor" bind:this={root} {onkeydown}>
    {#each items as item, i (item.id)}
      <CitationItem
        reference={item.id}
        bind:said={items[i]}
        {mode}
        index={i}
        onchange={commit}
        onremove={() => remove(i)}
        onedit={edit}
      />
    {/each}

    <div class="foot">
      <button type="button" onclick={add}><Plus size={14} /> Add a work</button>
      <label class="check inline">
        <input
          type="checkbox"
          checked={mode === 'intext'}
          onchange={(e) => {
            mode = e.currentTarget.checked ? 'intext' : 'normal';
            commit();
          }}
        />
        Author in the text: Nagy (1979)
      </label>
      <button
        type="button"
        class="danger"
        onclick={() => {
          items = [];
          commit();
          onclose();
        }}
      >
        <Trash2 size={14} /> Remove the citation
      </button>
    </div>
  </div>
</Popover>

<style>
  .editor {
    display: flex;
    flex-direction: column;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  .check.inline {
    margin: 0 auto 0 8px;
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px;
    background: var(--paper);
  }
  .foot button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .foot button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .foot .danger:hover {
    background: var(--danger-soft);
    color: var(--danger);
  }
</style>
