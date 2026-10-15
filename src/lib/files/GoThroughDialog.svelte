<script lang="ts">
  /**
   * Files given to their references, the machine proposing and the writer
   * deciding. What each file may be is found out first, in the background,
   * with how far it has come and a way to stop; then each file has a row
   * with its proposal, and is given to that work, to another, to a new
   * reference, or left for later. The window may be closed at any time:
   * what was decided stays decided for the session, and what is left stays
   * unassigned, to be gone through another day.
   */
  import { onMount } from 'svelte';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { filesIdentify, fileAssign, onFilesProgress, filesStop } from '$lib/api/files';
  import type { FilesProgress, Proposal } from '$lib/api/files';
  import {
    emptyDraft,
    importApply,
    type Draft,
    type PlanItem,
    type SummaryLite,
  } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { reasonWords } from '$lib/library/format';
  import { newReference } from '$lib/library/references.svelte';
  import { library } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, toasts } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import ReferenceChooser from './ReferenceChooser.svelte';
  import {
    KIND_ICONS,
    decisions,
    files,
    filesUi,
    proposals,
    undoLast,
    type Decision,
  } from './store.svelte';

  let { hashes, onclose }: { hashes: string[]; onclose: () => void } = $props();

  /** The rows a group shows before it is unfolded: a thousand files are a few decisions, not a thousand rows. */
  const FOLDED = 40;
  /** The cases the rows are grouped by, in this order. */
  const GROUPS = ['certain', 'probable', 'new', 'nothing'] as const;
  type Group = (typeof GROUPS)[number];

  const ticket = newId();
  let phase = $state<'finding' | 'deciding' | 'applying'>('finding');
  let progress = $state.raw<FilesProgress | null>(null);
  let stopping = $state(false);
  /** Rises when what is found out changes, for what reads the proposals. */
  let found = $state(0);
  let chosen = $state<Record<string, Decision>>({});
  /** The row whose reference is being chosen by hand. */
  let choosing = $state<string | null>(null);
  /** Rises when a choice is taken back, so that the switches show what stands. */
  let shown = $state(0);
  let gone = false;
  /** The groups shown whole. */
  let unfolded = $state<Record<Group, boolean>>({
    certain: false,
    probable: false,
    new: false,
    nothing: false,
  });

  const rows = $derived.by(() => {
    void found;
    return hashes.flatMap((h) => {
      const p = proposals.get(h);
      return p && files.get(h) ? [p] : [];
    });
  });

  function decisionOf(p: Proposal): Decision {
    return (
      chosen[p.hash] ??
      decisions.get(p.hash) ?? {
        choice: p.matches.length || p.lookup ? 'this' : 'later',
        match: 0,
        chosen: null,
      }
    );
  }

  function decide(hash: string, decision: Decision) {
    chosen[hash] = decision;
    decisions.set(hash, decision);
  }

  onMount(() => {
    void find();
    return () => {
      gone = true;
      if (phase === 'finding') filesStop(ticket).catch(() => {});
    };
  });

  async function find() {
    const missing = hashes.filter((h) => !proposals.has(h) && files.get(h));
    if (missing.length) {
      const unlisten = await onFilesProgress(ticket, (told) => (progress = told));
      try {
        // Stopped, it gives what was found out before.
        for (const p of await filesIdentify(missing, true, ticket)) proposals.set(p.hash, p);
      } catch (error) {
        if (!gone) notifyError(t('files-going-failed'), error);
      } finally {
        unlisten();
      }
    }
    if (gone) return;
    found++;
    phase = 'deciding';
  }

  function stop() {
    stopping = true;
    filesStop(ticket).catch(() => {});
  }

  /** A work of the library as the rows say it. */
  function lite(draft: Draft): SummaryLite {
    const people = draft.names.author?.length ? draft.names.author : (draft.names.editor ?? []);
    return {
      key: draft.key,
      type: draft.type,
      authors: people.map((p) => p.family).join(', '),
      year: (draft.fields.date ?? draft.fields.year ?? '').slice(0, 4),
      title: draft.fields.title ?? '',
      container: draft.fields.journaltitle ?? draft.fields.booktitle ?? '',
    };
  }

  /** What the form of a new reference is filled with: what the services said, or what the name says. */
  function draftFor(p: Proposal): Draft {
    if (p.lookup) return structuredClone($state.snapshot(p.lookup.draft) as Draft);
    const draft = emptyDraft('book');
    if (p.named) {
      if (p.named.families.length)
        draft.names.author = p.named.families.map((family) => ({ family }));
      if (p.named.year) draft.fields.date = String(p.named.year);
      if (p.named.title) draft.fields.title = p.named.title;
    }
    return draft;
  }

  async function choose(p: Proposal, value: Decision['choice']) {
    const was = decisionOf(p);
    if (value === 'other') {
      choosing = p.hash;
      return;
    }
    if (value === 'new') {
      const made = await newReference({ draft: draftFor(p) });
      if (made) decide(p.hash, { ...was, choice: 'new', chosen: made.summary });
      else shown++;
      return;
    }
    decide(p.hash, { ...was, choice: value });
  }

  // ---- the groups, and for all in one ----

  /** The case of a proposal: by its first match, else by the services' description, else nothing. */
  function groupOf(p: Proposal): Group {
    if (p.matches.length) return p.matches[0].certainty;
    return p.lookup ? 'new' : 'nothing';
  }

  const groups = $derived.by(() => {
    const out: Record<Group, Proposal[]> = { certain: [], probable: [], new: [], nothing: [] };
    for (const p of rows) out[groupOf(p)].push(p);
    return out;
  });

  function chosenByAll(list: Proposal[]): 'this' | 'later' | '' {
    void chosen;
    const kinds = new Set(list.map((p) => decisionOf(p).choice));
    if (kinds.size !== 1) return '';
    const [kind] = kinds;
    return kind === 'this' || kind === 'later' ? kind : '';
  }

  function chooseForAll(list: Proposal[], value: 'this' | 'later') {
    for (const p of list) decide(p.hash, { ...decisionOf(p), choice: value });
  }

  // ---- what is done ----

  const counts = $derived.by(() => {
    void chosen;
    let assign = 0;
    let later = 0;
    for (const p of rows) {
      const d = decisionOf(p);
      if (d.choice === 'later' || ((d.choice === 'other' || d.choice === 'new') && !d.chosen))
        later++;
      else assign++;
    }
    return { assign, later };
  });

  async function done() {
    phase = 'applying';
    const problems: string[] = [];
    let assigned = 0;
    let made = 0;
    let later = 0;
    const lookups: PlanItem[] = [];
    // What is done, so that it can be undone at once.
    const given: { hash: string; id: string }[] = [];
    const madeIds: string[] = [];
    const viaLookup: string[] = [];
    for (const p of rows) {
      const d = decisionOf(p);
      try {
        if (d.choice === 'this' && p.matches.length) {
          const id = p.matches[Math.min(d.match, p.matches.length - 1)].id;
          await fileAssign(p.hash, id);
          given.push({ hash: p.hash, id });
          assigned++;
        } else if (d.choice === 'this' && p.lookup) {
          // The candidate names the file in the store already: the import links it.
          lookups.push({
            candidate: $state.snapshot(p.lookup),
            summary: lite(p.lookup.draft),
            matches: [],
            repeats: null,
            action: { kind: 'add' },
          });
          viaLookup.push(p.hash);
        } else if ((d.choice === 'other' || d.choice === 'new') && d.chosen) {
          await fileAssign(p.hash, d.chosen.id);
          given.push({ hash: p.hash, id: d.chosen.id });
          // A reference made here, in the form, is the going-through's too.
          if (d.choice === 'new') madeIds.push(d.chosen.id);
          assigned++;
        } else later++;
      } catch (error) {
        problems.push(`${p.name}: ${describeError(error)}`);
      }
    }
    if (lookups.length) {
      try {
        const outcome = await importApply({
          source: t('files-going-source'),
          items: lookups,
          warnings: [],
        });
        made = outcome.added.length;
        madeIds.push(...outcome.added);
        if (outcome.added.length) given.push(...viaLookup.map((hash) => ({ hash, id: '' })));
        problems.push(...outcome.problems);
      } catch (error) {
        problems.push(describeError(error) ?? t('files-going-failed'));
      }
    }
    await Promise.all([files.reload(), library.reload()]);
    const parts = [t('files-going-assigned', { count: assigned })];
    if (made) parts.push(t('files-going-made', { count: made }));
    if (later) parts.push(t('files-going-later-count', { count: later }));
    const words = parts.join(', ');
    const done = given.length || madeIds.length;
    filesUi.lastDone = done ? { assigned: given, made: madeIds } : filesUi.lastDone;
    if (problems.length) notifyError(words, problems.slice(0, 4).join('\n'));
    else if (done)
      // It stays until it is dismissed: what was done to many is undone at once.
      toasts.show(
        {
          kind: 'ok',
          message: words,
          action: { label: t('files-going-undo'), run: () => void undoLast() },
        },
        0,
      );
    else toasts.show({ kind: 'ok', message: words });
    onclose();
  }

  const heads: Record<Group, (n: number) => string> = {
    certain: (n) => t('files-going-all-certain', { count: n }),
    probable: (n) => t('files-going-all-probable', { count: n }),
    new: (n) => t('files-going-all-new', { count: n }),
    nothing: (n) => t('files-going-all-nothing', { count: n }),
  };
