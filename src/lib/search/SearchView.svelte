<script lang="ts">
  import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
  import Regex from '@lucide/svelte/icons/regex';
  import Search from '@lucide/svelte/icons/search';
  import Tag from '@lucide/svelte/icons/tag';
  import WholeWord from '@lucide/svelte/icons/whole-word';
  import X from '@lucide/svelte/icons/x';
  import { onMount, untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Found, ProjectFound } from './everything';
  import { everything, type Scope } from './everything.svelte';

  let field = $state<HTMLInputElement>();

  onMount(() => {
    field?.focus();
    field?.select();
    // What is in the projects may have changed since it was last searched.
    if (everything.words) void everything.search();
  });

  // What is searched for is searched for again, a moment after it was changed.
  let first = true;
  $effect(() => {
    void everything.words;
    void everything.scope;
    const o = everything.options;
    void [o.caseSensitive, o.wholeWords, o.accentsAlike, o.regex, o.labels];
    if (first) {
      first = false;
      return;
    }
    untrack(() => everything.later());
  });

  type Option = 'caseSensitive' | 'wholeWords' | 'accentsAlike' | 'regex' | 'labels';
  function toggle(option: Option) {
    everything.options[option] = !everything.options[option];
  }

  /** What was found in a project, with the map and the element it is in said where they change. */
  function grouped(
    project: ProjectFound,
  ): { found: Found; map: string | null; where: string | null }[] {
    let map: string | null = null;
    let where: string | null = null;
    return project.found.map((found) => {
      const mapShown = found.map !== map ? found.mapName : null;
      const place = placeOf(found);
      const whereShown = mapShown !== null || place !== where ? place : null;
      map = found.map;
      where = place;
      return { found, map: mapShown, where: whereShown };
    });
  }

  function placeOf(found: Found): string {
    switch (found.where) {
      case 'details':
        return t('search-where-details');
      case 'association':
        return `${t('search-where-association')}: ${found.elementName}`;
      case 'note':
        return t('search-where-note', { work: found.work || '?' });
      default:
        return found.elementName || t('search-untitled');
    }
  }

  const said = $derived.by(() => {
    if (everything.error) return t('search-invalid');
    if (!everything.words) return '';
    const count = everything.count;
    if (!count) return everything.done ? t('search-nothing') : '';
    return t('search-everything-found', { count, projects: everything.found.length });
  });
</script>

<div class="search-view">
  <header>
    <label class="field" class:invalid={!!everything.error}>
      <Search size={16} />
      <input
        bind:this={field}
        bind:value={everything.words}
        type="search"
        placeholder={t('search-everything-field')}
        aria-label={t('search-everything-field')}
        spellcheck="false"
        autocomplete="off"
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void everything.search();
          }
        }}
      />
      {#if everything.words}
        <button
          type="button"
          class="clear"
          aria-label={t('common-close')}
          onclick={() => {
            everything.words = '';
            field?.focus();
          }}><X size={14} /></button
        >
      {/if}
    </label>
    <div class="options" role="group">
      <IconButton
        label={t('search-case')}
        active={everything.options.caseSensitive}
        onclick={() => toggle('caseSensitive')}
      >
        <CaseSensitive size={17} />
      </IconButton>
      <IconButton
        label={t('search-whole-words')}
        active={everything.options.wholeWords}
        onclick={() => toggle('wholeWords')}
      >
        <WholeWord size={17} />
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
        active={everything.options.regex}
        onclick={() => toggle('regex')}
      >
        <Regex size={16} />
      </IconButton>
      <IconButton
        label={t('search-labels-outside')}
        active={everything.options.labels}
        onclick={() => toggle('labels')}
      >
        <Tag size={15} />
      </IconButton>
    </div>
    <Segmented
      value={everything.scope}
      label={t('search-everything-title')}
      options={[
        { value: 'last' as Scope, label: t('search-last-project') },
        { value: 'all' as Scope, label: t('search-all-projects') },
      ]}
      onchange={(scope) => (everything.scope = scope)}
    />
  </header>

  <div class="results">
    <div class="said" aria-live="polite">
      {#if everything.reading}
        <Spinner size={13} />
        <span>{t('search-reading', { name: everything.reading })}</span>
      {:else}
        <span class:none={everything.done && !everything.count}>{said}</span>
      {/if}
      {#each everything.unread as name (name)}
        <span class="unread">{t('search-could-not-read', { name })}</span>
      {/each}
    </div>

    {#each everything.found as project (project.project)}
      <section class="project">
        <h2>
          <span class="name serif">{project.name}</span>
          <span class="count">{t('search-in-project', { count: project.count })}</span>
        </h2>
        <ul>
          {#each grouped(project) as { found, map, where }, i (i)}
            {#if map !== null}
              <li class="map">{map}</li>
            {/if}
            <li>
              <button type="button" class="hit" onclick={() => everything.go(project, found)}>
                {#if where !== null}<span class="where">{where}</span>{/if}
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
</div>

<style>
  .search-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    flex: none;
    padding: 14px 24px;
    border-bottom: 1px solid var(--line);
  }
  .field {
    flex: 1 1 320px;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 640px;
    height: 36px;
    padding: 0 10px 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    color: var(--ink-3);
    cursor: text;
  }
  .field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .field.invalid {
    border-color: var(--danger);
  }
  .field input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--ink);
    font-size: var(--text-lg);
    outline: none;
  }
  .field input::-webkit-search-cancel-button {
    display: none;
  }
  .field input::placeholder {
    color: var(--ink-4);
  }
  .clear {
    display: inline-flex;
    padding: 3px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .clear:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .options {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .sign {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--control-h);
    height: var(--control-h);
    padding: 0 4px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: 12px;
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
  .results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 24px 40px;
  }
  .said {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 22px;
    margin-bottom: 10px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .said .none {
    color: var(--ink-2);
  }
  .unread {
    color: var(--danger);
  }
  .project {
    max-width: 860px;
    margin-bottom: 26px;
  }
  h2 {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line);
    font-size: var(--text-xl);
    font-weight: 600;
  }
  .count {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--ink-3);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .map {
    margin: 12px 0 2px;
    font-size: var(--text-xs);
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
    padding: 5px 10px;
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
  .where {
    font-size: var(--text-sm);
    font-weight: 550;
    color: var(--accent-strong);
  }
  .words {
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink-2);
  }
  .in-note {
    margin-right: 6px;
    padding: 0 5px;
    border-radius: 0.6em;
    background: var(--gold-soft);
    color: var(--gold);
    font-family: var(--font-ui);
    font-size: 11px;
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
    margin: 6px 10px 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
