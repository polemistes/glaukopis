<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import type { Certainty, ImportAction, PlanItem } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { reasonWords } from './format';
  import { carryOut, type ImportRequest } from './references.svelte';
  import { fieldLabel } from './schema';
  import TypeIcon from './TypeIcon.svelte';

  let { request, onclose }: { request: ImportRequest; onclose: () => void } = $props();

  // svelte-ignore state_referenced_locally
  let items = $state<PlanItem[]>($state.snapshot(request.plan.items));
  let working = $state(false);
  let error = $state<string | null>(null);
  // The first group that has anything in it is shown open.
  // svelte-ignore state_referenced_locally
  let open = $state<Record<string, boolean>>({
    review: true,
    new: !request.plan.items.some((i) => i.matches[0]?.certainty === 'probable'),
  });

  type Group = 'review' | 'new' | 'complete' | 'known' | 'repeated';

  function groupOf(item: PlanItem): Group {
    if (item.repeats != null) return 'repeated';
    if (!item.matches.length) return 'new';
    if (item.matches[0].certainty === 'probable') return 'review';
    return item.matches[0].gains.length ? 'complete' : 'known';
  }

  const groups = $derived.by(() => {
    const out: Record<Group, { item: PlanItem; index: number }[]> = {
      review: [],
      new: [],
      complete: [],
      known: [],
      repeated: [],
    };
    items.forEach((item, index) => out[groupOf(item)].push({ item, index }));
    return out;
  });

  const counts = $derived({
    add: items.filter((i) => i.action.kind === 'add').length,
    merge: items.filter((i) => i.action.kind === 'merge').length,
    skip: items.filter((i) => i.action.kind === 'skip').length,
  });

  const titles: Record<Group, (n: number) => string> = {
    review: (n) => t('library-import-review', { count: n }),
    new: (n) => t('library-import-new', { count: n }),
    complete: (n) => t('library-import-complete', { count: n }),
    known: (n) => t('library-import-known', { count: n }),
    repeated: (n) => t('library-import-repeated', { count: n }),
  };

  function set(index: number, action: ImportAction) {
    items[index].action = action;
  }

  type Choice = 'merge' | 'add' | 'skip';

  function choice(item: PlanItem): Choice {
    return item.action.kind;
  }

  function choose(index: number, value: Choice) {
    const item = items[index];
    if (value === 'merge') set(index, { kind: 'merge', into: item.matches[0].id });
    else set(index, { kind: value });
  }

  // The candidates that have a match, by how sure the match is. Those in the same
  // case can be answered alike, in one go.
  const alike = $derived.by(() => {
    const out: Record<Certainty, { item: PlanItem; index: number }[]> = {
      probable: [],
      certain: [],
    };
    items.forEach((item, index) => {
      if (item.repeats == null && item.matches.length)
        out[item.matches[0].certainty].push({ item, index });
    });
    return out;
  });

  function lacks(item: PlanItem): boolean {
    return item.matches[0].gains.length > 0;
  }

  // What all of a certainty have chosen, when they agree; nothing when they differ.
  // One that lacks nothing has nothing to take, so it is left out and counts as
  // agreeing with the others that take what they lack.
  function chosenByAll(certainty: Certainty): Choice | '' {
    const list = alike[certainty];
    const kinds = new Set(list.map(({ item }) => choice(item)));
    if (kinds.size === 1) return [...kinds][0];
    if (kinds.has('merge') && !kinds.has('add')) {
      if (list.every(({ item }) => choice(item) === 'merge' || !lacks(item))) return 'merge';
    }
    return '';
  }

  function chooseForAll(certainty: Certainty, value: Choice) {
    for (const { item, index } of alike[certainty]) {
      choose(index, value === 'merge' && !lacks(item) ? 'skip' : value);
    }
  }

  const forAll: Record<Certainty, (n: number) => string> = {
    probable: (n) => t('library-import-all-probable', { count: n }),
    certain: (n) => t('library-import-all-certain', { count: n }),
  };

  async function run() {
    working = true;
    error = null;
    try {
      const outcome = await carryOut(
        { ...request.plan, items: $state.snapshot(items) },
        request.collection,
      );
      request.resolve(outcome);
      onclose();
    } catch (e) {
      error = describeError(e) ?? t('library-import-failed');
    } finally {
      working = false;
    }
  }

  function close() {
    request.resolve(null);
    onclose();
  }

  function gains(names: string[]): string {
    // What an entry is in Zotero is no field of the form, and has no name there.
    const named = (n: string) =>
      n === 'file'
        ? t('library-import-gains-file')
        : n === 'glaukopis-zotero'
          ? t('library-import-gains-zotero')
          : fieldLabel(n);
    return names.map(named).join(', ');
  }
