<script lang="ts">
  /**
   * The settings of the history of a project: whether it is kept, how
   * finely older history is kept, the room it takes, and taking out what
   * came before a moment, into an archive or for good.
   */
  import { onMount } from 'svelte';
  import { save } from '@tauri-apps/plugin-dialog';
  import { historyDelete } from '$lib/api/history';
  import { languages, t } from '$lib/i18n';
  import { fileSize } from '$lib/library/format';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import type { ProjectHistory } from './history.svelte';
  import type { Looking } from './looking';

  interface Props {
    project: Project;
    history: ProjectHistory;
    looking: Looking | null;
    onlook: (looking: Looking | null) => void;
  }

  let { project, history, looking, onlook }: Props = $props();

  let room = $state<number | null>(null);
  let busy = $state(false);

  async function measure() {
    try {
      room = await history.room();
    } catch {
      room = null;
    }
  }
  onMount(measure);

  async function turnOff() {
    const sure = await confirm({
      title: t('history-turn-off-title'),
      message:
        project.others.length || project.yUsers.size > 1
          ? t('history-turn-off-shared')
          : t('history-turn-off-message'),
      confirm: t('history-turn-off'),
      danger: true,
    });
    if (!sure) return;
    busy = true;
    try {
      onlook(null);
      history.stop();
      await project.setHistory({ on: false });
      await historyDelete(history.id);
    } catch (error) {
      notifyError(t('history-failed'), error);
    } finally {
      busy = false;
    }
  }

  function setNumber(key: 'hourly' | 'daily', value: string) {
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && n >= 1 && n <= 120 && n !== project.history[key])
      void project.setHistory({ [key]: n });
  }

  /** The moment chosen, as a record of this project's history, where it is one. */
  const record = $derived(
    looking && looking.history === history && typeof looking.when === 'number'
      ? looking.when
      : null,
  );

  function day(time: number): string {
    return new Date(time).toLocaleString(languages.current, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function cut(archiving: boolean) {
    if (record === null || !looking) return;
    busy = true;
    try {
      const at = day(looking.time);
      const cutting = await history.cutting(record);
      if (!cutting) {
        notify(t('history-cut-not-here'));
        return;
      }
      const sure = await confirm({
        title: archiving
          ? t('history-archive-title', { when: at })
          : t('history-delete-title', { when: at }),
        message:
          t('history-cut-message') +
          (cutting.before ? ` ${t('history-cut-kept', { count: cutting.before })}` : ''),
        confirm: archiving ? t('history-archive') : t('history-delete'),
        danger: !archiving,
      });
      if (!sure) return;
      let path: string | null = null;
      if (archiving) {
        path = await save({
          title: t('history-archive'),
          defaultPath:
            `${project.name} ${t('history-archive-until', { when: at })}.glaukopis-history`.replace(
              /[/\\:]/g,
              ' ',
            ),
          filters: [{ name: t('history-archive-kind'), extensions: ['glaukopis-history'] }],
        });
        if (!path) return;
      }
      await history.cut(record, path);
      onlook(null);
      notify(archiving ? t('history-archived', { when: at }) : t('history-deleted', { when: at }));
      await measure();
    } catch (error) {
      notifyError(t('history-cut-failed'), error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="settings">
  <section>
    <label class="row">
      <input type="checkbox" checked disabled={busy} onchange={turnOff} />
      <span>{t('history-keep')}</span>
    </label>
    <p class="hint">
      {room === null ? '' : t('history-room', { size: fileSize(room) })}
    </p>
  </section>

  <section>
    <h3>{t('history-finely')}</h3>
    <p class="hint">{t('history-finely-about')}</p>
    <label class="row">
      <span class="grow">{t('history-hourly')}</span>
      <input
        type="number"
        min="1"
        max="120"
        value={project.history.hourly}
        aria-label={t('history-hourly')}
        onchange={(e) => setNumber('hourly', e.currentTarget.value)}
      />
      <span>{t('history-weeks', { count: project.history.hourly })}</span>
    </label>
    <label class="row">
      <span class="grow">{t('history-daily')}</span>
      <input
        type="number"
        min="1"
        max="120"
        value={project.history.daily}
        aria-label={t('history-daily')}
        onchange={(e) => setNumber('daily', e.currentTarget.value)}
      />
      <span>{t('history-months', { count: project.history.daily })}</span>
    </label>
  </section>

  <section>
    <h3>{t('history-before')}</h3>
    {#if record === null || !looking}
      <p class="hint">{t('history-before-choose')}</p>
    {:else}
      <p class="hint">{t('history-before-about', { when: day(looking.time) })}</p>
      <div class="buttons">
        <Button size="sm" disabled={busy} onclick={() => cut(true)}>{t('history-archive')}</Button>
        <Button size="sm" variant="danger" disabled={busy} onclick={() => cut(false)}
          >{t('history-delete')}</Button
        >
      </div>
    {/if}
  </section>
</div>

<style>
  .settings {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border-top: 1px solid var(--line);
  }
  section {
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }
  h3 {
    margin: 0 0 4px;
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
  }
  .grow {
    flex: 1;
  }
  input[type='number'] {
    width: 56px;
    padding: 3px 6px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: inherit;
  }
  .hint {
    margin: 2px 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
</style>
