<script lang="ts">
  import { projectPurge, projectRestore, type Trashed } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';

  interface Props {
    trash: Trashed[];
    onchange: () => void;
    onclose: () => void;
  }

  let { trash, onchange, onclose }: Props = $props();

  /** The name of an entry begins with the time it was deleted: 20260927T101500Z_<id>. */
  function deleted(entry: string): string {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(entry);
    return m ? ago(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`) : '';
  }

  async function restore(gone: Trashed) {
    try {
      projects.put(await projectRestore(gone.entry));
      notifyOk(t('home-restored', { name: gone.info.name }));
      onchange();
    } catch (error) {
      notifyError(t('home-restore-failed'), error);
    }
  }

  async function purge(gone: Trashed) {
    const ok = await confirm({
      title: t('home-purge-title', { name: gone.info.name }),
      message: t('home-purge-message'),
      confirm: t('home-purge'),
      danger: true,
    });
    if (!ok) return;
    try {
      await projectPurge(gone.entry);
      onchange();
    } catch (error) {
      notifyError(t('home-purge-failed'), error);
    }
  }
</script>

<Dialog open title={t('home-trash-title')} width={520} {onclose}>
  {#if !trash.length}
    <p class="none">{t('home-trash-none')}</p>
  {:else}
    <ul>
      {#each trash as gone (gone.entry)}
        <li>
          <div class="what">
            <div class="name serif truncate">{gone.info.name}</div>
            <div class="when">{t('home-deleted-ago', { ago: deleted(gone.entry) })}</div>
          </div>
          <Button size="sm" variant="ghost" onclick={() => purge(gone)}>{t('home-purge')}</Button>
          <Button size="sm" onclick={() => restore(gone)}>{t('home-restore')}</Button>
        </li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .none {
    color: var(--ink-2);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 52vh;
    overflow-y: auto;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 2px;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .what {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .when {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
