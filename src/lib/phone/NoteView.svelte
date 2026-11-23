<script lang="ts">
  /**
   * A note, on the phone. A stand-in of the meeting points; part D fills it in.
   */
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';

  let {
    notebook,
    id,
    fresh = false,
  }: { notebook: Notebook; id: string; fresh?: boolean } = $props();
</script>

<section data-phone-note={id} data-fresh={fresh} data-notes={notebook ? '' : undefined}></section>
