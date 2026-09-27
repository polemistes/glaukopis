<script lang="ts">
  import MenuList from './MenuList.svelte';
  import { menuState } from './menu.svelte';

  let restore: HTMLElement | null = null;

  $effect(() => {
    if (menuState.current) {
      restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else if (restore) {
      if (restore.isConnected) restore.focus({ preventScroll: true });
      restore = null;
    }
  });
</script>

{#if menuState.current}
  {@const menu = menuState.current}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="backdrop"
    onpointerdown={(e) => {
      e.preventDefault();
      menuState.close();
    }}
    oncontextmenu={(e) => {
      e.preventDefault();
      menuState.close();
    }}
  ></div>
  {#key menu}
    <MenuList
      items={menu.items}
      anchor={menu.anchor}
      side={menu.side}
      align={menu.align}
      minWidth={menu.minWidth}
      onchoose={() => menuState.close()}
    />
  {/key}
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 899;
  }
</style>
