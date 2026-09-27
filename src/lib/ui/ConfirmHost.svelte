<script lang="ts">
  import Button from './Button.svelte';
  import Dialog from './Dialog.svelte';
  import { confirmations } from './confirm.svelte';

  const q = $derived(confirmations.current);
  let confirmButton = $state<HTMLButtonElement>();

  $effect(() => {
    if (q && confirmButton) confirmButton.focus();
  });
</script>

{#if q}
  <Dialog open title={q.title} width={440} onclose={() => confirmations.answer('cancel')}>
    {#if q.message}<p class="message selectable">{q.message}</p>{/if}
    {#snippet footer()}
      {#if q.cancel !== ''}
        <Button variant="ghost" onclick={() => confirmations.answer('cancel')}
          >{q.cancel ?? 'Cancel'}</Button
        >
      {/if}
      {#if q.alternative}
        <Button onclick={() => confirmations.answer('alternative')}>{q.alternative}</Button>
      {/if}
      <Button
        bind:el={confirmButton}
        variant={q.danger ? 'danger' : 'primary'}
        onclick={() => confirmations.answer('confirm')}>{q.confirm ?? 'OK'}</Button
      >
    {/snippet}
  </Dialog>
{/if}

<style>
  .message {
    color: var(--ink-2);
    line-height: 1.55;
    white-space: pre-line;
  }
</style>
