<script lang="ts">
  import ElementPicker from './ElementPicker.svelte';
  import { picker } from './picker.svelte';

  const picking = $derived(picker.current);
</script>

<!-- Each question is a new dialog: what was written and unfolded for the last is forgotten. -->
{#if picking}
  {#key picking}
    <ElementPicker {picking} />
  {/key}
{/if}
