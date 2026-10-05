<script lang="ts">
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { Collection } from '$lib/api/library';
  import { keepReferences } from '$lib/documents/bringing.svelte';
  import { languages, t } from '$lib/i18n';
  import { library, type SortKey } from '$lib/state/library.svelte';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { makeLibraryMap, planMap } from './map';

  interface Props {
    /** The collection the map is of, or null for the whole library. */
    collection: Collection | null;
    sort: { key: SortKey; descending: boolean };
    onclose: () => void;
  }

  let { collection, sort, onclose }: Props = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(collection?.name ?? t('library-map-library-name'));
  let making = $state(false);
  let failure = $state<string | null>(null);

  const plan = $derived(
    planMap(
      name.replace(/\s+/g, ' ').trim() || t('project-untitled'),
      collection,
      library.collections,
      library.entries,
      sort,
    ),
  );

  async function make() {
    if (making || !plan.parts.length) return;
    making = true;
    failure = null;
    try {
      const info = await projects.create(plan.name);
      const opened = await openProject(info.id);
      const first = opened.project.maps.map((m) => m.id);
      const made = makeLibraryMap(opened.project, plan);
      // The map a project begins with gives way to that of the library.
      for (const id of first) opened.project.deleteMap(id);
      await keepReferences(opened.project, plan.cited);
      await opened.project.close();
      onclose();
      router.go({ view: 'project', project: info.id, map: made.map, mode: 'text' });
    } catch (error) {
      failure = describeError(error) ?? t('library-map-failed');
      making = false;
    }
  }

  const n = (count: number) => count.toLocaleString(languages.current);
</script>

<Dialog
  open
  title={collection ? t('library-map-title-collection') : t('library-map-title-library')}
  subtitle={collection?.name}
  width={520}
  dismissable={!making}
  onclose={() => !making && onclose()}
>
  <form
    class="map-of"
    onsubmit={(e) => {
      e.preventDefault();
      make();
    }}
  >
    <TextField
      bind:value={name}
      label={t('library-map-name')}
      size="lg"
      serif
      hint={t('library-map-name-hint')}
      data-autofocus
    />
  </form>

  <p class="what">
    {collection ? t('library-map-what-collection') : t('library-map-what-library')}
  </p>
  <dl class="facts">
    <div data-fact="collections">
      <dd>{n(plan.collections)}</dd>
      <dt>{t('library-collection-count', { count: plan.collections })}</dt>
    </div>
    <div data-fact="references">
      <dd>{n(plan.references)}</dd>
      <dt>{t('library-count', { count: plan.references })}</dt>
    </div>
  </dl>
  {#if !plan.references}
    <p class="hint">{t('library-map-nothing')}</p>
  {/if}
  {#if failure}
    <p class="failure selectable" role="alert"><CircleAlert size={15} /> <span>{failure}</span></p>
  {/if}

  {#snippet footer()}
    {#if making}
      <div class="working"><Spinner /> {t('library-map-making')}</div>
    {/if}
    <Button variant="ghost" disabled={making} onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={making || !name.trim()} onclick={make}>
      {t('library-map-make')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .what {
    margin: var(--space-4) 0 0;
    color: var(--ink-2);
    line-height: 1.45;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 26px;
    margin: var(--space-3) 0 0;
  }
  .facts div {
    display: flex;
    flex-direction: column;
  }
  .facts dd {
    margin: 0;
    font-family: var(--font-text);
    font-size: 21px;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .facts dt {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .hint {
    margin: var(--space-3) 0 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: var(--space-3) 0 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .working {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
