<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Props = Omit<HTMLInputAttributes, 'value' | 'size'> & {
    value: string;
    label?: string;
    hint?: string;
    error?: string | null;
    size?: 'sm' | 'md' | 'lg';
    /** Shown inside the field, before the text. */
    leading?: Snippet;
    trailing?: Snippet;
    el?: HTMLInputElement;
    /** Text in a serif face: for titles and other content, as against settings. */
    serif?: boolean;
  };

  let {
    value = $bindable(),
    label,
    hint,
    error,
    size = 'md',
    leading,
    trailing,
    el = $bindable(),
    serif = false,
    id,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const fieldId = $derived(id ?? `field-${uid}`);
</script>

<div class="field {size}" class:invalid={!!error}>
  {#if label}<label for={fieldId}>{label}</label>{/if}
  <div class="box">
    {#if leading}<span class="adornment">{@render leading()}</span>{/if}
    <input
      bind:this={el}
      bind:value
      id={fieldId}
      class:serif
      autocomplete="off"
      spellcheck="false"
      {...rest}
    />
    {#if trailing}<span class="adornment">{@render trailing()}</span>{/if}
  </div>
  {#if error}
    <p class="message error">{error}</p>
  {:else if hint}
    <p class="message">{hint}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  .box {
    display: flex;
    align-items: center;
    gap: 6px;
    height: var(--control-h);
    padding: 0 9px;
    background: var(--paper-raised);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    transition:
      border-color var(--fast) var(--ease),
      box-shadow var(--fast) var(--ease);
  }
  .sm .box {
    height: 26px;
    padding: 0 7px;
  }
  .lg .box {
    height: 38px;
    padding: 0 12px;
    font-size: var(--text-lg);
  }
  .box:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .invalid .box {
    border-color: var(--danger);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    outline: none;
  }
  input.serif {
    font-family: var(--font-text);
    font-size: 1.06em;
  }
  input::placeholder {
    color: var(--ink-4);
  }
  .adornment {
    display: inline-flex;
    align-items: center;
    color: var(--ink-3);
    flex: none;
  }
  .message {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .message.error {
    color: var(--danger);
  }
</style>
