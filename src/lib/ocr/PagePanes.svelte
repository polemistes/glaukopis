<script lang="ts">
  /**
   * The page in view in the workbench of a reading, in three panes side by
   * side: the picture of the page, the text the PDF has for it, and what
   * Tesseract read of it. Where the PDF has no text at all, as a scan, or
   * where a picture is read, two: the picture and what Tesseract read. The
   * panes fill the height they are given, each scrolling on its own.
   *
   * The panes are given what they show; nothing here asks the backend. The
   * props of each pane are passed as they are, one object a pane.
   */
  import type { ComponentProps } from 'svelte';
  import PdfTextPane from './PdfTextPane.svelte';
  import PicturePane from './PicturePane.svelte';
  import TesseractPane from './TesseractPane.svelte';

  interface Props {
    /** Whether the file has text of its own, on any page: the pane of the PDF's text is shown. */
    hasPdfText: boolean;
    picture: ComponentProps<typeof PicturePane>;
    /** The pane of the PDF's text; not needed where the file has none. */
    pdf?: ComponentProps<typeof PdfTextPane> | null;
    tesseract: ComponentProps<typeof TesseractPane>;
  }

  let { hasPdfText, picture, pdf = null, tesseract }: Props = $props();

  const three = $derived(hasPdfText && !!pdf);
</script>

<div class="panes" class:three data-page-panes={three ? 3 : 2}>
  <PicturePane {...picture} />
  {#if three && pdf}
    <PdfTextPane {...pdf} />
  {/if}
  <TesseractPane {...tesseract} />
</div>

<style>
  .panes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    gap: var(--space-3);
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
  .panes.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
</style>
