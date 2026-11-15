<script lang="ts">
  /**
   * The surface of a box (record 0103): its notes as cards where they were
   * put, on a ground that is panned and zoomed as the map of a project is.
   * Not built yet: what the page gives it and asks of it is.
   */
  import type { Camera } from '$lib/ui/camera';
  import type { Notebook } from '../model/notebook.svelte';

  interface Props {
    notebook: Notebook;
    /** The box whose surface this is. */
    box: string;
    /** The notes selected, by id: the page's and the surface's alike. */
    selection: string[];
    /** Where the surface was looked at when it was left; none: it shows all. */
    camera?: Camera | null;
    oncamera?: (camera: Camera) => void;
    /** A note is to be opened beside the surface, to be written. */
    onopen: (id: string) => void;
    /** The notes are to be deleted: the page deletes, and says so with Undo. */
    ondelete: (ids: string[]) => void;
    /** The menu of the right button on notes: the page builds it. */
    oncontext: (event: MouseEvent, ids: string[]) => void;
  }

  let {
    notebook,
    box,
    selection = $bindable(),
    camera = null,
    oncamera,
    onopen,
    ondelete,
    oncontext,
  }: Props = $props();

  // Held until the surface is built, so that what the page passes is checked.
  const given = $derived([notebook, box, selection, camera, oncamera, onopen, ondelete, oncontext]);
</script>

<div class="surface" data-surface data-box={box} data-given={given.length}></div>

<style>
  .surface {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
</style>
