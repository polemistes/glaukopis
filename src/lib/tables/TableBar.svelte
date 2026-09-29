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
  import { t } from '$lib/i18n';
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
  aria-label={t('tables-table')}
  tabindex="-1"
  onmousedown={(e) => e.preventDefault()}
>
  <button
    type="button"
    class="word"
    data-tool="rows"
    use:tooltip={{ text: t('tables-row-hint'), side: 'top' }}
    onclick={(e) => menu(e, tools.rows())}
  >
    <Rows3 size={14} />
    {t('tables-row')}
    <ChevronDown size={12} />
  </button>
  <button
    type="button"
    class="word"
    data-tool="columns"
    use:tooltip={{ text: t('tables-column-hint'), side: 'top' }}
    onclick={(e) => menu(e, tools.columns())}
  >
    <Columns3 size={14} />
    {t('tables-column')}
    <ChevronDown size={12} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    data-tool="join"
    disabled={!now?.canJoin}
    aria-label={t('tables-join')}
    use:tooltip={{ text: t('tables-join-hint'), side: 'top' }}
    onclick={() => tools.join()}
  >
    <TableCellsMerge size={15} />
  </button>
  <button
    type="button"
    data-tool="split"
    disabled={!now?.canSplit}
    aria-label={t('tables-split')}
    use:tooltip={{ text: t('tables-split-hint'), side: 'top' }}
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
    use:tooltip={{ text: t('tables-headings-hint'), side: 'top' }}
    onclick={(e) => menu(e, tools.headings())}
  >
    {t('tables-headings')}
    <ChevronDown size={12} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    data-tool="left"
    class:on={now?.align === 'left'}
    disabled={!now?.cells}
    aria-label={t('tables-left')}
    use:tooltip={{ text: t('tables-left-hint'), side: 'top' }}
    onclick={() => tools.align('left')}
  >
    <TextAlignStart size={15} />
  </button>
  <button
    type="button"
    data-tool="center"
    class:on={now?.align === 'center'}
    disabled={!now?.cells}
    aria-label={t('tables-middle')}
    use:tooltip={{ text: t('tables-middle-hint'), side: 'top' }}
    onclick={() => tools.align('center')}
  >
    <TextAlignCenter size={15} />
  </button>
  <button
    type="button"
    data-tool="right"
    class:on={now?.align === 'right'}
    disabled={!now?.cells}
    aria-label={t('tables-right')}
    use:tooltip={{ text: t('tables-right-hint'), side: 'top' }}
    onclick={() => tools.align('right')}
  >
    <TextAlignEnd size={15} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class="word"
    data-tool="table"
    use:tooltip={{ text: t('tables-table-hint'), side: 'top' }}
    onclick={() => (tools.panelOpen ? tools.closePanel() : tools.openPanel())}
  >
    <Settings2 size={14} />
    {t('tables-table')}
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
