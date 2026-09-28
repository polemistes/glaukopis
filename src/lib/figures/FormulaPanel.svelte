<script lang="ts">
  /**
   * Where a formula is written: in the notation of TeX, with what it looks
   * like shown beneath while it is written.
   */
  import { untrack } from 'svelte';
  import { mathematics } from './math.svelte';

  interface Props {
    tex: string;
    /** On a line of its own, and not in the line. */
    display: boolean;
    numbered: boolean;
    /** With what was written, when it is to be kept. */
    ondone: (tex: string, numbered: boolean) => void;
    oncancel: () => void;
  }

  let { tex, display, numbered, ondone, oncancel }: Props = $props();

  let draft = $state(untrack(() => tex));
  let counted = $state(untrack(() => numbered));
  /** What is shown follows what is written, a moment behind. */
  let settled = $state(untrack(() => tex));
  let field = $state<HTMLTextAreaElement>();

  $effect(() => {
    const value = draft;
    const timer = setTimeout(() => (settled = value), 220);
    return () => clearTimeout(timer);
  });

  const shown = $derived(mathematics.of(settled, display));

  /** What can be put in by pressing, for those who do not know it by heart. */
  const SIGNS: { label: string; hint: string; put: string; into?: number }[] = [
    { label: 'x²', hint: 'Raised', put: '^{}', into: 2 },
    { label: 'xᵢ', hint: 'Lowered', put: '_{}', into: 2 },
    { label: '½', hint: 'Fraction', put: '\\frac{}{}', into: 6 },
    { label: '√', hint: 'Root', put: '\\sqrt{}', into: 6 },
    { label: '∑', hint: 'Sum', put: '\\sum_{}^{}', into: 6 },
    { label: '∫', hint: 'Integral', put: '\\int_{}^{}', into: 6 },
    { label: '( )', hint: 'Brackets that grow', put: '\\left(  \\right)', into: 7 },
    { label: 'α', hint: 'alpha', put: '\\alpha ' },
    { label: 'β', hint: 'beta', put: '\\beta ' },
    { label: 'γ', hint: 'gamma', put: '\\gamma ' },
    { label: 'λ', hint: 'lambda', put: '\\lambda ' },
    { label: 'π', hint: 'pi', put: '\\pi ' },
    { label: 'σ', hint: 'sigma', put: '\\sigma ' },
    { label: '≤', hint: 'Less than or equal', put: '\\leq ' },
    { label: '≥', hint: 'Greater than or equal', put: '\\geq ' },
    { label: '≠', hint: 'Not equal', put: '\\neq ' },
    { label: '≈', hint: 'Nearly equal', put: '\\approx ' },
    { label: '×', hint: 'Times', put: '\\times ' },
    { label: '±', hint: 'Plus or minus', put: '\\pm ' },
    { label: '→', hint: 'Arrow', put: '\\to ' },
    { label: '∞', hint: 'Without end', put: '\\infty ' },
    { label: 'ab', hint: 'Words within a formula', put: '\\text{}', into: 6 },
  ];

  function put(sign: (typeof SIGNS)[number]) {
    const el = field;
    if (!el) return;
    const from = el.selectionStart ?? draft.length;
    const to = el.selectionEnd ?? from;
    const selected = draft.slice(from, to);
    // What is selected goes into what is put in, where that has room for it.
    const into = sign.into;
    const text =
      into !== undefined ? sign.put.slice(0, into) + selected + sign.put.slice(into) : sign.put;
    draft = draft.slice(0, from) + text + draft.slice(to);
    const at = into !== undefined ? from + into + selected.length : from + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(at, at);
    });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      ondone(draft.trim(), counted);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      oncancel();
    } else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      // What is taken back here is what was typed here.
      event.stopPropagation();
    }
  }

  export function focus() {
    field?.focus();
    field?.setSelectionRange(draft.length, draft.length);
  }

  /** What has been written, for when the panel is left without a key. */
  export function written(): { tex: string; numbered: boolean } {
    return { tex: draft.trim(), numbered: counted };
  }
</script>

<div class="head">
  <div class="note-number">{display ? 'Equation' : 'Formula'}</div>
  {#if display}
    <label class="counted">
      <input type="checkbox" bind:checked={counted} />
      Numbered
    </label>
  {/if}
</div>

<textarea
  bind:this={field}
  bind:value={draft}
  rows={display ? 3 : 2}
  spellcheck="false"
  autocomplete="off"
  aria-label="The formula, in the notation of TeX"
  placeholder={display ? 'a^2 + b^2 = c^2' : 'x_i'}
  {onkeydown}></textarea>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="signs" onmousedown={(e) => e.preventDefault()}>
  {#each SIGNS as sign (sign.label)}
    <button type="button" title={sign.hint} aria-label={sign.hint} onclick={() => put(sign)}>
      {sign.label}
    </button>
  {/each}
</div>

<div class="shown" class:display aria-live="polite">
  {#if !settled.trim()}
    <span class="quiet">What is written is shown here as it will stand.</span>
  {:else if shown?.mathml}
    <!-- Made by `sanitise`: mathematics and nothing else. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html shown.mathml}
  {:else if shown?.problem}
    <span class="problem">{shown.problem}</span>
  {:else if shown}
    <span class="quiet">{settled}</span>
  {:else}
    <span class="quiet">…</span>
  {/if}
</div>

<div class="hint">
  Written as in TeX. Enter when done{display ? ', Shift+Enter for a new line' : ''}, Escape to leave
  it as it was.
</div>

<style>
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 4px;
  }
  .head .note-number {
    flex: 1;
    margin-bottom: 0;
  }
  .counted {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--ink-3);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .counted input {
    accent-color: var(--accent);
  }
  textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 7px 9px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 13px;
    line-height: 1.5;
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .signs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin-top: 6px;
  }
  .signs button {
    min-width: 26px;
    height: 24px;
    padding: 0 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-family: var(--font-text);
    font-size: 14px;
    cursor: pointer;
  }
  .signs button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .shown {
    min-height: 2.2em;
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken, var(--paper-hover));
    color: var(--ink);
    font-size: 17px;
    overflow-x: auto;
  }
  .shown.display {
    text-align: center;
  }
  .quiet {
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .problem {
    color: var(--danger);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .hint {
    margin-top: 6px;
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
  }
</style>
