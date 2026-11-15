<script lang="ts">
  /**
   * The starting texts of new notes, in one window (stage 4; `model/starts.ts`):
   * their list at the left, in their order, changed by dragging or by the two
   * small arrows; the one chosen at the right, its name, its lines, and the
   * kind of paragraph they are; New, and Delete after the question. What is
   * changed is written at once, and undone with the notebook's undo.
   */
  import { untrack } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import Plus from '@lucide/svelte/icons/plus';
  import { specOf } from '$lib/editor/kinds';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { Notebook } from './model/notebook.svelte';
  import { cleanStartText } from './model/starts';
  import { dropBefore } from './page.svelte';
  import { startKinds } from './starting';

  interface Props {
    notebook: Notebook;
    onclose: () => void;
  }

  let { notebook, onclose }: Props = $props();

  const START_DRAGGED = 'notebook-start';

  const starts = $derived(notebook.starts);
  let chosenId = $state<string | null>(untrack(() => notebook.starts[0]?.id ?? null));
  const chosen = $derived(starts.find((s) => s.id === chosenId) ?? null);
  const at = $derived(chosen ? starts.indexOf(chosen) : -1);
  const kinds = startKinds();

  // The name and the lines as they are typed: what is kept is trimmed, so
  // the fields keep their own words while they are written, and take them
  // anew where they are changed otherwise, as by undo, or another is chosen.
  let name = $state('');
  let lines = $state('');
  let nameField = $state<HTMLInputElement>();
  $effect(() => {
    const now = chosen;
    untrack(() => {
      if ((now?.name ?? '') !== name.trim()) name = now?.name ?? '';
      if ((now?.text ?? '') !== cleanStartText(lines)) lines = now?.text ?? '';
    });
  });

  // What is chosen must be there: deleted, or undone away.
  $effect(() => {
    if (chosenId && !starts.some((s) => s.id === chosenId)) chosenId = starts[0]?.id ?? null;
  });

  function make() {
    notebook.checkpoint();
    chosenId = notebook.addStart({ name: '' });
    notebook.checkpoint();
    name = '';
    lines = '';
    setTimeout(() => nameField?.focus(), 0);
  }

  async function remove() {
    if (!chosen) return;
    const doomed = chosen;
    const sure = await confirm({
      title: t('notebook-start-delete-title', { name: doomed.name || t('notebook-start-unnamed') }),
      message: t('notebook-start-delete-message'),
      confirm: t('common-delete'),
      danger: true,
    });
    if (!sure) return;
    const next = starts[at + 1] ?? starts[at - 1] ?? null;
    notebook.checkpoint();
    notebook.deleteStart(doomed.id);
    notebook.checkpoint();
    chosenId = next?.id ?? null;
  }

  /** Moves the one chosen up or down a place. */
  function shift(by: -1 | 1) {
    if (!chosen) return;
    const order = starts.map((s) => s.id);
    // Before the one above it; or before the one two below it, the end where there is none.
    const before = by < 0 ? order[at - 1] : (order[at + 2] ?? null);
    if (by < 0 && at <= 0) return;
    if (by > 0 && at >= order.length - 1) return;
    notebook.checkpoint();
    notebook.moveStart(chosen.id, before ?? null);
    notebook.checkpoint();
  }

  // ---- dragging in the list ----

  let line = $state<{ id: string; lower: boolean } | null>(null);

  function lowerHalf(event: DropEvent): boolean {
    const r = event.target.getBoundingClientRect();
    return event.y > r.top + r.height / 2;
  }

  function dropOn(event: DropEvent, id: string) {
    line = null;
    const dragged = event.payload.data as string;
    const order = starts.map((s) => s.id);
    // Before the row, or after it where the pointer is in its lower half.
    const before = lowerHalf(event) ? dropBefore(order, id, true) : id;
    notebook.checkpoint();
    notebook.moveStart(dragged, before);
    notebook.checkpoint();
  }
</script>

