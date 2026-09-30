<script lang="ts">
  /**
   * A map as it was at a moment of the history, not to be written in: its
   * elements in the order of the text, with what changed since the moment
   * before marked in the colour of who changed it. From here an element or
   * the whole map is brought back as it was, the moment is given a name, or
   * the project as it was is opened as a project of its own.
   */
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import CopyPlus from '@lucide/svelte/icons/copy-plus';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import { projectCreate, projectSaveState } from '$lib/api/projects';
  import { languages, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import { colourOf } from '$lib/sharing/connection.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { MapAt } from './history.svelte';
  import type { Looking } from './looking';
  import type { Passage, Piece } from './types';

  interface Props {
    project: Project;
    map: string;
    looking: Looking;
    onback: () => void;
  }

  let { project, map, looking, onback }: Props = $props();

  let reading = $state.raw<MapAt | null>(null);
  let failed = $state(false);
  let names = $state.raw(new Map<string, string>());
  let naming = $state<string | null>(null);
  let busy = $state(false);

  const history = $derived(looking.history);
  const own = $derived(!history.archive);

  $effect(() => {
    const l = looking;
    const m = map;
    reading = null;
    failed = false;
    Promise.all([l.history.mapAt(m, l.when, l.since), l.history.people()])
      .then(([r, people]) => {
        if (l !== looking || m !== map) return;
        reading = r;
        names = new Map(people.map((p) => [p.id, p.name]));
      })
      .catch((error) => {
        failed = true;
        console.error('the map could not be read as it was', error);
      });
  });

  /** The passages of each element, by element and part. */
  const byElement = $derived.by(() => {
    const out = new Map<string, { title: Passage[]; body: Passage[] }>();
    for (const p of reading?.all ?? []) {
      let entry = out.get(p.place.element);
      if (!entry) out.set(p.place.element, (entry = { title: [], body: [] }));
      entry[p.place.part].push(p);
    }
    return out;
  });

  const when = $derived(
    new Date(looking.time).toLocaleString(languages.current, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  function who(person: string | null): string {
    return person ? names.get(person) || t('history-someone') : t('history-someone');
  }

  function style(piece: Piece): string {
    const person = piece.by ?? piece.marksBy ?? '';
    return `--who: ${colourOf(person)}`;
  }

  function title(piece: Piece): string {
    if (piece.status === 'added') return t('history-added-by', { name: who(piece.by) });
    if (piece.status === 'removed') return t('history-removed-by', { name: who(piece.by) });
    if (piece.marksBefore || piece.objectBefore)
      return t('history-changed-by', { name: who(piece.marksBy ?? null) });
    return '';
  }

  function objectText(piece: Piece): string {
    const o = piece.object!;
    if (o.label) return o.label;
    if (o.kind === 'footnote') return '*';
    if (o.kind === 'hard_break') return '↵';
    if (o.kind === 'crossref') return t('history-pointer');
    return '◦';
  }

  function elementStatus(element: string): 'added' | 'removed' | null {
    const change = reading?.elements.find(
      (c) => c.element === element && (c.kind === 'added' || c.kind === 'removed'),
    );
    return (change?.kind as 'added' | 'removed' | undefined) ?? null;
  }

  async function bringBack(element: string | null) {
    busy = true;
    try {
      const done = await history.bringBack(map, element, looking.when);
      if (done) notify(t('history-brought-back'));
    } catch (error) {
      notifyError(t('history-bring-back-failed'), error);
    } finally {
      busy = false;
    }
  }

  async function name() {
    const words = naming?.trim();
    naming = null;
    if (!words) return;
    const moment =
      typeof looking.when === 'number'
        ? await history.moment(looking.when)
        : { snapshot: looking.when, time: looking.time };
    history.name(moment, words);
    notify(t('history-named', { name: words }));
  }

  async function openCopy() {
    busy = true;
    try {
      const day = new Date(looking.time).toLocaleDateString(languages.current, {
        day: 'numeric',
        month: 'long',
      });
      const state = await history.stateAt(looking.when);
      const copy = await projectCreate(t('history-copy-name', { name: project.name, day }));
      const info = await projectSaveState(copy.id, state, null);
      projects.put(info);
      router.go({ view: 'project', project: copy.id });
    } catch (error) {
      notifyError(t('history-copy-failed'), error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="past">
  <div class="bar">
    <Button size="sm" variant="primary" onclick={onback}>
      <ArrowLeft size={14} />
      {t('history-back')}
    </Button>
    <span class="when">
      {#if looking.name}<strong>{looking.name}</strong> ·
      {/if}{t('history-as-it-was', { when })}
    </span>
    {#if own}
      {#if naming !== null}
        <input
          class="naming"
          bind:value={naming}
          placeholder={t('history-name-placeholder')}
          aria-label={t('history-name-moment')}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') void name();
            else if (e.key === 'Escape') naming = null;
          }}
          onblur={() => void name()}
          {@attach (el: HTMLInputElement) => el.focus()}
        />
      {:else}
        <IconButton label={t('history-name-moment')} size="sm" onclick={() => (naming = '')}
          ><Bookmark size={15} /></IconButton
        >
      {/if}
      <IconButton
        label={t('history-bring-back-map')}
        size="sm"
        disabled={busy}
        onclick={() => bringBack(null)}><RotateCcw size={15} /></IconButton
      >
    {/if}
    <IconButton label={t('history-open-copy')} size="sm" disabled={busy} onclick={openCopy}
      ><CopyPlus size={15} /></IconButton
    >
  </div>

  {#if failed}
    <p class="note">{t('history-failed')}</p>
  {:else if !reading}
    <div class="note"><Spinner size={18} /></div>
  {:else if !reading.order.length}
    <p class="note">{t('history-map-not-there')}</p>
  {:else}
    <div class="text serif" style:font-size="var(--text-size, 17px)">
      {#if looking.since !== null}
        <p class="about">{t('history-marked')}</p>
      {/if}
      {#each reading.order as entry (entry.element)}
        {@const parts = byElement.get(entry.element)}
        {@const status = elementStatus(entry.element)}
        <section
          class="element"
          class:appeared={status === 'added'}
          class:went={status === 'removed'}
          data-element={entry.element}
        >
          <div class="heading level-{Math.min(entry.level, 4)}">
            {#each parts?.title ?? [] as passage (passage.block)}
              {@render text(passage)}
            {/each}
            {#if own && entry.after}
              <button
                type="button"
                class="back"
                disabled={busy}
                use:tooltip={t('history-bring-back-element')}
                aria-label={t('history-bring-back-element')}
                onclick={() => bringBack(entry.element)}><RotateCcw size={13} /></button
              >
            {/if}
          </div>
          {#each parts?.body ?? [] as passage (passage.block)}
            <p
              class="passage {passage.kind}"
              class:gone={!passage.after}
              class:new={!passage.before}
            >
              {@render text(passage)}
            </p>
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</div>

{#snippet text(passage: Passage)}
  {#each passage.pieces as piece, i (i)}
    {#if piece.object}
      <span
        class="object {piece.status}"
        class:changed={!!piece.objectBefore}
        style={style(piece)}
        title={title(piece)}>{objectText(piece)}</span
      >
    {:else}
      <span
        class="piece {piece.status}"
        class:em={!!piece.marks.em}
        class:strong={!!piece.marks.strong}
        class:smallcaps={!!piece.marks.smallcaps}
        class:changed={!!piece.marksBefore}
        style={style(piece)}
        title={title(piece)}>{piece.text}</span
      >
    {/if}
  {/each}
{/snippet}

<style>
  .past {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--paper);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    padding: 6px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--accent-softer);
  }
  .when {
    flex: 1;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .naming {
    width: 200px;
    padding: 3px 8px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: inherit;
  }
  .note {
    display: flex;
    justify-content: center;
    padding: 30px;
    color: var(--ink-2);
  }
  .text {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 48px 60px;
    line-height: 1.6;
  }
  .about {
    margin: 0 0 16px;
    color: var(--ink-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .element {
    max-width: 44em;
    margin: 0 auto;
  }
  .element.went {
    opacity: 0.75;
  }
  .heading {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 1.1em 0 0.3em;
    font-weight: 600;
  }
  .heading.level-0 {
    font-size: 1.5em;
  }
  .heading.level-1 {
    font-size: 1.3em;
  }
  .heading.level-2 {
    font-size: 1.12em;
  }
  .back {
    display: inline-flex;
    padding: 2px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
    opacity: 0;
  }
  .heading:hover .back,
  .back:focus-visible {
    opacity: 1;
  }
  .back:hover {
    color: var(--accent-strong);
    background: var(--paper-hover);
  }
  .passage {
    margin: 0 0 0.7em;
  }
  .passage.note {
    margin-left: 2em;
    font-size: 0.88em;
    color: var(--ink-2);
  }
  .passage.caption {
    font-style: italic;
  }
  .passage.cell {
    margin-left: 1em;
  }
  .em {
    font-style: italic;
  }
  .strong {
    font-weight: 600;
  }
  .smallcaps {
    font-variant: small-caps;
  }
  .added {
    background: color-mix(in srgb, var(--who) 18%, transparent);
    box-shadow: inset 0 -2px 0 var(--who);
    text-decoration: none;
  }
  .removed {
    color: var(--who);
    text-decoration: line-through;
    text-decoration-color: var(--who);
  }
  .changed {
    box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--who) 60%, transparent);
  }
  .object {
    padding: 0 3px;
    border-radius: 3px;
    background: var(--paper-sunken);
    font-family: var(--font-ui);
    font-size: 0.85em;
  }
</style>
