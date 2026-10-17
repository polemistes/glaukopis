<script lang="ts">
  /**
   * A name written in place, on the owl map: in a folder's label or on a
   * project's card, as an element is named in the diagram. Enter keeps the
   * name, Escape leaves it as it was; going elsewhere keeps what was
   * written, where anything was. The keys are the field's while it is open,
   * not the map's.
   */
  import { onMount } from 'svelte';

  interface Props {
    value: string;
    placeholder?: string;
    /** What was typed to begin a new name, in the place of the old one. */
    startingWith?: string;
    oncommit: (name: string) => void;
    oncancel: () => void;
  }

  let { value, placeholder, startingWith, oncommit, oncancel }: Props = $props();

  // svelte-ignore state_referenced_locally
  let text = $state(startingWith ?? value);
  let input = $state<HTMLInputElement>();
  let ended = false;

  onMount(() => {
    if (!input) return;
    input.focus({ preventScroll: true });
    // A new name begun by a letter goes on after it; a name opened for
    // writing is chosen whole, to be written over or changed.
    if (startingWith !== undefined) input.setSelectionRange(text.length, text.length);
    else input.select();
  });

  function end(keep: boolean) {
    if (ended) return;
    ended = true;
    const name = text.split(/\s+/).filter(Boolean).join(' ');
    if (keep && name && name !== value) oncommit(name);
    else oncancel();
  }

  function onkeydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      end(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      end(false);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      end(true);
    }
  }
</script>

<span class="name-field">
  <!-- The width follows the text, as a label's does. -->
  <span class="mirror" aria-hidden="true">{text || placeholder || ' '}</span>
  <input
    bind:this={input}
    bind:value={text}
    {placeholder}
    maxlength="200"
    spellcheck="false"
    data-name-field
    {onkeydown}
    onblur={() => end(true)}
    onpointerdown={(e) => e.stopPropagation()}
    ondblclick={(e) => e.stopPropagation()}
  />
</span>

<style>
  .name-field {
    position: relative;
    display: inline-grid;
    min-width: 4ch;
    max-width: 100%;
  }
  .mirror,
  input {
    grid-area: 1 / 1;
    font: inherit;
    letter-spacing: inherit;
    padding: 0 2px;
    white-space: pre;
  }
  .mirror {
    visibility: hidden;
    overflow: hidden;
  }
  input {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 0 0 2px var(--accent);
  }
  input::placeholder {
    color: var(--ink-4);
  }
</style>
