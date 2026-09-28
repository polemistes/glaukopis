<script lang="ts">
  /** What can be said of a table as a whole: whether it is numbered, how wide it is. */
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { untrack } from 'svelte';
  import type { TableTools } from './views.svelte';

  interface Props {
    tools: TableTools;
    /** While the width is being set: shown, and not yet kept. */
    ontry: (width: number) => void;
    onchange: (change: { width?: number; numbered?: boolean }) => void;
    onremove: () => void;
    onclose: () => void;
  }

  let { tools, ontry, onchange, onremove, onclose }: Props = $props();

  const now = $derived(tools.now);

  /** Nought for as wide as it needs to be. */
  let wide = $state(untrack(() => tools.now?.width ?? 0));
  let counted = $state(untrack(() => tools.now?.numbered ?? true));
  /** What the bar stands at while the table is as wide as it needs to be. */
  let share = $state(untrack(() => tools.now?.width || 100));

  // What another changes meanwhile is shown here as well.
  $effect(() => {
    wide = now?.width ?? 0;
    if (now?.width) share = now.width;
  });
  $effect(() => {
    counted = now?.numbered ?? true;
  });

  const WIDTHS = [
    { value: 0, label: 'As it needs' },
    { value: 50, label: 'Half' },
    { value: 75, label: 'Three quarters' },
    { value: 100, label: 'Whole' },
  ];

  function set(width: number) {
    wide = width;
    if (width) share = width;
    onchange({ width });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
      onclose();
    } else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="table-settings" {onkeydown}>
  <div class="head">
    <div class="note-number">Table</div>
    <span class="size">
      {now?.rows ?? 0}
      {now?.rows === 1 ? 'row' : 'rows'}, {now?.columns ?? 0}
      {now?.columns === 1 ? 'column' : 'columns'}
    </span>
  </div>

  <div class="row">
    <label for="table-width">Width</label>
    <input
      id="table-width"
      type="range"
      min="10"
      max="100"
      step="5"
      bind:value={share}
      oninput={() => {
        wide = share;
        ontry(share);
      }}
      onchange={() => set(share)}
    />
    <span class="amount">{wide ? `${wide}%` : '—'}</span>
  </div>
  <div class="row widths">
    <span></span>
    <div class="choices">
      {#each WIDTHS as w (w.value)}
        <button type="button" class:on={wide === w.value} onclick={() => set(w.value)}>
          {w.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="hint indent">
    {#if wide}
      Of the width of the text, in the document.
    {:else}
      As wide as what it holds needs it to be.
    {/if}
  </div>

  <div class="row">
    <span></span>
    <label class="check">
      <input
        type="checkbox"
        bind:checked={counted}
        onchange={() => onchange({ numbered: counted })}
      />
      Numbered, as “Table 1”
    </label>
  </div>

  <!--
    WHERE THE TABLE STANDS, AND WHETHER THE TEXT FLOWS AROUND IT.
    The controls for `align` and `flow` of the table go here, as rows like
    those above: `onchange({ align })`, `onchange({ flow })`. What is set is
    kept by `setTable` (commands.ts) and shown by `TabularView`, which puts
    `data-align` and `data-flow` on the figure.
  -->
  <div class="standing" data-place="align-and-flow"></div>

  <div class="actions">
    <button type="button" onclick={onclose}>Done</button>
    <span class="spring"></span>
    <button type="button" class="danger" onclick={onremove}>
      <Trash2 size={14} />
      Remove the table
    </button>
  </div>
</div>

<style>
  .table-settings {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
  }
  .head .note-number {
    margin-bottom: 0;
  }
  .size {
    flex: 1;
    min-width: 0;
    color: var(--ink-4);
    font-size: var(--text-xs);
    text-align: right;
  }
  .row {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .row > label:first-child {
    color: var(--ink-3);
  }
  .amount {
    width: 40px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  .widths {
    margin-top: 2px;
  }
  .choices {
    grid-column: 2 / 4;
    display: flex;
    gap: 2px;
  }
  .choices button {
    height: 22px;
    padding: 0 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .choices button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .choices button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-4);
    font-size: var(--text-xs);
  }
  .indent {
    margin-left: 64px;
  }
  .check input {
    accent-color: var(--accent);
  }
  .check {
    grid-column: 2 / 4;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .standing:empty {
    display: none;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .actions button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .actions button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .actions button.danger:hover {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .spring {
    flex: 1;
  }
</style>
