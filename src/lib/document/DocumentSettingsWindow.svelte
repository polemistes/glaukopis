<script lang="ts">
  /**
   * The settings of an element's document (ADR 0038), one window per
   * element: its template, the details that stand on its first page and in
   * the metadata of its files, its parts, its layout and reference style,
   * its language, and the checklist of what the template requires. What
   * the element does not set it takes from the elements over it (ADR
   * 0037): that is shown, and left for it to set its own.
   *
   * The template, the layout, the style and the language are written as
   * they are chosen, each a step of undo of its own, as a part is made; the
   * details are written together when the window is saved.
   */
  import { untrack } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import { openPath, type DocumentFormat } from '$lib/api/documents';
  import type { Template } from '$lib/api/templates';
  import { languageName, newTextLanguage, t, TEXT_LANGUAGES } from '$lib/i18n';
  import { lookUi } from '$lib/look/look.svelte';
  import { countWords } from '$lib/project/model/document';
  import type { Project } from '$lib/project/model/project.svelte';
  import { PROJECT, type DocumentSettings, type Person } from '$lib/project/model/types';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { DOCUMENT_SECTIONS, type DocumentSection } from './document-settings.svelte';
  import { checklist, type Remark } from './checklist';
  import { documents, templateFor, templateName } from '$lib/preview/documents.svelte';
  import { partOf, type PartSpec as PartKind } from '$lib/project/parts';
  import { templateEditorUi } from './template-editor.svelte';
  import {
    confidenceWords,
    partGroupWords,
    templateGroupWords,
    TEMPLATE_GROUPS,
  } from './templates';

  interface Props {
    project: Project;
    /** The element whose document is set. */
    at: string;
    /** The part of the window to open at. */
    section?: DocumentSection;
    /** Shows an element in the text: a part of the document, from its line here. */
    ongo: (element: string) => void;
    onclose: () => void;
  }

  let { project, at, section: openAt, ongo, onclose }: Props = $props();

  let section = $state<DocumentSection>(untrack(() => openAt ?? 'template'));
  const node = $derived(project.node(at));
  /** What the element says of its own. */
  const own = $derived(node?.document ?? {});
  /** What is said of the element with what it inherits, and which element says each thing. */
  const inherited = $derived(project.documentOf(at));
  const choice = $derived(documents.choice(inherited.settings, project));

  $effect(() => {
    documents.load();
  });

  /** The template and the layout in use, whole: for what they bring, require and set. */
  let template = $state.raw<Template | null>(null);
  let format = $state.raw<DocumentFormat | null>(null);
  $effect(() => {
    const id = choice.template;
    void documents.changed;
    void project.templates;
    untrack(() =>
      templateFor(project, id)
        .then((loaded) => {
          if (id === choice.template) template = loaded;
        })
        .catch(() => {}),
    );
  });
  $effect(() => {
    const id = choice.format;
    void documents.changed;
    untrack(() =>
      documents
        .format(id)
        .then((loaded) => {
          if (id === choice.format) format = loaded;
        })
        .catch(() => (format = null)),
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
  /** The nearest element over this one that sets a setting itself, whatever this one says; nothing where none does. */
  function over(key: keyof DocumentSettings): string | null {
    const way = project.pathTo(at).filter((id) => id !== at);
    return [...way].reverse().find((id) => project.node(id)?.document[key] !== undefined) ?? null;
  }
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  /** Writes one setting as its own step of undo. */
  function write(patch: Partial<DocumentSettings>) {
    project.checkpoint();
    project.setDocument(at, patch);
    project.checkpoint();
  }

  // ---- the template ----

  let query = $state('');
  const templateFrom = $derived(own.template ? null : from('template'));
  /** A template the chooser lists: as the application lists it, or the project's copy that the application lacks. */
  interface Listed {
    id: string;
    name: string;
    description: string;
    ofProject?: boolean;
  }
  /**
   * The templates the project carries a copy of that the application
   * lacks: brought by a shared project or a file from a computer that has
   * them. They stand among the writer's own.
   */
  const ofProject = $derived<Listed[]>(
    project.templates
      .filter((tp) => !documents.templateSummary(tp.id))
      .map((tp) => ({ id: tp.id, name: tp.name, description: tp.description, ofProject: true })),
  );
  const templateGroups = $derived.by(() => {
    const q = query.trim().toLocaleLowerCase();
    const fits = (s: { name: string; description: string }) =>
      !q || `${s.name}\n${s.description}`.toLocaleLowerCase().includes(q);
    return TEMPLATE_GROUPS.map((group) => ({
      group,
      label: templateGroupWords(group),
      templates: [
        ...documents.templates.filter((s) => s.group === group && fits(s)),
        ...(group === 'own' ? ofProject.filter(fits) : []),
      ] as Listed[],
    })).filter((g) => g.templates.length);
  });
  /** The usual layout and style, from the settings, by name. */
  const usualLayout = $derived(
    documents.formatSummary(documents.choice({}).format)?.name ?? documents.choice({}).format,
  );
  const usualStyle = $derived(
    documents.style(documents.choice({}).style)?.title ?? documents.choice({}).style,
  );
  const layoutName = (id: string | undefined) =>
    id ? (documents.formatSummary(id)?.name ?? id) : '';
  const styleName = (id: string | undefined) => (id ? (documents.style(id)?.title ?? id) : '');
  /** What the template brings: its layout, and its style or the layout's. */
  const broughtLayout = $derived(
    template?.layout
      ? layoutName(template.layout)
      : t('document-window-usual', { name: usualLayout }),
  );
  const broughtStyle = $derived(
    template?.style
      ? styleName(template.style)
      : format?.style
        ? styleName(format.style)
        : t('document-window-usual', { name: usualStyle }),
  );

  /**
   * Chooses a template for the element. One of the writer's own is copied
   * into the project, so that a shared project and a file carry it; one
   * that came with the application is on every computer already.
   */
  function setTemplate(id: string) {
    if (id === choice.template && own.template) return;
    write({ template: id });
    keep(id);
  }

  function keep(id: string) {
    if (!documents.templateSummary(id)?.own) return;
    documents
      .templateOf(id)
      .then((tp) => project.keepTemplate($state.snapshot(tp) as Template))
      .catch(() => {});
  }

  function editTemplate(fresh: boolean) {
    const id = choice.template;
    templateEditorUi.open({
      id,
      fresh,
      // Where the application lacks it, the editor begins from the project's copy.
      copy: documents.templateSummary(id) ? undefined : project.templateCopy(id),
      onsaved: (saved) => {
        documents.forgetTemplate(saved);
        write({ template: saved });
        keep(saved);
      },
    });
  }

  // ---- the details ----

  // svelte-ignore state_referenced_locally
  let draft = $state<DocumentSettings>(
    structuredClone($state.snapshot(node?.document ?? {}) as DocumentSettings),
  );
  // svelte-ignore state_referenced_locally
  let keywords = $state((node?.document.keywords ?? []).join(', '));
  if (!draft.authors?.length) draft.authors = [{ name: '' }];

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
    return USUAL_IDENTIFIERS.includes(key) ? t(`document-window-identifier-${key}`) : key;
  }

  function addIdentifier() {
    const key = newIdentifier.trim();
    if (!key || identifiers.some((i) => i.key.toLocaleLowerCase() === key.toLocaleLowerCase()))
      return;
    identifiers.push({ key, value: '' });
    newIdentifier = '';
  }

  // Shown while the element says nothing of its own.
  const authorsFrom = $derived(draft.authors?.some((a) => a.name.trim()) ? null : from('authors'));
  const keywordsFrom = $derived(keywords.trim() ? null : from('keywords'));
  const dateFrom = $derived(draft.date?.trim() ? null : from('date'));
  const identifiersFrom = $derived(
    identifiers.some((i) => i.value.trim()) ? null : from('identifiers'),
  );
  const inheritedAuthors = $derived(
    (inherited.settings.authors ?? []).map((a) => a.name).join(', '),
  );
  const keywordCount = $derived(keywords.split(/[,;\n]/).filter((k) => k.trim()).length);
  const keywordsMost = $derived(template?.requirements.keywords ?? null);

  function save() {
    const authors = (draft.authors ?? [])
      .map((a): Person => ({
        name: a.name.trim(),
        affiliation: a.affiliation?.trim() || undefined,
        email: a.email?.trim() || undefined,
        orcid: a.orcid?.trim() || undefined,
      }))
      .filter((a) => a.name);
    const named: Record<string, string> = {};
    for (const i of identifiers) if (i.value.trim()) named[i.key.trim()] = i.value.trim();
    write({
      title: draft.title?.trim(),
      subtitle: draft.subtitle?.trim(),
      authors,
      keywords: keywords
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean),
      date: draft.date?.trim(),
      identifiers: Object.keys(named).length ? named : undefined,
    });
    onclose();
  }

  // ---- the parts ----

  /** The kinds the template gives the document a place for: those of its contents in order, then the rest it puts in hand. */
  const partKinds = $derived.by(() => {
    if (!template) return [] as PartKind[];
    const ids: string[] = [];
    for (const item of template.contents)
      if ('kind' in item && !ids.includes(item.kind)) ids.push(item.kind);
    for (const id of template.kinds) if (!ids.includes(id)) ids.push(id);
    return ids.map((id) => partOf(project, id)).filter((k): k is PartKind => !!k);
  });
  /** The elements under this one, of each kind: by the kind itself, or a kind of the project based on it. */
  const partsOf = $derived.by(() => {
    const children = project.tree().children.get(at) ?? [];
    const out = new Map<string, string[]>();
    for (const child of children) {
      const kind = partOf(project, project.node(child)?.kind)?.id;
      if (kind) out.set(kind, [...(out.get(kind) ?? []), child]);
    }
    return out;
  });

  /** Makes an element of a kind under this one, named as the kind is: first among the children for the front, last for the back and the cover. */
  function makePart(kind: PartKind) {
    project.checkpoint();
    const id = project.addChild(at, {
      title: kind.label(),
      index: kind.group === 'front' ? 0 : undefined,
    });
    if (id) project.setKind([id], kind.id);
    project.checkpoint();
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

  const remarks = $derived<Remark[]>(template ? checklist(project, at, template, format) : []);
  const words = $derived(countWords(project, at));
  const wordsMost = $derived(template?.requirements.words ?? null);

  const sections = $derived(
    DOCUMENT_SECTIONS.map((key) => [key, t(`document-window-section-${key}`)] as const),
  );
</script>

<Dialog
  open
  title={t('document-window')}
  subtitle={node?.title || t('project-untitled')}
  width={760}
  tall
  padded={false}
  {onclose}
>
  <div class="window">
    <nav aria-label={t('document-window-sections')}>
      {#each sections as [key, label] (key)}
        <button type="button" class:current={section === key} onclick={() => (section = key)}
          >{label}</button
        >
      {/each}
    </nav>

    <div class="form settings">
      {#if section === 'template'}
        <h3>{t('document-window-section-template')}</h3>
        <p class="hint top">{t('document-window-template-hint')}</p>
        {#if templateFrom}
          <p class="from">
            {t('documents-inherited-from', { name: templateFrom })} · {templateName(
              project,
              choice.template,
            )}
          </p>
        {/if}
        {#if own.template}
          {@const setter = over('template')}
          <div class="actions">
            <Button size="sm" onclick={() => write({ template: undefined })}>
              {setter
                ? t('document-window-template-again', { name: nameOf(setter) })
                : t('document-window-template-usual-again')}
            </Button>
          </div>
        {/if}
        <div class="search">
          <Search size={14} />
          <input
            bind:value={query}
            placeholder={t('document-window-template-search-placeholder')}
            aria-label={t('document-window-template-search')}
            spellcheck="false"
          />
        </div>
        <div class="templates" role="radiogroup" aria-label={t('document-window-section-template')}>
          {#each templateGroups as group (group.group)}
            <h4>{group.label}</h4>
            {#each group.templates as s (s.id)}
              {@const chosen = s.id === choice.template}
              <div class="template" class:chosen>
                <button
                  type="button"
                  class="choose"
                  role="radio"
                  aria-checked={chosen}
                  onclick={() => setTemplate(s.id)}
                >
                  <span class="name">{s.name}</span>
                  {#if s.description}<span class="description">{s.description}</span>{/if}
                  {#if s.ofProject}
                    <span class="description">{t('document-window-template-of-project')}</span>
                  {/if}
                </button>
                {#if chosen && template && template.id === s.id}
                  <div class="about">
                    {#if template.source?.name}
                      {@const source = template.source}
                      <p class="selectable">
                        <span class="overline">{t('format-source')}</span>
                        {source.name}
                        {#if source.url}
                          <button
                            type="button"
                            class="link"
                            onclick={() => openPath(source.url).catch(() => {})}
                          >
                            {source.url}
                            <ExternalLink size={11} />
                          </button>
                        {/if}
                      </p>
                      <p class="read">
                        {#if source.checked}{t('format-source-read', { date: source.checked })}{/if}
                        {confidenceWords(source.confidence)}
                      </p>
                    {/if}
                    <p>{t('document-window-template-layout', { layout: broughtLayout })}</p>
                    <p>{t('document-window-template-style', { style: broughtStyle })}</p>
                    <div class="actions">
                      <Button size="sm" onclick={() => editTemplate(false)}
                        >{t('document-window-template-change')}</Button
                      >
                      <Button size="sm" variant="ghost" onclick={() => editTemplate(true)}
                        >{t('document-window-template-new')}</Button
                      >
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          {:else}
            <p class="hint">{t('document-window-template-none-found')}</p>
          {/each}
        </div>
      {:else if section === 'details'}
        <h3>{t('document-window-section-details')}</h3>
        <p class="hint top">{t('document-window-details-hint')}</p>
        <div class="details">
          <label class="field">
            <span>{t('document-window-title')}</span>
            <input
              bind:value={draft.title}
              class="serif"
              placeholder={node?.title || t('document-window-title-placeholder')}
            />
            <small>{t('document-window-title-hint')}</small>
          </label>
          <label class="field">
            <span>{t('document-window-subtitle')}</span>
            <input bind:value={draft.subtitle} class="serif" />
          </label>

          <div class="field">
            <span>{t('document-window-authors')}</span>
            {#each draft.authors ?? [] as author, i (i)}
              <div class="author">
                <input
                  bind:value={author.name}
                  placeholder={i === 0 && authorsFrom
                    ? inheritedAuthors
                    : t('document-window-name')}
                  aria-label={t('document-window-author-name', { number: i + 1 })}
                />
                <input
                  bind:value={author.affiliation}
                  placeholder={t('document-window-affiliation')}
                  aria-label={t('document-window-author-affiliation', { number: i + 1 })}
                />
                <input
                  bind:value={author.email}
                  placeholder={t('document-window-email')}
                  aria-label={t('document-window-author-email', { number: i + 1 })}
                />
                <input
                  bind:value={author.orcid}
                  placeholder={t('document-window-orcid')}
                  aria-label={t('document-window-author-orcid', { number: i + 1 })}
                  spellcheck="false"
                />
                <IconButton
                  label={t('common-remove')}
                  size="sm"
                  disabled={(draft.authors?.length ?? 0) <= 1 && !author.name}
                  onclick={() => {
                    draft.authors?.splice(i, 1);
                    if (!draft.authors?.length) draft.authors = [{ name: '' }];
                  }}
                >
                  <X size={13} />
                </IconButton>
              </div>
            {/each}
            <button type="button" class="add" onclick={() => draft.authors?.push({ name: '' })}>
              <Plus size={12} />
              {t('document-window-add-author')}
            </button>
            {#if authorsFrom}<small>{t('documents-inherited-from', { name: authorsFrom })}</small
              >{/if}
          </div>

          <div class="pair">
            <label class="field">
              <span>{t('document-window-date')}</span>
              <input
                bind:value={draft.date}
                placeholder={dateFrom
                  ? inherited.settings.date
                  : t('document-window-date-placeholder')}
              />
              {#if dateFrom}<small>{t('documents-inherited-from', { name: dateFrom })}</small>{/if}
            </label>
            <label class="field">
              <span>
                {t('document-window-keywords')}
                <em class:over={!!keywordsMost && keywordCount > keywordsMost}>
                  {keywordsMost
                    ? t('document-window-keywords-of', { count: keywordCount, limit: keywordsMost })
                    : t('document-window-keywords-count', { count: keywordCount })}
                </em>
              </span>
              <input
                bind:value={keywords}
                placeholder={keywordsFrom
                  ? (inherited.settings.keywords ?? []).join(', ')
                  : t('document-window-keywords-placeholder')}
              />
              {#if keywordsFrom}<small
                  >{t('documents-inherited-from', { name: keywordsFrom })}</small
                >{/if}
            </label>
          </div>

          <div class="field">
            <span>{t('document-window-identifiers')}</span>
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
                      placeholder={t('document-window-identifier-name-placeholder')}
                      aria-label={t('document-window-identifier-name')}
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
                      {t('document-window-identifier-add')}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            {#if identifiersFrom}<small
                >{t('documents-inherited-from', { name: identifiersFrom })}</small
              >{/if}
          </div>
        </div>
      {:else if section === 'parts'}
        <h3>{t('document-window-section-parts')}</h3>
        <p class="hint top">{t('document-window-parts-hint')}</p>
        {#each partKinds as kind (kind.id)}
          {@const elements = partsOf.get(kind.id) ?? []}
          <div class="part">
            <div class="part-head">
              <strong>{kind.label()}</strong>
              <span class="group">{partGroupWords(kind.group)}</span>
              <Button size="sm" onclick={() => makePart(kind)}>
                {#snippet icon()}<Plus size={13} />{/snippet}
                {t('document-window-parts-make')}
              </Button>
            </div>
            {#each elements as element, i (element)}
              <button type="button" class="element" onclick={() => go(element)}>
                <span class="truncate">{nameOf(element)}</span>
                {#if kind.one && i > 0}
                  <span class="doubled">{t('document-window-parts-doubled')}</span>
                {/if}
                <ArrowRight size={13} />
              </button>
            {:else}
              <p class="none">{t('document-window-parts-missing')}</p>
            {/each}
          </div>
        {:else}
          <p class="hint">{t('document-window-parts-none')}</p>
        {/each}
      {:else if section === 'look'}
        <h3>{t('document-window-section-look')}</h3>
        <p class="hint top">{t('document-window-look-hint')}</p>
        <div class="row">
          <span class="what"
            >{t('document-window-look-now', {
              layout: layoutName(choice.format),
              style: styleName(choice.style),
            })}</span
          >
          <Button
            size="sm"
            onclick={() => {
              lookUi.open();
              onclose();
            }}>{t('document-window-look-open')}</Button
          >
        </div>
      {:else if section === 'language'}
        <h3>{t('document-window-section-language')}</h3>
        <label class="row">
          <span class="what">{t('document-window-language')}</span>
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
        <h3>{t('document-window-section-checklist')}</h3>
        <p class="hint top">{t('document-window-checklist-hint')}</p>
        <div class="row">
          <span class="what"
            >{t('document-window-requirement-words')}{#if template?.requirements.note}<small
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
          <p class="hint">{t('document-window-requirement-anonymous')}</p>
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
            <li class="clear">{t('document-window-checklist-clear')}</li>
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
  .actions {
    display: flex;
    gap: 8px;
    margin: 10px 0 14px;
  }

  /* The template: a search, and the templates in their groups. */
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    color: var(--ink-3);
  }
  .search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .settings .search input {
    height: auto;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }
  .templates {
    margin-top: 6px;
  }
  .template {
    border-radius: var(--radius-m);
  }
  .template.chosen {
    background: var(--accent-soft);
  }
  .choose {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    border-radius: var(--radius-m);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .choose:hover {
    background: var(--paper-hover);
  }
  .chosen .choose {
    color: var(--accent-strong);
  }
  .choose .name {
    font-weight: 500;
  }
  .choose .description {
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.4;
  }
  .about {
    padding: 2px 10px 10px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: 1.5;
  }
  .about p {
    margin: 0 0 2px;
  }
  .about .overline {
    display: block;
    margin-top: 6px;
  }
  .about .read {
    color: var(--ink-3);
  }
  .about .actions {
    margin: 8px 0 0;
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
  .author {
    display: grid;
    grid-template-columns: 1.2fr 1.3fr 1.1fr 0.9fr auto;
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

  /* The parts: each kind with the elements that fill it. */
  .part {
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .part-head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 30px;
  }
  .part-head strong {
    font-weight: 600;
  }
  .part-head .group {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .element {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-top: 2px;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 14.5px;
    text-align: left;
    cursor: pointer;
  }
  .element:hover {
    background: var(--paper-hover);
    color: var(--accent-strong);
  }
  .element .truncate {
    flex: 1;
  }
  .doubled {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--warn);
  }
  .none {
    margin: 2px 0 0 8px;
    font-size: var(--text-sm);
    color: var(--ink-4);
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
