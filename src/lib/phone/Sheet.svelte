<script lang="ts">
  /**
   * A sheet from the bottom of the screen, over the place. A stand-in of the
   * meeting points; part C fills it in.
   */
  import type { Snippet } from 'svelte';

  let {
    open,
    title,
    onclose,
    children,
  }: { open: boolean; title?: string; onclose: () => void; children: Snippet } = $props();
</script>

{#if open}
  <section data-phone-sheet>
    {#if title}<h2>{title}</h2>{/if}
    <button type="button" onclick={() => onclose()}>×</button>
    {@render children()}
  </section>
{/if}
