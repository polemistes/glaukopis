<script lang="ts">
  import { t } from '$lib/i18n';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { makeProjectsMap } from './projects-map';

  interface Props {
    onclose: () => void;
    /** The new project and its map, to be opened. */
    onmade: (made: { project: string; map: string }) => void;
  }

  let { onclose, onmade }: Props = $props();

  let name = $state(t('home-map-name-default'));
  let what = $state<'names' | 'everything'>('names');
  let error = $state<string | null>(null);
  /** The project being read, while the map is made; null when it is not. */
  let reading = $state<string | null>(null);
  let working = $state(false);

  async function make() {
    const clean = name.trim();
    if (!clean) {
      error = t('home-name-missing');
      return;
    }
    if (working) return;
    working = true;
    error = null;
    try {
      const made = await makeProjectsMap({
        name: clean,
        everything: what === 'everything',
        folders: projects.folders,
        list: projects.list,
        onprogress: (project) => (reading = project),
      });
      onmade(made);
    } catch (e) {
      error = describeError(e) ?? t('home-map-failed');
    } finally {
      working = false;
      reading = null;
    }
  }
</script>

<Dialog open title={t('home-map-title')} width={480} dismissable={!working} {onclose}>
  <p class="about">{t('home-map-about')}</p>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      make();
    }}
  >
    <TextField
      bind:value={name}
      label={t('home-name')}
      serif
      {error}
      disabled={working}
      data-autofocus
      oninput={() => (error = null)}
    />
  </form>
  <div class="choice" role="radiogroup" aria-label={t('home-map-what')}>
    <label class="option" class:chosen={what === 'names'}>
      <input type="radio" bind:group={what} value="names" disabled={working} />
      <span class="words">
        <span class="name">{t('home-map-names')}</span>
        <span class="hint">{t('home-map-names-hint')}</span>
      </span>
    </label>
    <label class="option" class:chosen={what === 'everything'}>
      <input type="radio" bind:group={what} value="everything" disabled={working} />
      <span class="words">
        <span class="name">{t('home-map-everything')}</span>
        <span class="hint">{t('home-map-everything-hint')}</span>
      </span>
    </label>
  </div>
  {#if what === 'everything'}
    <p class="note">{t('home-map-note')}</p>
  {/if}
  {#if working}
    <p class="progress">
      <Spinner size={14} />
      {reading ? t('home-map-reading', { name: reading }) : t('home-map-working')}
    </p>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" disabled={working} onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={working || !name.trim()} onclick={make}>
      {t('home-map-make')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .about {
    margin-bottom: 14px;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .choice {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 14px;
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    cursor: pointer;
  }
  .option.chosen {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .option input {
    margin-top: 3px;
  }
  .words {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .name {
    font-weight: 500;
  }
  .hint,
  .note {
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .note {
    margin-top: 10px;
  }
  .progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
</style>
