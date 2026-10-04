<script lang="ts" module>
  /** Whether the list of all there is stands open: as it was left, for every panel. */
  let listOpen = $state(false);
</script>

<script lang="ts">
  /**
   * The panel at the side in which the citations that were found in the
   * map in view are gone through, one at a time: see ADR 0015. What there
   * is and what is done is in `going.svelte.ts`; this shows it, in a narrow
   * column: what is taken for citations at the top, then where in the list
   * the one that is looked at stands, the passage it stands in, the works,
   * and the buttons at the foot. The list of all there is folds open when
   * it is asked for. Whenever another is looked at, the view of the project
   * is told, so that it is shown where the text of the map is shown.
   */
  import type { Snippet } from 'svelte';
  import { onMount, tick, untrack } from 'svelte';
  import CheckCheck from '@lucide/svelte/icons/check-check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleDashed from '@lucide/svelte/icons/circle-dashed';
  import CircleDot from '@lucide/svelte/icons/circle-dot';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import Plus from '@lucide/svelte/icons/plus';
  import StickyNote from '@lucide/svelte/icons/sticky-note';
  import X from '@lucide/svelte/icons/x';
  import type { FoundBy } from '$lib/api/found';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { t } from '$lib/i18n';
  import { truncate } from '$lib/library/format';
  import { editReference, newReference } from '$lib/library/references.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { library } from '$lib/state/library.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { foundUi } from './found.svelte';
  import FoundWork from './FoundWork.svelte';
  import { NO_TEXT } from './gather';
  import { Going, type Entry, type Work } from './going.svelte';

  interface Props {
    project: Project;
    /** The map in view: its citations are gone through. */
    mapId: string;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
    /** Called when a work has been cited, with the id of its reference: the project keeps a copy. */
    onkeep: (reference: string) => void;
    /** Another is looked at: it is to be shown where the text of the map is shown. */
    onshow?: (entry: Entry) => void;
  }

  let { project, mapId, onclose, head, onkeep, onshow }: Props = $props();

  // The panel is made anew for every map it is opened for.
  // svelte-ignore state_referenced_locally
  const going = new Going(project, mapId, {
    kept: $state.snapshot(settings.value.found),
    keep: (reference) => onkeep(reference),
    remember: (kept) => settings.setFound(kept),
  });

  /** What holds all but the head and the foot, and takes the keys. */
  let keys = $state<HTMLDivElement>();
  let list = $state<HTMLDivElement>();
  let detail = $state<HTMLDivElement>();
  /** While something is asked of the writer in a window of its own. */
  let waiting = $state(false);
  let libraryAt = library.revision;
  /** The last asking of the panel that was answered: the one it was opened by, to begin with. */
  let handled = untrack(() => foundUi.asked);

  /** The citation that was asked for, where the asking was for this map. */
  function askedFor(): string | null {
    const request = foundUi.request;
    return request?.map === mapId ? request.at : null;
  }

  onMount(() => {
    // svelte-ignore state_referenced_locally
    void library.load().then(() => {
      libraryAt = library.revision;
      const asked = going.open(askedFor());
      focusKeys();
      return asked;
    });
    return () => going.close();
  });

  // Asked again while open, as when another citation is pressed in the text: that one is looked at.
  $effect(() => {
    const n = foundUi.asked;
    untrack(() => {
      if (n === handled) return;
      handled = n;
      const at = askedFor();
      const wanted = at ? going.entries.find((e) => e.target.id === at) : null;
      if (wanted) going.show(wanted.key);
      focusKeys();
    });
  });

  // The library may have a work now that it did not have: it is asked again.
  $effect(() => {
    const now = library.revision;
    untrack(() => {
      if (now === libraryAt) return;
      libraryAt = now;
      if (going.asked) void going.ask();
    });
  });

  const current = $derived(going.current);
  const certain = $derived(going.certain.length);

  // The one that is looked at is in view in the list and in the panel, and shown in the text.
  $effect(() => {
    const key = current?.key;
    untrack(() => {
      if (!key || !current) return;
      list?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({
        block: 'nearest',
      });
      detail?.scrollIntoView({ block: 'nearest' });
      onshow?.(current);
    });
  });

  const BY: Record<FoundBy, string> = $derived({
    zotero: t('found-by-zotero'),
    mendeley: t('found-by-mendeley'),
    key: t('found-by-key'),
    form: t('found-by-form'),
  });

  const SURE = $derived({
    certain: { icon: CircleCheck, words: t('found-sure-certain') },
    likely: { icon: CircleDot, words: t('found-sure-likely') },
    possible: { icon: CircleDashed, words: t('found-sure-possible') },
    none: { icon: CircleQuestionMark, words: t('found-sure-none') },
  });

  /** Text as it is shown: what is no text is a sign that says so. */
  const shown = (text: string) => text.replaceAll(NO_TEXT, '[…]').replace(/\s+/g, ' ');

  /** The passage an entry stands in, shortened around it where it is long. */
  function context(entry: Entry): { before: string; text: string; after: string } {
    const place = going.place(entry);
    if (!place) return { before: '', text: entry.target.text, after: '' };
    const { start, end } = entry.target;
    const room = 200;
    let before = place.text.slice(0, start);
    let after = place.text.slice(end);
    if (before.length > room) {
      const cut = before.slice(before.length - room);
      before = `… ${cut.slice(cut.indexOf(' ') + 1)}`;
    }
    if (after.length > room) {
      const cut = after.slice(0, room);
      after = `${cut.slice(0, Math.max(cut.lastIndexOf(' '), room / 2))} …`;
    }
    return {
      before: shown(before),
      text: shown(place.text.slice(start, end)),
      after: shown(after),
    };
  }

  /** What the element an entry stands in is called. */
  function elementTitle(entry: Entry): string {
    return project.node(entry.element)?.title || t('found-untitled');
  }

  /** Of a note: the words it stands after, in the text. */
  function standsAt(entry: Entry): string {
    const place = going.place(entry);
    if (!place?.stands) return '';
    const outer = going.placeOf(place.stands.passage);
    if (!outer) return '';
    const before = shown(outer.text.slice(Math.max(0, place.stands.at - 90), place.stands.at));
    return before.length >= 90 ? `… ${before.slice(before.indexOf(' ') + 1)}` : before;
  }

  /** The keys are those of the panel: the arrows, Enter and Ctrl+Z. */
  function focusKeys() {
    void tick().then(() => keys?.focus({ preventScroll: true }));
  }

  function make() {
    if (going.make()) focusKeys();
  }

  function leave() {
    if (going.leave()) focusKeys();
  }

  function later() {
    going.later();
    focusKeys();
  }

  function makeCertain() {
    const made = going.makeCertain();
    if (made) notify(t('found-made', { count: made }), t('found-made-undo'));
    focusKeys();
  }

  function another(entry: Entry, work: Work, anchor: HTMLElement) {
    editorUi.pick({
      anchor: anchor.getBoundingClientRect(),
      exclude: entry.works.flatMap((w) => (w !== work && w.reference ? [w.reference] : [])),
      purpose: t('found-pick-work'),
      query: work.words,
      onpick: (id) => {
        editorUi.closePicker(false);
        going.choose(work, id);
      },
    });
  }

  function addWork(entry: Entry, anchor: HTMLElement) {
    editorUi.pick({
      anchor: anchor.getBoundingClientRect(),
      exclude: entry.works.flatMap((w) => (w.reference ? [w.reference] : [])),
      purpose: t('found-pick-add'),
      onpick: (id) => {
        editorUi.closePicker(false);
        going.add(entry, id);
      },
    });
  }

  /** Adds a work to the library from what the file says of it; the writer sees the reference before it is added. */
  async function addToLibrary(work: Work) {
    if (waiting) return;
    waiting = true;
    try {
      const draft = await going.draft(work);
      if (!draft) {
        notify(t('found-too-little'));
        return;
      }
      const made = await newReference({ draft });
      if (made) {
        going.choose(work, made.id);
        onkeep(made.id);
      }
    } catch (error) {
      notifyError(t('found-reference-failed'), error);
    } finally {
      waiting = false;
    }
  }

  async function edit(id: string) {
    waiting = true;
    await editReference(id);
    waiting = false;
  }

  function onkeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const mod = event.ctrlKey || event.metaKey;
    const typing = !!target.closest('input:not([type="checkbox"]):not([type="radio"]), textarea');
    const key = event.key.toLowerCase();
    if (mod && !event.altKey && (key === 'z' || key === 'y')) {
      // In a field, what was typed is taken back; elsewhere, what was done to the text.
      if (typing) return;
      event.preventDefault();
      event.stopPropagation();
      if (key === 'y' || event.shiftKey) project.redo();
      else project.undo();
      going.undone();
      return;
    }
    if (mod || event.altKey) return;
    if (event.key === 'Enter') {
      if (target.closest('button, select, textarea, a')) return;
      event.preventDefault();
      make();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (target.closest('select, textarea')) return;
      event.preventDefault();
      going.move(event.key === 'ArrowDown' ? 1 : -1);
    }
  }
