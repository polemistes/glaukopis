<script lang="ts">
  /**
   * Where a figure, a table or an equation stands: to the left, in the
   * middle, to the right; whether the text flows around it; and whether it
   * stands beside what is before it. What is not said is as the format of
   * the document has it, which is told.
   */
  import { untrack } from 'svelte';
  import type { Flow, Stand } from '$lib/editor/schema';
  import { FLOWS, placed, SIDES, sideWords, type Usual } from './placing';

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
  const what = $derived(kind === 'figure' ? 'figures' : kind === 'table' ? 'tables' : 'equations');
  const it = $derived(kind === 'equation' ? 'equation' : kind);
</script>

{#if beside === 'in'}
  <div class="row">
    <span class="label">Stands</span>
    <div class="choices">
      <span class="said">beside others, in a row</span>
      <button type="button" class="link" onclick={onalone}>By itself again</button>
    </div>
  </div>
{:else}
  <div class="row">
    <span class="label">Stands</span>
    <div class="choices" role="radiogroup" aria-label="Where the {it} stands">
      {#each SIDES as side (side.value)}
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
    The format has {what}
    {sideWords[usual.align]}{#if kind !== 'equation' && usual.align !== 'center'}, {usual.wrap
        ? 'with the text flowing around them'
        : 'apart from the text'}{/if}.
  </div>

  {#if kind !== 'equation'}
    <div class="row">
      <span class="label">Text</span>
      <div class="choices" role="radiogroup" aria-label="Whether the text flows around the {it}">
        {#each FLOWS as f (f.value)}
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
      <div class="hint indent">The text flows around what stands at a side.</div>
    {/if}
  {/if}

  {#if beside === 'can'}
    <div class="row">
      <span></span>
      <div class="choices">
        <button type="button" class="link" onclick={onbeside}>
          Put it beside the one before it
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
