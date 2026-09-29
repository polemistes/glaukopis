<script lang="ts">
  import X from '@lucide/svelte/icons/x';
  import type { EditorView } from 'prosemirror-view';
  import { onDestroy, tick } from 'svelte';
  import type { KeyAction } from '$lib/editor/plugins';
  import { citationLabel } from '$lib/editor/references.svelte';
  import RichText from '$lib/editor/RichText.svelte';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { numbering, pointerText } from '$lib/figures/numbering.svelte';
  import { t } from '$lib/i18n';
  import SearchBar from '$lib/search/SearchBar.svelte';
  import { TextSearch, type Surface } from '$lib/search/text.svelte';
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
  let name = $state<ReturnType<typeof RichText>>();
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

  // ---- searching the name and the text ----

  let searching = $state<TextSearch | null>(null);
  let bar = $state<ReturnType<typeof SearchBar>>();

  const surface: Surface = {
    get project() {
      return project;
    },
    elements: () => [id],
    labels: () => {
      const map = project.node(id)?.map ?? '';
      return {
        citation: citationLabel,
        crossref: (target, form) =>
          pointerText(
            numbering.of(project, map).byId.get(target),
            form,
            numbering.countingOf(project, map),
          ),
      };
    },
    holder: (_element, part) =>
      el?.querySelector<HTMLElement>(part === 'title' ? 'header .rich-text' : '.text .rich-text') ??
      null,
    inView: () => null,
    // The box stands over the page, where the web view does not draw highlights.
    editorsDraw: true,
    reveal: async (_element, part) => (part === 'title' ? name : body)?.getView() ?? null,
    where: (view) =>
      view === name?.getView()
        ? { element: id, part: 'title' }
        : view === body?.getView()
          ? { element: id, part: 'body' }
          : null,
    looked: () => id,
    scroller: () => el?.querySelector<HTMLElement>('.text') ?? null,
  };

  /** Opens the search in the box, or turns to it; with `replacing`, to the field of what replaces. */
  function find(replacing: boolean) {
    const view = [name?.getView(), body?.getView()].find((v) => v?.hasFocus()) ?? null;
    if (!searching) searching = new TextSearch(surface);
    searching.open(replacing, view);
    tick().then(() => (replacing ? bar?.focusReplace() : bar?.focusQuery()));
  }

  function closeSearch(focus: boolean) {
    const s = searching;
    searching = null;
    void s?.close(focus);
  }

  onDestroy(() => void searching?.close(false));

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    const letter = event.key.toLowerCase();
    // Ctrl+F searches the name and the text, Ctrl+H replaces; F3 goes on to the next.
    const plain = mod && !event.altKey && !event.shiftKey;
    if (event.key === 'F3' || (plain && (letter === 'f' || letter === 'h'))) {
      event.preventDefault();
      if (event.key !== 'F3') find(letter === 'h');
      else if (!searching) find(false);
      else if (event.shiftKey) searching.previous();
      else searching.next();
    }
    // The search through everything is reached from here as from anywhere.
    if (mod && event.shiftKey && letter === 'f') return;
    event.stopPropagation();
  }

  function titleAction(action: KeyAction): boolean {
    if (action === 'enter' || action === 'down-out' || action === 'tab') {
      body?.focus('start');
      return true;
    }
    if (action === 'escape') {
      if (searching) closeSearch(false);
      else onclose();
      return true;
    }
    return false;
  }

  function bodyAction(action: KeyAction, _view: EditorView): boolean {
    if (action === 'escape') {
      if (editorUi.picking || editorUi.citation) return false;
      // The search is closed first; the box stays.
      if (searching) closeSearch(false);
      else onclose();
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
    aria-label={t('project-element')}
    tabindex="-1"
    {onkeydown}
  >
    <header>
      <RichText
        bind:this={name}
        {project}
        fragment={title}
        kind="title"
        placeholder={t('project-name-placeholder')}
        autofocus={begin === 'title' ? 'all' : null}
        onaction={titleAction}
        class="box-title"
      />
      <IconButton label={t('common-close')} shortcut="Esc" size="sm" onclick={onclose}
        ><X size={14} /></IconButton
      >
    </header>

    <div class="tools"><WritingTools scope={el} map={node?.map} /></div>
    {#if searching}
      <div class="find">
        <SearchBar bind:this={bar} search={searching} compact onclose={() => closeSearch(true)} />
      </div>
    {/if}

    <div class="text">
      <RichText
        bind:this={body}
        {project}
        fragment={text}
        kind="body"
        element={id}
        placeholder={t('project-write-here')}
        autofocus={begin === 'body' ? 'end' : null}
        onaction={bodyAction}
        oncite={onkeep}
      />
    </div>

    {#if node.words}
      <footer><span class="count">{t('project-words', { count: node.words })}</span></footer>
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
  .find {
    flex: none;
    margin: 0 12px;
  }
  .find :global(.search-bar) {
    padding: 5px 0;
    background: transparent;
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
