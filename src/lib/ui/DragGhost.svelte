<script lang="ts">
  import { drag } from './drag.svelte';
</script>

{#if drag.payload && !drag.quiet}
  <div
    class="ghost"
    class:welcome={drag.welcome}
    style:transform="translate({drag.x + 14}px, {drag.y + 12}px)"
  >
    {#if drag.copy && drag.welcome}<span class="plus">+</span>{/if}
    {drag.payload.label}
  </div>
{/if}

<style>
  .ghost {
    position: fixed;
    z-index: 1100;
    left: 0;
    top: 0;
    max-width: 320px;
    padding: 4px 10px;
    border-radius: 20px;
    background: var(--ink-2);
    color: var(--paper);
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    box-shadow: var(--shadow-2);
    opacity: 0.92;
  }
  .ghost.welcome {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .plus {
    font-weight: 700;
    margin-right: 3px;
  }
</style>
