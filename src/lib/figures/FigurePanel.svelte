<script lang="ts">
  /** What can be said of a figure besides its caption: how wide it is, whether it is numbered, what it shows. */
  import ImageUp from '@lucide/svelte/icons/image-up';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { untrack } from 'svelte';
  import type { Flow, Stand } from '$lib/editor/schema';
  import { t } from '$lib/i18n';
  import Placing from './Placing.svelte';
  import type { Usual } from './placing';

  interface Props {
    name: string;
    alt: string;
    width: number;
    numbered: boolean;
    /** Where it stands, and whether the text flows around it, where that is said of it. */
    align: Stand;
    flow: Flow;
    /** What the format says of figures. */
    usual: Usual;
    beside: 'in' | 'can' | 'no';
    onbeside: () => void;
    onalone: () => void;
    /** While the width is being set: shown, and not yet kept. */
    ontry: (width: number) => void;
    onchange: (change: {
      alt?: string;
      width?: number;
      numbered?: boolean;
      align?: Stand;
      flow?: Flow;
    }) => void;
    /** Whether what is said of the figure is what is kept with the picture. */
    kept: () => boolean;
    /** Whether anything is kept with the picture to be said of its figures. */
    own: () => boolean;
    /** Keeps what is said of the figure with the picture. */
    onkeep: () => void;
    /** Says of the figure what is kept with the picture. */
    ontake: () => void;
    onreplace: () => void;
    onremove: () => void;
    onclose: () => void;
  }

  let {
    name,
    alt,
    width,
    numbered,
    align,
    flow,
    usual,
    beside,
    onbeside,
    onalone,
    ontry,
    onchange,
    kept,
    own,
    onkeep,
    ontake,
    onreplace,
    onremove,
    onclose,
  }: Props = $props();

  /** Asked again when either has been done. */
  let same = $state(untrack(() => kept()));

  let wide = $state(untrack(() => width));
  let described = $state(untrack(() => alt));
  let counted = $state(untrack(() => numbered));

  // What another changes meanwhile is shown here as well.
  $effect(() => {
    wide = width;
  });
  $effect(() => {
    counted = numbered;
  });

  const WIDTHS = $derived([
    { value: 33, label: t('figures-width-third') },
    { value: 50, label: t('figures-width-half') },
    { value: 75, label: t('figures-width-three-quarters') },
    { value: 100, label: t('figures-width-whole') },
  ]);

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
      if (described !== alt) onchange({ alt: described.trim() });
      onclose();
    } else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="figure-settings" {onkeydown}>
  <div class="head">
    <div class="note-number">{t('figures-figure')}</div>
    <span class="name truncate" title={name}>{name}</span>
  </div>

  <div class="row">
    <label for="figure-width">{t('figures-width')}</label>
    <input
      id="figure-width"
      type="range"
      min="10"
      max="100"
      step="5"
      bind:value={wide}
      oninput={() => ontry(wide)}
      onchange={() => onchange({ width: wide })}
    />
    <span class="amount">{wide}%</span>
  </div>
  <div class="row widths">
    <span></span>
    <div class="choices">
      {#each WIDTHS as w (w.value)}
        <button
          type="button"
          class:on={wide === w.value}
          onclick={() => {
            wide = w.value;
            onchange({ width: w.value });
          }}
        >
          {w.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="hint indent">
    {beside === 'in' ? t('figures-width-of-row') : t('figures-width-of-text')}
  </div>

  <Placing kind="figure" {align} {flow} {usual} {beside} {onchange} {onbeside} {onalone} />

  <div class="row">
    <label for="figure-alt">{t('figures-shows')}</label>
    <input
      id="figure-alt"
      type="text"
      bind:value={described}
      placeholder={t('figures-shows-placeholder')}
      onblur={() => described !== alt && onchange({ alt: described.trim() })}
    />
  </div>

  <div class="row">
    <span></span>
    <label class="check">
      <input
        type="checkbox"
        bind:checked={counted}
        onchange={() => onchange({ numbered: counted })}
      />
      {t('figures-numbered')}
    </label>
  </div>

  <div class="row">
    <span></span>
    <div class="caption">
      <button
        type="button"
        class="link"
        disabled={same}
        title={t('figures-keep-caption-hint')}
        onclick={() => {
          onkeep();
          same = true;
        }}
      >
        {t('figures-keep-caption')}
      </button>
      <button
        type="button"
        class="link"
        disabled={same || !own()}
        title={t('figures-take-caption-hint')}
        onclick={() => {
          ontake();
          same = kept();
        }}
      >
        {t('figures-take-caption')}
      </button>
    </div>
  </div>

  <div class="actions">
    <button type="button" onclick={onreplace}>
      <ImageUp size={14} />
      {t('figures-another-picture')}
    </button>
    <span class="spring"></span>
    <button type="button" class="danger" onclick={onremove}>
      <Trash2 size={14} />
      {t('figures-remove')}
    </button>
  </div>
</div>

<style>
  .figure-settings {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
  }
  .head .note-number {
    margin-bottom: 0;
  }
  .name {
    flex: 1;
    min-width: 0;
    color: var(--ink-4);
    font-size: var(--text-xs);
    text-align: right;
  }
  .row {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .row > label:first-child {
    color: var(--ink-3);
  }
  .amount {
    width: 40px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  input[type='text'] {
    grid-column: 2 / 4;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  input[type='text']:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .widths {
    margin-top: 2px;
  }
  .choices {
    grid-column: 2 / 4;
    display: flex;
    gap: 2px;
  }
  .choices button {
    height: 22px;
    padding: 0 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .choices button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .choices button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-4);
    font-size: var(--text-xs);
  }
  .indent {
    margin-left: 64px;
  }
  .check input {
    accent-color: var(--accent);
  }
  .check {
    grid-column: 2 / 4;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .caption {
    grid-column: 2 / 4;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent-strong);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .link:hover:not(:disabled) {
    text-decoration: underline;
  }
  .link:disabled {
    color: var(--ink-4);
    cursor: default;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .actions button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .actions button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .actions button.danger:hover {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .spring {
    flex: 1;
  }
</style>
