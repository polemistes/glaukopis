<script lang="ts">
  /**
   * The head of a box of rich text (ADR 0112): its name, and the menu of
   * the box. It stands at the top of the box and stays in view while the
   * box is scrolled through. The tools that set the look by hand come to
   * stand in it.
   */
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import { t } from '$lib/i18n';
  import { tooltip } from '$lib/ui/tooltip';

  let { menu, editable }: { menu: (anchor: HTMLElement) => void; editable: boolean } = $props();
</script>

<!-- A press in the head leaves the cursor where it is in the text. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="head" data-rich-head onmousedown={(e) => e.preventDefault()}>
  <span class="name">{t('byhand-name')}</span>
  {#if editable}
    <button
      type="button"
      class="more"
      data-rich-menu
      aria-label={t('byhand-menu')}
      aria-haspopup="menu"
      use:tooltip={t('byhand-menu')}
      onclick={(e) => menu(e.currentTarget)}
    >
      <Ellipsis size={15} />
    </button>
  {/if}
</div>

<style>
  /* The measures and the letters of the head are the sheet's (app.css), which draws the same head where a text is only shown. */
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 26px;
  }
  .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .more:hover,
  .more:focus-visible {
    background: var(--paper-hover);
    color: var(--ink);
  }
</style>
