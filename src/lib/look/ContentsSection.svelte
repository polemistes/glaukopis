<script lang="ts">
  /**
   * The parts of a document, a section of Look (ADR 0118): what the document
   * type suggests, in its usual order, each with the elements of that kind
   * the document has, which go to them, and a way to add one. Nothing is
   * turned on here and nothing is placed: a part is an element, printed
   * where it stands in the tree, and what Glaukopis makes itself, a title
   * page, a table of contents, a bibliography, is there where an element of
   * its kind is. Then what the type requires. Only the body of the section:
   * its heading and its place are Look's.
   *
   * What is required is changed for the document, as a change to its look
   * is: written as the element's own changes over the type
   * (`DocumentSettings.composition`), which the elements under it inherit,
   * each a step of undo of its own.
   */
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Plus from '@lucide/svelte/icons/plus';
  import {
    LIMITS,
    suggestedParts,
    type CompositionPath,
    type Limit,
  } from '$lib/document/composition';
  import { documentWord, t } from '$lib/i18n';
  import { documents } from '$lib/preview/documents.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { PARTS, partOf, placeWords, type PartSpec as PartKind } from '$lib/project/parts';
  import Button from '$lib/ui/Button.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import type { Provenance } from '$lib/ui/settings/rows';
  import { Composition } from './composition.svelte';

  interface Props {
    project: Project;
    /** The element whose document it is. */
    at: string;
    /** Shows an element in the text: one of a kind, from its line here. */
    ongo: (element: string) => void;
  }

  let { project, at, ongo }: Props = $props();

  $effect(() => {
    documents.load();
  });

  // What the document requires, read and changed over what its type requires.
  const c = new Composition(
    () => project,
    () => at,
  );
  const used = $derived(c.used);
  const set = (path: CompositionPath, value: unknown, left: unknown) => c.set(path, value, left);
  const from = (path: CompositionPath): Provenance | null => c.from(path);
  const given = $derived(c.given);
  /** The name of an element. */
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  // ---- the parts ----

  /** The elements directly under this one, of each kind: by the kind itself, or a kind of the project based on it. */
  const partsOf = $derived.by(() => {
    const children = project.tree().children.get(at) ?? [];
    const out = new Map<string, string[]>();
    for (const child of children) {
      const node = project.node(child);
      const kind = partOf(project, node?.kind)?.id;
      if (kind && !node?.excluded) out.set(kind, [...(out.get(kind) ?? []), child]);
    }
    return out;
  });
  /**
   * The kinds listed: what the type suggests, in its usual order, and after
   * them those the document has that the type does not name, so that every
   * part there is stands in the list.
   */
  const listed = $derived.by<PartKind[]>(() => {
    if (!used) return [];
    const ids = suggestedParts(used);
    for (const kind of partsOf.keys()) if (!ids.includes(kind)) ids.push(kind);
    return ids.flatMap((id) => {
      const kind = partOf(project, id);
      return kind ? [kind] : [];
    });
  });
  /** The kinds of the catalogue that are not listed: offered under Another part. */
  const others = $derived(PARTS.filter((k) => !listed.some((l) => l.id === k.id)));

  /**
   * What an element of a kind is first named. Where its name is printed over
   * what Glaukopis makes, the word the document would have had there, in
   * the language of the document; else the name of the kind.
   */
  function firstName(kind: PartKind): string {
    const language = project.documentOf(at).settings.language;
    const layout = documents.formatForCached(project, at);
    if (kind.id === 'contents') return documentWord(language, 'Contents');
    if (kind.id === 'bibliography' && layout?.bibliography.title.trim())
      return documentWord(language, layout.bibliography.title.trim());
    if (kind.id === 'list-of-figures' && layout?.figures.endTitle.trim())
      return documentWord(language, layout.figures.endTitle.trim());
    if (kind.id === 'list-of-tables' && layout?.tables.endTitle.trim())
      return documentWord(language, layout.tables.endTitle.trim());
    return kind.label();
  }

  /**
   * Adds an element of a kind under this one, last among its children: it
   * is printed where it stands, and it is the writer who moves it.
   */
  function addPart(kind: PartKind) {
    project.checkpoint();
    const id = project.addChild(at, { title: firstName(kind) });
    if (id) project.setKind([id], kind.id);
    project.checkpoint();
  }

  function addAnother(event: MouseEvent) {
    const items: MenuItem[] = others.map((kind) => ({
      label: kind.label(),
      action: () => addPart(kind),
    }));
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
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

  /**
   * Sets a limit from its field: a whole number, empty or nought for none.
   * What cannot be a limit is not written, and the field shows what is; what
   * is written, the field shows as it is written.
   */
  function setLimit(limit: Limit, field: HTMLInputElement) {
    const typed = field.value.trim();
    const count = typed === '' ? 0 : Number(typed);
    if (!Number.isFinite(count) || count < 0) {
      field.value = String(used?.requirements[limit] ?? '');
      return;
    }
    const most = Math.round(count) || null;
    field.value = most === null ? '' : String(most);
    set(`requirements.${limit}`, most, given?.requirements[limit] ?? null);
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
  {#each listed as kind (kind.id)}
    {@const elements = partsOf.get(kind.id) ?? []}
    {@const where =
      kind.place === 'cover' || kind.place === 'none' ? placeWords(kind.place, true) : null}
    <div class="place" data-kind={kind.id}>
      <div class="place-head">
        <strong>{kind.label()}</strong>
        <span class="where">{where ?? ''}</span>
        {#if !kind.one || !elements.length}
          <Button size="sm" data-make={kind.id} onclick={() => addPart(kind)}>
            {#snippet icon()}<Plus size={13} />{/snippet}
            {t('look-parts-add')}
          </Button>
        {/if}
      </div>
      {#each elements as element, i (element)}
        <button type="button" class="element" data-element={element} onclick={() => ongo(element)}>
          <span class="truncate">{nameOf(element)}</span>
          {#if kind.one && i > 0}
            <span class="doubled">{t('look-contents-kinds-doubled')}</span>
          {/if}
          <ArrowRight size={13} />
        </button>
      {/each}
    </div>
  {/each}
  {#if others.length}
    <div class="another">
      <Button size="sm" data-make-another onclick={addAnother}>
        {#snippet icon()}<Plus size={13} />{/snippet}
        {t('look-parts-another')}
      </Button>
    </div>
  {/if}

  <h4>{t('look-type-requirements')}</h4>
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
    <span class="what">{t('template-requirement-anonymity')}</span>
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
  /* Each kind the type suggests, with the elements of it the document has. */
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
  .another {
    padding: 10px 0 2px;
  }
</style>
