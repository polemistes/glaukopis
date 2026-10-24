<script lang="ts">
  /**
   * Document properties: what an element's document says of itself, one
   * window per element (ADR 0038, as it stands since 2026-10-23): the
   * details that stand on its first page and in the metadata of its files,
   * with whether the lines of its pages are numbered; its type, what you are
   * writing, which is its template; its language; and the checklist of what
   * its template requires, as the document uses it. How it looks and what it
   * contains is set in Look. What the element does not set it takes from the
   * elements over it (ADR 0037): that is shown, and left for it to set its
   * own.
   *
   * The type and the language are written as they are chosen, each a step
   * of undo of its own; the details are written together when the window is
   * saved.
   */
  import { untrack } from 'svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import type { DocumentFormat } from '$lib/api/documents';
  import { languageName, newTextLanguage, t, TEXT_LANGUAGES } from '$lib/i18n';
  import { laidOver } from '$lib/look/changes';
  import { countWords } from '$lib/project/model/document';
  import type { Project } from '$lib/project/model/project.svelte';
  import {
    PROJECT,
    ROLES,
    type Contributor,
    type DocumentSettings,
  } from '$lib/project/model/types';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { ABOUT_SECTIONS, type AboutSection } from './about-document.svelte';
  import { checklist, type Remark } from './checklist';
  import DocumentType from './DocumentType.svelte';
  import { documents, templateUsedCached } from '$lib/preview/documents.svelte';

  interface Props {
    project: Project;
    /** The element whose document is set. */
    at: string;
    /** The part of the window to open at. */
    section?: AboutSection;
    /** Shows an element in the text: one the checklist names, from its line here. */
    ongo: (element: string) => void;
    onclose: () => void;
  }

  let { project, at, section: openAt, ongo, onclose }: Props = $props();

  let section = $state<AboutSection>(untrack(() => openAt ?? 'details'));
  const node = $derived(project.node(at));
  /** What the element says of its own. */
  const own = $derived(node?.document ?? {});
  /** What is said of the element with what it inherits, and which element says each thing. */
  const inherited = $derived(project.documentOf(at));
  const choice = $derived(documents.choice(inherited.settings, project));

  $effect(() => {
    documents.load();
  });

  /**
   * The template as the document uses it, with what the document requires
   * otherwise (set in Look, under what the document contains): for what it
   * requires. Nothing until it has been read.
   */
  const template = $derived(templateUsedCached(project, at) ?? null);
  /** The layout in use, whole. */
  let format = $state.raw<DocumentFormat | null>(null);
  $effect(() => {
    const id = choice.format;
    void documents.changed;
    untrack(() =>
      documents
        .format(id)
        .then((loaded) => {
          if (id === choice.format) format = loaded;
        })
        .catch((error) => {
          console.error(`the layout ${id} could not be read for the document window`, error);
          if (id === choice.format) format = null;
        }),
    );
  });

  /**
   * The name of the element over this one that a setting is taken from;
   * nothing where the setting is this element's own, or nobody's.
   */
  function from(key: keyof DocumentSettings): string | null {
    const who = inherited.from.get(key);
    if (!who || who === at) return null;
    return project.node(who)?.title || t('project-untitled');
  }
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  /** Writes one setting as its own step of undo. */
  function write(patch: Partial<DocumentSettings>) {
    project.checkpoint();
    project.setDocument(at, patch);
    project.checkpoint();
  }

  // ---- the details ----

  // svelte-ignore state_referenced_locally
  let draft = $state<DocumentSettings>(
    structuredClone($state.snapshot(node?.document ?? {}) as DocumentSettings),
  );
  // svelte-ignore state_referenced_locally
  let keywords = $state((node?.document.keywords ?? []).join(', '));
  /** A row for a contributor not yet named: an author, as most are. */
  const blank = (): Contributor => ({ name: '', role: 'author' });
  if (!draft.contributors?.length) draft.contributors = [blank()];
  const roles = $derived(ROLES.map((role) => ({ value: role, label: t(`about-role-${role}`) })));

  /** The identifiers a document usually has, first; then those the writer has named. */
  const USUAL_IDENTIFIERS = ['isbn', 'edition', 'publisher', 'place', 'doi'];
  // svelte-ignore state_referenced_locally
  let identifiers = $state<{ key: string; value: string }[]>(
    untrack(() => {
      const given = node?.document.identifiers ?? {};
      const keys = [
        ...USUAL_IDENTIFIERS,
        ...Object.keys(given).filter((k) => !USUAL_IDENTIFIERS.includes(k)),
      ];
      return keys.map((key) => ({ key, value: given[key] ?? '' }));
    }),
  );
  let newIdentifier = $state('');

  function identifierWords(key: string): string {
    return USUAL_IDENTIFIERS.includes(key) ? t(`about-identifier-${key}`) : key;
  }

  function addIdentifier() {
    const key = newIdentifier.trim();
    if (!key || identifiers.some((i) => i.key.toLocaleLowerCase() === key.toLocaleLowerCase()))
      return;
    identifiers.push({ key, value: '' });
    newIdentifier = '';
  }

  // Shown while the element says nothing of its own.
  const contributorsFrom = $derived(
    draft.contributors?.some((c) => c.name.trim()) ? null : from('contributors'),
  );
  const keywordsFrom = $derived(keywords.trim() ? null : from('keywords'));
  const dateFrom = $derived(draft.date?.trim() ? null : from('date'));
  const identifiersFrom = $derived(
    identifiers.some((i) => i.value.trim()) ? null : from('identifiers'),
  );
  const inheritedContributors = $derived(
    (inherited.settings.contributors ?? []).map((c) => c.name).join(', '),
  );
  /** Whether the lines of the pages are numbered: as the element says, else as those over it, else as its layout. */
  const linesNumbered = $derived(
    draft.lineNumbers ?? inherited.settings.lineNumbers ?? format?.lineNumbers ?? false,
  );
  /** Where the numbering of the lines comes from while the element says nothing of its own: an element over it, or the layout. */
  const linesFrom = $derived(draft.lineNumbers === undefined ? from('lineNumbers') : null);
  const keywordCount = $derived(keywords.split(/[,;\n]/).filter((k) => k.trim()).length);
  const keywordsMost = $derived(template?.requirements.keywords ?? null);

  function save() {
    const contributors = (draft.contributors ?? [])
      .map((c): Contributor => ({
        name: c.name.trim(),
        affiliation: c.affiliation?.trim() || undefined,
        email: c.email?.trim() || undefined,
        orcid: c.orcid?.trim() || undefined,
        role: c.role,
      }))
      .filter((c) => c.name);
    const named: Record<string, string> = {};
    for (const i of identifiers) if (i.value.trim()) named[i.key.trim()] = i.value.trim();
    write({
      title: draft.title?.trim(),
      subtitle: draft.subtitle?.trim(),
      contributors,
      keywords: keywords
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean),
      date: draft.date?.trim(),
      identifiers: Object.keys(named).length ? named : undefined,
      lineNumbers: draft.lineNumbers,
    });
    onclose();
  }

  function go(element: string) {
    onclose();
    ongo(element);
  }

  // ---- the language ----

  const languageFrom = $derived(own.language ? null : from('language'));
  /** What stands for no language of its own: the inherited one, or that of the settings. */
  const noLanguage = $derived(
    languageFrom && inherited.settings.language
      ? t('languages-map-none')
      : t('languages-project-settings', { language: languageName(newTextLanguage()) }),
  );

  function setLanguage(language: string) {
    if (language === (own.language ?? '')) return;
    project.checkpoint();
    if (at === PROJECT) project.setLanguage(language || null);
    else project.setDocument(at, { language: language || undefined });
    project.checkpoint();
  }

  // ---- the checklist ----

  /** The layout as the document uses it, with its changes: what the checklist judges the front page and the quotations by. */
  const used = $derived(format ? laidOver(format, project.lookOf(at).changes) : null);
  const remarks = $derived<Remark[]>(template ? checklist(project, at, template, used) : []);
  const words = $derived(countWords(project, at));
  const wordsMost = $derived(template?.requirements.words ?? null);

  const sections = $derived(ABOUT_SECTIONS.map((key) => [key, t(`about-section-${key}`)] as const));
