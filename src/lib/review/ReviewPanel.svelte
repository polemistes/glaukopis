<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Check from '@lucide/svelte/icons/check';
  import History from '@lucide/svelte/icons/history';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import X from '@lucide/svelte/icons/x';
  import type { Piece, Version } from '$lib/history/types';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Change } from './grouping';
  import { colour, type Review } from './review.svelte';
  import type { Choice } from './source';

  interface Props {
    review: Review;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
  }

  let { review, onclose, head }: Props = $props();

  let list = $state<HTMLElement>();
  let turning = $state(false);

  const current = $derived(review.current);
  const project = $derived(review.project);

  function when(time: number): string {
    return new Date(time).toLocaleString(languages.current, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function who(id: string | null): string {
    return (id && review.people.get(id)?.name) || t('review-someone');
  }

  function named(element: string | null | undefined): string {
    if (!element) return t('review-gone-element');
    const node = project.node(element);
    return node ? node.title || t('review-untitled') : t('review-gone-element');
  }

  /** What a moment chosen is called. */
  function sinceOf(choice: Choice | null): string {
    if (!choice) return t('review-since-last');
    if (choice.kind === 'beginning') return t('review-since-beginning');
    if (choice.kind === 'named' && choice.name)
      return t('review-since-named', { name: choice.name });
    return t('review-since-session', {
      who: (choice.by ?? []).map(who).join(', ') || t('review-someone'),
      when: when(choice.moment.time),
    });
  }

  async function chooseSince(anchor: HTMLElement) {
    const choices = await review.source.choices();
    const items: MenuItem[] = [
      {
        label: t('review-since-last'),
        checked: !review.chosen,
        action: () => review.choose(null),
      },
      { kind: 'separator' },
      ...choices
        .slice()
        .reverse()
        .map((c): MenuItem => ({
          label: sinceOf(c),
          hint: c.kind === 'named' ? when(c.moment.time) : undefined,
          checked: review.chosen?.moment.snapshot === c.moment.snapshot,
          action: () => review.choose(c),
        })),
    ];
    openMenu(anchor, items, { side: 'bottom', align: 'start' });
  }

  /** What a change is, in words. */
  function kindOf(c: Change): string {
    if (c.change) {
      switch (c.change.kind) {
        case 'added':
          return t('review-element-added');
        case 'removed':
          return t('review-element-removed');
        case 'moved':
          return t('review-element-moved');
        case 'heading':
          return project.node(c.element)?.heading
            ? t('review-element-heading')
            : t('review-element-no-heading');
        case 'excluded':
          return t('review-element-excluded');
        case 'included':
          return t('review-element-included');
        default:
          return t('review-element-other');
      }
    }
    if (c.kind === 'object') {
      const piece = c.stretches[0]?.pieces.find((p) => p.object && p.status !== 'same');
      const kind = c.object?.kind ?? piece?.object?.kind ?? 'other';
      const status = c.object?.status ?? piece?.status;
      const what = t('review-kind-object', { what: kind });
      return status === 'removed'
        ? t('review-kind-taken-out', { what })
        : status === 'added'
          ? t('review-kind-put-in', { what })
          : t('review-kind-altered', { what });
    }
    if (c.kind === 'added') return t('review-kind-added');
    if (c.kind === 'removed') return t('review-kind-removed');
    if (c.kind === 'moved') return t('review-kind-moved');
    return t('review-kind-changed');
  }

  /** A few words of a change, for the list. */
  function glimpse(c: Change): string {
    const s = c.stretches[c.stretches.length - 1];
    if (!s) return named(c.element);
    const text = s.pieces
      .filter((p) => p.status !== (c.kind === 'removed' ? 'added' : 'removed'))
      .map((p) => (p.object ? p.object.label || '·' : p.text))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 90 ? `${text.slice(0, 88)}…` : text;
  }

  /** The pieces of one side: as it was (the same and the deleted) or as it is (the same and the added). */
  function side(pieces: Piece[], was: boolean): Piece[] {
    return pieces.filter((p) => p.status === 'same' || p.status === (was ? 'removed' : 'added'));
  }

  function shown(p: Piece): string {
    return p.object ? p.object.label || '·' : p.text;
  }

  function place(c: Change): string {
    if (c.kind === 'moved' && c.stretches.length > 1) {
      const from = c.stretches[0].passage.place.element;
      const to = c.stretches[c.stretches.length - 1].passage.place.element;
      if (from !== to) return `${t('review-moved-from', { element: named(from) })} → ${named(to)}`;
    }
    return t('review-in', { element: named(c.element) });
  }

  // The when of the change looked at is the time of its last version.
  $effect(() => {
    const c = current;
    if (c && review.hasVersions(c) && review.versions?.key !== c.key) void review.loadVersions(c);
  });

  // The first the history gives is the stretch as it was at the moment
  // compared with, which the panel shows already as “As it was”.
  const versions = $derived.by(() => {
    const list = current && review.versions?.key === current.key ? review.versions.list : null;
    return list ? list.slice(1) : list;
  });
  let showVersions = $state(false);

  // The one looked at is kept in view in the list.
  $effect(() => {
    const key = review.looked;
    if (!key || !list) return;
    void tick().then(() =>
      list?.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'nearest' }),
    );
  });

  async function turnOn() {
    if (!review.source.turnOn) return;
    turning = true;
    try {
      if (await review.source.turnOn()) review.later(0);
    } finally {
      turning = false;
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as HTMLElement).closest('input, textarea, button')) return;
    if (event.key === 'ArrowDown') review.next();
    else if (event.key === 'ArrowUp') review.previous();
    else return;
    event.preventDefault();
  }
