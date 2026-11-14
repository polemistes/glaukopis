<script module lang="ts">
  /** What was found that was chosen last: kept while the list is made anew, as on opening a project. */
  let chosen = $state<string | null>(null);
</script>

<script lang="ts">
  /**
   * What the search through everything found, in the list of projects in the
   * place of the tree while the field there has words (record 0098): the
   * options of the search, what was found and where, and for each project
   * what was found in it, by the tree and the element it is in, with the
   * words around it. Choosing one opens the project at it, beside the list,
   * which stays as it is, so that one is gone through after another.
   */
  import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
  import Regex from '@lucide/svelte/icons/regex';
  import Tag from '@lucide/svelte/icons/tag';
  import WholeWord from '@lucide/svelte/icons/whole-word';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Found, ProjectFound } from './everything';
  import { everything } from './everything.svelte';

  interface Props {
    /** Up from the first that was found, back to the field. */
    onup?: () => void;
  }

  let { onup }: Props = $props();

  type Option = 'caseSensitive' | 'wholeWords' | 'accentsAlike' | 'regex' | 'labels';
  function toggle(option: Option) {
    everything.options[option] = !everything.options[option];
  }

  /**
   * What was found in a project, with the tree under the project and the
   * element it is in said where they change. No tree is said of the
   * project's own element, nor of what is in no element.
   */
  function grouped(
    project: ProjectFound,
  ): { found: Found; tree: string | null; where: string | null }[] {
    let tree: string | null = null;
    let where: string | null = null;
    return project.found.map((found) => {
      const changed = found.tree !== tree;
      const treeShown = changed && found.tree !== null ? found.treeName : null;
      const place = placeOf(found);
      const whereShown = changed || place !== where ? place : null;
      tree = found.tree;
      where = place;
      return { found, tree: treeShown, where: whereShown };
    });
  }

  function placeOf(found: Found): string {
    switch (found.where) {
      case 'details':
        return t('search-where-details');
      case 'association':
        return t('search-where-association', { ends: found.elementName });
      case 'note':
        return t('search-where-note', { work: found.work || '?' });
      default:
        return found.elementName || t('search-untitled');
    }
  }

  const said = $derived.by(() => {
    if (everything.error) return t('search-invalid');
    if (everything.none) return t('search-no-projects');
    const count = everything.count;
    if (!count) return everything.done ? t('search-nothing') : '';
    return t('search-everything-found', { count, projects: everything.found.length });
  });

  /** What was found, as it is told apart from the rest. */
  const keyOf = (project: ProjectFound, found: Found) =>
    [project.project, found.where, found.element, found.part, found.passage, found.start].join(' ');

  /** Up and down through what was found, as through the rows of the list. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const hits = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[data-hit]'),
    );
    const i = hits.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && i === 0) onup?.();
    else hits[event.key === 'ArrowDown' ? Math.min(i + 1, hits.length - 1) : i - 1]?.focus();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="found-list" data-found-list {onkeydown}>
  <div class="options" role="group">
    <IconButton
      label={t('search-case')}
      size="sm"
      active={everything.options.caseSensitive}
      onclick={() => toggle('caseSensitive')}
    >
      <CaseSensitive size={16} />
    </IconButton>
    <IconButton
      label={t('search-whole-words')}
      size="sm"
      active={everything.options.wholeWords}
      onclick={() => toggle('wholeWords')}
    >
      <WholeWord size={16} />
    </IconButton>
    <button
      type="button"
      class="sign"
      class:active={everything.options.accentsAlike}
      aria-pressed={everything.options.accentsAlike}
      aria-label={t('search-accents')}
      use:tooltip={{ text: t('search-accents') }}
      onclick={() => toggle('accentsAlike')}>{t('search-accents-sign')}</button
    >
    <IconButton
      label={t('search-regex')}
      size="sm"
      active={everything.options.regex}
      onclick={() => toggle('regex')}
    >
      <Regex size={15} />
    </IconButton>
    <IconButton
      label={t('search-labels-outside')}
      size="sm"
      active={everything.options.labels}
      onclick={() => toggle('labels')}
    >
      <Tag size={14} />
    </IconButton>
  </div>

  <div class="said" aria-live="polite">
    {#if everything.reading}
      <Spinner size={12} />
      <span class="truncate">{t('search-reading', { name: everything.reading })}</span>
    {:else}
      <span class:none={everything.done && !everything.count}>{said}</span>
    {/if}
    {#each everything.unread as name (name)}
      <span class="unread">{t('search-could-not-read', { name })}</span>
    {/each}
    {#each everything.partly as { project, name, count } (project)}
      <span class="unread">{t('search-read-in-part', { name, count })}</span>
    {/each}
  </div>

  {#each everything.found as project (project.project)}
    <section class="project">
      <h3>
        <span class="name serif truncate">{project.name}</span>
        <span class="count">{project.count}</span>
      </h3>
      <ul>
        {#each grouped(project) as { found, tree, where }, i (i)}
          {@const key = keyOf(project, found)}
          {#if tree !== null}
            <li class="tree truncate">{tree || t('search-untitled')}</li>
          {/if}
          <li>
            <button
              type="button"
              class="hit"
              class:chosen={chosen === key}
              data-hit
              onclick={() => {
                chosen = key;
                everything.go(project, found);
              }}
            >
              {#if where !== null}<span class="where truncate">{where}</span>{/if}
              <span class="words serif"
                >{#if found.note}<span class="in-note">{t('search-in-note')}</span
                  >{/if}{found.before}<mark>{found.text}</mark>{found.after}</span
              >
            </button>
          </li>
        {/each}
      </ul>
      {#if project.count > project.found.length}
        <p class="more">{t('search-more', { count: project.count - project.found.length })}</p>
      {/if}
    </section>
  {/each}
</div>

<style>
  .found-list {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .options {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 0 2px 4px;
  }
  .sign {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 3px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: -0.02em;
    cursor: pointer;
  }
  .sign:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .sign.active {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .said {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 18px;
    padding: 0 6px 6px;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .said > :global(:first-child) {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .said .none {
    color: var(--ink-2);
  }
  .unread {
    color: var(--danger);
  }
  .project {
    margin-bottom: 14px;
  }
  h3 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 2px;
    padding: 0 6px 3px;
    border-bottom: 1px solid var(--line);
    font-size: var(--text-md);
    font-weight: 600;
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .count {
    flex: none;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 400;
    color: var(--ink-3);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tree {
    margin: 8px 6px 1px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .hit {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    min-width: 0;
    padding: 4px 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .hit:hover,
  .hit:focus-visible {
    background: var(--paper-hover);
    outline: none;
  }
  .hit.chosen {
    background: var(--accent-soft);
  }
  .where {
    max-width: 100%;
    font-size: var(--text-xs);
    font-weight: 550;
    color: var(--accent-strong);
  }
  .words {
    font-size: 13.5px;
    line-height: 1.45;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .in-note {
    margin-right: 5px;
    padding: 0 5px;
    border-radius: 0.6em;
    background: var(--gold-soft);
    color: var(--gold);
    font-family: var(--font-ui);
    font-size: 10.5px;
    font-weight: 600;
    vertical-align: 1px;
  }
  mark {
    padding: 0 1px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--gold) 34%, transparent);
    color: var(--ink);
  }
  .more {
    margin: 4px 6px 0;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
</style>