</script>

{#snippet line(item: PlanItem)}
  <div class="what">
    <TypeIcon type={item.summary.type} />
    <div class="text selectable">
      <div class="first">
        <span class="authors">{item.summary.authors || '—'}</span>
        <span class="year">{item.summary.year}</span>
      </div>
      <div class="serif title">{item.summary.title || t('library-untitled')}</div>
    </div>
  </div>
{/snippet}

<Dialog
  open
  title={t('library-import-title')}
  subtitle={t('library-import-subtitle', { count: items.length, source: request.plan.source })}
  width={720}
  dismissable={!working}
  padded={false}
  onclose={close}
>
  <div class="content">
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

    {#if alike.probable.length > 1 || alike.certain.length > 1}
      <div class="for-all">
        {#each ['probable', 'certain'] as const as certainty (certainty)}
          {@const list = alike[certainty]}
          {#if list.length > 1}
            {@const words = forAll[certainty](list.length)}
            <div class="row" data-certainty={certainty}>
              <span>{words}</span>
              <Segmented
                size="sm"
                value={chosenByAll(certainty)}
                label={words}
                options={[
                  {
                    value: 'merge',
                    label: t('library-import-all-merge'),
                    disabled: !list.some(({ item }) => lacks(item)),
                  },
                  { value: 'skip', label: t('library-import-all-skip') },
                  { value: 'add', label: t('library-import-all-add') },
                ]}
                onchange={(value) => {
                  if (value) chooseForAll(certainty, value);
                }}
              />
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    {#each ['review', 'new', 'complete', 'known', 'repeated'] as const as group (group)}
      {@const list = groups[group]}
      {#if list.length}
        <section class:attention={group === 'review'}>
          <button
            type="button"
            class="heading"
            aria-expanded={!!open[group]}
            onclick={() => (open[group] = !open[group])}
          >
            <span class="twisty" class:open={open[group]}><ChevronRight size={14} /></span>
            <span>{titles[group](list.length)}</span>
          </button>

          {#if open[group]}
            <div class="items">
              {#each list.slice(0, 400) as { item, index } (index)}
                <div class="item">
                  {@render line(item)}

                  {#if group === 'review' || group === 'complete' || group === 'known'}
                    {@const match = item.matches[0]}
                    <div class="against">
                      <div class="overline">
                        {t('library-in-library')} · {reasonWords(match.reasons)}
                      </div>
                      <div class="existing selectable">
                        <span class="authors">{match.summary.authors || '—'}</span>
                        <span class="year">{match.summary.year}</span>
                        <span class="serif">{match.summary.title}</span>
                      </div>
                      {#if match.gains.length}
                        <div class="gains">
                          {t('library-import-would-gain', { fields: gains(match.gains) })}
                        </div>
                      {/if}
                    </div>
                    <div
                      class="choices"
                      role="radiogroup"
                      aria-label={t('library-import-what-to-do')}
                    >
                      <label>
                        <input
                          type="radio"
                          checked={choice(item) === 'merge'}
                          disabled={!match.gains.length}
                          onchange={() => choose(index, 'merge')}
                        />
                        {t('library-import-merge')}
                      </label>
                      <label>
                        <input
                          type="radio"
                          checked={choice(item) === 'skip'}
                          onchange={() => choose(index, 'skip')}
                        />
                        {t('library-import-skip')}
                      </label>
                      <label>
                        <input
                          type="radio"
                          checked={choice(item) === 'add'}
                          onchange={() => choose(index, 'add')}
                        />
                        {t('library-import-add')}
                      </label>
                    </div>
                  {:else if group === 'new'}
                    <label class="include">
                      <input
                        type="checkbox"
                        checked={item.action.kind === 'add'}
                        onchange={(e) => choose(index, e.currentTarget.checked ? 'add' : 'skip')}
                      />
                      {t('library-import')}
                    </label>
                  {/if}

                  {#each item.candidate.notes as note}
                    <p class="note"><TriangleAlert size={12} /> {note}</p>
                  {/each}
                </div>
              {/each}
              {#if list.length > 400}
                <p class="more">{t('library-import-more', { count: list.length - 400 })}</p>
              {/if}
            </div>
          {/if}
        </section>
      {/if}
    {/each}

    {#if request.plan.warnings.length}
      <section>
        <button
          type="button"
          class="heading"
          aria-expanded={!!open.warnings}
          onclick={() => (open.warnings = !open.warnings)}
        >
          <span class="twisty" class:open={open.warnings}><ChevronRight size={14} /></span>
          <span>{t('library-import-unread', { count: request.plan.warnings.length })}</span>
        </button>
        {#if open.warnings}
          <ul class="warnings selectable">
            {#each request.plan.warnings.slice(0, 200) as warning}
              <li>{warning}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </div>

  {#snippet footer()}
    <div class="summary">
      {#if working}
        <Spinner /> {t('library-import-importing')}
      {:else}
        {t('library-import-counts', counts)}
      {/if}
    </div>
    <Button variant="ghost" disabled={working} onclick={close}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={working || counts.add + counts.merge === 0} onclick={run}>
      {t('library-import')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
    padding: 0 var(--space-5) var(--space-4);
    min-height: 240px;
  }
  .error {
    padding: 8px 12px;
    margin-bottom: var(--space-3);
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  .for-all {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
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
  section {
    border-top: 1px solid var(--line);
  }
  section:first-of-type {
    border-top: none;
  }
  .heading {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 12px 0;
    border: none;
    background: transparent;
    font-weight: 550;
    text-align: left;
    cursor: pointer;
  }
  .attention .heading {
    color: var(--gold);
  }
  .twisty {
    display: inline-flex;
    color: var(--ink-3);
    transition: transform var(--fast) var(--ease);
  }
  .twisty.open {
    transform: rotate(90deg);
  }
  .items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 0 14px 20px;
  }
  .item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 16px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .what {
    display: flex;
    gap: 9px;
    min-width: 0;
  }
  .what :global(.type-icon) {
    margin-top: 2px;
  }
  .text {
    min-width: 0;
  }
  .first {
    display: flex;
    gap: 8px;
  }
  .authors {
    font-weight: 550;
  }
  .year {
    color: var(--ink-2);
  }
  .title {
    color: var(--ink-2);
    line-height: 1.4;
  }
  .against {
    grid-column: 1 / -1;
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
  }
  .against .overline {
    margin-bottom: 2px;
  }
  .existing {
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
    line-height: 1.45;
  }
  .gains {
    margin-top: 3px;
    font-size: var(--text-sm);
    color: var(--ok);
  }
  .choices {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    font-size: var(--text-sm);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  label:has(input:disabled) {
    color: var(--ink-4);
    cursor: default;
  }
  input[type='radio'],
  input[type='checkbox'] {
    accent-color: var(--accent);
    margin: 0;
  }
  .include {
    align-self: start;
    font-size: var(--text-sm);
    color: var(--ink-2);
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
  .warnings {
    margin: 0 0 14px;
    padding-left: 38px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: 1.6;
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
