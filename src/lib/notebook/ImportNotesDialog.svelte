<script lang="ts">
  /**
   * Import notes… (`docs/plans/the-notebook.md`, stage 5), made as the
   * library's import from Zotero is: a folder or a file of notes of another
   * program is chosen with the system's dialog, or handed in by the page;
   * what was found there is shown before anything is made; Import reads it,
   * with the count said here and Stop, and the notes are made in a box of
   * their own (`importing.ts`). Then the window closes and a message says
   * what was done, with Show. Stopped, nothing is made and the window stays;
   * what fails is said here, with the choice offered again.
   */
  import { onMount, untrack } from 'svelte';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { open as openDialog } from '@tauri-apps/plugin-dialog';
  import { isBackendError, type Count } from '$lib/api/backend';
  import {
    notesLook,
    notesRead,
    notesReadStop,
    onNotesProgress,
    type NotesLook,
  } from '$lib/api/notebook';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notify, toasts } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { notesOfRead } from './importing';
  import type { Notebook } from './model/notebook.svelte';
  import { boxName } from './page.svelte';

  interface Props {
    notebook: Notebook;
    /** A folder or a file chosen before the window opened, to be looked at at once. */
    path?: string | null;
    onclose: () => void;
    /** Brings a box into view: the box the notes were made in, asked for from the message. */
    onshow: (box: string) => void;
  }

  let { notebook, path = null, onclose, onshow }: Props = $props();

  /** The endings of the files of notes a file can be. */
  const ENDINGS = ['enex', 'md', 'markdown', 'txt', 'one'];
  /** How many of what could not be read the message names. */
  const NAMED = 3;

  let chosen = $state<string | null>(null);
  let look = $state.raw<NotesLook | null>(null);
  let looking = $state(false);
  let error = $state<string | null>(null);
  /** How far the reading has come; none while nothing is read. */
  let progress = $state.raw<Count | null>(null);
  let ticket: string | null = null;
  /** Counts the lookings, so that only the last one asked for is shown. */
  let asked = 0;

  const reading = $derived(progress !== null);

  onMount(() => {
    const given = untrack(() => path);
    if (given) void lookAt(given);
  });

  /** Looks at what was chosen: what is there is shown, or why it could not be looked at. */
  export async function lookAt(where: string) {
    if (reading) return;
    const mine = ++asked;
    chosen = where;
    look = null;
    error = null;
    looking = true;
    try {
      const found = await notesLook(where);
      if (mine === asked) look = found;
    } catch (e) {
      if (mine === asked) error = describeError(e) ?? t('notebook-import-unread');
    } finally {
      if (mine === asked) looking = false;
    }
  }

  async function chooseFolder() {
    const dir = await openDialog({ title: t('notebook-import-choose-folder'), directory: true });
    if (typeof dir === 'string') await lookAt(dir);
  }

  async function chooseFile() {
    const file = await openDialog({
      title: t('notebook-import-choose-file'),
      filters: [{ name: t('notebook-import-filter'), extensions: ENDINGS }],
    });
    if (typeof file === 'string') await lookAt(file);
  }

  async function read() {
    const where = chosen;
    const found = look;
    if (!where || !found || !found.notes || reading || looking) return;
    const mine = newId();
    ticket = mine;
    error = null;
    progress = { done: 0, total: found.notes, name: '' };
    const unlisten = await onNotesProgress(mine, (count) => {
      if (ticket === mine) progress = count;
    });
    try {
      const notes = await notesRead(where, mine);
      const made = notesOfRead(
        notebook,
        notes,
        found.name.trim() || t('notebook-import-kind', { kind: found.kind }),
      );
      onclose();
      say(made, notes.problems);
    } catch (e) {
      // Stopped, nothing was made, and the window stays as it was.
      if (!(isBackendError(e) && e.kind === 'stopped'))
        error = describeError(e) ?? t('notebook-import-unread');
    } finally {
      unlisten();
      if (ticket === mine) ticket = null;
      progress = null;
    }
  }

  function stop() {
    if (ticket) void notesReadStop(ticket).catch(() => {});
  }

  /** Says what was done: how many notes, into which box, with Show; and what could not be read. */
  function say(made: ReturnType<typeof notesOfRead>, problems: string[]) {
    const unread = problems.length
      ? t('notebook-import-problems', {
          count: problems.length,
          first: problems.slice(0, NAMED).join('; ') + (problems.length > NAMED ? ' …' : ''),
        })
      : undefined;
    if (!made) {
      notify(t('notebook-import-nothing'), unread);
      return;
    }
    const box = notebook.boxes.find((b) => b.id === made.box);
    toasts.show(
      {
        kind: 'ok',
        message: t('notebook-import-done', {
          count: made.notes.length,
          box: box ? boxName(box) : '',
        }),
        detail: unread,
        action: { label: t('common-show'), run: () => onshow(made.box) },
      },
      unread ? 15000 : 8000,
    );
  }

  function close() {
    if (reading) return;
    onclose();
  }
