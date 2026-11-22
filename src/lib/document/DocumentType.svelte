<!--
  The type of a document, a tab of Document properties: what you are
  writing, the template of its element. The plain document first, alone, as
  what every document is until something else is chosen; then the types in
  their groups; then, as a second step, those of journals, publishers and
  style guides, narrowed to those made for the type in use. The search finds
  every one. Under each name stands what the type brings, worked out from
  the type itself (`brings.ts`), and nothing that explains. Choosing writes
  at once, as a step of undo of its own. New document type… makes a type of
  the writer's own, from another or from nothing, and opens Look to edit it;
  a type of the writer's own in use has Edit, which does the same for it.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Search from '@lucide/svelte/icons/search';
  import { openPath } from '$lib/api/documents';
  import {
    templatesSave,
    type ContentsItem,
    type Requirements,
    type Template,
    type TemplateGroup,
  } from '$lib/api/templates';
  import { has, t } from '$lib/i18n';
  import { styleName } from '$lib/look/choosing.svelte';
  import { lookUi } from '$lib/look/look.svelte';
  import {
    documents,
    PLAIN_TEMPLATE,
    templateFor,
    templateName,
  } from '$lib/preview/documents.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { DocumentSettings } from '$lib/project/model/types';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import { limitsBrought, pagesBrought, partsBrought } from './brings';
  import { asOwn, confidenceWords, templateGroupWords, typeSaid } from './templates';

  interface Props {
    project: Project;
    /** The element whose document is chosen for: it and what is under it. */
    at: string;
    /** Closes Document properties: a template chosen by a double click is done with. */
    onclose: () => void;
  }

  let { project, at, onclose }: Props = $props();

  /** The groups of what is written, in the order they are offered. */
  const KINDS: readonly TemplateGroup[] = [
    'article',
    'book',
    'fiction',
    'poetry',
    'stage',
    'other',
  ];
  /** Whom a document is written for: the second step. */
  const SUBMISSION: readonly TemplateGroup[] = ['journal', 'publisher', 'style-guide'];

  const node = $derived(project.node(at));
  /** What the element says of its own. */
  const own = $derived(node?.document ?? {});
  const inherited = $derived(project.documentOf(at));
  const choice = $derived(documents.choice(inherited.settings, project));

  $effect(() => {
    documents.load();
  });

  /** The template in use, whole: for where its requirements were found. */
  let template = $state.raw<Template | null>(null);
  $effect(() => {
    const id = choice.template;
    void documents.changed;
    void project.templates;
    untrack(() =>
      templateFor(project, id)
        .then((loaded) => {
          if (id === choice.template) template = loaded;
        })
        .catch((error) => {
          // The chooser goes on without what the template brings; the log says why.
          console.error(`the template ${id} could not be read for the chooser`, error);
          if (id === choice.template) template = null;
        }),
    );
  });

  /**
   * Where the requirements of the type in use were found, where that is a
   * page one can go to: the type's own source, else that of the layout it
   * brings. What a type with no such page says of where it is from is how
   * it was thought out, and is not shown.
   */
  const source = $derived.by(() => {
    if (template?.source?.url) return template.source;
    const ofLayout = template?.layout ? documents.formatCached(template.layout)?.source : undefined;
    return ofLayout?.url ? ofLayout : undefined;
  });

  // ---- what is offered ----

  /** A template as the chooser lists it: as the application lists it, or the project's copy that the application lacks. */
  interface Listed {
    id: string;
    name: string;
    description: string;
    group: TemplateGroup;
    basedOn?: string;
    layout?: string;
    style?: string;
    contents: ContentsItem[];
    requirements: Requirements;
    own?: boolean;
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
      .map((tp) => ({
        id: tp.id,
        name: tp.name,
        description: tp.description,
        group: 'own',
        basedOn: tp.basedOn,
        layout: tp.layout,
        style: tp.style,
        contents: tp.contents,
        requirements: tp.requirements,
        ofProject: true,
      })),
  );
  const all = $derived<Listed[]>([...documents.templates, ...ofProject]);

  let query = $state('');
  const q = $derived(query.trim().toLocaleLowerCase());
  const nameOfTemplate = (s: Listed) => templateName(project, s.id) || s.name;
  /**
   * What is said of a type in words: of one that came with the application,
   * what the interface says of it, which is little (`template-described-<id>`);
   * of a writer's own, what the writer wrote.
   */
  function described(s: Listed): string {
    if (s.own || s.ofProject) return s.description;
    return has(`template-described-${s.id}`) ? t(`template-described-${s.id}`) : '';
  }
  /**
   * What a type brings, a line for each: its parts; how its pages are set,
   * by its layout or the writer's usual, and how it cites, where it or its
   * layout names a reference style; and what it requires.
   */
  function brought(s: Listed): string[] {
    const layout = documents.formatSummary(s.layout || documents.usualFormat());
    const style = s.style || (s.layout ? layout?.style : undefined);
    return [
      partsBrought(s.contents),
      pagesBrought(layout, style && documents.style(style) ? styleName(style) : ''),
      limitsBrought(s.requirements),
    ].filter(Boolean);
  }
  /** Whether a template is found by what is searched for: by its name, what is said of it or its group. */
  function fits(s: Listed): boolean {
    if (!q) return true;
    return `${nameOfTemplate(s)}\n${s.name}\n${described(s)}\n${templateGroupWords(s.group)}`
      .toLocaleLowerCase()
      .includes(q);
  }

  /** Whether a template is the one named, or made from it: its chain of bases reaches it. */
  function reaches(id: string, base: string): boolean {
    const seen = new Set<string>();
    let at: string | undefined = id;
    while (at && !seen.has(at)) {
      if (at === base) return true;
      seen.add(at);
      at = all.find((s) => s.id === at)?.basedOn;
    }
    return false;
  }

  const inUse = $derived(all.find((s) => s.id === choice.template));
  const plain = $derived(all.find((s) => s.id === PLAIN_TEMPLATE));
  const ownTemplates = $derived(all.filter((s) => s.group === 'own' && fits(s)));
  const kindGroups = $derived(
    KINDS.map((group) => ({
      group,
      label: templateGroupWords(group),
      templates: all.filter((s) => s.group === group && fits(s)),
    })).filter((g) => g.templates.length),
  );

  /** The type the second step is narrowed to: the one in use, where it is of those groups; nothing for all. */
  const narrowedTo = $derived(inUse && KINDS.includes(inUse.group) ? inUse.id : null);
  const submissions = $derived(all.filter((s) => SUBMISSION.includes(s.group)));
  /** Those made for the type in use; while something is searched for, every one that is found. */
  const offered = $derived.by(() => {
    if (q) return submissions.filter(fits);
    if (!narrowedTo) return submissions;
    const made = submissions.filter((s) => reaches(s.id, narrowedTo));
    // Where none is made for it, every one is offered.
    return made.length ? made : submissions;
  });
  const submissionGroups = $derived(
    SUBMISSION.map((group) => ({
      group,
      label: templateGroupWords(group),
      templates: offered.filter((s) => s.group === group),
    })).filter((g) => g.templates.length),
  );
  /** The second step is open where a template of it is in use, while something is searched for, and where the writer opened it. */
  let stepOpened = $state(false);
  const stepOpen = $derived(stepOpened || !!q || (!!inUse && SUBMISSION.includes(inUse.group)));
  const nothingFound = $derived(
    !!q &&
      !ownTemplates.length &&
      !(plain && fits(plain)) &&
      !kindGroups.length &&
      !submissionGroups.length,
  );

  // ---- where it comes from ----

  /** The name of the element over this one that the template is taken from; nothing where it is this element's own, or nobody's. */
  const templateFrom = $derived.by(() => {
    if (own.template) return null;
    const who = inherited.from.get('template');
    if (!who || who === at) return null;
    return nameOf(who);
  });
  /** The nearest element over this one that chooses a template itself, whatever this one says; nothing where none does. */
  function over(): string | null {
    const way = project.pathTo(at).filter((id) => id !== at);
    return (
      [...way].reverse().find((id) => project.node(id)?.document.template !== undefined) ?? null
    );
  }
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');
  /** What a document is where nothing over it says: the writer's usual. */
  const usual = $derived(settings.value.defaultTemplate || PLAIN_TEMPLATE);
  /** What the document is where its element says nothing of its own: what the nearest element over it chooses, else the usual. */
  function unsaid(): string {
    const setter = over();
    return (setter && project.node(setter)?.document.template) || usual;
  }

  // ---- choosing ----

  /** Writes one setting as its own step of undo. */
  function write(patch: Partial<DocumentSettings>) {
    project.checkpoint();
    project.setDocument(at, patch);
    project.checkpoint();
  }

  /**
   * Chooses a template for the element. One of the writer's own is copied
   * into the project, so that a shared project and a file carry it; one
   * that came with the application is on every computer already. The
   * element's own layout and style, chosen in Look, go with the choice, in
   * the same step of undo, so that the type's take hold. Choosing what the
   * document is without a choice of the element's own, the type of the
   * element over it or the usual, leaves the element saying nothing: it is
   * that type, and follows it.
   */
  function setTemplate(id: string) {
    const said = typeSaid(id, own.template, unsaid());
    if (said === null) return;
    write({ template: said, format: undefined, style: undefined });
    if (said) keep(said);
  }

  function keep(id: string) {
    if (!documents.templateSummary(id)?.own) return;
    documents
      .templateOf(id)
      .then((tp) => project.keepTemplate($state.snapshot(tp) as Template))
      // Chosen but not kept: the writer is told, since a shared project and a
      // file of it would fall back to the usual template without a word.
      .catch((error) => notifyError(t('template-keep-failed'), error));
  }

  /** Edits a type of the writer's own in Look, on this document: Document properties closes. */
  function edit(id: string) {
    lookUi.editing = id;
    onclose();
    lookUi.open({ section: 'document-type' });
  }

  // ---- a new type ----

  /** The name of a new type and what it starts from, while they are asked for; nothing while they are not. */
  let making = $state<{ name: string; from: string } | null>(null);
  let creating = $state(false);
  let makingError = $state<string | null>(null);
  /** Every type to start from, by its name. */
  const startFrom = $derived(
    [...all].sort((a, b) => nameOfTemplate(a).localeCompare(nameOfTemplate(b))),
  );

  /**
   * Makes a type of the writer's own from the one chosen to start from, or
   * from the plain type, gives it to the element, and edits it in Look.
   */
  async function create() {
    if (!making || !making.name.trim() || creating) return;
    creating = true;
    makingError = null;
    try {
      const from = $state.snapshot(await templateFor(project, making.from)) as Template;
      const taken = documents.templates.map((s) => s.id);
      const saved = await templatesSave(asOwn(from, making.name, taken, true));
      documents.forgetTemplate(saved.id);
      await documents.reload();
      setTemplate(saved.id);
      project.keepTemplate(saved);
      making = null;
      edit(saved.id);
    } catch (e) {
      makingError = describeError(e) ?? t('template-save-failed');
    } finally {
      creating = false;
    }
  }
