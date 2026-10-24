<script lang="ts">
  import MenuList from './MenuList.svelte';
  import { menuState } from './menu.svelte';
  import { onTop } from './top';

  /** Whether a point lies on what the menu was opened from: a press there only closes it. */
  const onAnchor = (x: number, y: number) => {
    const a = menuState.current?.anchor;
    return !!a && x >= a.left && x <= a.right && y >= a.top && y <= a.bottom;
  };

  /**
   * Escape closes an open menu whoever has the focus (ADR 0065): the menu's
   * own keys handle it while the menu has the focus, as in a submenu, and
   * where something else took the focus, the window does, before what has
   * the focus acts on the key too.
   */
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !menuState.current) return;
    if (event.target instanceof Element && event.target.closest('.menu')) return;
    event.preventDefault();
    event.stopPropagation();
    menuState.close();
  }
</script>

<svelte:window onkeydowncapture={onkeydown} />

{#if menuState.current}
  {@const menu = menuState.current}
  <!-- What is within is moved to where it lies over everything; this stays. -->
  <div class="holder">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="backdrop"
      use:onTop
      onpointerdown={(e) => {
        // A press elsewhere closes the menu and goes on to what lies under it,
        // as a click into the text puts the cursor there; one on what opened
        // the menu only closes it.
        if (onAnchor(e.clientX, e.clientY)) e.preventDefault();
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
