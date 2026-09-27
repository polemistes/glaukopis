<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { importText, type PasteRequest } from './references.svelte';

  let { request, onclose }: { request: PasteRequest; onclose: () => void } = $props();

  let text = $state('');
  let area = $state<HTMLTextAreaElement>();

  $effect(() => {
    area?.focus();
  });

  async function go() {
    const value = text;
    const { resolve, collection } = request;
    onclose();
    resolve(await importText(value, collection));
  }

  function close() {
    request.resolve(null);
    onclose();
  }
</script>

<Dialog
  open
  title="Paste references"
  subtitle="BibLaTeX or BibTeX, as many entries as you like"
  width={640}
  onclose={close}
>
  <textarea
    bind:this={area}
    bind:value={text}
    spellcheck="false"
    placeholder={'@book{nagy1979,\n  author = {Nagy, Gregory},\n  title = {The Best of the Achaeans},\n  date = {1979},\n}'}
    aria-label="BibLaTeX source"></textarea>
  {#snippet footer()}
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button variant="primary" disabled={!text.includes('@')} onclick={go}>Continue</Button>
  {/snippet}
</Dialog>

<style>
  textarea {
    display: block;
    width: 100%;
    height: 340px;
    padding: 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
    font-family: var(--font-mono);
    font-size: 12.5px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    white-space: pre;
  }
  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  textarea::placeholder {
    color: var(--ink-4);
  }
</style>
