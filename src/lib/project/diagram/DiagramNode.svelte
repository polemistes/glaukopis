<script lang="ts">
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import FileInput from '@lucide/svelte/icons/file-input';
  import Quote from '@lucide/svelte/icons/quote';
  import type { EditorView } from 'prosemirror-view';
  import { untrack } from 'svelte';
  import RichText from '$lib/editor/RichText.svelte';
  import type { KeyAction } from '$lib/editor/plugins';
  import { t } from '$lib/i18n';
  import { initials } from '$lib/sharing/connection.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Other, Project } from '../model/project.svelte';
  import type { NodeRecord } from '../model/types';
  import type { Placed, Size } from './layout';

  interface Props {
    project: Project;
    node: NodeRecord;
    placed: Placed;
    selected: boolean;
    /** Whether something dragged would be put under this element if dropped now. */
    target: boolean;
    /** Whether the element is being dragged. */
    lifted: boolean;
    renaming: boolean;
    hasChildren: boolean;
    /** Inherited: the element or one above it is left out of the document. */
    excluded: boolean;
    /** Those of the others who are at this element. */
    others?: Other[];
    onsize: (id: string, size: Size | null) => void;
    onrenamed: (id: string, action: KeyAction | 'blur') => void;
    /** What was typed before the name could be written in, and how it was ended: it goes in first. */
    typedAhead?: () => { text: string; then: KeyAction | null } | null;
    ontoggle: (id: string) => void;
    onlinkstart: (id: string, event: PointerEvent) => void;
  }

  let {
    project,
    node,
    placed,
    selected,
    target,
    lifted,
    renaming,
    hasChildren,
    excluded,
    others = [],
    onsize,
    typedAhead,
    onrenamed,
    ontoggle,
    onlinkstart,
  }: Props = $props();

  let el = $state<HTMLDivElement>();

  // Depends on the element alone: the size is reported for as long as it is
  // there, and withdrawn only when it goes.
  $effect(() => {
    if (!el) return;
    const target = el;
    const id = untrack(() => node.id);
    const report = (size: Size | null) => untrack(() => onsize(id, size));
    const measure = () => report({ w: target.offsetWidth, h: target.offsetHeight });
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(target);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      report(null);
    };
  });

  const title = $derived(project.fragment(node.id, 'title'));
  const cited = $derived(node.cited.length);

  function action(a: KeyAction, _view: EditorView): boolean {
    if (a === 'enter' || a === 'escape' || a === 'tab') {
      onrenamed(node.id, a);
      return true;
    }
    return false;
  }
</script>

<div
  bind:this={el}
  class="node depth-{Math.min(placed.depth, 2)} {placed.side}"
  class:root={placed.depth === 0 &&
    placed.parent === null &&
    node.parent === null &&
    project.map(node.map)?.root === node.id}
  class:loose={placed.parent === null && project.map(node.map)?.root !== node.id}
  class:selected
  class:target
  class:lifted
  class:renaming
  class:excluded
  class:plain={!node.heading}
  class:pinned={placed.pinned}
  data-node={node.id}
  style:transform="translate({Math.round(placed.x - placed.w / 2)}px, {Math.round(
    placed.y - placed.h / 2,
  )}px)"
