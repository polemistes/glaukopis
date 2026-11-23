<script lang="ts">
  /**
   * What the notes on the phone are narrowed to, in a sheet from the bottom:
   * all notes or one box, the one in view marked; and the tags, each with
   * how many notes have it, pressed on and off. Kept on the device as the
   * computer's page keeps them (`page-view.svelte.ts`). Of the computer's
   * other filters none is here.
   */
  import Box from '@lucide/svelte/icons/box';
  import Check from '@lucide/svelte/icons/check';
  import Inbox from '@lucide/svelte/icons/inbox';
  import Layers from '@lucide/svelte/icons/layers';
  import Tag from '@lucide/svelte/icons/tag';
  import { languages, t } from '$lib/i18n';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';
  import { boxInView, boxName, tagsInView, toggledTag } from '$lib/notebook/page.svelte';
  import { pageView } from '$lib/notebook/page-view.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Sheet from './Sheet.svelte';

  let { notebook, open, onclose }: { notebook: Notebook; open: boolean; onclose: () => void } =
    $props();

  const inView = $derived(boxInView(pageView.box, notebook.boxes));
  const tagsOn = $derived(tagsInView(pageView.tags, notebook.tags));
  const number = (n: number) => n.toLocaleString(languages.current);
</script>

<Sheet {open} title={t('notebook-filters')} {onclose}>
  <div class="filters" data-phone-filters>
    <h3 class="overline">{t('notebook-boxes')}</h3>
    <button
      type="button"
      class="item"
      class:on={inView === null}
      aria-pressed={inView === null}
      data-phone-filter-box="all"
      onclick={() => pageView.setBox(null)}
    >
      <Layers size={18} strokeWidth={1.6} />
      <span class="name">{t('notebook-all-notes')}</span>
      {#if inView === null}<Check size={18} />{/if}
    </button>
    {#each notebook.boxes as b (b.id)}
      {@const Icon = b.id === notebook.receiving ? Inbox : Box}
      <button
        type="button"
        class="item"
        class:on={inView === b.id}
        aria-pressed={inView === b.id}
        data-phone-filter-box={b.id}
        onclick={() => pageView.setBox(b.id)}
      >
        <Icon size={18} strokeWidth={1.6} />
        <span class="name">{boxName(b)}</span>
        {#if inView === b.id}<Check size={18} />{/if}
      </button>
    {/each}

    {#if notebook.tags.length}
      <h3 class="overline">{t('notebook-tags')}</h3>
      {#each notebook.tags as { tag, count } (tag)}
        <button
          type="button"
          class="item"
          class:on={tagsOn.includes(tag)}
          aria-pressed={tagsOn.includes(tag)}
          data-phone-filter-tag={tag}
          onclick={() => pageView.setTags(toggledTag(tagsOn, tag))}
        >
          <Tag size={17} strokeWidth={1.6} />
          <span class="name">{tag}</span>
          <span class="count">{number(count)}</span>
          {#if tagsOn.includes(tag)}<Check size={18} />{/if}
        </button>
      {/each}
    {/if}

    <div class="foot">
      <Button variant="primary" data-phone-filter-done onclick={() => onclose()}
        >{t('common-done')}</Button
      >
    </div>
  </div>
</Sheet>

<style>
  .filters {
    display: flex;
    flex-direction: column;
  }
  h3 {
    padding: var(--space-3) var(--phone-gutter, 16px) var(--space-1);
  }
  .item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    min-height: 48px;
    padding: var(--space-2) var(--phone-gutter, 16px);
    border: none;
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:active {
    background: var(--paper-hover);
  }
  .item.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 600;
  }
  .item > :global(svg) {
    flex: none;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .count {
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-3) var(--phone-gutter, 16px) 0;
  }
</style>
