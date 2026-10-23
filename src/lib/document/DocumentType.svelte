<!--
  The type of a document, a tab of Document properties: what you are
  writing, the template of its element. The plain document first, alone, as
  what every document is until something else is chosen; then the kinds of
  text in their groups; then, as a second step, the templates of journals,
  publishers and style guides, narrowed to those made for the kind of text in
  use. The search finds every one. Choosing writes at once, as a step of
  undo of its own.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Search from '@lucide/svelte/icons/search';
  import { openPath } from '$lib/api/documents';
  import type { Template, TemplateGroup } from '$lib/api/templates';
  import { t } from '$lib/i18n';
  import { layoutName, styleName } from '$lib/look/choosing.svelte';
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
  import { notifyError } from '$lib/ui/toast.svelte';
  import { templateEditorUi } from './template-editor.svelte';
  import { confidenceWords, templateGroupWords } from './templates';

  interface Props {
    project: Project;
    /** The element whose document is chosen for: it and what is under it. */
    at: string;
    /** Closes Document properties: a template chosen by a double click is done with. */
    onclose: () => void;
  }

  let { project, at, onclose }: Props = $props();

  /** The kinds of text, in the order they are offered. */
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

  /** The template in use, whole: for where it comes from and what it brings. */
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

  /** The layout the template in use brings, as read: for the reference style it brings in turn. */
  const broughtFormat = $derived(
    template?.layout ? documents.formatCached(template.layout) : undefined,
  );
  /**
   * What the template in use brings, in a line: how its pages are set and,
   * where it or its layout names one, how it cites. A template that names
   * no style says nothing of citing: the usual style is there for a
   * document that cites, and needs no word for one that does not.
   */
  const brings = $derived.by(() => {
    if (!template) return '';
    const layout = template.layout
      ? layoutName(template.layout)
      : t('chooser-usual-pages', { name: layoutName(settings.value.defaultFormat) });
    const style = template.style || broughtFormat?.style;
    return style && documents.style(style)
      ? t('chooser-brings', { layout, style: styleName(style) })
      : t('chooser-brings-layout', { layout });
  });

  // ---- what is offered ----

  /** A template as the chooser lists it: as the application lists it, or the project's copy that the application lacks. */
  interface Listed {
    id: string;
    name: string;
    description: string;
    group: TemplateGroup;
    basedOn?: string;
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
        ofProject: true,
      })),
  );
  const all = $derived<Listed[]>([...documents.templates, ...ofProject]);

  let query = $state('');
  const q = $derived(query.trim().toLocaleLowerCase());
  const nameOfTemplate = (s: Listed) => templateName(project, s.id) || s.name;
  /** Whether a template is found by what is searched for: by its name, its description or its group. */
  function fits(s: Listed): boolean {
    if (!q) return true;
    return `${nameOfTemplate(s)}\n${s.name}\n${s.description}\n${templateGroupWords(s.group)}`
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

  /** The kind of text the second step is narrowed to: the one in use, where it is one; nothing for all. */
  const narrowedTo = $derived(inUse && KINDS.includes(inUse.group) ? inUse.id : null);
  const submissions = $derived(all.filter((s) => SUBMISSION.includes(s.group)));
  /** Those made for the kind of text in use; while something is searched for, every one that is found. */
  const offered = $derived.by(() => {
    if (q) return submissions.filter(fits);
    if (!narrowedTo) return submissions;
    const made = submissions.filter((s) => reaches(s.id, narrowedTo));
    // Where none is made for it, every one is offered.
    return made.length ? made : submissions;
  });
  const narrowed = $derived(!q && !!narrowedTo && offered.length < submissions.length);
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
      // Chosen but not kept: the writer is told, since a shared project and a
      // file of it would fall back to the usual template without a word.
      .catch((error) => notifyError(t('template-keep-failed'), error));
  }

  /** Opens the template editor on the template in use: as one of the writer's own made from it, or, for one that is theirs, to change it. */
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
</script>

<div class="chooser">
  <div class="top">
    <div class="search">
      <Search size={14} />
      <input
        bind:value={query}
        placeholder={t('chooser-search-placeholder')}
        aria-label={t('chooser-search')}
        spellcheck="false"
      />
    </div>
    {#if own.template}
      {@const setter = over()}
      <p class="from">
        <button type="button" class="link" onclick={() => write({ template: undefined })}>
          {setter
            ? t('chooser-again', { name: nameOf(setter) })
            : t('chooser-usual-again', { name: templateName(project, usual) })}
        </button>
      </p>
    {:else if templateFrom}
      <p class="from" data-from>
        {t('chooser-from', {
          name: templateFrom,
          template: templateName(project, choice.template),
        })}
      </p>
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
        <p class="hint">
          {narrowed && narrowedTo
            ? t('chooser-submission-narrowed', { name: templateName(project, narrowedTo) })
            : t('chooser-submission-all')}
        </p>
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

  <div class="actions own">
    <Button size="sm" onclick={() => editTemplate(true)}>{t('chooser-own-from')}</Button>
  </div>
</div>

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
      {#if s.description}<span class="description">{s.description}</span>{/if}
      {#if s.ofProject}<span class="description">{t('chooser-of-project')}</span>{/if}
    </button>
    {#if chosen && template && template.id === s.id}
      <div class="about">
        {#if brings}<p class="brings" data-brings>{brings}</p>{/if}
        {#if template.source?.name}
          {@const source = template.source}
          <p class="selectable">
            <span class="overline">{t('format-source')}</span>
            {source.name}
            {#if source.url}
              <button
                type="button"
                class="link"
                onclick={() =>
                  openPath(source.url).catch((e) => notifyError(t('common-link-open-failed'), e))}
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
        {#if s.group === 'own' && !s.ofProject}
          <div class="actions">
            <Button size="sm" onclick={() => editTemplate(false)}>{t('chooser-change-own')}</Button>
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
  .about .overline {
    display: block;
    margin-top: 6px;
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
  .own {
    margin: 12px 0 0;
  }
</style>
