<script lang="ts">
  import { t } from '$lib/i18n';

  let { size = 16 }: { size?: number } = $props();
</script>

<span
  class="spinner"
  style:width="{size}px"
  style:height="{size}px"
  role="progressbar"
  aria-label={t('ui-working')}
></span>

<style>
  .spinner {
    display: inline-block;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
    flex: none;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