>
  <div class="caption">
    {#if renaming && title}
      <RichText
        {project}
        fragment={title}
        kind="title"
        placeholder={t('diagram-idea')}
        autofocus="all"
        onaction={action}
        onready={(view) => {
          const typed = typedAhead?.();
          if (!typed) return;
          if (typed.text) view.dispatch(view.state.tr.insertText(typed.text));
          if (typed.then) onrenamed(node.id, typed.then);
        }}
        onblur={() => onrenamed(node.id, 'blur')}
        class="rename"
      />
    {:else if node.titleHtml}
      <!-- The name holds only the marks a name can have; its text is escaped. -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="name">{@html node.titleHtml}</span>
    {:else}
      <span class="name unnamed">{t('project-untitled')}</span>
    {/if}
  </div>

  {#if !renaming && (!node.empty || cited || node.include || node.excluded)}
    <div class="marks">
      {#if node.include}<span class="mark include"><FileInput size={11} /></span>{/if}
      {#if !node.empty}<span class="mark"><AlignLeft size={11} /></span>{/if}
      {#if cited}<span class="mark"><Quote size={10} />{cited}</span>{/if}
      {#if node.excluded}<span class="mark"><EyeOff size={11} /></span>{/if}
    </div>
  {/if}

  {#if others.length}
    <div class="others">
      {#each others.slice(0, 3) as o (o.client)}
        <span
          class="other"
          style:background={o.color}
          use:tooltip={t('project-other-here', { name: o.name })}>{initials(o.name)}</span
        >
      {/each}
    </div>
  {/if}

  {#if hasChildren && !renaming}
    <button
      type="button"
      class="fold"
      class:folded={node.collapsed}
      aria-label={node.collapsed ? t('diagram-show-under') : t('diagram-hide-under')}
      tabindex="-1"
      onpointerdown={(e) => e.stopPropagation()}
      onclick={(e) => {
        e.stopPropagation();
        ontoggle(node.id);
      }}
    >
      {node.collapsed ? placed.hidden : '–'}
    </button>
  {/if}

  {#if !renaming}
    <span
      class="link-handle"
      role="presentation"
      title={t('diagram-link-handle')}
      onpointerdown={(e) => {
        e.stopPropagation();
        onlinkstart(node.id, e);
      }}
    ></span>
  {/if}
</div>

<style>
  .node {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    /* The canvas has no width of its own to take a share of. */
    width: max-content;
    max-width: 260px;
    min-height: 34px;
    padding: 6px 13px;
    background: var(--paper-raised);
    border: 1px solid var(--line-strong);
    border-radius: 9px;
    box-shadow: var(--shadow-1);
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 14.5px;
    line-height: 1.3;
    cursor: default;
    will-change: transform;
    transition:
      box-shadow var(--fast) var(--ease),
      border-color var(--fast) var(--ease),
      opacity var(--fast) var(--ease);
  }
  .node.root {
    max-width: 320px;
    min-height: 46px;
    padding: 10px 22px;
    background: var(--accent);
    border-color: var(--accent-strong);
    border-radius: 14px;
    color: var(--accent-ink);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.005em;
    box-shadow: var(--shadow-2);
  }
  .node.depth-1:not(.loose) {
    font-weight: 600;
    font-size: 15px;
  }
  .node.depth-2 {
    background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
    border-color: var(--line);
    box-shadow: none;
  }
  .node.loose {
    border-style: dashed;
    background: var(--paper);
  }
  .node.plain .name {
    font-style: italic;
    font-weight: 400;
    color: var(--ink-2);
  }
  .node.excluded {
    opacity: 0.5;
  }
  .node:hover {
    border-color: var(--ink-4);
  }
  .node.selected {
    border-color: var(--accent);
    box-shadow:
      0 0 0 2px var(--focus-ring),
      var(--shadow-1);
  }
  .node.root.selected {
    box-shadow:
      0 0 0 3px var(--focus-ring),
      var(--shadow-2);
  }
  .node.target {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--ink);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .node.lifted {
    opacity: 0.85;
    box-shadow: var(--shadow-3);
    z-index: 5;
    transition: none;
  }
  .node.renaming {
    z-index: 6;
    border-color: var(--accent);
    box-shadow:
      0 0 0 3px var(--focus-ring),
      var(--shadow-2);
    background: var(--paper-raised);
    color: var(--ink);
    cursor: text;
  }
  .caption {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .caption :global(.rename) {
    min-width: 60px;
  }
  .caption :global(.rename .prose) {
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    font-variant-numeric: normal;
  }
  .unnamed {
    color: var(--ink-4);
    font-style: italic;
    font-weight: 400;
  }
  .root .unnamed {
    color: color-mix(in srgb, var(--accent-ink) 60%, transparent);
  }
  .others {
    position: absolute;
    top: -9px;
    right: -7px;
    display: flex;
    pointer-events: auto;
  }
  .other {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: -4px;
    border: 1.5px solid var(--canvas);
    border-radius: 50%;
    color: #fff;
    font-family: var(--font-ui);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .marks {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: none;
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: 10.5px;
    font-weight: 500;
  }
  .root .marks {
    color: color-mix(in srgb, var(--accent-ink) 70%, transparent);
  }
  .mark {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .mark.include {
    color: var(--gold);
  }

  .fold {
    position: absolute;
    top: 50%;
    width: 18px;
    height: 18px;
    margin-top: -9px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper-raised);
    color: var(--ink-3);
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .right .fold {
    right: -24px;
  }
  .left .fold {
    left: -24px;
  }
  .root .fold {
    display: none;
  }
  .node:hover .fold,
  .node.selected .fold,
  .fold.folded {
    opacity: 1;
  }
  .fold.folded {
    min-width: 18px;
    width: auto;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent-strong);
  }
  .fold:hover {
    border-color: var(--accent);
    color: var(--accent-strong);
  }

  .link-handle {
    position: absolute;
    bottom: -6px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid var(--paper-raised);
    background: var(--gold);
    cursor: crosshair;
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity var(--fast) var(--ease),
      transform var(--fast) var(--ease);
  }
  .right .link-handle {
    right: 10px;
  }
  .left .link-handle {
    left: 10px;
  }
  .node:hover .link-handle,
  .node.selected .link-handle {
    opacity: 1;
    transform: scale(1);
  }
  .link-handle:hover {
    transform: scale(1.35) !important;
  }
</style>
