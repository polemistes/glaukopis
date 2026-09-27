<script lang="ts">
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { editReference } from '$lib/library/references.svelte';
  import { truncate } from '$lib/library/format';
  import NoteButton from '$lib/library/NoteButton.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { lookup } from './references.svelte';
  import { LOCATOR_LABELS, type CiteItem, type CiteMode } from './schema';
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
      {@const ref = lookup(item.id)}
      <div class="item" data-item={i}>
        <div class="work">
          <div class="what">
            {#if ref}
              <span class="authors">{ref.authors || '—'}</span>
              <span class="year">{ref.year}</span>
              <span class="title serif">{truncate(ref.title, 70)}</span>
            {:else}
              <span class="gone">This reference is not in your library.</span>
            {/if}
          </div>
          <NoteButton id={item.id} always />
          {#if ref?.inLibrary}
            <IconButton label="Edit the reference" size="sm" onclick={() => edit(item.id)}>
              <Pencil size={13} />
            </IconButton>
          {/if}
          <IconButton label="Remove from the citation" size="sm" onclick={() => remove(i)}>
            <X size={13} />
          </IconButton>
        </div>

        <div class="fields">
          <label class="prefix">
            <span>Before</span>
            <input bind:value={item.prefix} placeholder="see, cf." oninput={commit} />
          </label>
          <label class="locator">
            <select
              aria-label="Kind of place"
              value={item.label ?? 'page'}
              onchange={(e) => {
                item.label = e.currentTarget.value;
                commit();
              }}
            >
              {#each LOCATOR_LABELS as [value, label] (value)}
                <option {value}>{label}</option>
              {/each}
            </select>
            <input bind:value={item.locator} placeholder="45–67" oninput={commit} />
          </label>
          <label class="suffix">
            <span>After</span>
            <input bind:value={item.suffix} placeholder="and passim" oninput={commit} />
          </label>
        </div>

        {#if mode === 'normal'}
          <label class="check">
            <input type="checkbox" bind:checked={item.suppressAuthor} onchange={commit} />
            The author is named in my sentence: give the year only
          </label>
        {/if}
      </div>
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
        <Trash2 size={14} /> Remove
      </button>
    </div>
  </div>
</Popover>

<style>
  .editor {
    display: flex;
    flex-direction: column;
  }
  .item {
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }
  .work {
    display: flex;
    align-items: flex-start;
    gap: 2px;
  }
  .what {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .authors {
    font-weight: 550;
  }
  .year {
    color: var(--ink-2);
    margin: 0 4px;
  }
  .title {
    color: var(--ink-2);
  }
  .gone {
    color: var(--danger);
  }
  .fields {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 6px;
    margin-top: 8px;
    align-items: end;
  }
  .fields label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .fields span {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .fields select {
    appearance: none;
    -webkit-appearance: none;
    height: 17px;
    padding: 0;
    border: none;
    background: transparent;
    font-size: var(--text-xs);
    color: var(--accent-strong);
    font-weight: 500;
    cursor: pointer;
    outline: none;
  }
  .fields input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  .fields input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .fields input::placeholder {
    color: var(--ink-4);
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
