<!-- All the keys of the application, by where they hold: Ctrl+/. -->
<script lang="ts">
  import { KEY_DIGITS, kindKeysOf, kindName } from '$lib/editor/kinds';
  import { t } from '$lib/i18n';
  import { templateUsedCached } from '$lib/preview/documents.svelte';
  import { openProjects } from '$lib/project/open-projects.svelte';
  import { sides } from '$lib/project/sides.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { KEYS, kindDigitOf, kindKeys, keyLabel, wordsOf, type Place } from './keys.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const places: Place[] = [
    'everywhere',
    'project',
    'tree',
    'diagram',
    'list',
    'text',
    'writing',
    'review',
    'library',
    'files',
    'store',
  ];

  /**
   * The kinds Ctrl+Alt with a digit gives, as the document type of the
   * element in view on the side that has the focus gives them (ADR 0066):
   * by the digit, with the kinds of the writer's own for their names.
   * Nothing where no document is in view.
   */
  const kindsByKey = $derived.by(() => {
    const side = sides.active;
    const project = openProjects.get(side?.project)?.project;
    const at = side?.at;
    if (!project || !at || !project.node(at)) return null;
    const template = templateUsedCached(project, at);
    return template ? { keys: kindKeysOf(template), own: project.passageKinds } : null;
  });

  // What is done by two keys is one row, with both. The keys of the kinds
  // are each the kind they give; without a document, one row for the ten.
  const groups = $derived(
    places.map((place) => {
      const rows = new Map<string, string[]>();
      const add = (label: string, keys: string) =>
        rows.set(label, [...(rows.get(label) ?? []), keys]);
      for (const k of KEYS.filter((k) => k.place === place && k.keys)) {
        if (kindDigitOf(k.id) === null) add(t(wordsOf(k.id)), k.keys);
      }
      if (place === 'writing') {
        const known = kindsByKey;
        if (known) {
          for (const digit of KEY_DIGITS) {
            const kind = known.keys[digit];
            if (kind) add(kindName(kind, known.own), kindKeys(digit));
          }
        } else add(t('keys-writing-kind'), `${kindKeys('0').slice(0, -1)}0–9`);
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
              {#each keys as k}<kbd>{keyLabel(k)}</kbd>{/each}
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
