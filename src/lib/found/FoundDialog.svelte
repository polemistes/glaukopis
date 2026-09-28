<script lang="ts">
  /**
   * The window in which the citations that were found in a map are gone
   * through, one at a time: see ADR 0015. What there is and what is done is
   * in `going.svelte.ts`; this shows it.
   */
  import { onMount, tick, untrack } from 'svelte';
  import CheckCheck from '@lucide/svelte/icons/check-check';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleDashed from '@lucide/svelte/icons/circle-dashed';
  import CircleDot from '@lucide/svelte/icons/circle-dot';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import Plus from '@lucide/svelte/icons/plus';
  import StickyNote from '@lucide/svelte/icons/sticky-note';
  import type { FoundBy } from '$lib/api/found';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { plural, truncate } from '$lib/library/format';
  import { editReference, newReference } from '$lib/library/references.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { library } from '$lib/state/library.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import FoundWork from './FoundWork.svelte';
  import { NO_TEXT } from './gather';
  import { Going, type Entry, type Work } from './going.svelte';

  interface Props {
    project: Project;
    map: string;
    /** The id of a citation that was found, to begin with. */
    at?: string | null;
    onkeep: (reference: string) => void;
    onclose: () => void;
  }

  let { project, map, at = null, onkeep, onclose }: Props = $props();

  // The window is made anew for every map it is opened for.
  // svelte-ignore state_referenced_locally
  const going = new Going(project, map, {
    kept: $state.snapshot(settings.value.found),
    keep: (reference) => onkeep(reference),
    remember: (kept) => settings.setFound(kept),
  });

  let list = $state<HTMLDivElement>();
  let detail = $state<HTMLDivElement>();
  /** While something is asked of the writer in a window of its own. */
  let waiting = $state(false);
  let libraryAt = library.revision;

  onMount(() => {
    // svelte-ignore state_referenced_locally
    void library.load().then(() => {
      libraryAt = library.revision;
      const asked = going.open(at);
      // The keys are those of the list from the beginning.
      focusList();
      return asked;
    });
    return () => going.close();
  });

  // What is written elsewhere meanwhile, by the writer, by others, by undo.
  $effect(() => {
    void project.revision;
    untrack(() => going.changed());
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

  // The one that is looked at is in view in the list, and its text at the top beside it.
  $effect(() => {
    const key = current?.key;
    if (!key || !list) return;
    list.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({
      block: 'nearest',
    });
    if (detail) detail.scrollTop = 0;
  });

  const BY: Record<FoundBy, string> = {
    zotero: 'Made by Zotero',
    mendeley: 'Made by Mendeley, or a program that writes as it does',
    key: 'A tag that names a reference',
    form: 'Taken for a citation by how it looks',
  };

  const SURE = {
    certain: { icon: CircleCheck, words: 'The library has it for certain' },
    likely: { icon: CircleDot, words: 'The library has what is likely it' },
    possible: { icon: CircleDashed, words: 'The library has what may be it' },
    none: { icon: CircleQuestionMark, words: 'A work of it has no reference yet' },
  } as const;

  /** Text as it is shown: what is no text is a sign that says so. */
  const shown = (text: string) => text.replaceAll(NO_TEXT, '[…]').replace(/\s+/g, ' ');

  /** The passage an entry stands in, shortened around it where it is long. */
  function context(entry: Entry): { before: string; text: string; after: string } {
    const place = going.place(entry);
    if (!place) return { before: '', text: entry.target.text, after: '' };
    const { start, end } = entry.target;
    const room = 260;
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

  /** Of a note: the words it stands after, in the text. */
  function standsAt(entry: Entry): string {
    const place = going.place(entry);
    if (!place?.stands) return '';
    const outer = going.placeOf(place.stands.passage);
    if (!outer) return '';
    const before = shown(outer.text.slice(Math.max(0, place.stands.at - 90), place.stands.at));
    return before.length >= 90 ? `… ${before.slice(before.indexOf(' ') + 1)}` : before;
  }

  function focusList() {
    void tick().then(() => list?.focus());
  }

  function make() {
    if (going.make()) focusList();
  }

  function leave() {
    if (going.leave()) focusList();
  }

  function later() {
    going.later();
    focusList();
  }

  function makeCertain() {
    const made = going.makeCertain();
    if (made)
      notify(
        made === 1 ? 'One citation was made' : `${made.toLocaleString()} citations were made`,
        'Ctrl+Z takes them back, as one step.',
      );
    focusList();
  }

  function another(entry: Entry, work: Work, anchor: HTMLElement) {
    editorUi.pick({
      anchor: anchor.getBoundingClientRect(),
      exclude: entry.works.flatMap((w) => (w !== work && w.reference ? [w.reference] : [])),
      purpose: 'The work that is cited: author, title, year',
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
      purpose: 'Add a work to the citation',
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
        notify('The file says too little of this work to make a reference of it');
        return;
      }
      const made = await newReference({ draft });
      if (made) {
        going.choose(work, made.id);
        onkeep(made.id);
      }
    } catch (error) {
      notifyError('The reference could not be made', error);
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

<Dialog
  open
  title="Citations that were found"
  subtitle={`${project.map(map)?.name ?? ''}${
    going.entries.length ? ` · ${plural(going.entries.length, 'citation')} to go through` : ''
  }`}
  width={1080}
  tall
  padded={false}
  {onclose}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="found-window" {onkeydown}>
    <div class="taken">
      <span class="overline">What is taken for citations</span>
      <span class="always">What a program made, and tags</span>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.years}
          onchange={(e) => void going.take({ years: e.currentTarget.checked })}
        />
        Parentheses with a year in them
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.named || going.kept.notes}
          disabled={going.kept.notes}
          onchange={(e) => void going.take({ named: e.currentTarget.checked })}
        />
        Notes that name a work of the library
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={going.kept.notes}
          onchange={(e) => void going.take({ notes: e.currentTarget.checked })}
        />
        Every note
      </label>
      <span class="state" aria-live="polite">
        {#if going.asking}<Spinner size={13} /> Asking the library…{/if}
      </span>
      {#if certain}
        <Button size="sm" onclick={makeCertain}>
          {#snippet icon()}<CheckCheck size={14} />{/snippet}
          {certain === 1
            ? 'Make a citation of the one that is certain'
            : `Make citations of the ${certain.toLocaleString()} that are certain`}
        </Button>
      {/if}
    </div>

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
            title="Nothing to go through"
            text={going.proposing
              ? going.kept.years && going.kept.notes
                ? 'No citation that was found is left in this map, and nothing in it looks like one.'
                : 'No citation that was found is left in this map, and nothing in it looks like one. More can be taken for citations, above.'
              : 'No citation that was found is left in this map. Text that only looks like a citation is looked for when you say above what is to be taken for one: parentheses with a year in them, or notes.'}
          />
        {/if}
      </div>
    {:else}
      <div class="through">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="list"
          role="listbox"
          aria-label="What there is to go through"
          tabindex="0"
          data-autofocus
          bind:this={list}
        >
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
                  {#if entry.note}<StickyNote size={11} /> In a note ·
                  {/if}
                  {project.node(entry.element)?.title || 'Untitled'}
                </span>
              </span>
            </div>
          {/each}
        </div>

        {#if current}
          {@const around = context(current)}
          {@const can = current.note ? going.can(current) : null}
          {@const how = going.how(current)}
          <div class="detail" bind:this={detail} data-entry={current.key}>
            <div class="overline">
              {current.note ? 'In a note of' : 'In'}
              “{project.node(current.element)?.title || 'Untitled'}”
            </div>
            {#if current.note && standsAt(current)}
              <p class="outer serif selectable">{standsAt(current)}<sup>note</sup></p>
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
              <div class="overline">The citation</div>
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
                  <p class="no-works">It names no work. Add one, or leave it as the text it is.</p>
                {/each}
              </div>
              <div class="foot">
                <button type="button" onclick={(e) => addWork(current, e.currentTarget)}>
                  <Plus size={14} /> Add a work
                </button>
                <label class="check inline">
                  <input
                    type="checkbox"
                    checked={current.mode === 'intext'}
                    onchange={(e) => (current.mode = e.currentTarget.checked ? 'intext' : 'normal')}
                  />
                  Author in the text: Nagy (1979)
                </label>
              </div>
            </div>

            {#if current.note && can}
              <fieldset class="in-note">
                <legend class="overline">It stands in a note</legend>
                <label class="choice" class:off={!can.possible}>
                  <input
                    type="radio"
                    name="in-note"
                    checked={how === 'note'}
                    disabled={!can.possible}
                    onchange={() => going.choice(current, 'note', going.kept.inNotes !== '')}
                  />
                  <span>
                    <strong>The note becomes a citation</strong>
                    <span class="hint">
                      {#if !can.possible}
                        {can.why}
                      {:else if can.before || can.after}
                        What else the note says goes before and after its works{can.before
                          ? `: “${truncate(can.before, 60)}” before`
                          : ''}{can.after
                          ? `${can.before ? ',' : ':'} “${truncate(can.after, 60)}” after`
                          : ''}. The style of the references sets it in the line or in a note.
                      {:else}
                        The style of the references sets it in the line or in a note.
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
                    <strong>The citation stands in the note</strong>
                    <span class="hint">The note stays a note, with what else it says.</span>
                  </span>
                </label>
                <label class="check all">
                  <input
                    type="checkbox"
                    checked={going.kept.inNotes !== ''}
                    onchange={(e) => going.choice(current, how, e.currentTarget.checked)}
                  />
                  So for all that follow
                </label>
              </fieldset>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#snippet footer()}
    <span class="count">
      {#if current}
        {going.index + 1} of {going.entries.length.toLocaleString()}
        <span class="keys"><kbd>↑</kbd><kbd>↓</kbd> <kbd>Enter</kbd> <kbd>Ctrl+Z</kbd></span>
      {/if}
    </span>
    {#if current}
      <Button variant="ghost" disabled={waiting || going.entries.length < 2} onclick={later}>
        Later
      </Button>
      <Button disabled={waiting} onclick={leave}>Leave it as text</Button>
      <Button variant="primary" disabled={waiting || !going.ready(current)} onclick={make}>
        Make it a citation
      </Button>
    {:else}
      <Button variant="primary" onclick={onclose}>Close</Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .found-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .taken {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 18px;
    flex: none;
    min-height: 44px;
    padding: 6px var(--space-5);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .always {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  .check input,
  .choice input {
    accent-color: var(--accent);
    margin: 0;
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: var(--space-3) var(--space-5) 0;
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
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
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 0;
  }
  .through {
    display: grid;
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }
  .list {
    min-height: 0;
    overflow-y: auto;
    padding: 6px;
    border-right: 1px solid var(--line);
    background: var(--paper);
    outline: none;
  }
  .list:focus-visible {
    box-shadow: inset 0 0 0 2px var(--focus-ring);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 7px 9px;
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
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-4) var(--space-5) var(--space-5);
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
    font-size: 16px;
    line-height: 1.6;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .passage.note {
    padding-left: 12px;
    border-left: 2px solid var(--line-strong);
    font-size: var(--text-lg);
  }
  mark {
    padding: 1px 0;
    border-bottom: 1.5px dotted var(--gold);
    border-radius: 2px 2px 0 0;
    background: var(--gold-soft);
    color: var(--ink);
  }
  .by {
    margin-top: 8px;
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
    background: var(--paper-raised);
  }
  .no-works {
    margin: 0;
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px;
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
    padding: 0 9px;
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
    margin: 0 auto 0 8px;
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
  .choice input {
    margin-top: 3px;
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
  .count {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  .keys {
    display: inline-flex;
    gap: 3px;
    opacity: 0.8;
  }
</style>
