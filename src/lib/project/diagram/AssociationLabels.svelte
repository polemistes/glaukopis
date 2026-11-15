<!--
  The words of associations, each at the middle of its curve, and the field
  of the one whose words are being written: direct children of the `.world`
  of a view that pans and zooms, where the picture of a diagram reads
  `.world > .link-label` (`picture.ts`). Drawn from `DrawnAssociation`s
  (`lines.ts`); it knows nothing of what holds the links.
-->
<script lang="ts">
  import { t } from '$lib/i18n';
  import LinesField from '$lib/ui/LinesField.svelte';
  import type { DrawnAssociation } from './lines';

  interface Props {
    associations: DrawnAssociation[];
    /** The association selected, if one is. */
    selected: string | null;
    /** The association whose words are being written, if one is. */
    writing: string | null;
    /** A press on the words: the association is selected. */
    onselect: (id: string) => void;
    /** A double click on the words: they are to be written. */
    onwrite: (id: string) => void;
    /** The words written, to be kept. */
    ondone: (value: string) => void;
    /** The writing given up. */
    oncancel: () => void;
  }

  let { associations, selected, writing, onselect, onwrite, ondone, oncancel }: Props = $props();
</script>

{#each associations as c (c.id)}
  {#if writing === c.id}
    <div
      class="link-field"
      style:transform="translate(-50%, -50%) translate({c.middle.x}px, {c.middle.y}px)"
    >
      <LinesField
        value={c.label}
        placeholder={t('project-link-placeholder')}
        label={t('project-link-label')}
        {ondone}
        {oncancel}
      />
    </div>
  {:else if c.label}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="link-label"
      class:selected={selected === c.id}
      data-link={c.id}
      style:--link={c.colour}
      style:transform="translate(-50%, -50%) translate({c.middle.x}px, {c.middle.y}px)"
      onpointerdown={(e) => {
        e.stopPropagation();
        onselect(c.id);
      }}
      ondblclick={(e) => {
        e.stopPropagation();
        onwrite(c.id);
      }}>{c.label}</span
    >
  {/if}
{/each}

<style>
  .link-label {
    position: absolute;
    left: 0;
    top: 0;
    padding: 1px 7px;
    border-radius: 9px;
    background: var(--canvas);
    color: var(--link, var(--gold));
    font-size: 12px;
    font-style: italic;
    font-family: var(--font-text);
    line-height: 1.35;
    /* Its lines as they were written, centred, a line longer than the width broken. */
    width: max-content;
    max-width: 240px;
    white-space: pre-line;
    overflow-wrap: anywhere;
    text-align: center;
    cursor: pointer;
  }
  .link-label.selected {
    box-shadow: 0 0 0 1px var(--link, var(--gold));
  }
  .link-field {
    position: absolute;
    left: 0;
    top: 0;
    font-size: 12px;
    font-family: var(--font-text);
  }
  .link-field :global(.lines-field) {
    width: 220px;
    padding: 2px 8px;
    border: 1px solid var(--gold);
    border-radius: 9px;
    background: var(--paper-raised);
    color: var(--ink);
    outline: none;
    text-align: center;
  }
</style>
