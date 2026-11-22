<script lang="ts">
  /**
   * The last part of Look, Document type (the plan of one form, stage 2):
   * where the look of the document is taken from, named with where it is
   * from and never called a layout; and what the document changes, each
   * with where it was made and Reset. Only the body of the part: its
   * heading and its place are Look's.
   */
  import type { Template } from '$lib/api/templates';
  import { LIMITS, type Limit } from '$lib/document/composition';
  import { t } from '$lib/i18n';
  import { documents, templateName } from '$lib/preview/documents.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { formatGroups, layoutName } from './choosing.svelte';
  import { Composition } from './composition.svelte';

  /** A change of the look, by the words of its row, and the element that makes it. */
  interface LookChange {
    path: string;
    words: string;
    who: string;
  }

  interface Props {
    project: Project;
    /** The element whose document it is. */
    at: string;
    /** The element whose look the panel sets: the document's, or one under it. */
    target: string;
    /** The type of the document, whole; nothing until it has been read. */
    template: Template | null;
    /** The changes of the look the panel shows. */
    changes: LookChange[];
    /** Takes a change of the look away from the element that makes it. */
    onreset: (who: string, path: string) => void;
    /** Sets where the look is taken from, on the element; nothing for the first choice. */
    onchoose: (format: string | undefined) => void;
  }

  let { project, at, target, template, changes, onreset, onchoose }: Props = $props();

  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');
  const own = $derived(project.node(target)?.document ?? {});
  const inherited = $derived(project.documentOf(target));
  const choice = $derived(documents.choice(inherited.settings, project));
  const typeName = $derived(templateName(project, choice.template));
  const nameOfLayout = $derived(layoutName(choice.format));

  /** The element over this one the look is taken from, by name; nothing where it is this one's, or nobody's. */
  const chosenAbove = $derived.by(() => {
    if (own.format) return null;
    const who = inherited.from.get('format');
    return who && who !== target ? nameOf(who) : null;
  });
  /** The first choice: the look the type brings, or the writer's default, or what an element over this one chose. */
  const first = $derived(
    chosenAbove
      ? t('look-from-with', { name: chosenAbove, what: nameOfLayout })
      : template?.layout
        ? t('look-from-type', { name: layoutName(template.layout), type: typeName })
        : t('look-your-default', { name: layoutName(documents.usualFormat()) }),
  );

  // What the document requires otherwise than its type, beside the changes of the look.
  const composition = new Composition(
    () => project,
    () => at,
  );
  const limitWords: Record<Limit | 'anonymous', () => string> = {
    words: () => t('look-contents-limit-words'),
    abstractWords: () => t('look-contents-limit-abstract-words'),
    keywords: () => t('look-contents-limit-keywords'),
    anonymous: () => t('template-requirement-anonymity'),
  };
  const required = $derived(
    [...composition.composition.from]
      .filter(([path]) => path.startsWith('requirements.'))
      .map(([path, who]) => {
        const key = path.slice('requirements.'.length) as Limit | 'anonymous';
        return {
          path,
          who,
          words: LIMITS.includes(key as Limit) || key === 'anonymous' ? limitWords[key]() : path,
        };
      }),
  );
</script>

<label class="row">
  <span class="what">{t('look-taken-from')}</span>
  <select
    value={own.format ?? ''}
    data-taken-from
    onchange={(e) => onchoose(e.currentTarget.value || undefined)}
  >
    <option value="">{first}</option>
    {#each formatGroups() as group (group.name)}
      <optgroup label={group.name}>
        {#each group.formats as fm (fm.id)}
          <option value={fm.id}>{fm.name}</option>
        {/each}
      </optgroup>
    {/each}
    {#if own.format && !documents.formatSummary(own.format)}
      <option value={own.format}>{own.format}</option>
    {/if}
  </select>
</label>

{#if changes.length || required.length}
  <h4>{t('look-changed-list')}</h4>
  <ul class="changed" data-changed-list>
    {#each changes as c (c.path)}
      <li>
        <span>{c.words}</span>
        <small
          >{c.who === at
            ? t('look-changed-here')
            : t('look-changed-in', { name: nameOf(c.who) })}</small
        >
        <button type="button" class="again" onclick={() => onreset(c.who, c.path)}
          >{t('look-reset')}</button
        >
      </li>
    {/each}
    {#each required as c (c.path)}
      <li>
        <span>{c.words}</span>
        <small
          >{c.who === at
            ? t('look-changed-here')
            : t('look-changed-in', { name: nameOf(c.who) })}</small
        >
        <button type="button" class="again" onclick={() => composition.takeAgain(c.who, c.path)}
          >{t('look-reset')}</button
        >
      </li>
    {/each}
  </ul>
{/if}

<style>
  .changed {
    margin: 0 0 8px;
    padding: 6px 10px;
    list-style: none;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    font-size: var(--text-sm);
  }
  .changed li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding: 3px 0;
  }
  .changed small {
    color: var(--ink-3);
  }
  .again {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    text-decoration: underline;
    cursor: pointer;
  }
  .again:hover {
    color: var(--ink);
  }
</style>
