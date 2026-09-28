<script lang="ts">
  import FileInput from '@lucide/svelte/icons/file-input';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import type { EditorView } from 'prosemirror-view';
  import type { KeyAction } from '$lib/editor/plugins';
  import RichText, { type FocusAt } from '$lib/editor/RichText.svelte';
  import { blocksHtml } from '../model/html';
  import { hydrate } from '$lib/figures/hydrate.svelte';
  import { initials } from '$lib/sharing/connection.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Other, Project } from '../model/project.svelte';
  import { readBody } from '../model/text';
  import type { NodeRecord } from '../model/types';

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
    return body ? blocksHtml(readBody(body)) : '';
  });
  const included = $derived(node.include ? project.map(node.include) : undefined);

  $effect(() => {
    onready?.(node.id, active ? { title: titleEditor, body: bodyEditor } : null);
  });

  function press(event: MouseEvent, part: Part) {
    if (linkable) {
      event.preventDefault();
      onpick(node.id);
      return;
    }
    if (active) return;
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
  data-section={node.id}
>
  <div class="gutter">
    <button
      type="button"
      class="grip"
      aria-label="Move or change this element"
      tabindex="-1"
      onpointerdown={(e) => ongrip(node.id, e)}
      onclick={(e) => onmenu(node.id, e, e.currentTarget)}
    >
      <GripVertical size={15} />
    </button>
    {#each others.slice(0, 3) as o (o.client)}
      <span class="other" style:background={o.color} use:tooltip={`${o.name} is here`}
        >{initials(o.name)}</span
      >
    {/each}
  </div>

  <div class="content">
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="heading" data-part="title" onmousedown={(e) => press(e, 'title')}>
      {#if !node.heading && level > 0}<span class="tag">not printed</span>{/if}
      {#if active && title}
        <RichText
          bind:this={titleEditor}
          {project}
          fragment={title}
          kind="title"
          placeholder={level === 0 ? 'Title' : 'Name of the element'}
          autofocus={focus?.part === 'title' ? focus.at : null}
          onaction={(a, v) => onaction(node.id, 'title', a, v)}
          onfocus={() => onfocused(node.id, 'title')}
        />
      {:else if node.titleHtml}
        <!-- The name holds only the marks a name can have; its text is escaped. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="prose title static">{@html node.titleHtml}</div>
      {:else}
        <div class="prose title static unnamed">
          {level === 0 ? 'Title' : 'Name of the element'}
        </div>
      {/if}
    </div>

    {#if included}
      <button type="button" class="include" onclick={() => onopenmap(included.id)}>
        <FileInput size={14} />
        <span>In the document, the map <strong>{included.name}</strong> stands here.</span>
        <span class="go">Open it</span>
      </button>
    {/if}

    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="body" data-part="body" onmousedown={(e) => press(e, 'body')}>
      {#if active && body}
        <RichText
          bind:this={bodyEditor}
          {project}
          fragment={body}
          kind="body"
          placeholder={level === 0 && !loose
            ? 'Write here, or press Ctrl+Enter to begin the first section.'
            : ''}
          autofocus={focus?.part === 'body' ? focus.at : null}
          onaction={(a, v) => onaction(node.id, 'body', a, v)}
          onfocus={() => onfocused(node.id, 'body')}
          oncite={onkeep}
        />
      {:else if html}
        <!-- Made by blocksHtml, which escapes all text. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="prose body static" use:hydrate={html}>{@html html}</div>
      {:else}
        <div class="prose body static blank">&nbsp;</div>
      {/if}
    </div>
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
    padding: 0 8px 0 0;
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
    min-width: 0;
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
