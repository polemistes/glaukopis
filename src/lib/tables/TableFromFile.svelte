<script lang="ts">
  /**
   * What was read from a file, before it becomes a table in the text: which
   * sheet, where there are several; its first rows as they will be; which of
   * them are headings; and what is said of the table.
   */
  import { untrack } from 'svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import type { Sheet } from '$lib/api/tables';
  import { numberColumns, type TableOf } from './commands';

  interface Props {
    /** What the file is called, with its ending. */
    file: string;
    sheets: Sheet[];
    onpick: (table: TableOf) => void;
    onclose: () => void;
  }

  let { file, sheets, onpick, onclose }: Props = $props();

  /** How many rows are shown of what was read. */
  const SHOWN = 8;

  // The first sheet that can become a table.
  let chosen = $state(
    untrack(() =>
      String(
        Math.max(
          0,
          sheets.findIndex((s) => !s.problem),
        ),
      ),
    ),
  );
  let headerRow = $state(true);
  let headerColumn = $state(false);
  let said = $state(untrack(() => file.replace(/\.[^./\\]+$/, '')));

  const sheet = $derived(sheets[Number(chosen)] ?? sheets[0]);
  const rows = $derived(sheet?.rows ?? []);
  const columns = $derived(rows[0]?.length ?? 0);
  const table = $derived<TableOf>({ rows, headerRow, headerColumn, caption: said });
  const numbers = $derived(numberColumns(table));

  function put() {
    if (!rows.length || sheet?.problem) return;
    onpick(table);
  }
</script>

<Dialog open title="A table from a file" subtitle={file} width={680} {onclose}>
  <div class="from-file">
    {#if sheets.length > 1}
      <div class="sheet">
        <Select
          bind:value={chosen}
          label="Sheet"
          options={sheets.map((s, i) => ({ value: String(i), label: s.name || `Sheet ${i + 1}` }))}
        />
      </div>
    {/if}

    {#if sheet?.problem}
      <p class="problem selectable" role="alert">{sheet.problem}</p>
    {:else}
      <div class="shown prose static" aria-label="The first rows, as they will be">
        <figure class="tabular">
          <table>
            <tbody>
              {#each rows.slice(0, SHOWN) as row, r (r)}
                <tr>
                  {#each row as value, c (c)}
                    {#if (headerRow && r === 0) || (headerColumn && c === 0)}
                      <th style:text-align={numbers[c] ? 'right' : null}>{value}</th>
                    {:else}
                      <td style:text-align={numbers[c] ? 'right' : null}>{value}</td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </figure>
      </div>
      <p class="count">
        {rows.length}
        {rows.length === 1 ? 'row' : 'rows'}, {columns}
        {columns === 1 ? 'column' : 'columns'}{#if rows.length > SHOWN}. The first {SHOWN} are shown.{/if}
      </p>

      <div class="said">
        <label for="table-said">What is said of the table</label>
        <input
          id="table-said"
          type="text"
          bind:value={said}
          placeholder="Its caption, which can be changed in the text"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              put();
            }
          }}
        />
      </div>

      <label class="check">
        <input type="checkbox" bind:checked={headerRow} />
        The first row holds the headings
      </label>
      <label class="check">
        <input type="checkbox" bind:checked={headerColumn} />
        The first column holds the headings
      </label>
      {#if numbers.some(Boolean)}
        <p class="hint">Columns that hold numbers are set to the right.</p>
      {/if}
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button variant="primary" disabled={!rows.length || !!sheet?.problem} onclick={put}>
      Put it into the text
    </Button>
  {/snippet}
</Dialog>

<style>
  .from-file {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: var(--text-md);
    color: var(--ink-2);
  }
  .sheet {
    max-width: 320px;
    margin-bottom: 4px;
  }
  .shown {
    max-height: 300px;
    overflow: auto;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
    font-size: 14px;
    cursor: default;
  }
  .shown :global(figure.tabular) {
    margin: 0.5em 0;
  }
  .shown th,
  .shown td {
    white-space: pre-line;
  }
  .count {
    color: var(--ink-3);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  .said {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0;
  }
  .said label {
    font-size: var(--text-sm);
    font-weight: 500;
  }
  input[type='text'] {
    height: var(--control-h);
    padding: 0 9px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
  }
  input[type='text']:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
  }
  .hint {
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
  .problem {
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
</style>