<Dialog open title={t('notebook-starts-title')} width={640} {onclose}>
  <div class="starts" data-starts-dialog>
    <div class="side">
      <div class="list" role="listbox" aria-label={t('notebook-starts-title')}>
        {#each starts as s (s.id)}
          <div
            class="item"
            class:chosen={s.id === chosenId}
            class:above={line?.id === s.id && !line.lower}
            class:below={line?.id === s.id && line.lower}
            role="option"
            tabindex="0"
            aria-selected={s.id === chosenId}
            data-start={s.id}
            use:dropTarget={{
              accepts: (p) => p.kind === START_DRAGGED && p.data !== s.id,
              quiet: true,
              onover: (e) => {
                if (!e) {
                  if (line?.id === s.id) line = null;
                } else line = { id: s.id, lower: lowerHalf(e) };
              },
              ondrop: (e) => dropOn(e, s.id),
            }}
            onclick={() => (chosenId = s.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                chosenId = s.id;
              }
            }}
            onpointerdown={(e) =>
              startDrag(e, () => ({
                kind: START_DRAGGED,
                data: s.id,
                label: s.name || t('notebook-start-unnamed'),
              }))}
          >
            <span class="truncate" class:unnamed={!s.name}
              >{s.name || t('notebook-start-unnamed')}</span
            >
          </div>
        {:else}
          <p class="none">{t('notebook-start-none')}</p>
        {/each}
      </div>
      <div class="tools">
        <Button size="sm" data-start-new onclick={make}>
          {#snippet icon()}<Plus size={14} />{/snippet}
          {t('notebook-start-new')}
        </Button>
        <span class="gap"></span>
        <IconButton
          label={t('notebook-start-up')}
          size="sm"
          disabled={!chosen || at <= 0}
          data-start-up
          onclick={() => shift(-1)}
        >
          <ArrowUp size={14} />
        </IconButton>
        <IconButton
          label={t('notebook-start-down')}
          size="sm"
          disabled={!chosen || at >= starts.length - 1}
          data-start-down
          onclick={() => shift(1)}
        >
          <ArrowDown size={14} />
        </IconButton>
      </div>
    </div>

    <div class="form">
      {#if chosen}
        {@const id = chosen.id}
        <TextField
          bind:value={name}
          bind:el={nameField}
          label={t('notebook-start-name')}
          spellcheck="false"
          autocomplete="off"
          data-start-name
          oninput={(e) => notebook.changeStart(id, { name: e.currentTarget.value })}
          onkeydown={(e) => {
            // Enter keeps what is typed, and is taken whole: it answers nothing else.
            if (e.key === 'Enter') e.preventDefault();
          }}
        />
        <label class="field">
          <span class="label">{t('notebook-start-lines')}</span>
          <textarea
            bind:value={lines}
            rows="7"
            data-start-lines
            oninput={(e) => notebook.changeStart(id, { text: e.currentTarget.value })}></textarea>
        </label>
        <label class="field">
          <span class="label">{t('notebook-start-kind')}</span>
          <select
            value={chosen.begins || 'text'}
            data-start-kind
            onchange={(e) => {
              const kind = e.currentTarget.value;
              notebook.checkpoint();
              notebook.changeStart(id, { begins: kind === 'text' ? '' : kind });
              notebook.checkpoint();
            }}
          >
            {#each kinds as k (k)}
              <option value={k}>{specOf(k)?.label() ?? k}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <Button variant="ghost" disabled={!chosen} data-start-delete onclick={() => void remove()}
      >{t('common-delete')}</Button
    >
    <span class="gap"></span>
    <Button variant="primary" onclick={onclose}>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .starts {
    display: grid;
    grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
    gap: 16px;
    min-height: 280px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .list {
    flex: 1;
    min-height: 0;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
  }
  .item {
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 8px;
    border-radius: var(--radius-s);
    color: var(--ink-2);
    cursor: pointer;
  }
  .item:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .item.chosen {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  /* Where a starting text dragged among the others will stand. */
  .item.above:global([data-drop-over]) {
    box-shadow: inset 0 2px 0 var(--accent);
  }
  .item.below:global([data-drop-over]) {
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .unnamed {
    font-style: italic;
    color: var(--ink-4);
  }
  .none {
    margin: 8px;
    font-size: var(--text-sm);
    color: var(--ink-4);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .label {
    display: block;
    margin-bottom: 6px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .field textarea,
  .field select {
    display: block;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-md);
  }
  .field textarea {
    padding: 8px 10px;
    line-height: 1.4;
    resize: vertical;
  }
  .field select {
    height: 30px;
    padding: 0 8px;
  }
  .field textarea:focus,
  .field select:focus {
    outline: none;
    border-color: var(--accent);
  }
  .gap {
    flex: 1;
  }
  @media (max-width: 560px) {
    .starts {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
