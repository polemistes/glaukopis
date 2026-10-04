<!--
  The head of the panel at the side of a project: what it can show, as tabs.
  The references, the pictures, the comments, the citations that were found,
  the history and the changes have the one place, and are one at a time. A
  tab may carry a count, as of the citations that are left to go through.
  The panel puts its own tools, and the way to close it, after these.
-->
<script lang="ts" module>
  export type SideKind = 'references' | 'pictures' | 'comments' | 'found' | 'history' | 'changes';
</script>

<script lang="ts">
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import FileDiff from '@lucide/svelte/icons/file-diff';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import Images from '@lucide/svelte/icons/images';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import { t } from '$lib/i18n';
  import { tooltip } from '$lib/ui/tooltip';

  interface Props {
    current: SideKind;
    onpick: (kind: SideKind) => void;
    /** What a tab counts, where it counts anything: shown beside it. */
    counts?: Partial<Record<SideKind, number>>;
  }

  let { current, onpick, counts = {} }: Props = $props();

  const kinds = $derived([
    {
      kind: 'references' as const,
      label: t('project-references'),
      icon: BookMarked,
      shortcut: 'Ctrl+Shift+R',
    },
    {
      kind: 'pictures' as const,
      label: t('project-pictures'),
      icon: Images,
      shortcut: 'Ctrl+Shift+P',
    },
    {
      kind: 'comments' as const,
      label: t('comments-title'),
      icon: MessageSquare,
      shortcut: 'Ctrl+Shift+M',
    },
    {
      kind: 'found' as const,
      label: t('found-tab'),
      icon: TextSearch,
      shortcut: 'Ctrl+Shift+T',
    },
    {
      kind: 'history' as const,
      label: t('history-title'),
      icon: HistoryIcon,
      shortcut: 'Ctrl+Shift+H',
    },
    {
      kind: 'changes' as const,
      label: t('review-title'),
      icon: FileDiff,
      shortcut: 'Ctrl+Shift+E',
    },
  ]);

  function onkeydown(event: KeyboardEvent) {
    const i = kinds.findIndex((k) => k.kind === current);
    const by = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!by) return;
    event.preventDefault();
    const next = kinds[(i + by + kinds.length) % kinds.length];
    onpick(next.kind);
    requestAnimationFrame(() =>
      (event.currentTarget as HTMLElement | null)
        ?.querySelector<HTMLElement>(`[data-kind="${next.kind}"]`)
        ?.focus(),
    );
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="side-tabs" role="tablist" aria-label={t('project-side-tabs')} {onkeydown}>
  {#each kinds as k (k.kind)}
    {@const Icon = k.icon}
    {@const chosen = k.kind === current}
    <button
      type="button"
      role="tab"
      data-kind={k.kind}
      aria-selected={chosen}
      aria-label={k.label}
      tabindex={chosen ? 0 : -1}
      class:chosen
      use:tooltip={chosen ? null : { text: k.label, shortcut: k.shortcut }}
      onclick={() => onpick(k.kind)}
    >
      <Icon size={15} />
      {#if chosen}<span class="label">{k.label}</span>{/if}
      {#if counts[k.kind]}<span class="count">{counts[k.kind]}</span>{/if}
    </button>
  {/each}
</div>
<span class="spacer"></span>

<style>
  .side-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  button:hover {
    background: var(--paper-hover);
    color: var(--ink-2);
  }
  button.chosen {
    padding-right: 10px;
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .label {
    font-size: var(--text-md);
    font-weight: 600;
    white-space: nowrap;
  }
  .count {
    min-width: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 16px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  button.chosen .count {
    background: var(--paper);
  }
  .spacer {
    flex: 1;
  }
</style>
