<script lang="ts">
  /**
   * Where a table is asked for by its size: a grid to point at, or two
   * numbers, and whether its first row is headings.
   */
  import type { RectLike } from '$lib/ui/floating';
  import Popover from '$lib/ui/Popover.svelte';
  import { MOST_COLUMNS, MOST_ROWS } from './commands';

  interface Props {
    anchor: RectLike;
    onpick: (rows: number, columns: number, headings: boolean) => void;
    onclose: () => void;
  }

  let { anchor, onpick, onclose }: Props = $props();

  /** How many rows and columns the grid offers. */
  const GRID_ROWS = 8;
  const GRID_COLUMNS = 8;

  let rows = $state(3);
  let columns = $state(3);
  let headings = $state(true);
  let first = $state<HTMLInputElement>();

  $effect(() => {
    first?.focus();
    first?.select();
  });

  const within = (n: unknown, most: number) =>
    Math.max(1, Math.min(most, Math.round(Number(n)) || 1));

  function put() {
    onpick(within(rows, MOST_ROWS), within(columns, MOST_COLUMNS), headings);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    put();
  }
</script>

<Popover
  open
  {anchor}
  side="bottom"
  align="start"
  gap={8}
  width={264}
  label="A table of what size"
  {onclose}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="size" {onkeydown}>
    <div class="head">A table</div>
    <div
      class="grid"
      role="group"
      aria-label="Point at the size of the table"
      style:grid-template-columns="repeat({GRID_COLUMNS}, 1fr)"
    >
      {#each { length: GRID_ROWS } as _, r (r)}
        {#each { length: GRID_COLUMNS } as _, c (c)}
          <button
            type="button"
            tabindex="-1"
            class:on={r < rows && c < columns}
            class:heading={headings && r === 0 && c < columns}
            data-size="{r + 1}x{c + 1}"
            aria-label="{r + 1} by {c + 1}"
            onpointerenter={() => {
              rows = r + 1;
              columns = c + 1;
            }}
            onclick={() => {
              rows = r + 1;
              columns = c + 1;
              put();
            }}
          ></button>
        {/each}
      {/each}
    </div>

    <div class="numbers">
      <label>
        Rows
        <input
          bind:this={first}
          type="number"
          min="1"
          max={MOST_ROWS}
          bind:value={rows}
          aria-label="Rows"
        />
      </label>
      <label>
        Columns
        <input type="number" min="1" max={MOST_COLUMNS} bind:value={columns} aria-label="Columns" />
      </label>
    </div>

    <label class="check">
      <input type="checkbox" bind:checked={headings} />
      The first row is headings
    </label>

    <div class="actions">
      <span class="hint">{within(rows, MOST_ROWS)} by {within(columns, MOST_COLUMNS)}</span>
      <button type="button" class="put" onclick={put}>Put it in</button>
    </div>
  </div>
</Popover>

<style>
  .size {
    padding: 12px 14px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .head {
    margin-bottom: 8px;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-strong);
  }
  .grid {
    display: grid;
    gap: 3px;
  }
  .grid button {
    aspect-ratio: 1.5;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: 2px;
    background: var(--paper);
    cursor: pointer;
  }
  .grid button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .grid button.on.heading {
    background: color-mix(in srgb, var(--accent) 45%, var(--accent-soft));
  }
  .numbers {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }
  .numbers label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-3);
  }
  input[type='number'] {
    width: 58px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
  input[type='number']:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .hint {
    flex: 1;
    color: var(--ink-4);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .put {
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--accent-ink);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .put:hover {
    background: var(--accent-strong);
  }
</style>
