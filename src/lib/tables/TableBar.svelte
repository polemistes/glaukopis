<script lang="ts">
  /**
   * The tools of a table, in a small bar over the table the cursor is in:
   * its rows and columns, its cells, its headings, where what the cells
   * hold stands, and what is said of the table as a whole.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Columns3 from '@lucide/svelte/icons/columns-3';
  import Rows3 from '@lucide/svelte/icons/rows-3';
  import Settings2 from '@lucide/svelte/icons/settings-2';
  import TableCellsMerge from '@lucide/svelte/icons/table-cells-merge';
  import TableCellsSplit from '@lucide/svelte/icons/table-cells-split';
  import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
  import TextAlignEnd from '@lucide/svelte/icons/text-align-end';
  import TextAlignStart from '@lucide/svelte/icons/text-align-start';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { TableTools } from './views.svelte';

  let { tools }: { tools: TableTools } = $props();

  const now = $derived(tools.now);

  function menu(event: MouseEvent, items: MenuItem[]) {
    openMenu(event.currentTarget as HTMLElement, items, { side: 'bottom', align: 'start' });
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="bar"
  role="toolbar"
  aria-label="Table"
  tabindex="-1"
  onmousedown={(e) => e.preventDefault()}
>
  <button
    type="button"
    class="word"
    data-tool="rows"
    use:tooltip={{ text: 'A row above or below; remove the row', side: 'top' }}
    onclick={(e) => menu(e, tools.rows())}
  >
    <Rows3 size={14} />
    Row
    <ChevronDown size={12} />
  </button>
  <button
    type="button"
    class="word"
    data-tool="columns"
    use:tooltip={{ text: 'A column before or after; remove the column', side: 'top' }}
    onclick={(e) => menu(e, tools.columns())}
  >
    <Columns3 size={14} />
    Column
    <ChevronDown size={12} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    data-tool="join"
    disabled={!now?.canJoin}
    aria-label="Join the cells"
    use:tooltip={{ text: 'Join the cells that are selected', side: 'top' }}
    onclick={() => tools.join()}
  >
    <TableCellsMerge size={15} />
  </button>
  <button
    type="button"
    data-tool="split"
    disabled={!now?.canSplit}
    aria-label="Split the cell"
    use:tooltip={{ text: 'Split the cell into those it was joined of', side: 'top' }}
    onclick={() => tools.split()}
  >
    <TableCellsSplit size={15} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class="word"
    data-tool="headings"
    class:on={now?.headerRow || now?.headerColumn}
    use:tooltip={{ text: 'Whether the first row and the first column are headings', side: 'top' }}
    onclick={(e) => menu(e, tools.headings())}
  >
    Headings
    <ChevronDown size={12} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    data-tool="left"
    class:on={now?.align === 'left'}
    disabled={!now?.cells}
    aria-label="To the left"
    use:tooltip={{ text: 'What the cell holds stands to the left', side: 'top' }}
    onclick={() => tools.align('left')}
  >
    <TextAlignStart size={15} />
  </button>
  <button
    type="button"
    data-tool="center"
    class:on={now?.align === 'center'}
    disabled={!now?.cells}
    aria-label="In the middle"
    use:tooltip={{ text: 'What the cell holds stands in the middle', side: 'top' }}
    onclick={() => tools.align('center')}
  >
    <TextAlignCenter size={15} />
  </button>
  <button
    type="button"
    data-tool="right"
    class:on={now?.align === 'right'}
    disabled={!now?.cells}
    aria-label="To the right"
    use:tooltip={{ text: 'What the cell holds stands to the right', side: 'top' }}
    onclick={() => tools.align('right')}
  >
    <TextAlignEnd size={15} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class="word"
    data-tool="table"
    use:tooltip={{ text: 'Whether it is numbered, how wide it is; remove it', side: 'top' }}
    onclick={() => (tools.panelOpen ? tools.closePanel() : tools.openPanel())}
  >
    <Settings2 size={14} />
    Table
  </button>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 3px;
    background: var(--ink);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-2);
    font-family: var(--font-ui);
    animation: appear var(--fast) var(--ease);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 28px;
    height: 26px;
    padding: 0 6px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: color-mix(in srgb, var(--paper) 78%, transparent);
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--paper) 16%, transparent);
    color: var(--paper);
  }
  button.on {
    background: color-mix(in srgb, var(--paper) 24%, transparent);
    color: var(--paper);
  }
  button:disabled {
    opacity: 0.38;
    cursor: default;
  }
  .word {
    font-size: var(--text-sm);
    font-weight: 500;
    padding: 0 7px;
    white-space: nowrap;
  }
  .rule {
    width: 1px;
    height: 16px;
    margin: 0 3px;
    background: color-mix(in srgb, var(--paper) 25%, transparent);
  }
</style>