</script>

{#snippet text(pieces: Piece[], was: boolean)}
  {@const own = side(pieces, was)}
  {#if own.some((p) => p.text.trim() || p.object)}
    {#each own as p, i (i)}
      {#if p.status === 'same'}<span
          class:formatted={!was && p.marksBefore !== undefined}
          style:--by={colour(p.by)}>{shown(p)}</span
        >{:else}<span class={was ? 'gone' : 'new'} style:--by={colour(p.by)} use:tooltip={who(p.by)}
          >{shown(p)}</span
        >{/if}
    {/each}
  {:else}
    <span class="nothing">{t('review-nothing-there')}</span>
  {/if}
{/snippet}

{#snippet people(ids: (string | null)[])}
  <span class="people">
    {#each ids as id, i (i)}
      <span class="person"><span class="dot" style:background={colour(id)}></span>{who(id)}</span>
    {/each}
  </span>
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside class="panel review-panel" aria-label={t('review-title')} {onkeydown}>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('review-title')}</h2>{/if}
    <IconButton label={t('common-close')} shortcut="Ctrl+Shift+E" size="sm" onclick={onclose}
      ><X size={15} /></IconButton
    >
  </header>

  {#if !review.source.history}
    <EmptyState
      icon={History}
      compact
      title={t('review-no-history')}
      text={t('review-no-history-text')}
    >
      {#if review.source.turnOn}
        <Button variant="primary" disabled={turning} onclick={turnOn}>{t('review-turn-on')}</Button>
      {:else}
        <p class="aside">{t('review-turn-on-elsewhere')}</p>
      {/if}
    </EmptyState>
  {:else}
    <div class="tools">
      <button type="button" class="since" onclick={(e) => chooseSince(e.currentTarget)}>
        <span class="since-words">
          <span>{sinceOf(review.chosen)}</span>
          {#if review.since && review.since.time}
            <span class="quiet">{t('review-since-when', { when: when(review.since.time) })}</span>
          {/if}
        </span>
        <ChevronDown size={14} />
      </button>
      <div class="row">
        <Segmented
          value={review.unit}
          label={t('review-unit')}
          size="sm"
          options={[
            { value: 'sentence', label: t('review-by-sentence') },
            { value: 'paragraph', label: t('review-by-paragraph') },
          ]}
          onchange={(unit) => review.setUnit(unit)}
        />
        <label class="own">
          <input
            type="checkbox"
            checked={review.own}
            onchange={(e) => review.setOwn(e.currentTarget.checked)}
          />
          {t('review-own')}
        </label>
      </div>
    </div>

    {#if review.failure}
      <EmptyState compact title={t('review-failed')} text={review.failure} />
    {:else if !review.ready}
      <div class="waiting"><Spinner size={18} /><span>{t('review-working')}</span></div>
    {:else if !review.changes.length}
      <EmptyState
        icon={Check}
        compact
        title={t('review-nothing')}
        text={t('review-nothing-text')}
      />
    {:else}
      <div class="count">
        <span class="left">{t('review-left', { count: review.changes.length })}</span>
        {#if review.working}<Spinner size={12} />{/if}
        <span class="position"
          >{t('review-position', {
            index: Math.max(1, review.index + 1),
            count: review.changes.length,
          })}</span
        >
        <IconButton
          label={t('review-previous')}
          shortcut="Shift+F8"
          size="sm"
          onclick={() => review.previous()}><ChevronLeft size={15} /></IconButton
        >
        <IconButton label={t('review-later')} shortcut="F8" size="sm" onclick={() => review.next()}
          ><ChevronRight size={15} /></IconButton
        >
      </div>

      <ol class="list" bind:this={list} aria-label={t('review-list')}>
        {#each review.changes as c (c.key)}
          {@const looked = c.key === review.looked}
          <li class:looked data-key={c.key}>
            <button
              type="button"
              class="line"
              onclick={() => review.look(c.key)}
              aria-current={looked}
            >
              <span class="bar">
                {#each c.by as b, i (i)}<span style:background={colour(b)}></span>{/each}
              </span>
              <span class="what">{kindOf(c)}</span>
              <span class="words">{glimpse(c)}</span>
            </button>
            {#if looked}
              <div class="change" data-change={c.key}>
                <div class="where">{place(c)}</div>
                {#if c.change}
                  <p class="element-words">{named(c.element)}</p>
                  {#if c.change.kind === 'moved'}
                    {#if c.change.before?.parent}<p class="quiet">
                        {t('review-was-under', { element: named(c.change.before.parent) })}
                      </p>{/if}
                    {#if c.change.after?.parent}<p class="quiet">
                        {t('review-now-under', { element: named(c.change.after.parent) })}
                      </p>{/if}
                  {/if}
                {/if}
                {#each c.stretches as s, i (i)}
                  {#if c.kind === 'changed' || c.kind === 'moved' || s.pieces.some((p) => p.status === 'removed')}
                    <div class="side">
                      <span class="label">{t('review-was')}</span>
                      <p class="prose-text">{@render text(s.pieces, true)}</p>
                    </div>
                  {/if}
                  {#if s.passage.after}
                    <div class="side">
                      <span class="label">{t('review-is')}</span>
                      <p class="prose-text">{@render text(s.pieces, false)}</p>
                    </div>
                  {/if}
                {/each}
                <div class="who">
                  {@render people(c.by)}
                  {#if versions?.length}<span class="quiet"
                      >{when(versions[versions.length - 1].moment.time)}</span
                    >{/if}
                </div>
                <div class="actions">
                  <Button
                    variant="primary"
                    size="sm"
                    onclick={() => review.accept(c)}
                    title={`${t('review-accept')} (Ctrl+Alt+Y)`}
                  >
                    {#snippet icon()}<Check size={14} />{/snippet}
                    {t('review-accept')}
                  </Button>
                  <span
                    use:tooltip={review.canReject(c)
                      ? { text: t('review-reject'), shortcut: 'Ctrl+Alt+N' }
                      : t('review-reject-cannot')}
                  >
                    <Button
                      size="sm"
                      disabled={!review.canReject(c)}
                      onclick={() => review.reject(c)}
                    >
                      {#snippet icon()}<Undo2 size={14} />{/snippet}
                      {t('review-reject')}
                    </Button>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => review.next()}
                    title={`${t('review-later')} (F8)`}
                  >
                    {t('review-later')}
                  </Button>
                </div>
                {#if review.hasVersions(c)}
                  <button
                    type="button"
                    class="versions-toggle"
                    onclick={() => (showVersions = !showVersions)}
                  >
                    <History size={13} />
                    <span>{t('review-versions')}</span>
                    {#if versions}<span class="quiet"
                        >{t('review-versions-count', { count: versions.length })}</span
                      >{/if}
                    <ChevronDown size={13} class={showVersions ? 'open' : ''} />
                  </button>
                  {#if showVersions}
                    <ol class="versions">
                      {#if versions === null}
                        <li class="quiet">{t('review-versions-reading')}</li>
                      {:else if !versions.length}
                        <li class="quiet">{t('review-versions-none')}</li>
                      {:else}
                        {#each versions as v, i (i)}
                          {@render version(c, v)}
                        {/each}
                      {/if}
                    </ol>
                  {/if}
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</aside>

{#snippet version(c: Change, v: Version)}
  <li class="version">
    <div class="quiet">
      {t('review-version-by', {
        who: v.by.map(who).join(', ') || t('review-someone'),
        when: when(v.moment.time),
      })}
    </div>
    <p class="prose-text">{@render text(v.pieces, false)}</p>
    <div class="actions">
      <Button size="sm" onclick={() => review.acceptUpTo(c, v)}>{t('review-accept-up-to')}</Button>
      <Button size="sm" variant="ghost" onclick={() => review.useVersion(c, v)}
        >{t('review-use-version')}</Button
      >
    </div>
  </li>
{/snippet}

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    flex: none;
    padding: 0 8px 0 16px;
  }
  h2 {
    flex: 1;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 2px 12px 10px;
    border-bottom: 1px solid var(--line);
  }
  .since {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  .since:hover {
    background: var(--paper-hover);
  }
  .since-words {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .own {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .quiet,
  .aside {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .waiting {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .count {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 16px;
    border-bottom: 1px solid var(--line);
    font-size: var(--text-sm);
  }
  .left {
    flex: 1;
    font-weight: 550;
  }
  .position {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 4px 0 24px;
    list-style: none;
  }
  .line {
    display: grid;
    grid-template-columns: 4px auto minmax(0, 1fr);
    align-items: baseline;
    gap: 8px;
    width: 100%;
    padding: 6px 12px 6px 10px;
    border: none;
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  .line:hover {
    background: var(--paper-hover);
  }
  li.looked > .line {
    background: var(--accent-softer);
    color: var(--ink);
  }
  .bar {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    border-radius: 2px;
    overflow: hidden;
  }
  .bar span {
    flex: 1;
  }
  .what {
    font-weight: 550;
    white-space: nowrap;
  }
  .words {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ink-3);
  }
  .change {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 14px 14px 22px;
    border-bottom: 1px solid var(--line);
    background: var(--accent-softer);
  }
  .where {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .element-words {
    font-family: var(--font-text);
    font-weight: 600;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  .prose-text {
    font-family: var(--font-text);
    font-size: 14.5px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .new {
    background: color-mix(in srgb, var(--by) 22%, transparent);
    text-decoration: underline;
    text-decoration-color: var(--by);
    border-radius: 2px;
  }
  .gone {
    color: color-mix(in srgb, var(--by) 80%, var(--ink-3));
    text-decoration: line-through;
    text-decoration-color: var(--by);
  }
  .formatted {
    text-decoration: underline dotted var(--by);
  }
  .nothing {
    color: var(--ink-4);
    font-style: italic;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: var(--text-sm);
  }
  .people {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .person {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .versions-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 2px 4px;
    border: none;
    background: transparent;
    color: var(--accent-strong);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .versions-toggle :global(.open) {
    transform: rotate(180deg);
  }
  .versions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0 0 0 10px;
    border-left: 2px solid var(--line);
    list-style: none;
  }
  .version {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
