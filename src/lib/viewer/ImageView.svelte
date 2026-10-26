<script lang="ts">
  /**
   * An image of the library's files, or of the store of images, in a side
   * (ADR 0069): as one page, fitted to the side or at a factor of its size,
   * zoomed with the typesetting pane's keys and Ctrl and the wheel.
   */
  import { onMount } from 'svelte';
  import { pictureRead } from '$lib/api/pictures';
  import { fileRead } from '$lib/api/system';
  import { t } from '$lib/i18n';
  import { clampZoom, stepped } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { AROUND } from './pages';
  import type { ImageSource } from './viewers.svelte';

  interface Props {
    /** Where the image is read from: the path of a file of the library, or a picture of the store. */
    source: ImageSource;
    /** Its size, in its pixels. */
    size: [number, number];
    name: string;
    zoom: number | null;
    onzoom: (zoom: number | null) => void;
  }

  let { source, size, name, zoom, onzoom }: Props = $props();

  let url = $state<string | null>(null);
  let failed = $state<string | null>(null);
  let scroller = $state<HTMLDivElement>();
  let roomWidth = $state(0);
  let pointerIn = $state(false);

  $effect(() => {
    const from = source;
    let made: string | null = null;
    let gone = false;
    const bytes =
      'path' in from
        ? fileRead(from.path).then((b) => b.buffer as ArrayBuffer)
        : pictureRead(from.hash, from.extension);
    bytes
      .then((b) => {
        if (gone) return;
        made = URL.createObjectURL(new Blob([b]));
        url = made;
      })
      .catch((e) => (failed = (e as { message?: string })?.message ?? String(e)));
    return () => {
      gone = true;
      if (made) URL.revokeObjectURL(made);
    };
  });

  const [w, h] = $derived(size);
  const factor = $derived(
    zoom ?? Math.min(1, Math.max(0.05, (roomWidth - 2 * AROUND.side) / Math.max(w, 1))),
  );

  function zoomBy(steps: number) {
    onzoom(clampZoom(stepped(factor, steps)));
  }

  onMount(() => {
    const el = scroller;
    if (!el) return;
    const observer = new ResizeObserver(() => (roomWidth = el.clientWidth));
    observer.observe(el);
    roomWidth = el.clientWidth;
    const onwheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    const here = () => pointerIn || el.contains(document.activeElement);
    const unbind = shortcuts.bind({
      'preview-zoom-in': { run: () => zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => zoomBy(1), when: here },
      'preview-zoom-out': { run: () => zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => onzoom(null), when: here },
    });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onwheel);
      unbind();
    };
  });

  export function percent(): number {
    return Math.round(factor * 100);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="scroller"
  bind:this={scroller}
  tabindex="0"
  role="img"
  aria-label={name}
  onpointerenter={() => (pointerIn = true)}
  onpointerleave={() => (pointerIn = false)}
  data-viewer-image
>
  {#if url}
    <img src={url} alt={name} style:width="{w * factor}px" style:height="{h * factor}px" />
  {:else if failed}
    <p class="failed">{t('viewer-not-drawn', { why: failed })}</p>
  {/if}
</div>

<style>
  .scroller {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 18px;
    background: var(--canvas);
    outline: none;
    text-align: center;
  }
  img {
    display: inline-block;
    max-width: none;
    background: #fff;
    box-shadow: var(--shadow-1);
  }
  .failed {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
