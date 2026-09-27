<script lang="ts">
  import Quote from '@lucide/svelte/icons/quote';
  import X from '@lucide/svelte/icons/x';
  import type { EditorView } from 'prosemirror-view';
  import type { KeyAction } from '$lib/editor/plugins';
  import { lookup } from '$lib/editor/references.svelte';
  import RichText from '$lib/editor/RichText.svelte';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { plural, shortLabel } from '$lib/library/format';
  import { editReference } from '$lib/library/references.svelte';
  import { library } from '$lib/state/library.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
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

  function attach(event: MouseEvent) {
    editorUi.pick({
      anchor: (event.currentTarget as HTMLElement).getBoundingClientRect(),
      exclude: node?.refs ?? [],
      purpose: 'Attach a reference to this element',
      onpick: (ref) => {
        editorUi.closePicker(false);
        project.attach(id, ref);
        onkeep(ref);
      },
    });
  }

  function label(ref: string): string {
    if (ref.startsWith('c:')) return library.collection(ref.slice(2))?.name ?? 'A collection';
    const found = lookup(ref);
    return found ? shortLabel(found) : 'Not found';
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
    use:dropTarget={{
      accepts: ['references'],
      ondrop: (e) => {
        for (const ref of e.payload.data as string[]) {
          project.attach(id, ref);
          onkeep(ref);
        }
      },
    }}
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

    <div class="tools"><WritingTools scope={el} /></div>

    <div class="text">
      <RichText
        bind:this={body}
        {project}
        fragment={text}
        kind="body"
        placeholder="Write here. Type @ to cite."
        autofocus={begin === 'body' ? 'end' : null}
        onaction={bodyAction}
        oncite={onkeep}
      />
    </div>

    <footer>
      <div class="refs">
        {#each node.refs as ref (ref)}
          <span class="chip">
            <button
              type="button"
              class="open truncate"
              onclick={() => !ref.startsWith('c:') && lookup(ref)?.inLibrary && editReference(ref)}
            >
              {label(ref)}
            </button>
            <button
              type="button"
              class="drop"
              aria-label="Detach {label(ref)}"
              onclick={() => project.detach(id, ref)}
            >
              <X size={11} />
            </button>
          </span>
        {/each}
        <button type="button" class="attach" onclick={attach}>
          <Quote size={12} />
          {node.refs.length ? 'Attach' : 'Attach a reference'}
        </button>
      </div>
      {#if node.words}
        <span class="count">{plural(node.words, 'word')}</span>
      {/if}
    </footer>
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
  .refs {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    max-width: 220px;
    height: 22px;
    padding-left: 9px;
    border-radius: 11px;
    background: var(--accent-softer);
    color: var(--accent-strong);
    font-size: var(--text-sm);
  }
  .chip button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0;
  }
  .chip .open:hover {
    text-decoration: underline;
  }
  .chip .drop {
    display: inline-flex;
    margin: 0 3px 0 2px;
    padding: 2px;
    border-radius: 50%;
    opacity: 0.6;
  }
  .chip .drop:hover {
    opacity: 1;
    background: var(--accent-soft);
  }
  .attach {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 22px;
    padding: 0 8px;
    border: none;
    border-radius: 11px;
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .attach:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .count {
    flex: none;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
</style>
