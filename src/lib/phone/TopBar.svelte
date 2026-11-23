<script lang="ts">
  /**
   * The row at the top of a place: its title, Back where it has one, and at
   * its right end what the place gives it. A stand-in of the meeting points;
   * part C fills it in.
   */
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import { places } from './places.svelte';

  let {
    title,
    back = false,
    children,
  }: { title?: string; back?: boolean; children?: Snippet } = $props();
</script>

<header data-phone-bar>
  {#if back}
    <button type="button" data-phone-back onclick={() => places.back()}>{t('phone-back')}</button>
  {/if}
  {#if title}<h1>{title}</h1>{/if}
  {@render children?.()}
</header>
