<!-- All the keys of the application, by where they hold: Ctrl+/. -->
<script lang="ts">
  import { t } from '$lib/i18n';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { KEYS, type Place } from './keys.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const places: Place[] = [
    'everywhere',
    'project',
    'diagram',
    'text',
    'writing',
    'review',
    'library',
    'store',
  ];
  // What is done by two keys is one row, with both.
  const groups = $derived(
    places.map((place) => {
      const rows = new Map<string, string[]>();
      for (const k of KEYS.filter((k) => k.place === place && k.keys)) {
        const label = t(`keys-${k.id}`);
        rows.set(label, [...(rows.get(label) ?? []), k.keys]);
      }
      return { place, rows: [...rows] };
    }),
  );
</script>

<Dialog open title={t('keys-title')} subtitle={t('keys-subtitle')} width={760} tall {onclose}>
  <div class="groups">
    {#each groups as group (group.place)}
      <section>
        <h3>{t(`keys-place-${group.place}`)}</h3>
        <dl>
          {#each group.rows as [label, keys] (label)}
            <dt>{label}</dt>
            <dd>
              {#each keys as k}<kbd>{k}</kbd>{/each}
            </dd>
          {/each}
        </dl>
      </section>
    {/each}
  </div>
</Dialog>

<style>
  .groups {
    columns: 2 320px;
    column-gap: 32px;
  }
  section {
    break-inside: avoid;
    margin-bottom: 18px;
  }
  h3 {
    margin: 0 0 6px;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 3px 16px;
    margin: 0;
  }
  dt {
    color: var(--ink-2);
    font-size: var(--text-md);
  }
  dd {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    margin: 0;
  }
</style>