</script>

<Dialog
  open
  title={t('about-window')}
  subtitle={node?.title || t('project-untitled')}
  width={760}
  tall
  padded={false}
  {onclose}
>
  <div class="window">
    <nav aria-label={t('about-sections')}>
      {#each sections as [key, label] (key)}
        <button type="button" class:current={section === key} onclick={() => (section = key)}
          >{label}</button
        >
      {/each}
    </nav>

    <div class="form settings">
      {#if section === 'details'}
        <h3>{t('about-section-details')}</h3>
        <div class="details">
          <label class="field">
            <span>{t('about-title')}</span>
            <input
              bind:value={draft.title}
              class="serif"
              placeholder={node?.title || t('about-title-placeholder')}
            />
          </label>
          <label class="field">
            <span>{t('about-subtitle')}</span>
            <input bind:value={draft.subtitle} class="serif" />
          </label>

          <div class="field">
            <span>{t('about-contributors')}</span>
            {#each draft.contributors ?? [] as contributor, i (i)}
              <div class="contributor" data-contributor={i + 1}>
                <Select
                  bind:value={contributor.role}
                  options={roles}
                  ariaLabel={t('about-contributor-role', { number: i + 1 })}
                />
                <input
                  bind:value={contributor.name}
                  placeholder={i === 0 && contributorsFrom
                    ? inheritedContributors
                    : t('about-name')}
                  aria-label={t('about-contributor-name', { number: i + 1 })}
                />
                <input
                  bind:value={contributor.affiliation}
                  placeholder={t('about-affiliation')}
                  aria-label={t('about-contributor-affiliation', { number: i + 1 })}
                />
                <input
                  bind:value={contributor.email}
                  placeholder={t('about-email')}
                  aria-label={t('about-contributor-email', { number: i + 1 })}
                />
                <input
                  bind:value={contributor.orcid}
                  placeholder={t('about-orcid')}
                  aria-label={t('about-contributor-orcid', { number: i + 1 })}
                  spellcheck="false"
                />
                <IconButton
                  label={t('common-remove')}
                  size="sm"
                  disabled={(draft.contributors?.length ?? 0) <= 1 && !contributor.name}
                  onclick={() => {
                    draft.contributors?.splice(i, 1);
                    if (!draft.contributors?.length) draft.contributors = [blank()];
                  }}
                >
                  <X size={13} />
                </IconButton>
              </div>
            {/each}
            <button type="button" class="add" onclick={() => draft.contributors?.push(blank())}>
              <Plus size={12} />
              {t('about-add-contributor')}
            </button>
            {#if contributorsFrom}<small
                >{t('documents-inherited-from', { name: contributorsFrom })}</small
              >{/if}
          </div>

          <div class="pair">
            <label class="field">
              <span>{t('about-date')}</span>
              <input
                bind:value={draft.date}
                placeholder={dateFrom ? inherited.settings.date : t('about-date-placeholder')}
              />
              {#if dateFrom}<small>{t('documents-inherited-from', { name: dateFrom })}</small>{/if}
            </label>
            <label class="field">
              <span>
                {t('about-keywords')}
                <em class:over={!!keywordsMost && keywordCount > keywordsMost}>
                  {keywordsMost
                    ? t('about-keywords-of', { count: keywordCount, limit: keywordsMost })
                    : t('about-keywords-count', { count: keywordCount })}
                </em>
              </span>
              <input
                bind:value={keywords}
                placeholder={keywordsFrom
                  ? (inherited.settings.keywords ?? []).join(', ')
                  : t('about-keywords-placeholder')}
              />
              {#if keywordsFrom}<small
                  >{t('documents-inherited-from', { name: keywordsFrom })}</small
                >{/if}
            </label>
          </div>

          <div class="field">
            <span>{t('about-identifiers')}</span>
            <table class="identifiers">
              <tbody>
                {#each identifiers as identifier (identifier.key)}
                  <tr>
                    <th scope="row">{identifierWords(identifier.key)}</th>
                    <td>
                      <input
                        bind:value={identifier.value}
                        placeholder={identifiersFrom
                          ? inherited.settings.identifiers?.[identifier.key]
                          : undefined}
                        aria-label={identifierWords(identifier.key)}
                        spellcheck="false"
                      />
                    </td>
                  </tr>
                {/each}
                <tr class="new">
                  <th scope="row">
                    <input
                      bind:value={newIdentifier}
                      placeholder={t('about-identifier-name-placeholder')}
                      aria-label={t('about-identifier-name')}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addIdentifier();
                        }
                      }}
                    />
                  </th>
                  <td>
                    <button
                      type="button"
                      class="add"
                      disabled={!newIdentifier.trim()}
                      onclick={addIdentifier}
                    >
                      <Plus size={12} />
                      {t('about-identifier-add')}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            {#if identifiersFrom}<small
                >{t('documents-inherited-from', { name: identifiersFrom })}</small
              >{/if}
          </div>

          <div class="field">
            <label class="check" data-line-numbers>
              <input
                type="checkbox"
                checked={linesNumbered}
                onchange={(e) => (draft.lineNumbers = e.currentTarget.checked)}
              />
              <span>{t('about-page-lines')}</span>
            </label>
            {#if linesFrom}<small>{t('documents-inherited-from', { name: linesFrom })}</small>{/if}
          </div>
        </div>
      {:else if section === 'type'}
        <h3>{t('about-section-type')}</h3>
        <DocumentType {project} {at} {onclose} />
      {:else if section === 'language'}
        <h3>{t('about-section-language')}</h3>
        <label class="row">
          <span class="what">{t('about-language')}</span>
          <select value={own.language ?? ''} onchange={(e) => setLanguage(e.currentTarget.value)}>
            <option value="">{noLanguage}</option>
            {#each TEXT_LANGUAGES as tag (tag)}
              <option value={tag}>{languageName(tag)}</option>
            {/each}
            {#if own.language && !TEXT_LANGUAGES.includes(own.language)}
              <option value={own.language}>{languageName(own.language)}</option>
            {/if}
          </select>
        </label>
        {#if languageFrom && inherited.settings.language}
          <p class="from">
            {t('documents-inherited-from', { name: languageFrom })} · {languageName(
              inherited.settings.language,
            )}
          </p>
        {/if}
        <p class="hint">{t('languages-map-hint')}</p>
        {#if at === PROJECT}
          <p class="hint">{t('languages-project-hint')}</p>
        {/if}
      {:else if section === 'checklist'}
        <h3>{t('about-section-checklist')}</h3>
        <p class="hint top">{t('about-checklist-hint')}</p>
        <div class="row">
          <span class="what"
            >{t('about-requirement-words')}{#if template?.requirements.note}<small
                >{template.requirements.note}</small
              >{/if}</span
          >
          <span class="count" class:over={!!wordsMost && words.text > wordsMost}>
            {wordsMost
              ? t('preview-words-of', { count: words.text, limit: wordsMost })
              : t('preview-words', { count: words.text })}
          </span>
        </div>
        {#if template?.requirements.anonymous}
          <p class="hint">{t('about-requirement-anonymous')}</p>
        {/if}
        <ul class="remarks">
          {#each remarks as remark, i (i)}
            <li>
              <span>{remark.text}</span>
              {#if remark.elements?.length}
                <span class="links">
                  {#each remark.elements as element (element)}
                    <button type="button" class="link" onclick={() => go(element)}
                      >{nameOf(element)}</button
                    >
                  {/each}
                </span>
              {/if}
            </li>
          {:else}
            <li class="clear">{t('about-checklist-clear')}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={save}>{t('common-save')}</Button>
  {/snippet}
</Dialog>

<style>
  .window {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    border-top: 1px solid var(--line);
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 12px 8px;
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }
  nav button {
    min-height: 30px;
    padding: 5px 12px;
    line-height: 1.3;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  nav button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  nav button.current {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .form {
    padding: 18px 24px 28px;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
  }
  .from {
    margin: 0 0 10px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }

  /* The details, as the dialog of them had them. */
  .details {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .field > span {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  em {
    font-style: normal;
    font-weight: 400;
    color: var(--ink-4);
  }
  .over {
    color: var(--danger);
    font-weight: 500;
  }
  .field small {
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .serif {
    font-family: var(--font-text);
    font-size: 14.5px;
  }
  .settings .details input {
    height: var(--control-h);
    padding: 0 9px;
  }
  .details input::placeholder {
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-md);
  }
  .contributor {
    display: grid;
    grid-template-columns: 0.9fr 1.2fr 1.2fr 1fr 0.8fr auto;
    gap: 5px;
    align-items: center;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    align-self: flex-start;
    padding: 2px 7px 2px 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .add:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--accent-strong);
  }
  .add:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .identifiers {
    width: 100%;
    border-collapse: collapse;
  }
  .identifiers th {
    width: 130px;
    padding: 2px 10px 2px 0;
    font-weight: 500;
    font-size: var(--text-sm);
    color: var(--ink-2);
    text-align: left;
  }
  .identifiers td {
    padding: 2px 0;
  }
  .identifiers .new th input {
    font-weight: 400;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-md);
    color: var(--ink);
    cursor: pointer;
  }

  /* The checklist. */
  .count {
    justify-self: end;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .remarks {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }
  .remarks li {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    line-height: 1.5;
  }
  .remarks .clear {
    color: var(--ink-3);
  }
  .links {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
