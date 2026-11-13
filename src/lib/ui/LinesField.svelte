<!--
  A field of a few words in lines, that grows with what is written: Enter
  says it is done, Shift+Enter makes a new line (as everywhere in the
  application), Escape leaves it as it was, and leaving the field keeps what
  was written. It takes the focus when it is shown. It tells once, by
  `ondone` or `oncancel`; what is written is the caller's to clean.
-->
<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    label?: string;
    class?: string;
    style?: string;
    ondone: (value: string) => void;
    oncancel: () => void;
  }

  let {
    value,
    placeholder,
    label,
    class: className = '',
    style,
    ondone,
    oncancel,
  }: Props = $props();

  // What was given, to be written in: the field is the writer's from then on.
  // svelte-ignore state_referenced_locally
  let written = $state(value);
  let told = false;

  function done() {
    if (told) return;
    told = true;
    ondone(written);
  }

  function cancel() {
    if (told) return;
    told = true;
    oncancel();
  }

  /** As tall as its lines, so that nothing scrolls inside it. */
  function grow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }
</script>

<textarea
  class="lines-field {className}"
  {style}
  rows="1"
  bind:value={written}
  {placeholder}
  aria-label={label}
  oninput={(e) => grow(e.currentTarget)}
  onblur={done}
  onkeydown={(e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      done();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }}
  {@attach (el: HTMLTextAreaElement) => {
    grow(el);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }}></textarea>

<style>
  .lines-field {
    display: block;
    resize: none;
    overflow: hidden;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font: inherit;
    line-height: 1.35;
  }
</style>
