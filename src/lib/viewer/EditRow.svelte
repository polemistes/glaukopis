<script lang="ts">
  /**
   * The row of an image being edited (ADR 0071), under the viewer's bar:
   * the turns and the flips, the crop, the three colours in percent with 100
   * as the image is, and at the end the keeping and the leaving. Six things,
   * and no more.
   */
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
  import CropIcon from '@lucide/svelte/icons/crop';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import RotateCw from '@lucide/svelte/icons/rotate-cw';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import type { Edit, EditFacts } from '$lib/api/files';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { cutSize, flipped, isNothing, nothing, shownSize, turned } from './editing';

  interface Props {
    edit: Edit;
    facts: EditFacts;
    cropping: boolean;
    /** Whether the edit is being kept: everything waits. */
    keeping: boolean;
    onchange: (edit: Edit) => void;
    oncropping: (on: boolean) => void;
    onkeep: () => void;
    oncancel: () => void;
  }

  let { edit, facts, cropping, keeping, onchange, oncropping, onkeep, oncancel }: Props = $props();

  type Colour = 'brightness' | 'contrast' | 'saturation';
  const COLOURS: { key: Colour; label: string }[] = $derived([
    { key: 'brightness', label: t('viewer-edit-brightness') },
    { key: 'contrast', label: t('viewer-edit-contrast') },
    { key: 'saturation', label: t('viewer-edit-saturation') },
  ]);

  const changed = $derived(!isNothing(edit));
  const cut = $derived(cutSize(edit, facts.width, facts.height));
  const full = $derived(shownSize(edit, facts.width, facts.height));

  function colour(key: Colour, value: number) {
    onchange({ ...edit, [key]: Math.round(Math.min(200, Math.max(0, value))) });
  }
</script>

<div class="row" data-edit-row>
  <div class="group">
    <IconButton
      size="sm"
      label={t('viewer-edit-turn-left')}
      disabled={keeping}
      data-edit-turn="left"
      onclick={() => onchange(turned(edit, -1))}
    >
      <RotateCcw size={15} />
    </IconButton>
    <IconButton
      size="sm"
      label={t('viewer-edit-turn-right')}
      disabled={keeping}
      data-edit-turn="right"
      onclick={() => onchange(turned(edit, 1))}
    >
      <RotateCw size={15} />
    </IconButton>
    <IconButton
      size="sm"
      label={t('viewer-edit-flip-sideways')}
      disabled={keeping}
      data-edit-flip="x"
      onclick={() => onchange(flipped(edit, 'x'))}
    >
      <ArrowLeftRight size={15} />
    </IconButton>
    <IconButton
      size="sm"
      label={t('viewer-edit-flip-over')}
      disabled={keeping}
      data-edit-flip="y"
      onclick={() => onchange(flipped(edit, 'y'))}
    >
      <ArrowUpDown size={15} />
    </IconButton>
    <IconButton
      size="sm"
      label={t('viewer-edit-crop')}
      active={cropping}
      disabled={keeping}
      data-edit-crop
      onclick={() => oncropping(!cropping)}
    >
      <CropIcon size={15} />
    </IconButton>
  </div>
  <span class="rule" role="separator"></span>
  {#each COLOURS as c (c.key)}
    <label class="slider" data-edit-slider={c.key}>
      <span class="label">{c.label}</span>
      <input
        type="range"
        min="0"
        max="200"
        step="1"
        value={edit[c.key]}
        disabled={keeping}
        oninput={(e) => colour(c.key, Number(e.currentTarget.value))}
      />
      <span class="amount" data-amount>{t('viewer-edit-percent', { percent: edit[c.key] })}</span>
      <button
        type="button"
        class="again"
        class:hidden={edit[c.key] === 100}
        aria-label={t('viewer-edit-as-it-was')}
        use:tooltip={{ text: t('viewer-edit-as-it-was') }}
        disabled={keeping || edit[c.key] === 100}
        data-edit-as-it-was
        onclick={() => colour(c.key, 100)}
      >
        <Undo2 size={13} />
      </button>
    </label>
  {/each}
  <span class="rule" role="separator"></span>
  <Button
    variant="ghost"
    size="sm"
    disabled={keeping || !changed}
    data-edit-start-again
    onclick={() => onchange(nothing())}
  >
    {t('viewer-edit-start-again')}
  </Button>
  <span class="spring"></span>
  {#if cropping || edit.crop}
    <span class="cut" data-edit-cut
      >{t('viewer-edit-cut-to', {
        width: cut[0],
        height: cut[1],
        fullWidth: full[0],
        fullHeight: full[1],
      })}</span
    >
  {/if}
  <Button
    variant="primary"
    size="sm"
    disabled={keeping || !changed}
    data-edit-keep
    onclick={onkeep}
  >
    {t('viewer-edit-keep')}
  </Button>
  <Button variant="ghost" size="sm" disabled={keeping} data-edit-cancel onclick={oncancel}>
    {t('common-cancel')}
  </Button>
</div>

<style>
  /* The row wraps on a narrow side, and never scrolls. */
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    flex: none;
    padding: 4px 8px 4px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .rule {
    flex: none;
    width: 1px;
    height: 16px;
    background: var(--line);
  }
  .slider {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .slider input {
    width: 96px;
    accent-color: var(--accent);
  }
  .amount {
    min-width: 3.4em;
    font-variant-numeric: tabular-nums;
    color: var(--ink-3);
  }
  .again {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .again:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .again.hidden {
    visibility: hidden;
  }
  .spring {
    flex: 1;
  }
  .cut {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--ink-3);
  }
</style>
