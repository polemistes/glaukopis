<script lang="ts">
  /**
   * The mark of the application: the owl as its author has drawn it. Its
   * lines have the colour of the text, in the light and in the dark. The
   * files are made of the drawing by `scripts/icons.sh`.
   */
  import large from './owl.png';
  import small from './owl-small.png';

  let { size = 24 }: { size?: number } = $props();

  // Made small, the lines are darker, or they would be too faint to see.
  const lines = $derived(size <= 48 ? small : large);
</script>

<span
  class="mark"
  aria-hidden="true"
  style:width="{size}px"
  style:height="{size}px"
  style:--lines="url({lines})"
></span>

<style>
  .mark {
    display: inline-block;
    flex: none;
    background-color: var(--ink);
    -webkit-mask: var(--lines) center / contain no-repeat;
    mask: var(--lines) center / contain no-repeat;
  }
</style>
