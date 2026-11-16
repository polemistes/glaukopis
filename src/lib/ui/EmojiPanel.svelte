<script lang="ts">
  /**
   * What the emoji picker shows when it is open: a row of tabs, one for each
   * group, and under it the emojis of the group chosen. It is made anew each
   * time the picker opens, so that the emojis chosen last are those of the
   * time it was opened: choosing several without closing does not shuffle
   * the grid under the pointer.
   */
  import type { Component } from 'svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import Lightbulb from '@lucide/svelte/icons/lightbulb';
  import Leaf from '@lucide/svelte/icons/leaf';
  import Plane from '@lucide/svelte/icons/plane';
  import Shapes from '@lucide/svelte/icons/shapes';
  import Smile from '@lucide/svelte/icons/smile';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Users from '@lucide/svelte/icons/users';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import { EMOJI_COLUMNS, movedInGrid, recentEmojisOf, rememberEmoji } from './emoji';
  import { EMOJIS, EMOJI_GROUP_IDS, type EmojiGroupId } from './emoji-list.generated';
  import { tooltip } from './tooltip';

  interface Props {
    onpick: (emoji: string) => void;
    onclose: () => void;
    stay: boolean;
  }

  let { onpick, onclose, stay }: Props = $props();

  type GroupId = 'recent' | EmojiGroupId;

  const ICONS: Record<GroupId, Component<{ size?: number | string }>> = {
    recent: Clock,
    smileys: Smile,
    people: Users,
    nature: Leaf,
    food: Utensils,
    travel: Plane,
    activities: Trophy,
    objects: Lightbulb,
    symbols: Shapes,
  };

  const names = $derived<Record<GroupId, string>>({
    recent: t('emoji-recent'),
    smileys: t('emoji-smileys'),
    people: t('emoji-people'),
    nature: t('emoji-nature'),
    food: t('emoji-food'),
    travel: t('emoji-travel'),
    activities: t('emoji-activities'),
    objects: t('emoji-objects'),
    symbols: t('emoji-symbols'),
  });

  // The emojis chosen last, as they were when the picker was opened.
  const recent = recentEmojisOf(settings.value.recentEmojis);
  const groups: { id: GroupId; emojis: readonly string[] }[] = [
    ...(recent.length ? [{ id: 'recent' as const, emojis: recent }] : []),
    ...EMOJI_GROUP_IDS.map((id) => ({ id, emojis: EMOJIS[id] })),
  ];

  let shownId = $state<GroupId>(groups[0].id);
  /** The emoji that can be reached with Tab: the one that has the focus, or had it last. */
  let at = $state(0);
  let root = $state<HTMLElement>();

  const shown = $derived(groups.find((group) => group.id === shownId) ?? groups[0]);

  const tabButtons = () => Array.from(root?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
  const emojiButtons = () => Array.from(root?.querySelectorAll<HTMLElement>('[data-emoji]') ?? []);

  // Opened, the focus is on the first emoji; closed, it goes back to what had it,
  // unless something else has taken it by then.
  $effect(() => {
    const mine = root;
    if (!mine) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // A moment later: the popover is moved to where it lies over the rest as it
    // opens, and what has the focus when it is moved loses it.
    let opened = true;
    queueMicrotask(() => {
      if (opened) emojiButtons()[0]?.focus();
    });
    return () => {
      opened = false;
      // It may still be in the picker, which is taken away after this.
      const now = document.activeElement;
      if (before?.isConnected && (!now || now === document.body || mine.contains(now)))
        before.focus();
    };
  });

  function show(id: GroupId) {
    if (id === shownId) return;
    shownId = id;
    at = 0;
  }

  function pick(emoji: string) {
    settings.set('recentEmojis', rememberEmoji(settings.value.recentEmojis, emoji));
    onpick(emoji);
    if (!stay) onclose();
  }

  /** The arrows move among the tabs, and the group of the tab that has the focus is shown. */
  function tabKey(event: KeyboardEvent, from: number) {
    const last = groups.length - 1;
    const to =
      event.key === 'ArrowLeft'
        ? (from + last) % groups.length
        : event.key === 'ArrowRight'
          ? (from + 1) % groups.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (to === null || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    show(groups[to].id);
    tabButtons()[to]?.focus();
  }

  /** The arrows, Home and End move among the emojis; Enter and Space press the one that has the focus, as for any button. */
  function emojiKey(event: KeyboardEvent, from: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const to = movedInGrid(event.key, from, shown.emojis.length);
    if (to === null) return;
    event.preventDefault();
    event.stopPropagation();
    emojiButtons()[to]?.focus();
  }
</script>

<div class="emoji-picker" data-emoji-picker style:--emoji-columns={EMOJI_COLUMNS} bind:this={root}>
  <div class="tabs" role="tablist" aria-label={t('emoji-title')}>
    {#each groups as group, i (group.id)}
      {@const Icon = ICONS[group.id]}
      {@const on = group.id === shown.id}
      <button
        type="button"
        role="tab"
        class="tab"
        class:on
        data-emoji-group={group.id}
        aria-selected={on}
        aria-label={names[group.id]}
        tabindex={on ? 0 : -1}
        use:tooltip={{ text: names[group.id], side: 'top' }}
        onclick={() => show(group.id)}
        onkeydown={(event) => tabKey(event, i)}
      >
        <Icon size={16} />
      </button>
    {/each}
  </div>
  <div class="overline name">{names[shown.id]}</div>
  <div class="grid" role="tabpanel" aria-label={names[shown.id]}>
    {#each shown.emojis as emoji, i (emoji)}
      <button
        type="button"
        class="emoji"
        data-emoji={emoji}
        tabindex={i === at ? 0 : -1}
        onclick={() => pick(emoji)}
        onfocus={() => (at = i)}
        onkeydown={(event) => emojiKey(event, i)}>{emoji}</button
      >
    {/each}
  </div>
</div>

<style>
  .emoji-picker {
    display: flex;
    flex-direction: column;
  }
  .tabs {
    display: flex;
    gap: 2px;
    padding: 6px 6px 0;
  }
  .tab {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 28px;
    min-width: 0;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .tab:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .tab.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .name {
    padding: 8px 12px 2px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--emoji-columns), 32px);
    justify-content: center;
    max-height: 260px;
    padding: 2px 6px 8px;
    overflow-y: auto;
  }
  .emoji {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    font-family: var(--font-emoji), var(--font-ui);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .emoji:hover {
    background: var(--paper-hover);
  }
  .emoji:focus-visible {
    outline-offset: -2px;
  }
</style>
