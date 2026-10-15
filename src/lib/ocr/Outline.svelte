<script lang="ts">
  /**
   * The outline a PDF read by its headings will make (ADR 0047): its title,
   * and its headings set in by their levels, as they will nest in the map,
   * shown before it is made, so that the structure is seen first.
   */
  import type { Imported } from '$lib/api/imported';
  import { t } from '$lib/i18n';
  import { inlineText } from '$lib/project/model/text';
  import Button from '$lib/ui/Button.svelte';

  let { imported, title }: { imported: Imported; title: string } = $props();

  /** The rows shown before the outline is unfolded. */
  const FOLDED = 40;
  let whole = $state(false);

  const headings = $derived(
    imported.sections
      .filter((s) => s.level > 0)
      .map((s) => ({ level: s.level, name: inlineText(s.heading).replace(/\s+/g, ' ').trim() })),
  );
  const shown = $derived(whole ? headings : headings.slice(0, FOLDED));
</script>

<section class="outline" data-outline>
  <div class="overline">{t('ocr-outline-title')}</div>
  <ol>
    <li class="title" data-outline-level="0">{title || t('documents-untitled')}</li>
    {#each shown as h, i (i)}
      <li style:--level={h.level} data-outline-level={h.level}>{h.name}</li>
    {/each}
  </ol>
  {#if !whole && headings.length > FOLDED}
    <Button size="sm" variant="ghost" onclick={() => (whole = true)} data-outline-all>
      {t('ocr-outline-all', { count: headings.length })}
    </Button>
  {/if}
</section>

<style>
  .outline {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .overline {
    color: var(--ink-3);
  }
  ol {
    max-height: 260px;
    overflow-y: auto;
    margin: 0;
    padding: 8px 12px;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
  }
  li {
    padding: 2px 0 2px calc(var(--level, 0) * 14px);
    font-family: var(--font-text);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  li.title {
    font-weight: 600;
  }
</style>
