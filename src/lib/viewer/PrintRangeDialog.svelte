<script lang="ts">
  /**
   * The pages of a file to be printed (record 0075): all of them, or from
   * one to another. Asked before anything is drawn, since the pages of a
   * scan take a while to draw at the resolution print wants, and then the
   * system's dialog opens.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';

  interface Props {
    /** How many pages the file has. */
    count: number;
    /** The page in view, which the range begins with. */
    page: number;
    onprint: (from: number, to: number) => void;
    onclose: () => void;
  }

  let { count, page, onprint, onclose }: Props = $props();

  let all = $state(true);
  let from = $state(untrack(() => page));
  let to = $state(untrack(() => count));

  /** A number written, as a page of the file. */
  const clamp = (n: number) => Math.min(count, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));

  function print() {
    if (all) return onprint(1, count);
    const [a, b] = [clamp(from), clamp(to)];
    onprint(Math.min(a, b), Math.max(a, b));
  }
</script>

<Dialog open title={t('viewer-print-pages')} width={380} {onclose}>
  <form
    class="range"
    data-print-range
    onsubmit={(e) => {
      e.preventDefault();
      print();
    }}
  >
    <label class="row">
      <input type="radio" name="range" checked={all} onchange={() => (all = true)} data-print-all />
      <span>{t('viewer-print-all', { count })}</span>
    </label>
    <label class="row">
      <input type="radio" name="range" checked={!all} onchange={() => (all = false)} />
      <span>{t('viewer-print-from')}</span>
      <input
        type="number"
        min="1"
        max={count}
        bind:value={from}
        onfocus={() => (all = false)}
        data-print-from
      />
      <span>{t('viewer-print-to')}</span>
      <input
        type="number"
        min="1"
        max={count}
        bind:value={to}
        onfocus={() => (all = false)}
        data-print-to
      />
    </label>
    <!-- So that Enter prints. -->
    <button type="submit" hidden aria-hidden="true" tabindex="-1"></button>
  </form>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={print} data-print-run>{t('viewer-print')}</Button>
  {/snippet}
</Dialog>

<style>
  .range {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-md);
  }
  input[type='number'] {
    width: 5.5em;
    height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
</style>
