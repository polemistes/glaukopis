<script lang="ts">
  /**
   * The sample of the appearance: three levels of a text, a heading, a
   * subheading and one under it, with a line of text, set in the size and
   * the font chosen for the editor, with how deep each stands shown as the
   * editor shows it (`TextSection.svelte`): a number, dots, or set in.
   */
  import type { TextDepth } from '$lib/api/system';
  import { t } from '$lib/i18n';

  let { depth, size }: { depth: TextDepth; size: number } = $props();

  const levels = $derived([
    { level: 1, number: '1', name: t('settings-sample-heading') },
    { level: 2, number: '1.1', name: t('settings-sample-subheading') },
    { level: 3, number: '1.1.1', name: t('settings-sample-third') },
  ]);
</script>

<div class="structure depth-{depth}" style:font-size="{size}px" data-structure-sample={depth}>
  {#each levels as { level, number, name } (level)}
    <div class="lvl lvl-{level}" style:--level={level}>
      {#if depth === 'indent'}
        {#each Array.from({ length: level - 1 }, (_, i) => i + 1) as over (over)}
          <span class="guide" aria-hidden="true" style:--over={over}></span>
        {/each}
      {/if}
      <span class="mark" aria-hidden="true">
        {#if depth === 'numbers'}
          {number}
        {:else if depth === 'dots'}
          {#each Array.from({ length: level }, (_, i) => i) as i (i)}<i></i>{/each}
        {/if}
      </span>
      <div class="words">
        <div class="name">{name}</div>
        {#if level === 3}
          <p class="text">{t('settings-sample')}</p>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .structure {
    --step: 24px;
    --gutter: 52px;
    padding: 14px 18px 16px 0;
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    border: 1px solid var(--line);
    font-family: var(--font-editor, var(--font-text));
    line-height: 1.62;
    color: var(--ink);
  }
  .lvl {
    position: relative;
    display: grid;
    grid-template-columns: var(--gutter) minmax(0, 1fr);
    border: none;
  }
  .depth-indent .lvl {
    margin-left: calc((var(--level) - 1) * var(--step));
  }
  .mark {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    height: 1.6em;
    padding-right: 10px;
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .mark i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.7;
  }
  .lvl-1 .mark {
    height: 2.3em;
  }
  /* A faint line for each level over it, under the start of that level's name. */
  .guide {
    position: absolute;
    top: -0.6em;
    bottom: 0;
    width: 1px;
    left: calc(var(--gutter) - 12px + (var(--over) - var(--level)) * var(--step));
    background: var(--line);
  }
  .words {
    min-width: 0;
  }
  .name {
    font-weight: 600;
  }
  .lvl-1 .name {
    font-size: 1.42em;
    letter-spacing: -0.01em;
    line-height: 1.6;
  }
  .lvl-2 {
    margin-top: 0.6em;
  }
  .lvl-2 .name {
    font-size: 1.16em;
  }
  .lvl-3 {
    margin-top: 0.5em;
  }
  .lvl-3 .name {
    font-style: italic;
  }
  .text {
    margin: 0.2em 0 0;
  }
</style>