</script>

<div class="chooser">
  <div class="top">
    <div class="search-line">
      <div class="search">
        <Search size={14} />
        <input bind:value={query} aria-label={t('chooser-search')} spellcheck="false" />
      </div>
      <Button size="sm" data-new-type onclick={() => (making = { name: '', from: choice.template })}
        >{t('chooser-new')}</Button
      >
    </div>
    {#if templateFrom}
      <p class="from" data-from>{t('documents-inherited-from', { name: templateFrom })}</p>
    {/if}
  </div>

  <div class="templates" role="radiogroup" aria-label={t('chooser-title')}>
    {#if ownTemplates.length}
      <h4>{templateGroupWords('own')}</h4>
      {#each ownTemplates as s (s.id)}{@render entry(s)}{/each}
    {/if}
    {#if plain && fits(plain)}
      <div class="alone">{@render entry(plain)}</div>
    {/if}
    {#each kindGroups as group (group.group)}
      <h4>{group.label}</h4>
      {#each group.templates as s (s.id)}{@render entry(s)}{/each}
    {/each}

    {#if submissionGroups.length}
      <details
        class="step"
        data-step
        open={stepOpen}
        ontoggle={(e) => (stepOpened = e.currentTarget.open)}
      >
        <summary>{t('chooser-submission')}</summary>
        {#each submissionGroups as group (group.group)}
          <h4>{group.label}</h4>
          {#each group.templates as s (s.id)}{@render entry(s)}{/each}
        {/each}
      </details>
    {/if}

    {#if nothingFound}
      <p class="hint">{t('chooser-none-found')}</p>
    {/if}
  </div>
</div>

{#if making}
  {@const m = making}
  <Dialog open title={t('chooser-new-title')} width={420} onclose={() => (making = null)}>
    <form
      id="new-type"
      class="new-type settings"
      onsubmit={(e) => {
        e.preventDefault();
        void create();
      }}
    >
      {#if makingError}<p class="error selectable" role="alert">{makingError}</p>{/if}
      <label class="row">
        <span class="what">{t('chooser-new-name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input bind:value={m.name} data-new-name autofocus />
      </label>
      <label class="row">
        <span class="what">{t('chooser-start-from')}</span>
        <select bind:value={m.from} data-start-from>
          <option value={PLAIN_TEMPLATE}>{t('chooser-start-nothing')}</option>
          {#each startFrom as s (s.id)}<option value={s.id}>{nameOfTemplate(s)}</option>{/each}
        </select>
      </label>
    </form>
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (making = null)}>{t('common-cancel')}</Button>
      <Button
        type="submit"
        form="new-type"
        variant="primary"
        data-create
        disabled={creating || !m.name.trim()}>{t('chooser-create')}</Button
      >
    {/snippet}
  </Dialog>
{/if}

{#snippet entry(s: Listed)}
  {@const chosen = s.id === choice.template}
  <div class="template" class:chosen data-template={s.id}>
    <button
      type="button"
      class="choose"
      role="radio"
      aria-checked={chosen}
      onclick={() => setTemplate(s.id)}
      ondblclick={() => {
        setTemplate(s.id);
        onclose();
      }}
    >
      <span class="name">{nameOfTemplate(s)}</span>
      {#if described(s)}<span class="description">{described(s)}</span>{/if}
      {#each brought(s) as line, i (i)}<span class="description" data-brings>{line}</span>{/each}
      {#if s.ofProject}<span class="description">{t('chooser-of-project')}</span>{/if}
    </button>
    {#if chosen && template && template.id === s.id && (source || (s.group === 'own' && !s.ofProject))}
      <div class="about">
        {#if source}
          {@const from = source}
          <p class="selectable" data-source>
            <button
              type="button"
              class="link"
              onclick={() =>
                openPath(from.url).catch((e) => notifyError(t('common-link-open-failed'), e))}
              >{t('about-layout-source', { name: from.name })}
              <ExternalLink size={11} /></button
            >
          </p>
          <p class="read">
            {#if from.checked}{t('format-source-read', { date: from.checked })}{/if}
            {confidenceWords(from.confidence)}
          </p>
        {/if}
        {#if s.group === 'own' && !s.ofProject}
          <div class="actions">
            <Button size="sm" data-edit-type onclick={() => edit(s.id)}>{t('chooser-edit')}</Button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<style>
  .chooser {
    display: flex;
    flex-direction: column;
  }
  .top {
    padding: 0 0 6px;
  }
  .templates {
    padding: 4px 0 12px;
  }
  .from {
    margin: 8px 0 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .search-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .search {
    flex: 1;
    min-width: 0;
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
  .chooser .search input {
    flex: 1;
    min-width: 0;
    height: auto;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }
  h4 {
    margin: 16px 0 4px 10px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  .alone {
    margin-top: 8px;
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
  .about .read {
    color: var(--ink-3);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
  }
  .step {
    margin-top: 18px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .step summary {
    padding: 6px 10px;
    border-radius: var(--radius-s);
    font-weight: 500;
    color: var(--ink-2);
    cursor: pointer;
  }
  .step summary:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .hint {
    margin: 4px 10px 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.45;
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
  .error {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
</style>
