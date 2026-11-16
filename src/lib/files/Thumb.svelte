<script lang="ts">
  /**
   * A picture of the store as it is shown in the views: on a quiet ground,
   * so that one that is transparent is seen, and as an empty frame while it
   * is read or when it is not on this computer.
   */
  import ImageOff from '@lucide/svelte/icons/image-off';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { t } from '$lib/i18n';

  interface Props {
    hash: string;
    extension: string;
    /** As it is shown in a list. */
    small?: boolean;
    /**
     * As wide as where it stands, and as high as it then is: where the
     * picture says how high its frame is, and not the frame how large the
     * picture.
     */
    whole?: boolean;
    alt?: string;
  }

  let { hash, extension, small = false, whole = false, alt = '' }: Props = $props();

  const shown = $derived(pictures.of(hash, extension, small));
</script>

<div class="thumb" class:small class:whole data-state={shown.url ? undefined : shown.state}>
  {#if shown.url}
    <img src={shown.url} {alt} draggable="false" />
  {:else if shown.state === 'absent'}
    <ImageOff size={small ? 16 : 22} strokeWidth={1.5} />
  {:else if shown.state === 'unread'}
    <span title={t('figures-picture-unread', { reason: shown.why })}>
      <ImageOff size={small ? 16 : 22} strokeWidth={1.5} />
    </span>
  {/if}
</div>

<style>
  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--radius-s);
    color: var(--ink-4);
    /* Squares of two quiet shades, as under a drawing that has no ground of its own. */
    background-color: var(--picture-ground);
    background-image: conic-gradient(
      var(--picture-ground-2) 25%,
      transparent 0 50%,
      var(--picture-ground-2) 0 75%,
      transparent 0
    );
    background-size: 16px 16px;
  }
  .thumb.small {
    background-size: 10px 10px;
  }
  .thumb[data-state] {
    background: var(--paper-sunken);
  }
  img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .thumb.whole {
    height: auto;
  }
  .thumb.whole img {
    width: 100%;
    height: auto;
    max-height: none;
  }
  /* While it is read, or where it is not here, a frame of the height a small picture has. */
  .thumb.whole[data-state] {
    height: 96px;
  }
</style>
