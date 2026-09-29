<script lang="ts">
  /**
   * Where a figure, a table or an equation stands: to the left, in the
   * middle, to the right; whether the text flows around it; and whether it
   * stands beside what is before it. What is not said is as the format of
   * the document has it, which is told.
   */
  import { untrack } from 'svelte';
  import type { Flow, Stand } from '$lib/editor/schema';
  import { t } from '$lib/i18n';
  import { flows, placed, sides, type Usual } from './placing';

  interface Props {
    kind: 'figure' | 'table' | 'equation';
    align: Stand;
    flow?: Flow;
    /** What the format says of things of this kind. */
    usual: Usual;
    /** Whether it stands in a row, or could stand beside what is before it. */
    beside: 'in' | 'can' | 'no';
    onchange: (change: { align?: Stand; flow?: Flow }) => void;
    onbeside: () => void;
    onalone: () => void;
  }

  let { kind, align, flow = '', usual, beside, onchange, onbeside, onalone }: Props = $props();

  let to = $state<Stand>(untrack(() => align));
  let text = $state<Flow>(untrack(() => flow));
  $effect(() => {
    to = align;
  });
  $effect(() => {
    text = flow;
  });

  const now = $derived(placed({ align: to, flow: text }, usual));
  /** Whether the format has the text flow around things of the kind; nothing for what cannot have it. */
  const flowing = $derived(
    kind !== 'equation' && usual.align !== 'center' ? (usual.wrap ? 'around' : 'apart') : 'none',
  );
</script>

{#if beside === 'in'}
  <div class="row">
    <span class="label">{t('figures-stands')}</span>
    <div class="choices">
      <span class="said">{t('figures-stands-in-row')}</span>
      <button type="button" class="link" onclick={onalone}>{t('figures-stands-alone')}</button>
    </div>
  </div>
{:else}
  <div class="row">
    <span class="label">{t('figures-stands')}</span>
    <div class="choices" role="radiogroup" aria-label={t('figures-stands-where', { kind })}>
      {#each sides() as side (side.value)}
        <button
          type="button"
          role="radio"
          aria-checked={to === side.value}
          class:on={to === side.value}
          onclick={() => {
            to = side.value;
            onchange({ align: side.value });
          }}
        >
          {side.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="hint indent">
    {t('figures-usual', { kind, side: usual.align, flow: flowing })}
  </div>

  {#if kind !== 'equation'}
    <div class="row">
      <span class="label">{t('figures-text')}</span>
      <div class="choices" role="radiogroup" aria-label={t('figures-flows-where', { kind })}>
        {#each flows() as f (f.value)}
          <button
            type="button"
            role="radio"
            aria-checked={text === f.value}
            class:on={text === f.value}
            disabled={now.stand === 'center'}
            onclick={() => {
              text = f.value;
              onchange({ flow: f.value });
            }}
          >
            {f.label}
          </button>
        {/each}
      </div>
    </div>
    {#if now.stand === 'center'}
      <div class="hint indent">{t('figures-flow-at-side')}</div>
    {/if}
  {/if}

  {#if beside === 'can'}
    <div class="row">
      <span></span>
      <div class="choices">
        <button type="button" class="link" onclick={onbeside}>
          {t('figures-beside')}
        </button>
      </div>
    </div>
  {/if}
{/if}

<style>
  .row {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .label {
    color: var(--ink-3);
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
  }
  .choices button:not(.link) {
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
  .choices button:not(.link):hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .choices button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .choices button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .said {
    margin-right: 10px;
    color: var(--ink-2);
    font-size: var(--text-xs);
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
  .link:hover {
    text-decoration: underline;
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    line-height: 1.4;
  }
  .indent {
    margin-left: 64px;
  }
</style>