</script>

<Dialog open title={t('notebook-import-title')} width={520} dismissable={!reading} onclose={close}>
  <div class="content" data-import-notes>
    <div class="choose">
      <Button disabled={reading} data-import-folder onclick={() => void chooseFolder()}>
        {#snippet icon()}<FolderOpen size={15} />{/snippet}
        {t('notebook-import-folder')}
      </Button>
      <Button disabled={reading} data-import-file onclick={() => void chooseFile()}>
        {#snippet icon()}<FileText size={15} />{/snippet}
        {t('notebook-import-file')}
      </Button>
    </div>
    <p class="programs">{t('notebook-import-programs')}</p>

    {#if looking}
      <div class="waiting" data-import-looking><Spinner size={18} /></div>
    {:else if look}
      <div class="found" data-import-found data-kind={look.kind} data-notes={look.notes}>
        <div class="kind">{t('notebook-import-kind', { kind: look.kind })}</div>
        <div class="name selectable" title={chosen ?? undefined}>{look.name}</div>
        <div class="facts">
          {t('notebook-import-count', { count: look.notes })} · {t('notebook-import-files', {
            count: look.attachments,
          })}
        </div>
      </div>
      {#if !look.notes}
        <p class="lead" data-import-none>{t('notebook-import-none')}</p>
      {/if}
      {#if look.remarks.length}
        <section class="to-know" data-import-remarks>
          <h3>{t('notebook-import-to-know')}</h3>
          {#each look.remarks as remark}
            <p class="remark"><TriangleAlert size={13} /> {remark}</p>
          {/each}
        </section>
      {/if}
    {/if}

    {#if progress}
      <p class="reading" role="status" data-import-reading>
        <Spinner size={14} />
        <span
          >{t('notebook-import-reading', {
            done: Math.min(progress.done + 1, progress.total),
            count: progress.total,
            name: progress.name,
          })}</span
        >
      </p>
    {/if}
    {#if error}<p class="error selectable" role="alert" data-import-error>{error}</p>{/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" disabled={reading} onclick={close}>{t('common-cancel')}</Button>
    {#if reading}
      <Button data-import-stop onclick={stop}>{t('notebook-import-stop')}</Button>
    {:else}
      <Button
        variant="primary"
        disabled={!look || !look.notes || looking}
        data-import-do
        onclick={() => void read()}>{t('notebook-import-do')}</Button
      >
    {/if}
  {/snippet}
</Dialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 140px;
  }
  .choose {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .programs {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .waiting {
    display: flex;
    justify-content: center;
    padding: 24px 0;
  }
  .found {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .kind {
    font-weight: 500;
  }
  .name {
    overflow-wrap: anywhere;
  }
  .facts {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .lead {
    margin: 0;
    color: var(--ink-2);
  }
  .to-know {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .to-know h3 {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .remark {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .remark :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .reading {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    min-width: 0;
  }
  .reading span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .error {
    margin: 0;
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
</style>
