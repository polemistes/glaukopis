<script lang="ts">
  /** What can be said of a figure besides its caption: how wide it is, whether it is numbered, what it shows. */
  import ImageUp from '@lucide/svelte/icons/image-up';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { untrack } from 'svelte';

  interface Props {
    name: string;
    alt: string;
    width: number;
    numbered: boolean;
    /** While the width is being set: shown, and not yet kept. */
    ontry: (width: number) => void;
    onchange: (change: { alt?: string; width?: number; numbered?: boolean }) => void;
    onreplace: () => void;
    onremove: () => void;
    onclose: () => void;
  }

  let { name, alt, width, numbered, ontry, onchange, onreplace, onremove, onclose }: Props =
    $props();

  let wide = $state(untrack(() => width));
  let described = $state(untrack(() => alt));
  let counted = $state(untrack(() => numbered));

  // What another changes meanwhile is shown here as well.
  $effect(() => {
    wide = width;
  });
  $effect(() => {
    counted = numbered;
  });

  const WIDTHS = [
    { value: 33, label: 'A third' },
    { value: 50, label: 'Half' },
    { value: 75, label: 'Three quarters' },
    { value: 100, label: 'Whole' },
  ];

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
      if (described !== alt) onchange({ alt: described.trim() });
      onclose();
    } else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="figure-settings" {onkeydown}>
  <div class="head">
    <div class="note-number">Figure</div>
    <span class="name truncate" title={name}>{name}</span>
  </div>

  <div class="row">
    <label for="figure-width">Width</label>
    <input
      id="figure-width"
      type="range"
      min="10"
      max="100"
      step="5"
      bind:value={wide}
      oninput={() => ontry(wide)}
      onchange={() => onchange({ width: wide })}
    />
    <span class="amount">{wide}%</span>
  </div>
  <div class="row widths">
    <span></span>
    <div class="choices">
      {#each WIDTHS as w (w.value)}
        <button
          type="button"
          class:on={wide === w.value}
          onclick={() => {
            wide = w.value;
            onchange({ width: w.value });
          }}
        >
          {w.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="hint indent">Of the width of the text, in the document.</div>

  <div class="row">
    <label for="figure-alt">Shows</label>
    <input
      id="figure-alt"
      type="text"
      bind:value={described}
      placeholder="In words, for those who cannot see it"
      onblur={() => described !== alt && onchange({ alt: described.trim() })}
    />
  </div>

  <div class="row">
    <span></span>
    <label class="check">
      <input
        type="checkbox"
        bind:checked={counted}
        onchange={() => onchange({ numbered: counted })}
      />
      Numbered, as “Figure 1”
    </label>
  </div>

  <div class="actions">
    <button type="button" onclick={onreplace}>
      <ImageUp size={14} />
      Another picture…
    </button>
    <span class="spring"></span>
    <button type="button" class="danger" onclick={onremove}>
      <Trash2 size={14} />
      Remove the figure
    </button>
  </div>
</div>

<style>
  .figure-settings {
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
  .name {
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
  input[type='text'] {
    grid-column: 2 / 4;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  input[type='text']:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
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
