<script lang="ts">
  import X from '@lucide/svelte/icons/x';
  import type { EditorView } from 'prosemirror-view';
  import type { KeyAction } from '$lib/editor/plugins';
  import RichText from '$lib/editor/RichText.svelte';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { plural } from '$lib/library/format';
  import { place, type RectLike } from '$lib/ui/floating';
  import IconButton from '$lib/ui/IconButton.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    id: string;
    anchor: RectLike;
    /** Where to begin: in the name, or in the text. */
    begin?: 'title' | 'body';
    onkeep: (id: string) => void;
    onclose: () => void;
  }

  let { project, id, anchor, begin = 'body', onkeep, onclose }: Props = $props();

  let el = $state<HTMLDivElement>();
  let body = $state<ReturnType<typeof RichText>>();

  const node = $derived(project.node(id));
  const title = $derived(project.fragment(id, 'title'));
  const text = $derived(project.fragment(id, 'body'));

  $effect(() => {
    if (!el) return;
    const position = () =>
      place(el!, anchor, { side: 'right', align: 'start', gap: 14, margin: 12 });
    position();
    const observer = new ResizeObserver(() => requestAnimationFrame(position));
    observer.observe(el);
    return () => observer.disconnect();
  });

  // The element may go while its box is open: deleted by a collaborator, or by undo.
  $effect(() => {
    if (!node) onclose();
  });

  $effect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !el || el.contains(target)) return;
      if (target.closest('.popover, .menu, dialog, .backdrop, .note-panel, .bar, .toaster')) return;
      // What stands at the side to be put into the text is part of the writing.
      if (target.closest('[data-beside-text]')) return;
      onclose();
    };
    window.addEventListener('pointerdown', outside, true);
    return () => window.removeEventListener('pointerdown', outside, true);
  });

  function titleAction(action: KeyAction): boolean {
    if (action === 'enter' || action === 'down-out' || action === 'tab') {
      body?.focus('start');
      return true;
    }
    if (action === 'escape') {
      onclose();
      return true;
    }
    return false;
  }

  function bodyAction(action: KeyAction, _view: EditorView): boolean {
    if (action === 'escape') {
      if (editorUi.picking || editorUi.citation) return false;
      onclose();
      return true;
    }
    return false;
  }
</script>

{#if node && title && text}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={el}
    class="box"
    role="dialog"
    aria-label="Element"
    tabindex="-1"
    onkeydown={(e) => e.stopPropagation()}
  >
    <header>
      <RichText
        {project}
        fragment={title}
        kind="title"
        placeholder="Name"
        autofocus={begin === 'title' ? 'all' : null}
        onaction={titleAction}
        class="box-title"
      />
      <IconButton label="Close" shortcut="Esc" size="sm" onclick={onclose}
        ><X size={14} /></IconButton
      >
    </header>

    <div class="tools"><WritingTools scope={el} map={node?.map} /></div>

    <div class="text">
      <RichText
        bind:this={body}
        {project}
        fragment={text}
        kind="body"
        element={id}
        placeholder="Write here. Type @ to cite."
        autofocus={begin === 'body' ? 'end' : null}
        onaction={bodyAction}
        oncite={onkeep}
      />
    </div>

    {#if node.words}
      <footer><span class="count">{plural(node.words, 'word')}</span></footer>
    {/if}
  </div>
{/if}

<style>
  .box {
    position: fixed;
    z-index: 600;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    width: min(500px, calc(100vw - 32px));
    max-height: min(640px, calc(100vh - 32px));
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-3);
    outline: none;
    animation: appear var(--slow) var(--ease);
  }
  .box:global([data-drop-over]) {
    box-shadow:
      0 0 0 2px var(--accent),
      var(--shadow-3);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.99);
    }
  }
  header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 16px 12px 4px 22px;
    flex: none;
  }
  header :global(.box-title) {
    flex: 1;
  }
  header :global(.box-title .prose) {
    font-size: 20px;
    letter-spacing: -0.005em;
  }
  .tools {
    flex: none;
    margin: 2px 12px 0 13px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--line);
  }
  .text {
    flex: 1;
    min-height: 120px;
    overflow-y: auto;
    padding: 12px 22px 16px;
    cursor: text;
  }
  .text :global(.prose) {
    min-height: 96px;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px 8px 16px;
    flex: none;
    border-top: 1px solid var(--line);
    background: var(--paper);
    border-radius: 0 0 var(--radius-l) var(--radius-l);
  }
  .count {
    flex: none;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
</style>
