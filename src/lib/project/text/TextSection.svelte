<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import FileInput from '@lucide/svelte/icons/file-input';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import type { EditorView } from 'prosemirror-view';
  import type { KeyAction } from '$lib/editor/plugins';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import RichText, { type FocusAt } from '$lib/editor/RichText.svelte';
  import { blocksHtml } from '../model/html';
  import { hydrate } from '$lib/figures/hydrate.svelte';
  import { pressedFound } from '$lib/found/found.svelte';
  import { t } from '$lib/i18n';
  import { drawnWordAt, spellingMarks } from '$lib/spelling/drawn';
  import { initials } from '$lib/sharing/connection.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Other, Project } from '../model/project.svelte';
  import { readBody } from '../model/text';
  import type { NodeRecord } from '../model/types';
  import { saidWords } from '../elements';
  import { kindColour } from '../kinds';
  import { describeWhen } from '$lib/timeline/solve';
  import { pieces } from '../pieces';
  import { reviewing } from '$lib/review/context';
  import { reviewDrawn } from '$lib/review/drawn';
  import { markReview } from '$lib/review/editor';
  import { marksIn } from '$lib/review/marks';

  export type Part = 'title' | 'body';

  interface Props {
    project: Project;
    node: NodeRecord;
    /** 0 for the centre of the map, which is the title of the document. */
    level: number;
    /** Whether the editors are there; otherwise the text is shown as it stands. */
    active: boolean;
    /** Where the cursor goes when the editors appear. */
    focus: { part: Part; at: FocusAt } | null;
    selected: boolean;
    /** Left out of the document, itself or by what it is under. */
    excluded: boolean;
    loose: boolean;
    /** Where something dragged would go, if dropped now. */
    drop: 'before' | 'after' | 'inside' | null;
    /** Whether an association is being made and this element could be its other end. */
    linkable: boolean;
    /** Those of the others who are at this element. */
    others?: Other[];
    /** Whether it has text or something under it, which can be folded away. */
    foldable?: boolean;
    /** What is folded away of it, when it is folded: the elements under it, its own text, the words of all of it. */
    hidden?: { parts: number; text: boolean; words: number } | null;
    /** Whether something under it is folded. */
    openable?: boolean;
    /** Folds it away, or opens it; with `all`, opens all that is folded under it as well. */
    onfold?: (id: string, all: boolean) => void;
    onactivate: (id: string, part: Part, at: FocusAt) => void;
    onaction: (id: string, part: Part, action: KeyAction, view: EditorView) => boolean;
    onfocused: (id: string, part: Part) => void;
    ongrip: (id: string, event: PointerEvent) => void;
    onmenu: (id: string, event: MouseEvent, anchor: HTMLElement) => void;
    onpick: (id: string) => void;
    onkeep: (ref: string) => void;
    onopenmap: (id: string) => void;
    onready?: (
      id: string,
      editors: { title?: ReturnType<typeof RichText>; body?: ReturnType<typeof RichText> } | null,
    ) => void;
  }

  let {
    project,
    node,
    level,
    active,
    focus,
    selected,
    excluded,
    loose,
    others = [],
    foldable = false,
    hidden = null,
    openable = false,
    onfold,
    drop,
    linkable,
    onactivate,
    onaction,
    onfocused,
    ongrip,
    onmenu,
    onpick,
    onkeep,
    onopenmap,
    onready,
  }: Props = $props();

  let titleEditor = $state<ReturnType<typeof RichText>>();
  let bodyEditor = $state<ReturnType<typeof RichText>>();

  const title = $derived(project.fragment(node.id, 'title'));
  const body = $derived(project.fragment(node.id, 'body'));
  const html = $derived.by(() => {
    if (active) return '';
    // The record is made anew whenever the text changes.
    void node.words;
    void node.cited;
    return body ? blocksHtml(readBody(body), project.map(node.map)?.document.language) : '';
  });
  const included = $derived(node.include ? project.map(node.include) : undefined);
  /** Where the map it stands for is in the document, with the map's name in bold. */
  const includedWords = $derived(
    included ? pieces((m) => t('text-include', m), { map: included.name }) : [],
  );
  /** The language of the map, whose spelling the text is checked by. */
  const language = $derived(project.map(node.map)?.document.language ?? null);
  /** Its kind, where it has one: a tag by its name. */
  const kind = $derived(project.kind(node.kind));
  /** The threads of comments on it that are open: a marker in the right margin. */
  const commented = $derived(project.threadsOf(node.id).filter((th) => !th.resolved));

  $effect(() => {
    const id = node.id;
    onready?.(id, active ? { title: titleEditor, body: bodyEditor } : null);
    // Folded away or taken away, its editors are no longer there.
    return () => onready?.(id, null);
  });

  // The changes that are reviewed, where they are in the name and the text.
  const review = reviewing();
  const marks = $derived(marksIn(review?.review?.marked ?? null, node.id));
  const changedAsElement = $derived(review?.review?.marked.elements.get(node.id)?.[0] ?? null);
  $effect(() => {
    const given = marks;
    if (!active) return;
    // The editors are made a moment after the section is.
    const frame = requestAnimationFrame(() => {
      for (const editor of [titleEditor, bodyEditor]) {
        const view = editor?.getView();
        if (view) markReview(view, given);
      }
    });
    return () => cancelAnimationFrame(frame);
  });

  /** What is folded away, in words. */
  const away = $derived.by(() => {
    if (!hidden) return '';
    return t('text-folded', {
      text: hidden.text ? 'yes' : 'no',
      parts: hidden.parts,
      words: hidden.words,
    });
  });

  function press(event: MouseEvent, part: Part) {
    if (linkable) {
      event.preventDefault();
      onpick(node.id);
      return;
    }
    if (active) return;
    // A misspelt word has its menu where it stands.
    if (event.button === 2 && drawnWordAt(event.clientX, event.clientY)) return;
    // A citation that was found is gone through where it is pressed, as a citation is changed.
    if (part === 'body' && event.button === 0 && pressedFound(event.target, node.map)) {
      event.preventDefault();
      return;
    }
    onactivate(node.id, part, { left: event.clientX, top: event.clientY });
  }