</script>

<aside class="panel found-panel" aria-label={t('found-title')}>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('found-title')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
  <div class="through" tabindex="0" bind:this={keys} {onkeydown}>
    <section class="taken">
      <div class="overline">{t('found-taken')}</div>
      <p class="always">{t('found-taken-always')}</p>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.years}
          onchange={(e) => void going.take({ years: e.currentTarget.checked })}
        />
        {t('found-taken-years')}
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.named || going.kept.notes}
          disabled={going.kept.notes}
          onchange={(e) => void going.take({ named: e.currentTarget.checked })}
        />
        {t('found-taken-named')}
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.notes}
          onchange={(e) => void going.take({ notes: e.currentTarget.checked })}
        />
        {t('found-taken-notes')}
      </label>
      {#if going.asking}
        <p class="state" aria-live="polite"><Spinner size={13} /> {t('found-asking')}</p>
      {/if}
      {#if certain}
        <div class="certain">
          <Button size="sm" onclick={makeCertain}>
            {#snippet icon()}<CheckCheck size={14} />{/snippet}
            {t('found-make-certain', { count: certain })}
          </Button>
        </div>
      {/if}
    </section>

    {#if going.failure}
      <p class="failure" role="alert"><CircleAlert size={15} /> <span>{going.failure}</span></p>
    {/if}

    {#if !going.entries.length}
      <div class="nothing">
        {#if !going.asked}
          <Spinner size={20} />
        {:else}
          <EmptyState
            compact
            icon={CircleCheck}
            title={t('found-nothing')}
            text={going.proposing
              ? going.kept.years && going.kept.notes
                ? t('found-nothing-looked')
                : t('found-nothing-looked-more')
              : t('found-nothing-not-looked')}
          />
        {/if}
      </div>
    {:else}
      <div class="where-in">
        <IconButton label={t('found-previous')} size="sm" onclick={() => going.move(-1)}>
          <ChevronUp size={15} />
        </IconButton>
        <IconButton label={t('found-next')} size="sm" onclick={() => going.move(1)}>
          <ChevronDown size={15} />
        </IconButton>
        <span class="position">
          {t('found-position', { index: going.index + 1, count: going.entries.length })}
        </span>
        <span class="spring"></span>
        <button
          type="button"
          class="list-toggle"
          aria-expanded={listOpen}
          onclick={() => (listOpen = !listOpen)}
        >
          {listOpen ? t('found-list-hide') : t('found-list-show')}
          <span class="chevron" class:open={listOpen}><ChevronDown size={13} /></span>
        </button>
      </div>

      {#if listOpen}
        <div class="list" role="listbox" aria-label={t('found-list-label')} bind:this={list}>
          {#each going.entries as entry (entry.key)}
            {@const sure = going.sureness(entry)}
            {@const Sign = SURE[sure].icon}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="row"
              class:current={entry.key === current?.key}
              role="option"
              tabindex="-1"
              aria-selected={entry.key === current?.key}
              data-key={entry.key}
              data-sure={sure}
              onclick={() => going.show(entry.key)}
            >
              <span class="sign" use:tooltip={{ text: SURE[sure].words, side: 'right' }}>
                <Sign size={15} />
              </span>
              <span class="words">
                <span class="text serif truncate">{truncate(shown(entry.target.text), 60)}</span>
                <span class="where truncate">
                  {#if entry.note}<StickyNote size={11} /> {t('found-in-a-note')} ·
                  {/if}
                  {elementTitle(entry)}
                </span>
              </span>
            </div>
          {/each}
        </div>
      {/if}

      {#if current}
        {@const around = context(current)}
        {@const can = current.note ? going.can(current) : null}
        {@const how = going.how(current)}
        <div class="detail" bind:this={detail} data-entry={current.key}>
          <div class="overline">
            {current.note
              ? t('found-in-note-of', { element: elementTitle(current) })
              : t('found-in', { element: elementTitle(current) })}
          </div>
          {#if current.note && standsAt(current)}
            <p class="outer serif selectable">
              {standsAt(current)}<sup>{t('found-note-mark')}</sup>
            </p>
          {/if}
          <p class="passage serif selectable" class:note={current.note}>
            {around.before}<mark>{around.text}</mark>{around.after}
          </p>
          <div class="by" data-by={current.by}>{BY[current.by]}</div>

          {#if current.trouble}
            <p class="failure" role="alert">
              <CircleAlert size={15} /> <span>{current.trouble}</span>
            </p>
          {/if}

          <div class="proposed">
            <div class="overline">{t('found-the-citation')}</div>
            <div class="works">
              {#each current.works as work, i (work.key)}
                <FoundWork
                  bind:work={current.works[i]}
                  mode={current.mode}
                  index={i}
                  asking={going.asking}
                  onchoose={(reference) => going.choose(work, reference)}
                  onremove={() => going.remove(current, work)}
                  onedit={edit}
                  onanother={(anchor) => another(current, work, anchor)}
                  onadd={() => addToLibrary(work)}
                />
              {:else}
                <p class="no-works">{t('found-no-works')}</p>
              {/each}
            </div>
            <div class="foot">
              <button type="button" onclick={(e) => addWork(current, e.currentTarget)}>
                <Plus size={14} />
                {t('found-add-work')}
              </button>
              <label class="check inline">
                <input
                  type="checkbox"
                  checked={current.mode === 'intext'}
                  onchange={(e) => (current.mode = e.currentTarget.checked ? 'intext' : 'normal')}
                />
                {t('found-author-in-text')}
              </label>
            </div>
          </div>

          {#if current.note && can}
            <fieldset class="in-note">
              <legend class="overline">{t('found-in-note')}</legend>
              <label class="choice" class:off={!can.possible}>
                <input
                  type="radio"
                  name="in-note"
                  checked={how === 'note'}
                  disabled={!can.possible}
                  onchange={() => going.choice(current, 'note', going.kept.inNotes !== '')}
                />
                <span>
                  <strong>{t('found-note-becomes')}</strong>
                  <span class="hint">
                    {#if !can.possible}
                      {can.why}
                    {:else if can.before || can.after}
                      {t('found-note-around', {
                        has: can.before && can.after ? 'both' : can.before ? 'before' : 'after',
                        before: truncate(can.before, 60),
                        after: truncate(can.after, 60),
                      })}
                    {:else}
                      {t('found-note-style')}
                    {/if}
                  </span>
                </span>
              </label>
              <label class="choice">
                <input
                  type="radio"
                  name="in-note"
                  checked={how === 'here'}
                  onchange={() => going.choice(current, 'here', going.kept.inNotes !== '')}
                />
                <span>
                  <strong>{t('found-citation-in-note')}</strong>
                  <span class="hint">{t('found-citation-in-note.hint')}</span>
                </span>
              </label>
              <label class="check all">
                <input
                  type="checkbox"
                  checked={going.kept.inNotes !== ''}
                  onchange={(e) => going.choice(current, how, e.currentTarget.checked)}
                />
                {t('found-for-all')}
              </label>
            </fieldset>
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  {#if current}
    <footer>
      <span class="keys"><kbd>↑</kbd><kbd>↓</kbd> <kbd>Enter</kbd> <kbd>Ctrl+Z</kbd></span>
      <div class="buttons">
        <Button
          variant="ghost"
          size="sm"
          disabled={waiting || going.entries.length < 2}
          onclick={later}
        >
          {t('found-later')}
        </Button>
        <Button size="sm" disabled={waiting} onclick={leave}>{t('found-leave')}</Button>
        <Button
          variant="primary"
          size="sm"
          disabled={waiting || !going.ready(current)}
          onclick={make}
        >
          {t('found-make')}
        </Button>
      </div>
    </footer>
  {/if}
</aside>

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
  .through {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    outline: none;
  }
  .through:focus-visible {
    box-shadow: inset 0 0 0 2px var(--focus-ring);
  }
  .taken {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 4px 16px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .always {
    margin: -2px 0 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .check {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: 1.4;
    cursor: pointer;
  }
  .check input,
  .choice input {
    flex: none;
    margin: 2px 0 0;
    accent-color: var(--accent);
  }
  .state {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .certain {
    margin-top: 6px;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: var(--space-3) 16px 0;
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .detail .failure {
    margin: var(--space-3) 0 0;
  }
  .nothing {
    padding: 24px 16px;
  }
  .where-in {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 8px 6px 10px;
    border-bottom: 1px solid var(--line);
  }
  .position {
    margin-left: 6px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .spring {
    flex: 1;
  }
  .list-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .list-toggle:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .chevron {
    display: inline-flex;
    transition: transform 120ms ease;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
  .list {
    max-height: 36vh;
    overflow-y: auto;
    padding: 6px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .row:hover {
    background: var(--paper-hover);
  }
  .row.current {
    background: var(--accent-soft);
  }
  .sign {
    display: inline-flex;
    flex: none;
    margin-top: 2px;
    color: var(--ink-4);
  }
  .row[data-sure='certain'] .sign {
    color: var(--ok);
  }
  .row[data-sure='likely'] .sign {
    color: var(--accent);
  }
  .row[data-sure='possible'] .sign {
    color: var(--warn);
  }
  .words {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 1px;
  }
  .text {
    font-size: var(--text-md);
  }
  .where {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .where :global(svg) {
    vertical-align: -1px;
  }
  .detail {
    padding: var(--space-3) 16px var(--space-5);
  }
  .outer {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--text-md);
    line-height: 1.5;
  }
  .outer sup {
    margin-left: 1px;
    color: var(--accent-strong);
    font-family: var(--font-ui);
    font-size: 10px;
  }
  .passage {
    margin: 6px 0 0;
    font-size: var(--text-lg);
    line-height: 1.55;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .passage.note {
    padding-left: 10px;
    border-left: 2px solid var(--line-strong);
    font-size: var(--text-md);
  }
  mark {
    padding: 1px 0;
    border-bottom: 1.5px dotted var(--gold);
    border-radius: 2px 2px 0 0;
    background: var(--gold-soft);
    color: var(--ink);
  }
  .by {
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .proposed {
    margin-top: var(--space-4);
  }
  .works {
    margin-top: 6px;
    border: 1px solid var(--line);
    border-bottom: none;
    border-radius: var(--radius-m) var(--radius-m) 0 0;
    background: var(--paper);
  }
  .no-works {
    margin: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 6px;
    padding: 4px;
    border: 1px solid var(--line);
    border-top: none;
    border-radius: 0 0 var(--radius-m) var(--radius-m);
    background: var(--paper);
  }
  .foot button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .foot button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .check.inline {
    align-items: center;
    margin: 0 4px 0 auto;
  }
  .in-note {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: var(--space-4) 0 0;
    padding: 0;
    border: none;
  }
  .in-note legend {
    padding: 0;
    margin-bottom: 6px;
  }
  .choice {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    cursor: pointer;
  }
  .choice.off {
    cursor: default;
  }
  .choice.off strong {
    color: var(--ink-3);
  }
  .choice strong {
    display: block;
    font-weight: 550;
  }
  .hint {
    display: block;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .check.all {
    margin-left: 22px;
  }
  footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: none;
    padding: 8px 12px 10px;
    border-top: 1px solid var(--line);
  }
  .keys {
    display: inline-flex;
    gap: 3px;
    padding-left: 4px;
    color: var(--ink-3);
    font-size: var(--text-xs);
    opacity: 0.8;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
  }
</style>
