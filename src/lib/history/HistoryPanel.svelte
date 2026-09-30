<script lang="ts">
  import type { Snippet } from 'svelte';
  /**
   * The history of the project beside the map (ADR 0021): what each person
   * did before a pause, and the moments that were given a name, the newest
   * first. Choosing one shows the map as it was then. The settings of the
   * history are here as well.
   */
  import { onDestroy, untrack } from 'svelte';
  import Archive from '@lucide/svelte/icons/archive';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import History from '@lucide/svelte/icons/history';
  import Settings from '@lucide/svelte/icons/settings-2';
  import X from '@lucide/svelte/icons/x';
  import { open } from '@tauri-apps/plugin-dialog';
  import { historyArchiveRead } from '$lib/api/history';
  import { languages, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import { colourOf } from '$lib/sharing/connection.svelte';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { ProjectHistory } from './history.svelte';
  import HistorySettings from './HistorySettings.svelte';
  import type { Looking } from './looking';
  import type { Named, Session } from './types';

  interface Props {
    project: Project;
    history: ProjectHistory;
    looking: Looking | null;
    /** The pane the map is in, where a moment is shown. */
    pane: number;
    onlook: (looking: Looking | null) => void;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
  }

  let { project, history, looking, pane, onlook, onclose, head }: Props = $props();

  let sessions = $state.raw<Session[] | null>(null);
  let named = $state.raw<Named[]>([]);
  let names = $state.raw(new Map<string, string>());
  let failed = $state(false);
  let showSettings = $state(false);
  /** An archive that was opened, in place of the project's own history. */
  let archive = $state.raw<ProjectHistory | null>(null);
  let turning = $state(false);

  const shown = $derived(archive ?? history);
  const on = $derived(project.history.on);

  type Row =
    | { kind: 'session'; session: Session; since: number | null }
    | { kind: 'named'; named: Named; since: number | null };

  /** The sessions and named moments, the newest first. */
  const rows = $derived.by((): Row[] => {
    const list = sessions ?? [];
    const out: Row[] = list.map((session, i) => ({
      kind: 'session',
      session,
      since: i > 0 ? list[i - 1].last : null,
    }));
    for (const n of named) {
      const before = list.filter((s) => s.until <= n.moment.time);
      out.push({
        kind: 'named',
        named: n,
        since: before.length ? before[before.length - 1].last : null,
      });
    }
    const time = (r: Row) => (r.kind === 'session' ? r.session.until : r.named.moment.time);
    return out.sort((a, b) => time(b) - time(a) || (a.kind === 'named' ? -1 : 1));
  });

  async function read(which: ProjectHistory) {
    try {
      const [s, n, p] = await Promise.all([which.sessions(), which.named(), which.people()]);
      if (which !== shown) return;
      sessions = s;
      named = n;
      names = new Map(p.map((x) => [x.id, x.name]));
      failed = false;
    } catch (error) {
      failed = true;
      notifyError(t('history-failed'), error);
    }
  }

  // Read when it is looked at, and again when the project has changed and the writing pauses.
  $effect(() => {
    const which = shown;
    if (!on && !which.archive) return;
    untrack(() => void read(which));
    return project.onChange(() => void read(which), 1200);
  });

  function nameOf(person: string | null): string {
    if (!person) return t('history-someone');
    return names.get(person) || t('history-someone');
  }

  function when(time: number, withDay = true): string {
    return new Date(time).toLocaleString(languages.current, {
      ...(withDay ? { day: 'numeric', month: 'long' } : {}),
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function span(s: Session): string {
    const a = new Date(s.time);
    const b = new Date(s.until);
    const sameDay = a.toDateString() === b.toDateString();
    if (s.until - s.time < 60_000) return when(s.until);
    return t('history-span', { from: when(s.time), to: when(s.until, !sameDay) });
  }

  function choose(row: Row) {
    if (row.kind === 'session') {
      const s = row.session;
      onlook({ history: shown, when: s.last, since: row.since, time: s.until, name: null, pane });
    } else {
      const n = row.named;
      onlook({
        history: shown,
        when: n.moment.snapshot,
        since: row.since,
        time: n.moment.time,
        name: n.name,
        pane,
      });
    }
  }

  const chosen = (row: Row) =>
    !!looking &&
    looking.history === shown &&
    (row.kind === 'session'
      ? looking.when === row.session.last
      : looking.when === row.named.moment.snapshot);

  async function turnOn() {
    turning = true;
    try {
      await history.turnOn();
    } catch (error) {
      notifyError(t('history-failed'), error);
    } finally {
      turning = false;
    }
  }

  async function openArchive() {
    const path = await open({
      title: t('history-open-archive'),
      filters: [{ name: t('history-archive-kind'), extensions: ['glaukopis-history'] }],
    });
    if (typeof path !== 'string') return;
    const name = path.split(/[\\/]/).pop() ?? path;
    const opened = new ProjectHistory(project, history.id, {
      archive: name,
      read: () => historyArchiveRead(path),
    });
    try {
      await opened.start();
      archive?.stop();
      archive = opened;
      sessions = null;
      onlook(null);
      showSettings = false;
    } catch (error) {
      notifyError(t('history-archive-unread'), error);
    }
  }

  function closeArchive() {
    archive?.stop();
    archive = null;
    sessions = null;
    onlook(null);
  }

  onDestroy(() => archive?.stop());
</script>

<div class="panel history-panel">
  <header>
    {#if head}{@render head()}{:else}<h2>{t('history-title')}</h2>{/if}
    {#if on}
      <IconButton
        label={t('history-settings')}
        size="sm"
        active={showSettings}
        onclick={() => (showSettings = !showSettings)}><Settings size={15} /></IconButton
      >
    {/if}
    <IconButton label={t('history-open-archive')} size="sm" onclick={openArchive}
      ><FolderOpen size={15} /></IconButton
    >
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  {#if archive}
    <div class="archive">
      <Archive size={14} />
      <span class="truncate">{t('history-archive-of', { name: archive.archive ?? '' })}</span>
      <Button size="sm" variant="ghost" onclick={closeArchive}>{t('history-archive-close')}</Button>
    </div>
  {/if}

  {#if showSettings && !archive && on}
    <HistorySettings {project} {history} {looking} onlook={(l) => onlook(l)} />
  {:else if !on && !archive}
    <div class="off">
      <History size={28} />
      <p>{t('history-off')}</p>
      <p class="about">{t('history-off-about')}</p>
      <Button variant="primary" disabled={turning} onclick={turnOn}>{t('history-turn-on')}</Button>
    </div>
  {:else if failed && sessions === null}
    <p class="note">{t('history-failed')}</p>
  {:else if sessions === null}
    <div class="waiting"><Spinner size={18} /> {t('history-reading')}</div>
  {:else}
    <ul class="moments">
      {#each rows as row (row.kind === 'session' ? `s${row.session.first}` : `n${row.named.id}`)}
        <li>
          <button
            type="button"
            class="moment"
            class:chosen={chosen(row)}
            class:named={row.kind === 'named'}
            onclick={() => choose(row)}
          >
            {#if row.kind === 'named'}
              <span class="mark"><Bookmark size={13} /></span>
              <span class="what">
                <span class="name">{row.named.name}</span>
                <span class="when">{when(row.named.moment.time)}</span>
              </span>
            {:else if row.session.person === null && row.session.first === 0}
              <span class="mark"><History size={13} /></span>
              <span class="what">
                <span class="name">{t('history-began')}</span>
                <span class="when">{when(row.session.until)}</span>
              </span>
            {:else}
              <span class="dot" style:background={colourOf(row.session.person ?? '')}></span>
              <span class="what">
                <span class="name">{nameOf(row.session.person)}</span>
                <span class="when">
                  {span(row.session)}{#if row.session.merged}
                    · {t('history-merged')}{/if}
                </span>
              </span>
              <span class="much">
                {#if row.session.added}<span class="added"
                    >{t('history-added', { count: row.session.added })}</span
                  >{/if}
                {#if row.session.removed}<span class="removed"
                    >{t('history-removed', { count: row.session.removed })}</span
                  >{/if}
              </span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

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
  .archive {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 12px 8px;
    padding: 4px 4px 4px 10px;
    border-radius: var(--radius-s);
    background: var(--accent-softer);
    color: var(--accent-strong);
    font-size: var(--text-sm);
  }
  .archive span {
    flex: 1;
    min-width: 0;
  }
  .off {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 30px 22px;
    color: var(--ink-3);
    text-align: center;
  }
  .off p {
    margin: 0;
    color: var(--ink-1);
    line-height: 1.5;
  }
  .off p.about {
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .note,
  .waiting {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    color: var(--ink-2);
  }
  .moments {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 0 6px 10px;
    overflow-y: auto;
    list-style: none;
    border-top: 1px solid var(--line);
  }
  .moment {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 7px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .moment:hover {
    background: var(--paper-hover);
  }
  .moment.chosen {
    background: var(--accent-soft);
  }
  .dot {
    width: 9px;
    height: 9px;
    flex: none;
    border-radius: 50%;
  }
  .mark {
    display: inline-flex;
    flex: none;
    color: var(--accent-strong);
  }
  .what {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: 550;
  }
  .named .name {
    color: var(--accent-strong);
  }
  .when {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .much {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  .added {
    color: var(--ok);
  }
  .removed {
    color: var(--danger);
  }
</style>