</script>

{#snippet work(s: SummaryLite)}
  <span class="authors">{s.authors || '—'}</span>
  {#if s.year}<span class="year">{s.year}</span>{/if}
  <span class="serif title">{s.title || t('library-untitled')}</span>
{/snippet}

{#snippet item(p: Proposal)}
  {@const d = decisionOf(p)}
  {@const file = files.get(p.hash)}
  {@const Icon = KIND_ICONS[file?.kind ?? 'other']}
  {@const match = p.matches[Math.min(d.match, Math.max(0, p.matches.length - 1))]}
  <div class="item" data-going-file={p.name} data-hash={p.hash}>
    <div class="what">
      <span class="icon"><Icon size={16} strokeWidth={1.6} /></span>
      <span class="name selectable">{p.name}</span>
    </div>
    {#key shown}
      <Segmented
        size="sm"
        value={d.choice}
        label={t('files-going-what', { name: p.name })}
        options={[
          {
            value: 'this',
            label: t('files-going-this'),
            disabled: !p.matches.length && !p.lookup,
          },
          { value: 'other', label: t('files-going-other') },
          { value: 'new', label: t('files-going-new') },
          { value: 'later', label: t('files-going-later') },
        ]}
        onchange={(value) => void choose(p, value)}
      />
    {/key}

    <div class="proposal" class:off={d.choice !== 'this'}>
      {#if match}
        <div class="overline" data-reasons>
          {t('library-in-library')} · {match.certainty === 'certain'
            ? t('files-going-certain')
            : t('files-going-probable')} · {reasonWords(match.reasons)}
        </div>
        {#if p.matches.length > 1}
          <select
            class="matches"
            value={String(d.match)}
            aria-label={t('files-going-which')}
            onchange={(e) =>
              decide(p.hash, {
                ...d,
                choice: 'this',
                match: Number(e.currentTarget.value),
              })}
          >
            {#each p.matches as m, i (m.id)}
              <option value={String(i)}
                >{m.summary.authors || '—'} {m.summary.year} · {m.summary.title}</option
              >
            {/each}
          </select>
        {:else}
          <div class="work selectable">{@render work(match.summary)}</div>
        {/if}
      {:else if p.lookup}
        <div class="overline">
          {t('files-going-lookup', { origin: p.lookup.origin })}
        </div>
        <div class="work selectable">{@render work(lite(p.lookup.draft))}</div>
      {:else}
        <div class="nothing">{t('files-going-nothing')}</div>
      {/if}
    </div>

    {#if (d.choice === 'other' || d.choice === 'new') && d.chosen}
      <div class="chosen" data-chosen>
        <span class="overline"
          >{d.choice === 'new' ? t('files-going-made-here') : t('files-going-chosen')}</span
        >
        <div class="work selectable">{@render work(d.chosen)}</div>
      </div>
    {/if}

    {#each p.notes as note}
      <p class="note"><TriangleAlert size={12} /> {note}</p>
    {/each}
  </div>
{/snippet}

<Dialog
  open
  title={t('files-going-title')}
  subtitle={t('files-going-subtitle', { count: hashes.length })}
  width={760}
  dismissable={phase !== 'applying'}
  padded={false}
  onclose={() => phase !== 'applying' && onclose()}
>
  <div class="content" data-going={phase}>
    {#if phase === 'finding'}
      <div class="finding" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">
          {#if progress && progress.name}
            {t('files-going-progress', {
              done: Math.min(progress.done + 1, progress.total),
              count: progress.total,
              name: progress.name,
            })}
          {:else}
            {t('files-going-finding', { count: hashes.length })}
          {/if}
        </div>
      </div>
      {#if progress && progress.total > 1}
        <progress class="bar" max={progress.total} value={progress.done}></progress>
      {/if}
      <p class="hint">{t('files-going-finding-hint')}</p>
    {:else}
      {#if !rows.length}
        <p class="none">{t('files-going-none')}</p>
      {/if}

      {#each GROUPS as g (g)}
        {@const list = groups[g]}
        {#if list.length}
          {@const head = heads[g](list.length)}
          <section class="group" data-group={g}>
            <div class="row">
              <span>{head}</span>
              {#if g !== 'nothing'}
                <Segmented
                  size="sm"
                  value={chosenByAll(list)}
                  label={head}
                  options={[
                    {
                      value: 'this',
                      label: g === 'new' ? t('files-going-this-new') : t('files-going-this'),
                    },
                    { value: 'later', label: t('files-going-later') },
                  ]}
                  onchange={(value) => {
                    if (value) chooseForAll(list, value);
                  }}
                />
              {/if}
            </div>
            <div class="items">
              {#each unfolded[g] ? list : list.slice(0, FOLDED) as p (p.hash)}
                {@render item(p)}
              {/each}
              {#if !unfolded[g] && list.length > FOLDED}
                <div class="more">
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => (unfolded[g] = true)}
                    data-show-all
                  >
                    {t('files-going-show-all', { count: list.length })}
                  </Button>
                </div>
              {/if}
            </div>
          </section>
        {/if}
      {/each}
    {/if}
  </div>

  {#snippet footer()}
    <div class="summary">
      {#if phase === 'applying'}
        <Spinner /> {t('files-going-applying')}
      {:else if phase === 'deciding'}
        {t('files-going-counts', counts)}
      {/if}
    </div>
    {#if phase === 'finding'}
      <Button variant="ghost" disabled={stopping} onclick={stop}>{t('files-going-stop')}</Button>
    {:else}
      <Button variant="ghost" disabled={phase === 'applying'} onclick={onclose}
        >{t('common-cancel')}</Button
      >
      <Button
        variant="primary"
        disabled={phase === 'applying' || !counts.assign}
        onclick={() => void done()}
        data-going-done
      >
        {t('files-going-done', { count: counts.assign })}
      </Button>
    {/if}
  {/snippet}
</Dialog>

{#if choosing}
  {@const p = proposals.get(choosing)}
  <ReferenceChooser
    title={t('files-assign-title', { name: p?.name ?? '' })}
    onpick={(id) => {
      const entry = library.get(id);
      if (p && entry) decide(p.hash, { ...decisionOf(p), choice: 'other', chosen: entry });
    }}
    onclose={() => {
      choosing = null;
      shown++;
    }}
  />
{/if}

<style>
  .content {
    display: flex;
    flex-direction: column;
    padding: 0 var(--space-5) var(--space-4);
    min-height: 200px;
  }
  .finding {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 48px;
    margin-top: var(--space-3);
  }
  .doing {
    font-weight: 550;
    overflow-wrap: anywhere;
  }
  .bar {
    width: 100%;
    height: 6px;
    margin-top: var(--space-2);
    accent-color: var(--accent);
  }
  .hint {
    margin-top: var(--space-3);
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .group {
    padding-top: 12px;
    border-bottom: 1px solid var(--line);
  }
  .group:last-child {
    border-bottom: none;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .none {
    padding: 16px 0;
    color: var(--ink-3);
  }
  .items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0 4px;
  }
  .item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px 16px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .what {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .icon {
    display: inline-flex;
    flex: none;
    color: var(--ink-3);
  }
  .name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 550;
  }
  .proposal,
  .chosen {
    grid-column: 1 / -1;
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
  }
  .proposal.off {
    opacity: 0.6;
  }
  .overline {
    margin-bottom: 2px;
  }
  .work {
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
    line-height: 1.45;
  }
  .authors {
    font-weight: 550;
  }
  .year {
    color: var(--ink-2);
  }
  .title {
    color: var(--ink-2);
  }
  .nothing {
    color: var(--ink-3);
    font-style: italic;
  }
  .matches {
    width: 100%;
    height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
  }
  .chosen {
    background: var(--accent-soft);
  }
  .note {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-sm);
    color: var(--warn);
  }
  .more {
    padding: 4px 12px;
    color: var(--ink-3);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
