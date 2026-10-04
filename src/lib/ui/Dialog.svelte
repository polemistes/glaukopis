<script lang="ts">
  import type { Snippet } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import IconButton from './IconButton.svelte';
  import { dialogClosed, dialogOpened } from './top';

  interface Props {
    open: boolean;
    title?: string;
    /** A line under the title. */
    subtitle?: string;
    width?: number;
    /** Fills most of the window's height instead of fitting the content. */
    tall?: boolean;
    /** When false, Escape and clicking outside do not close it. */
    dismissable?: boolean;
    /** Can be dragged about by its header, to see what lies under it. */
    movable?: boolean;
    padded?: boolean;
    onclose: () => void;
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    open,
    title,
    subtitle,
    width = 520,
    tall = false,
    dismissable = true,
    movable = false,
    padded = true,
    onclose,
    header,
    children,
    footer,
  }: Props = $props();

  let el = $state<HTMLDialogElement>();

  $effect(() => {
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // The focus goes to what the dialog is for, not to its close button.
      const first =
        el.querySelector<HTMLElement>('[data-autofocus]') ??
        el.querySelector<HTMLElement>('.body :is(input, textarea, select):not(:disabled)') ??
        el.querySelector<HTMLElement>('footer .button.primary:not(:disabled)');
      (first ?? el).focus();
    }
    if (!open && el.open) el.close();
  });

  // What floats is put into the dialog that lies over the others (see top.ts).
  $effect(() => {
    if (!open || !el) return;
    const dialog = el;
    dialogOpened(dialog);
    return () => dialogClosed(dialog);
  });

  // The scrollbars of what lies behind are drawn over the dialog by WebKitGTK;
  // while a dialog is open they are made to be unseen (see app.css).
  $effect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.dialogs = String(Number(root.dataset.dialogs ?? 0) + 1);
    return () => {
      const left = Number(root.dataset.dialogs ?? 1) - 1;
      if (left > 0) root.dataset.dialogs = String(left);
      else delete root.dataset.dialogs;
    };
  });

  function oncancel(event: Event) {
    event.preventDefault();
    if (dismissable) onclose();
  }

  let pressedOutside = false;
  function onpointerdown(event: PointerEvent) {
    pressedOutside = event.target === el;
  }

  // Where the dialog has been dragged to, from where it opened; forgotten when it is opened again.
  let moved = $state({ x: 0, y: 0 });
  $effect(() => {
    if (open) moved = { x: 0, y: 0 };
  });
  function grab(event: PointerEvent) {
    if (!movable || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    const header = event.currentTarget as HTMLElement;
    const from = { x: event.clientX - moved.x, y: event.clientY - moved.y };
    header.setPointerCapture(event.pointerId);
    const onmove = (e: PointerEvent) => {
      moved = { x: e.clientX - from.x, y: e.clientY - from.y };
    };
    const onup = () => {
      header.removeEventListener('pointermove', onmove);
      header.removeEventListener('pointerup', onup);
      header.removeEventListener('pointercancel', onup);
    };
    header.addEventListener('pointermove', onmove);
    header.addEventListener('pointerup', onup);
    header.addEventListener('pointercancel', onup);
    event.preventDefault();
  }
  function onclick(event: MouseEvent) {
    if (dismissable && pressedOutside && event.target === el) onclose();
    pressedOutside = false;
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={el}
    class:tall
    style:width="min({width}px, calc(100vw - 48px))"
    style:transform={moved.x || moved.y ? `translate(${moved.x}px, ${moved.y}px)` : undefined}
    aria-label={title}
    tabindex="-1"
    {oncancel}
    {onpointerdown}
    {onclick}
  >
    <div class="frame">
      {#if title || header}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <header class:movable onpointerdown={grab}>
          <div class="titles">
            {#if header}
              {@render header()}
            {:else}
              <h2>{title}</h2>
              {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
            {/if}
          </div>
          {#if dismissable}
            <IconButton label={t('common-close')} shortcut="Esc" onclick={onclose}
              ><X size={16} /></IconButton
            >
          {/if}
        </header>
      {/if}
      <div class="body" class:padded>
        {@render children()}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  </dialog>
{/if}

<style>
  dialog {
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    background: var(--paper-raised);
    color: var(--ink);
    box-shadow: var(--shadow-3);
    max-height: calc(100vh - 64px);
    overflow: hidden;
    outline: none;
    animation: rise var(--slow) var(--ease);
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
  }
  dialog.tall {
    height: calc(100vh - 96px);
  }
  dialog::backdrop {
    background: var(--scrim);
    animation: fade var(--slow) var(--ease);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .frame {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-4) var(--space-3) var(--space-5);
    flex: none;
  }
  header.movable {
    cursor: move;
    touch-action: none;
    user-select: none;
  }
  .titles {
    flex: 1;
    min-width: 0;
    padding-top: 3px;
  }
  h2 {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin-top: 2px;
    color: var(--ink-3);
  }
  .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
  }
  .body.padded {
    padding: var(--space-2) var(--space-5) var(--space-5);
  }
  footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    border-top: 1px solid var(--line);
    background: var(--paper);
    flex: none;
  }
</style>
