<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleOff from '@lucide/svelte/icons/circle-off';
  import FileInput from '@lucide/svelte/icons/file-input';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import Maximize2 from '@lucide/svelte/icons/maximize-2';
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import type { EditorView } from 'prosemirror-view';
  import type { KeyAction } from '$lib/editor/plugins';
  import type { TextDepth } from '$lib/api/system';
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
  import { isDoubled, kindLabel } from '../parts';
  import { describeWhen } from '$lib/timeline/solve';
  import { pieces } from '../pieces';
  import { reviewing } from '$lib/review/context';
  import { reviewDrawn } from '$lib/review/drawn';
  import { markReview } from '$lib/review/editor';
  import { marksIn } from '$lib/review/marks';

  export type Part = 'title' | 'body';

  interface Props {
    project: Project;
    /** The element in view, whose document this is part of. */
    at: string;
    node: NodeRecord;
    /** 0 for the element in view, whose name is the title of the document. */
    level: number;
    /** How deep it stands is shown: by its number, by dots, or set in, with lines. On the screen only. */
    depthShown?: TextDepth;
    /** Its number, as in an outline, where it has one: its name is printed as a heading. */
    number?: string | null;
    /** Whether the editors are there; otherwise the text is shown as it stands. */
    active: boolean;
    /** Where the cursor goes when the editors appear. */
    focus: { part: Part; at: FocusAt } | null;
    selected: boolean;
    /** Left out of the document, itself or by what it is under. */
    excluded: boolean;
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
    /** Enters an element: this one, by the button by its name, or the one it stands for. */
    onenter: (id: string) => void;
    /** On the element in view: goes up, to the element over it, by the button by its name. */
    onleave?: () => void;
    onready?: (
      id: string,
      editors: { title?: ReturnType<typeof RichText>; body?: ReturnType<typeof RichText> } | null,
    ) => void;
  }

  let {
    project,
    at,
    node,
    level,
    depthShown = 'numbers',
    number = null,
    active,
    focus,
    selected,
    excluded,
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
    onenter,
    onleave,
    onready,
  }: Props = $props();

  let titleEditor = $state<ReturnType<typeof RichText>>();
  let bodyEditor = $state<ReturnType<typeof RichText>>();

  const title = $derived(project.fragment(node.id, 'title'));
  const body = $derived(project.fragment(node.id, 'body'));
  /** The language of the text, as the element or one over it says it: its spelling is checked by it. */
  const language = $derived(project.documentOf(node.id).settings.language ?? null);
  const html = $derived.by(() => {
    if (active) return '';
    // The record is made anew whenever the text changes.
    void node.words;
    void node.cited;
    return body ? blocksHtml(readBody(body), language) : '';
  });
  /** The element it stands for in the document, where it stands for one. */
  const included = $derived(node.include ? project.node(node.include) : undefined);
  /** Where that element is in the document, with its name in bold. */
  const includedWords = $derived(
    included
      ? pieces((m) => t('text-include', m), { name: included.title || t('project-untitled') })
      : [],
  );
  /** Its kind, where it has one: a tag by its name. */
  const kind = $derived(kindLabel(project, node.kind));
  /** A second of a kind the document has one of, among its siblings: not printed. */
  const doubled = $derived(!!kind?.part && isDoubled(project, node.id));
  /** The threads of comments on it that are open: a marker in the right margin. */
  const commented = $derived(project.threadsOf(node.id).filter((th) => !th.resolved));
  /** The name of the element over it, which going up enters: said only of the element in view. */
  const above = $derived.by(() => {
    if (level !== 0 || !onleave) return '';
    const parent = project.tree().parent.get(node.id);
    return (parent && project.node(parent)?.title) || t('project-untitled');
  });

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

  /** What stands in the gutter for how deep it is, while the pointer is not on it: a number, or dots. */
  const mark = $derived(
    level === 0 || depthShown === 'indent' ? null : depthShown === 'numbers' ? number : level,
  );

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
    if (part === 'body' && event.button === 0 && pressedFound(event.target, at)) {
      event.preventDefault();
      return;
    }
    onactivate(node.id, part, { left: event.clientX, top: event.clientY });
  }

  /**
   * A press in the gaps of the section, beside its name and text or between
   * them: the cursor goes into the nearer of the two, where the press was,
   * rather than the focus being lost.
   */
  function pressGap(event: MouseEvent) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.heading, .body, .away, .include, button, a, input')) return;
    if (linkable) {
      event.preventDefault();
      onpick(node.id);
      return;
    }
    const section = event.currentTarget as HTMLElement;
    const heading = section.querySelector<HTMLElement>(':scope > .content > .heading');
    const text = section.querySelector<HTMLElement>(':scope > .content > .body');
    if (!heading) return;
    event.preventDefault();
    const within = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
      return {
        left: clamp(event.clientX, r.left + 1, r.right - 1),
        top: clamp(event.clientY, r.top + 1, r.bottom - 1),
      };
    };
    if (text && event.clientY >= heading.getBoundingClientRect().bottom)
      onactivate(node.id, 'body', within(text));
    else onactivate(node.id, 'title', within(heading));
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  onmousedown={pressGap}
  class="section level-{Math.min(level, 4)} depth-{depthShown}"
  style:--level={level}
  class:selected
  class:excluded
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
    {#if depthShown === 'indent' && level > 1}
      <!-- A faint line for each level over it, down from the names of those it is under. -->
      {#each Array.from({ length: level - 1 }, (_, i) => i + 1) as over (over)}
        <span class="guide" aria-hidden="true" style:--over={over}></span>
      {/each}
    {/if}
    {#if mark !== null}
      <span class="depth" aria-hidden="true">
        {#if typeof mark === 'string'}{mark}{:else}{#each Array.from({ length: mark }, (_, i) => i) as i (i)}<i
            ></i>{/each}{/if}
      </span>
    {/if}
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
    {#if level > 0}
      <button
        type="button"
        class="corner enter"
        aria-label={t('text-open-as-map')}
        use:tooltip={{ text: t('text-open-as-map'), shortcut: 'Alt+Shift+↓', side: 'top' }}
        tabindex="-1"
        onmousedown={(e) => e.preventDefault()}
        onclick={() => onenter(node.id)}
      >
        <Maximize2 size={11} />
      </button>
    {:else if onleave}
      <button
        type="button"
        class="corner leave"
        aria-label={t('project-leave-map', { name: above })}
        use:tooltip={{
          text: t('project-leave-map', { name: above }),
          shortcut: 'Alt+Shift+↑',
          side: 'top',
        }}
        tabindex="-1"
        onmousedown={(e) => e.preventDefault()}
        onclick={() => onleave()}
      >
        <Minimize2 size={11} />
      </button>
    {/if}
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
          ><span class="dot"></span>{kind.name}{#if doubled}<span
              class="doubled"
              title={t('parts-doubled')}><CircleOff size={10} /></span
            >{/if}</span
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
      <button type="button" class="include" onclick={() => onenter(included.id)}>
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
            {at}
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
            use:hydrate={{ html, project, element: node.id, at }}
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
    position: relative;
    display: flex;
    justify-content: flex-end;
    padding: 0 4px 0 0;
  }
  /*
   * Opens the element as a map, or, on the element in view, goes up: before
   * the grip, out in the margin, while the pointer is at the name or beside it.
   */
  .corner {
    position: absolute;
    top: calc(var(--grip-top, 4px) + 3px);
    right: 100%;
    width: 20px;
    height: 20px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--accent);
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent-strong);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--fast) var(--ease);
  }
  .section:has(> .content > .heading:hover) > .gutter .corner,
  .section > .gutter:hover .corner {
    opacity: 1;
    pointer-events: auto;
  }
  .corner:hover {
    background: var(--accent);
    color: var(--accent-ink);
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

  /*
   * How deep it stands, on the screen only: its number as in an outline, or
   * a dot for each level, faint before the chevron, out in the margin, until
   * the pointer comes, when the button to enter takes its place.
   */
  .depth {
    position: absolute;
    top: calc(var(--grip-top, 4px) + 4px);
    right: calc(100% + 3px);
    display: flex;
    align-items: center;
    gap: 3px;
    height: 18px;
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    transition: opacity var(--fast) var(--ease);
  }
  .depth i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.7;
  }
  .section:has(> .content > .heading:hover) > .gutter .depth,
  .section > .gutter:hover .depth {
    opacity: 0;
  }

  /*
   * Set in: each level a step further in, the steps smaller and fewer in a
   * narrow column, with a faint line for each level over it, down from the
   * chevron of the element it is under.
   */
  .section.depth-indent {
    --step: min(24px, 4cqi);
    --cap: 30cqi;
    margin-left: min(calc((var(--level) - 1) * var(--step)), var(--cap));
  }
  .section.depth-indent.level-0 {
    margin-left: 0;
  }
  .guide {
    position: absolute;
    top: -2em;
    bottom: 0;
    width: 1px;
    left: calc(
      min(calc((var(--over) - 1) * var(--step)), var(--cap)) -
        min(calc((var(--level) - 1) * var(--step)), var(--cap)) + 9px
    );
    background: var(--line);
    pointer-events: none;
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
  /* An empty text is a line high, as it is when it is written in: there is room to press it. */
  .static.blank {
    min-height: 1lh;
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
  .tag.kind .doubled {
    display: inline-flex;
    margin-left: 4px;
    color: var(--ink-3);
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
