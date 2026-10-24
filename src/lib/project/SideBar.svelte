<script lang="ts">
  /**
   * The bar of a side (ADR 0064): icons with tooltips, in this order: the
   * outline; the views, Diagram, Text, and Timeline where the element has
   * times; the writing tools with their three menus, undo and redo of the
   * side's project between them and spelling, and Insert; Typesetting and
   * Document. The × that closes the side stands in the top row, in the
   * side's cell (ADR 0065). While the side shows no text, the writing tools
   * are disabled, not hidden, so that the bar does not shift.
   */
  import Clock from '@lucide/svelte/icons/clock';
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import FileText from '@lucide/svelte/icons/file-text';
  import ListTree from '@lucide/svelte/icons/list-tree';
  import Network from '@lucide/svelte/icons/network';
  import PanelRight from '@lucide/svelte/icons/panel-right';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import type { MapMode } from '$lib/state/router.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Project } from './model/project.svelte';
  import { panes } from './panes.svelte';
  import type { SideSpec } from './sides.svelte';

  interface Props {
    spec: SideSpec;
    /** The side's project, once it is open. */
    project: Project | null;
    /** Whether the side has the focus. */
    focused: boolean;
    /** The element of the side, within which the writing tools find their editor. */
    scope: HTMLElement | undefined;
    /** Whether the element in view has anything to show as a timeline. */
    timed: boolean;
    onview: (mode: MapMode) => void;
    onoutline: () => void;
  }

  let { spec, project, focused, scope, timed, onview, onoutline }: Props = $props();

  const views = $derived([
    { mode: 'diagram' as const, label: t('project-diagram'), icon: Network },
    { mode: 'text' as const, label: t('project-text'), icon: FileText },
    ...(timed || spec.mode === 'timeline'
      ? [{ mode: 'timeline' as const, label: t('timeline-title'), icon: Clock }]
      : []),
  ]);

  /** The views by the arrow keys, as a group of radio buttons is gone through. */
  function onviewkey(event: KeyboardEvent) {
    const i = views.findIndex((v) => v.mode === spec.mode);
    const by = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!by || i < 0) return;
    event.preventDefault();
    const next = views[(i + by + views.length) % views.length];
    onview(next.mode);
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>(`[data-view="${next.mode}"]`)
      ?.focus();
  }

  /** Whether the Document button is lit: the pane is open, and shows this side, which has the focus. */
  const documentShown = $derived(panes.document && focused);

  // A press on the Document button of the side without the focus gives the
  // side the focus before the button hears of it: the pane, which follows
  // the focus, then shows this side, and is not closed. When the side was
  // given the focus is kept for that; it depends on the focus alone.
  let focusedAt = 0;
  $effect(() => {
    if (focused) focusedAt = performance.now();
  });

  function onDocument() {
    if (panes.document && performance.now() - focusedAt < 400) return;
    panes.toggleDocument();
  }
</script>

<div class="bar" data-bar>
  <IconButton
    label={t('text-outline')}
    shortcut={keysFor('text-outline')}
    size="sm"
    active={spec.outline}
    data-outline-button
    onclick={onoutline}
  >
    <ListTree size={15} />
  </IconButton>

  <span class="rule" role="separator"></span>

  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="views" role="radiogroup" aria-label={t('project-view-this')} onkeydown={onviewkey}>
    {#each views as view (view.mode)}
      {@const Icon = view.icon}
      <button
        type="button"
        role="radio"
        class:on={spec.mode === view.mode}
        aria-checked={spec.mode === view.mode}
        aria-label={view.label}
        data-view={view.mode}
        tabindex={spec.mode === view.mode ? 0 : -1}
        use:tooltip={{
          text: view.label,
          shortcut: view.mode === 'timeline' ? undefined : keysFor('diagram-or-text'),
          side: 'bottom',
        }}
        onclick={() => onview(view.mode)}
      >
        <Icon size={15} />
      </button>
    {/each}
  </div>

  <span class="rule" role="separator"></span>

  {#if project}
    <WritingTools {project} {scope} at={spec.at} disabled={spec.mode !== 'text'}>
      {#snippet middle()}
        <!-- In the project of this side. -->
        <IconButton
          label={t('common-undo')}
          shortcut={keysFor('undo')}
          size="sm"
          disabled={!project?.canUndo}
          data-undo
          onclick={() => project?.undo()}
        >
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label={t('project-redo')}
          shortcut={keysFor('redo')}
          size="sm"
          disabled={!project?.canRedo}
          data-redo
          onclick={() => project?.redo()}
        >
          <Redo2 size={15} />
        </IconButton>
      {/snippet}
    </WritingTools>
  {/if}

  <span class="rule" role="separator"></span>

  <IconButton
    label={t('project-bar-typesetting')}
    shortcut={focused ? keysFor('preview') : undefined}
    size="sm"
    active={panes.typesetting === spec.key}
    data-typeset
    onclick={() => panes.typesetFor(spec.key)}
  >
    <BookOpenText size={15} />
  </IconButton>
  <IconButton
    label={t('project-bar-document')}
    size="sm"
    active={documentShown}
    data-document
    onclick={onDocument}
  >
    <PanelRight size={15} />
  </IconButton>
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .views {
    display: inline-flex;
    gap: 1px;
  }
  .views button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .views button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .views button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .rule {
    flex: none;
    width: 1px;
    height: 16px;
    margin: 0 4px;
    background: var(--line);
  }
</style>
