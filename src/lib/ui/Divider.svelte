<script lang="ts">
  /**
   * A line between two parts of the window that can be dragged, to give one
   * of them more room and the other less.
   */
  interface Props {
    label: string;
    /** Called while the line is dragged, with how far it has moved since it was last called. */
    onmove: (dx: number) => void;
    /** Called when the dragging begins: the place to measure what is about to change. */
    onstart?: () => void;
    onend?: () => void;
    /** Double-click: back to the size that was given. */
    onreset?: () => void;
  }

  let { label, onmove, onstart, onend, onreset }: Props = $props();

  let dragging = $state(false);
  let last = 0;

  // By the events of the mouse, and followed on the window: they come
  // wherever the pointer goes, and whatever was pressed before.
  function down(event: MouseEvent) {
    if (event.button !== 0 || dragging) return;
    event.preventDefault();
    dragging = true;
    last = event.clientX;
    document.body.classList.add('resizing');
    window.addEventListener('mousemove', move, true);
    window.addEventListener('mouseup', up, true);
    onstart?.();
  }

  function move(event: MouseEvent) {
    if (!dragging) return;
    event.preventDefault();
    const dx = event.clientX - last;
    if (!dx) return;
    last = event.clientX;
    onmove(dx);
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('resizing');
    window.removeEventListener('mousemove', move, true);
    window.removeEventListener('mouseup', up, true);
    onend?.();
  }

  $effect(() => () => up());

  function onkeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 64 : 16;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      onstart?.();
      onmove(event.key === 'ArrowLeft' ? -step : step);
      onend?.();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="divider"
  class:dragging
  role="separator"
  aria-orientation="vertical"
  aria-label={label}
  tabindex="0"
  onmousedown={down}
  ondblclick={() => onreset?.()}
  {onkeydown}
></div>

<style>
  .divider {
    position: relative;
    z-index: 3;
    flex: none;
    width: 1px;
    background: var(--line-strong);
    cursor: col-resize;
    outline: none;
    touch-action: none;
  }
  /* Wider to the hand than to the eye. */
  .divider::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    width: 9px;
  }
  .divider::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -1px;
    width: 3px;
    background: var(--accent);
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .divider:hover::after,
  .divider:focus-visible::after,
  .divider.dragging::after {
    opacity: 1;
  }
  :global(body.resizing) {
    cursor: col-resize;
    user-select: none;
  }
  :global(body.resizing *) {
    cursor: col-resize !important;
  }
</style>
