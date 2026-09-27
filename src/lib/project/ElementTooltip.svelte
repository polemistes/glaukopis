<script lang="ts">
  import * as Y from 'yjs';
  import { place, type RectLike } from '$lib/ui/floating';
  import { blocksHtml, excerpt } from './model/html';
  import type { Project } from './model/project.svelte';
  import { readBody } from './model/text';

  interface Props {
    project: Project;
    id: string;
    anchor: RectLike;
  }

  let { project, id, anchor }: Props = $props();

  let el = $state<HTMLDivElement>();

  const node = $derived(project.node(id));
  const content = $derived.by(() => {
    // Depends on the element's record, which changes when its text does.
    void node?.words;
    const f = project.fragment(id, 'body');
    if (!(f instanceof Y.XmlFragment)) return { html: '', cut: false };
    const { blocks, cut } = excerpt(readBody(f), 520);
    return { html: blocksHtml(blocks), cut };
  });
  const included = $derived(node?.include ? project.map(node.include) : undefined);
  const worth = $derived(!!node && (!node.empty || !!included || !node.heading || node.excluded));

  $effect(() => {
    if (el && worth) place(el, anchor, { side: 'bottom', align: 'center', gap: 10 });
  });
</script>

{#if node && worth}
  <div bind:this={el} class="tip" role="tooltip">
    {#if content.html}
      <!-- Made by blocksHtml, which escapes all text. -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="prose">{@html content.html}</div>
      {#if content.cut}<div class="more">Double-click to read on</div>{/if}
    {/if}
    {#if included || !node.heading || node.excluded}
      <div class="facts" class:alone={!content.html}>
        {#if included}<div>Stands for the map “{included.name}”</div>{/if}
        {#if !node.heading}<div>The name is not printed</div>{/if}
        {#if node.excluded}<div>Left out of the document</div>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tip {
    position: fixed;
    z-index: 550;
    left: 0;
    top: 0;
    width: max-content;
    max-width: 400px;
    padding: 12px 16px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-3);
    pointer-events: none;
    animation: appear var(--fast) var(--ease);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }
  .prose {
    font-size: 14px;
    line-height: 1.55;
    white-space: normal;
  }
  .more {
    margin-top: 6px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .facts {
    margin-top: 8px;
    padding-top: 7px;
    border-top: 1px solid var(--line);
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.5;
  }
  .facts.alone {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
</style>
