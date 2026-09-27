<script lang="ts">
  import { fly } from 'svelte/transition';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import X from '@lucide/svelte/icons/x';
  import { toasts } from './toast.svelte';
</script>

<div class="toaster" aria-live="polite">
  {#each toasts.list as toast (toast.id)}
    <div class="toast {toast.kind}" role="status" transition:fly={{ y: 12, duration: 180 }}>
      {#if toast.kind === 'error'}
        <span class="mark"><CircleAlert size={16} /></span>
      {:else if toast.kind === 'ok'}
        <span class="mark"><CircleCheck size={16} /></span>
      {/if}
      <div class="text selectable">
        <div class="message">{toast.message}</div>
        {#if toast.detail}<div class="detail">{toast.detail}</div>{/if}
      </div>
      {#if toast.action}
        <button
          class="action"
          onclick={() => {
            toast.action?.run();
            toasts.dismiss(toast.id);
          }}>{toast.action.label}</button
        >
      {/if}
      <button class="close" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
        <X size={14} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    z-index: 950;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    max-width: min(560px, calc(100vw - 48px));
    padding: 9px 10px 9px 14px;
    background: var(--ink);
    color: var(--paper);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-3);
  }
  .mark {
    display: inline-flex;
    margin-top: 1px;
  }
  .error .mark {
    color: #f0a090;
  }
  .ok .mark {
    color: #a6d6a3;
  }
  .text {
    min-width: 0;
  }
  .message {
    font-weight: 500;
  }
  .detail {
    margin-top: 1px;
    font-size: var(--text-sm);
    opacity: 0.72;
    overflow-wrap: anywhere;
  }
  button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .action {
    padding: 1px 8px;
    font-weight: 600;
    color: #a9d6d2;
  }
  .close {
    display: inline-flex;
    padding: 3px;
    opacity: 0.6;
  }
  .close:hover,
  .action:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.12);
  }
</style>
