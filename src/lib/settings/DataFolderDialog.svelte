<script lang="ts">
  /**
   * Change… beside the data folder in the settings, and what follows it
   * (ADR 0084): a folder is chosen, and what it holds decides. An empty
   * folder has everything moved to it; one holding Glaukopis's data is used
   * as it is; anything else is refused, since two sets of data are not
   * merged. Either way Glaukopis then closes, saving everything, and starts
   * again; a copy to another disk is made first, with its progress here.
   */
  import { open as chooseFolder } from '@tauri-apps/plugin-dialog';
  import {
    appRestart,
    dataFolderCheck,
    dataFolderMove,
    dataFolderUse,
    onDataFolderProgress,
  } from '$lib/api/system';
  import { t } from '$lib/i18n';
  import { testHook } from '$lib/shell/testing';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { describeError } from '$lib/ui/toast.svelte';

  interface Props {
    /** The folder in use. */
    current: string;
    disabled?: boolean;
  }

  let { current, disabled = false }: Props = $props();

  type Asking =
    | { path: string; holds: 'empty' | 'glaukopis' | 'other' }
    | { path: string; holds: 'empty' | 'glaukopis'; working: true; done?: number; count?: number };

  let asking = $state<Asking | null>(null);
  let failed = $state<string | null>(null);

  async function choose() {
    const path = await chooseFolder({ title: t('settings-data-change'), directory: true });
    if (typeof path === 'string') await check(path);
  }

  async function check(path: string) {
    failed = null;
    try {
      const found = await dataFolderCheck(path);
      // The folder in use: nothing to do.
      asking = found.current ? null : { path, holds: found.holds };
    } catch (error) {
      asking = { path, holds: 'other' };
      failed = describeError(error) ?? '';
    }
  }

  async function go() {
    if (!asking || asking.holds === 'other') return;
    const { path, holds } = asking;
    asking = { path, holds, working: true };
    failed = null;
    const stop = await onDataFolderProgress((done, count) => {
      if (asking && 'working' in asking) asking = { ...asking, done, count };
    });
    try {
      if (holds === 'empty') await dataFolderMove(path);
      else await dataFolderUse(path);
      await appRestart();
    } catch (error) {
      failed = describeError(error) ?? '';
      asking = { path, holds };
    } finally {
      stop();
    }
  }

  const working = $derived(!!asking && 'working' in asking);

  function close() {
    if (!working) asking = null;
  }

  testHook('__glaukopisDataFolder', { choose: (path: string) => check(path) });
</script>

<Button size="sm" {disabled} onclick={choose} data-data-folder-change>
  {t('settings-data-change')}
</Button>

{#if asking}
  <Dialog open title={t('settings-data')} width={480} dismissable={!working} onclose={close}>
    <div class="asking" data-data-folder-dialog={asking.holds}>
      {#if asking.holds === 'other'}
        <p>{t('settings-data-not-empty')}</p>
      {:else if asking.holds === 'empty'}
        <p class="path-text">{t('settings-data-move', { path: asking.path })}</p>
        <p>{t('settings-data-restart')}</p>
      {:else}
        <p class="path-text">{t('settings-data-use', { path: asking.path })}</p>
        <p class="path-text">{t('settings-data-use-note', { path: current })}</p>
        <p>{t('settings-data-restart')}</p>
      {/if}
      {#if 'working' in asking && asking.count !== undefined}
        <p class="progress" data-data-folder-copying>
          {t('settings-data-copying', { done: asking.done ?? 0, count: asking.count })}
        </p>
      {/if}
      {#if failed}
        <p class="failed" data-data-folder-failed>{t('settings-data-failed')}: {failed}</p>
      {/if}
    </div>
    {#snippet footer()}
      {#if !working}
        {#if asking?.holds === 'other'}
          <Button variant="primary" onclick={close}>{t('common-close')}</Button>
        {:else}
          <Button onclick={close}>{t('common-cancel')}</Button>
          <Button variant="primary" onclick={go} data-data-folder-go>
            {asking?.holds === 'empty'
              ? t('settings-data-move-button')
              : t('settings-data-use-button')}
          </Button>
        {/if}
      {/if}
    {/snippet}
  </Dialog>
{/if}

<style>
  .asking p {
    margin: 0 0 0.6em;
  }
  .path-text {
    overflow-wrap: anywhere;
  }
  .failed {
    color: var(--danger);
  }
  .progress {
    font-variant-numeric: tabular-nums;
  }
</style>
