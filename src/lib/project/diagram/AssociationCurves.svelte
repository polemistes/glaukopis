<!--
  The curves of associations with their arrowheads, and the one being drawn,
  inside the `svg.lines` of a view that pans and zooms: the diagram, or the
  surface of the notebook. Drawn from `DrawnAssociation`s (`lines.ts`); it
  knows nothing of what holds the links. The picture of a diagram reads
  `svg.lines g.association path.curve` and `path.head` (`picture.ts`).
-->
<svelte:options namespace="svg" />

<script lang="ts">
  import type { DrawnAssociation } from './lines';

  interface Props {
    associations: DrawnAssociation[];
    /** The association selected, if one is. */
    selected: string | null;
    /** The path of an association being drawn, if one is. */
    pending?: string | null;
    /** A press on a curve: it is selected. */
    onselect: (id: string) => void;
    /** A double click on a curve: its words are to be written. */
    onwrite: (id: string) => void;
  }

  let { associations, selected, pending = null, onselect, onwrite }: Props = $props();
</script>

{#each associations as c (c.id)}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <g
    class="association"
    class:selected={selected === c.id}
    class:faint={c.faint}
    data-link={c.id}
    style:--link={c.colour}
    onpointerdown={(e) => {
      e.stopPropagation();
      onselect(c.id);
    }}
    ondblclick={(e) => {
      e.stopPropagation();
      onwrite(c.id);
    }}
  >
    <path d={c.path} class="link-hit" />
    <path d={c.path} class="curve" />
    {#each c.heads as head, i (i)}
      <path d={head} class="head" />
    {/each}
  </g>
{/each}
{#if pending}
  <path d={pending} class="curve pending" />
{/if}

<style>
  .association {
    pointer-events: stroke;
    cursor: pointer;
  }
  .curve {
    fill: none;
    stroke: var(--link, var(--gold));
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
    stroke-linecap: round;
  }
  .association.faint .curve,
  .association.faint .head {
    opacity: 0.45;
  }
  /* An arrowhead: a filled path of its own, so that the picture reads it as it reads the curve. */
  .head {
    fill: var(--link, var(--gold));
    stroke: none;
  }
  .association:hover .curve,
  .association.selected .curve {
    stroke-width: 2.4;
  }
  .association.selected .curve {
    stroke-dasharray: none;
  }
  .link-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 14;
  }
  .curve.pending {
    opacity: 0.8;
    pointer-events: none;
  }
</style>
