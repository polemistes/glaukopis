<script lang="ts">
  /**
   * What the document contains, a section of Look (ADR 0054): the parts the
   * core makes itself, each with a switch; the kinds of elements the
   * template gives a place of their own, each with where it is printed, the
   * elements under this one that fill it, and a way to make one; and what
   * is required. Only the body of the section: its heading and its place
   * are Look's.
   *
   * What is changed here belongs to the document, as a change to its look
   * does: it is written as the element's own changes over the template
   * (`DocumentSettings.composition`), which the elements under it inherit,
   * each a step of undo of its own. A value set back to what the elements
   * above leave is taken away instead, so that a change taken back leaves
   * nothing; and every row that something other than the template sets says
   * where, and offers the template's value again.
   */
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Plus from '@lucide/svelte/icons/plus';
  import type { GeneratedPart } from '$lib/api/templates';
  import {
    ALWAYS_MADE,
    compositionPaths,
    hasPart,
    LIMITS,
    withCompositionPath,
    withoutCompositionPath,
    type CompositionChanges,
    type CompositionPath,
    type Limit,
  } from '$lib/document/composition';
  import { GENERATED_PARTS, generatedPartWords, partGroupWords } from '$lib/document/templates';
  import { t } from '$lib/i18n';
  import { documents, templateName, templateUsedCached } from '$lib/preview/documents.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { partOf, placeWords, type PartSpec as PartKind } from '$lib/project/parts';
  import Button from '$lib/ui/Button.svelte';
  import type { Provenance } from '$lib/ui/settings/rows';

  interface Props {
    project: Project;
    /** The element whose document it is. */
    at: string;
    /** Shows an element in the text: one that fills a place of its own, from its line here. */
    ongo: (element: string) => void;
  }

  let { project, at, ongo }: Props = $props();

  $effect(() => {
    documents.load();
  });

  /** What the element sets of its own. */
  const own = $derived<CompositionChanges | undefined>(project.node(at)?.document.composition);
  /** What the document sets with what the elements over it set, and which element sets each path. */
  const composition = $derived(project.compositionOf(at));
  const choice = $derived(documents.choice(project.documentOf(at).settings, project));
  /** What the document is, by the name the writer is shown. */
  const named = $derived(templateName(project, choice.template));
  /** The template as the document uses it: what the rows show. Nothing until it has been read. */
  const used = $derived(templateUsedCached(project, at));
  /** The changes of the elements over this one: what its own are laid over. */
  const above = $derived.by<CompositionChanges>(() => {
    const way = project.pathTo(at);
    return way.length > 1 ? project.compositionOf(way[way.length - 2]).changes : {};
  });
  /** The template as the elements over this one leave it: what a change here is told from. */
  const given = $derived(templateUsedCached(project, at, above));

  /** The name of an element, as a row says a change was made in it. */
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  /** Writes changes of an element's own, as one step of undo; nothing where they are as they were. */
  function write(element: string, next: CompositionChanges) {
    const before = project.node(element)?.document.composition;
    if (!project.node(element) || JSON.stringify(next) === JSON.stringify(before ?? {})) return;
    project.checkpoint();
    project.setDocument(element, {
      composition: compositionPaths(next).length ? next : undefined,
    });
    project.checkpoint();
  }

  /** Sets a value of the element's own; where it is what the elements above leave, takes the change away instead. */
  function set(path: CompositionPath, value: unknown, left: unknown) {
    write(
      at,
      value === left ? withoutCompositionPath(own, path) : withCompositionPath(own, path, value),
    );
  }

  /** Takes the template's value again: the change at a path goes from the element that makes it. */
  function takeAgain(who: string, path: CompositionPath) {
    write(who, withoutCompositionPath(project.node(who)?.document.composition, path));
  }

  /** Where the value at a path comes from: nothing where it is the template's. */
  function from(path: CompositionPath): Provenance | null {
    const who = composition.from.get(path);
    if (!who) return null;
    return {
      words: who === at ? t('look-changed-here') : t('look-changed-in', { name: nameOf(who) }),
      again: { label: t('look-take-again', { layout: named }), take: () => takeAgain(who, path) },
    };
  }

  // ---- the parts the core makes ----

  /** What is said under a part: when those always made are printed, and that keywords need some. */
  const partHints: Partial<Record<GeneratedPart, () => string>> = {
    keywords: () => t('look-contents-part-keywords'),
    body: () => t('look-contents-part-body'),
    notes: () => t('look-contents-part-notes'),
    bibliography: () => t('look-contents-part-bibliography'),
  };

  function setPart(part: GeneratedPart, on: boolean) {
    set(`parts.${part}`, on, given ? hasPart(given, part) : undefined);
  }

  // ---- the kinds of elements with a place of their own ----

  /** The kinds the template gives the document a place for: those of its contents in order, then the rest it puts in hand. */
  const partKinds = $derived.by(() => {
    if (!used) return [] as PartKind[];
    const ids: string[] = [];
    for (const item of used.contents)
      if ('kind' in item && !ids.includes(item.kind)) ids.push(item.kind);
    for (const id of used.kinds) if (!ids.includes(id)) ids.push(id);
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

  // ---- what is required ----

  const limitWords: Record<Limit, () => string> = {
    words: () => t('look-contents-limit-words'),
    abstractWords: () => t('look-contents-limit-abstract-words'),
    keywords: () => t('look-contents-limit-keywords'),
  };
  /** How far a limit goes, and by what step, as the template editor has them. */
  const limitRange: Record<Limit, { max: number; step: number }> = {
    words: { max: 1000000, step: 500 },
    abstractWords: { max: 5000, step: 10 },
    keywords: { max: 50, step: 1 },
  };

  /** Sets a limit from its field: empty or nought for none; what cannot be a limit is not written, and the field shows what is. */
  function setLimit(limit: Limit, field: HTMLInputElement) {
    const typed = field.value.trim();
    const count = typed === '' ? 0 : Number(typed);
    if (!Number.isFinite(count) || count < 0) {
      field.value = String(used?.requirements[limit] ?? '');
      return;
    }
    set(`requirements.${limit}`, Math.round(count) || null, given?.requirements[limit] ?? null);
  }

  function setAnonymous(on: boolean) {
    set('requirements.anonymous', on, given?.requirements.anonymous ?? false);
  }
</script>

{#snippet fromLine(path: CompositionPath)}
  {@const said = from(path)}
  {#if said}
    <p class="from" data-from>
      {said.words}{#if said.again}{' · '}<button
          type="button"
          class="again"
          onclick={said.again.take}>{said.again.label}</button
        >{/if}
    </p>
  {/if}
{/snippet}

{#if used}
  {@const u = used}
  <h4>{t('look-contents-parts')}</h4>
  <p class="hint top">{t('look-contents-parts-hint', { template: named })}</p>
  {#each GENERATED_PARTS as part (part)}
    {@const always = ALWAYS_MADE.includes(part)}
    {@const hint = partHints[part]?.()}
    <label class="row check" class:always>
      <span class="what"
        >{generatedPartWords(part)}{#if hint}<small>{hint}</small>{/if}</span
      >
      <input
        type="checkbox"
        data-part-switch={part}
        checked={always || hasPart(u, part)}
        disabled={always}
        onchange={(e) => setPart(part, e.currentTarget.checked)}
      />
    </label>
    {@render fromLine(`parts.${part}`)}
  {/each}

  <h4>{t('look-contents-kinds')}</h4>
  {#if partKinds.length}
    <p class="hint top">{t('look-contents-kinds-hint', { template: named })}</p>
  {/if}
  {#each partKinds as kind (kind.id)}
    {@const elements = partsOf.get(kind.id) ?? []}
    <div class="place" data-kind={kind.id}>
      <div class="place-head">
        <strong>{kind.label()}</strong>
        <span class="where">{placeWords(kind.place, true) ?? partGroupWords(kind.group)}</span>
        <Button size="sm" data-make={kind.id} onclick={() => makePart(kind)}>
          {#snippet icon()}<Plus size={13} />{/snippet}
          {t('look-contents-kinds-make')}
        </Button>
      </div>
      {#each elements as element, i (element)}
        <button type="button" class="element" data-element={element} onclick={() => ongo(element)}>
          <span class="truncate">{nameOf(element)}</span>
          {#if kind.one && i > 0}
            <span class="doubled">{t('look-contents-kinds-doubled')}</span>
          {/if}
          <ArrowRight size={13} />
        </button>
      {:else}
        <p class="none">{t('look-contents-kinds-missing')}</p>
      {/each}
    </div>
  {:else}
    <p class="hint top">{t('look-contents-kinds-none', { template: named })}</p>
  {/each}

  <h4>{t('look-contents-requirements')}</h4>
  <p class="hint top">{t('look-contents-requirements-hint', { template: named })}</p>
  {#each LIMITS as limit (limit)}
    {@const count = u.requirements[limit]}
    <label class="row">
      <span class="what">{limitWords[limit]()}</span>
      <span class="with-unit">
        <input
          class="short"
          type="number"
          min="0"
          max={limitRange[limit].max}
          step={limitRange[limit].step}
          data-requirement={limit}
          value={count ?? ''}
          onchange={(e) => setLimit(limit, e.currentTarget)}
        />
        <em>{count ? '' : t('template-no-limit')}</em>
      </span>
    </label>
    {@render fromLine(`requirements.${limit}`)}
  {/each}
  <label class="row check">
    <span class="what"
      >{t('template-requirement-anonymous')}<small>{t('template-requirement-anonymous-hint')}</small
      ></span
    >
    <input
      type="checkbox"
      data-requirement="anonymous"
      checked={u.requirements.anonymous}
      onchange={(e) => setAnonymous(e.currentTarget.checked)}
    />
  </label>
  {@render fromLine('requirements.anonymous')}
  {#if u.requirements.note.trim()}
    <p class="hint note">
      {t('look-contents-requirements-note', { note: u.requirements.note.trim() })}
    </p>
  {/if}
{/if}

<style>
  /* A part the core always makes: shown, and not turned. */
  .row.always {
    cursor: default;
  }

  /* Each kind with a place of its own, with the elements that fill it. */
  .place {
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .place-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    min-height: 30px;
  }
  .place-head strong {
    font-weight: 600;
  }
  .place-head .where {
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
</style>
