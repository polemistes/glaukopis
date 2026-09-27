<script lang="ts">
  import MenuList from './MenuList.svelte';
  import { menuState } from './menu.svelte';
  import { onTop } from './top';

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
  <!-- What is within is moved to where it lies over everything; this stays. -->
  <div class="holder">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="backdrop"
      use:onTop
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
  </div>
{/if}

<style>
  .holder {
    display: contents;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 899;
    width: 100vw;
    height: 100vh;
    padding: 0;
    border: none;
    background: transparent;
  }
</style>