</script>

<section
  class="section level-{Math.min(level, 4)}"
  class:selected
  class:excluded
  class:loose
  class:plain={!node.heading && level > 0}
  class:linkable
  class:drop-before={drop === 'before'}
  class:drop-after={drop === 'after'}
  class:drop-inside={drop === 'inside'}
  class:folded={!!hidden}
  data-section={node.id}
  class:commented={commented.length > 0}
  data-folded={hidden ? '' : undefined}
  data-review={changedAsElement?.kind}
  data-change={changedAsElement?.change}
  class:review-current={changedAsElement?.current}
  style:--by={changedAsElement?.colour}
>
  <div class="gutter">
    {#if foldable}
      <button
        type="button"
        class="fold"
        aria-expanded={!hidden}
        aria-label={hidden ? t('text-open') : t('text-fold')}
        tabindex="-1"
        use:tooltip={{
          text: hidden
            ? openable
              ? t('text-open-shift')
              : t('text-open')
            : openable
              ? t('text-fold-shift')
              : t('text-fold-hint'),
          side: 'top',
        }}
        onmousedown={(e) => e.preventDefault()}
        onclick={(e) => onfold?.(node.id, e.shiftKey)}
      >
        {#if hidden}<ChevronRight size={15} />{:else}<ChevronDown size={15} />{/if}
      </button>
    {/if}
    <button
      type="button"
      class="grip"
      aria-label={t('text-grip')}
      tabindex="-1"
      onpointerdown={(e) => ongrip(node.id, e)}
      onclick={(e) => onmenu(node.id, e, e.currentTarget)}
    >
      <GripVertical size={15} />
    </button>
    {#each others.slice(0, 3) as o (o.client)}
      <span
        class="other"
        style:background={o.color}
        use:tooltip={t('project-other-here', { name: o.name })}>{initials(o.name)}</span
      >
    {/each}
  </div>

  <div class="content">
    {#if commented.length && !hidden}
      <button
        type="button"
        class="comment-marker"
        aria-label={t('comments-mark', { count: commented.length })}
        use:tooltip={{ text: t('comments-mark', { count: commented.length }), side: 'left' }}
        tabindex="-1"
        onmousedown={(e) => e.preventDefault()}
        onclick={() => commentsUi.show(commented[0].id)}
      >
        <MessageSquare size={13} />{#if commented.length > 1}<span>{commented.length}</span>{/if}
      </button>
    {/if}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="heading" data-part="title" onmousedown={(e) => press(e, 'title')}>
      {#if kind}
        <span class="tag kind" style:--kind={kindColour(kind.colour).ink}
          ><span class="dot"></span>{kind.name}</span
        >
      {/if}
      {#if node.when}
        <span class="tag when"
          >{describeWhen(
            node.when,
            (id) => project.node(id)?.title || t('project-untitled'),
            saidWords(),
          )}</span
        >
      {/if}
      {#if !node.heading && level > 0}<span class="tag">{t('text-not-printed')}</span>{/if}
      {#if active && title}
        <RichText
          bind:this={titleEditor}
          {project}
          fragment={title}
          kind="title"
          placeholder={level === 0 ? t('text-title') : t('text-name')}
          autofocus={focus?.part === 'title' ? focus.at : null}
          onaction={(a, v) => onaction(node.id, 'title', a, v)}
          onfocus={() => onfocused(node.id, 'title')}
        />
      {:else if node.titleHtml}
        <!-- The name holds only the marks a name can have; its text is escaped. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div
          class="prose title static"
          use:spellingMarks={{
            project,
            element: node.id,
            part: 'title',
            language,
            ignored: project.ignored,
            html: node.titleHtml,
          }}
          use:reviewDrawn={{ marks, part: 'title', fragment: title, html: node.titleHtml }}
        >
          {@html node.titleHtml}
        </div>
      {:else}
        <div class="prose title static unnamed">
          {level === 0 ? t('text-title') : t('text-name')}
        </div>
      {/if}
    </div>

    {#if included && !hidden}
      <button type="button" class="include" onclick={() => onopenmap(included.id)}>
        <FileInput size={14} />
        <span>
          {#each includedWords as piece, i (i)}
            {#if piece.name}<strong>{piece.text}</strong>{:else}{piece.text}{/if}
          {/each}
        </span>
        <span class="go">{t('text-include-open')}</span>
      </button>
    {/if}

    {#if !hidden}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="body" data-part="body" onmousedown={(e) => press(e, 'body')}>
        {#if active && body}
          <RichText
            bind:this={bodyEditor}
            {project}
            fragment={body}
            kind="body"
            element={node.id}
            placeholder={level === 0 && !loose ? t('text-first-section') : ''}
            autofocus={focus?.part === 'body' ? focus.at : null}
            onaction={(a, v) => onaction(node.id, 'body', a, v)}
            onfocus={() => onfocused(node.id, 'body')}
            oncite={onkeep}
          />
        {:else if html}
          <!-- Made by blocksHtml, which escapes all text. -->
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <div
            class="prose body static"
            use:hydrate={{ html, project, element: node.id }}
            use:spellingMarks={{
              project,
              element: node.id,
              part: 'body',
              language,
              ignored: project.ignored,
              html,
            }}
            use:reviewDrawn={{ marks, part: 'body', fragment: body, html }}
          >
            {@html html}
          </div>
        {:else}
          <div class="prose body static blank">&nbsp;</div>
        {/if}
      </div>
    {:else}
      <div class="away">
        <button type="button" class="open" onclick={(e) => onfold?.(node.id, e.shiftKey)}>
          <ChevronRight size={13} />
          <span>{away}</span>
        </button>
        {#if openable}
          <button type="button" class="all" onclick={() => onfold?.(node.id, true)}>
            {t('text-open-all')}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .other {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin: 4px auto 0;
    border-radius: 50%;
    color: #fff;
    font-family: var(--font-ui);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .section {
    position: relative;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 0;
  }
  .gutter {
    display: flex;
    justify-content: flex-end;
    padding: 0 4px 0 0;
  }
  .fold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 26px;
    margin-top: var(--grip-top, 4px);
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    /* Seen faintly at all times, so that it is known what can be folded. */
    opacity: 0.4;
    transition: opacity var(--fast) var(--ease);
  }
  .section:hover > .gutter .fold,
  .section.selected > .gutter .fold,
  .section.folded > .gutter .fold {
    opacity: 1;
  }
  .section.folded > .gutter .fold {
    color: var(--accent-strong);
  }
  .fold:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .away {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0.35em 0 0.2em;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .away button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 9px 0 6px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    cursor: pointer;
  }
  .away .open {
    border-color: var(--line);
    background: var(--paper-raised, var(--paper));
  }
  .away .all {
    padding: 0 8px;
    color: var(--accent-strong);
  }
  .away button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .grip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 26px;
    margin-top: var(--grip-top, 4px);
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: grab;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .section:hover > .gutter .grip,
  .section.selected > .gutter .grip {
    opacity: 1;
  }
  .grip:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .content {
    position: relative;
    min-width: 0;
  }
  /* An element with open comments: a line of the comments' colour at the left of its name. */
  .section.commented > .content > .heading {
    box-shadow: inset 3px 0 0 var(--gold);
    padding-left: 10px;
    margin-left: -13px;
  }
  /* In the right margin, by the name of the element. */
  .comment-marker {
    position: absolute;
    top: var(--grip-top, 4px);
    right: -34px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 22px;
    padding: 0 4px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--gold);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .comment-marker:hover {
    background: var(--accent-soft);
  }

  .heading {
    position: relative;
    cursor: text;
  }
  .heading :global(.prose.title) {
    font-family: var(--font-text);
    color: var(--ink);
  }
  .unnamed {
    color: var(--ink-4) !important;
    font-style: italic;
    font-weight: 400 !important;
  }
  .static {
    white-space: pre-wrap;
  }
  .static.blank {
    min-height: 0.8em;
    line-height: 0.8;
  }
  .body {
    cursor: text;
  }

  /* The title of the document */
  .level-0 {
    margin-bottom: 1.2em;
    --grip-top: 10px;
  }
  .level-0 .heading :global(.prose.title) {
    font-size: 2em;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
    margin-bottom: 0.5em;
  }
  .level-1 {
    margin-top: 1.9em;
    --grip-top: 3px;
  }
  .level-1 .heading :global(.prose.title) {
    font-size: 1.42em;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 0.4em;
  }
  .level-2 {
    margin-top: 1.5em;
    --grip-top: 0px;
  }
  .level-2 .heading :global(.prose.title) {
    font-size: 1.16em;
    font-weight: 600;
    margin-bottom: 0.3em;
  }
  .level-3 {
    margin-top: 1.2em;
    --grip-top: -2px;
  }
  .level-3 .heading :global(.prose.title) {
    font-size: 1em;
    font-weight: 600;
    font-style: italic;
    margin-bottom: 0.2em;
  }
  .level-4 {
    margin-top: 1em;
    --grip-top: -2px;
  }
  .level-4 .heading :global(.prose.title) {
    font-size: 1em;
    font-weight: 400;
    font-style: italic;
    margin-bottom: 0.15em;
  }

  /* A name that is a label for the writer only */
  .plain {
    margin-top: 0.9em;
    --grip-top: -4px;
  }
  .plain .heading {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .plain .heading :global(.rich-text) {
    flex: 1;
  }
  .plain .heading :global(.prose.title) {
    font-family: var(--font-ui);
    font-size: 0.7em;
    font-weight: 600;
    font-style: normal;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 0.15em;
  }
  .tag {
    order: 2;
    flex: none;
    font-family: var(--font-ui);
    font-size: 10.5px;
    color: var(--ink-4);
    font-style: italic;
    user-select: none;
  }

  .tag.kind {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 10px;
    color: var(--kind);
    font-style: normal;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .tag.when {
    margin-right: 10px;
    font-style: normal;
    color: var(--ink-3);
  }
  .tag.kind .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--kind);
  }

  .excluded > .content {
    opacity: 0.45;
  }
  .excluded > .content::before {
    content: '';
    position: absolute;
    left: 38px;
    top: 0;
    bottom: 0;
    width: 2px;
    border-radius: 2px;
    background: repeating-linear-gradient(var(--ink-4) 0 4px, transparent 4px 8px);
  }
  .loose > .content {
    padding: 10px 14px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-m);
  }
  .loose {
    margin-top: 0.9em;
  }

  .linkable .heading {
    cursor: crosshair;
    border-radius: var(--radius-s);
    outline: 1px dashed var(--gold);
    outline-offset: 4px;
  }

  .section::before,
  .section::after {
    content: '';
    position: absolute;
    left: 44px;
    right: 0;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
    opacity: 0;
    pointer-events: none;
  }
  .section::before {
    top: -0.55em;
  }
  .section::after {
    bottom: -0.55em;
  }
  .drop-before::before,
  .drop-after::after {
    opacity: 1;
  }
  .drop-inside::after {
    opacity: 1;
    left: 76px;
  }

  .include {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    margin: 0.2em 0 0.6em;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-left: 2px solid var(--gold);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink-2);
    font-family: var(--font-ui);
    font-size: var(--text-md);
    text-align: left;
    cursor: pointer;
  }
  .include :global(svg) {
    color: var(--gold);
    flex: none;
  }
  .include .go {
    margin-left: auto;
    color: var(--accent-strong);
    font-weight: 500;
  }
  .include:hover {
    background: var(--paper-hover);
  }
</style>
