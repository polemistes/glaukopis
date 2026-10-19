/**
 * What a document contains, as a part of Look reads and changes it (ADR
 * 0054): the template as the document uses it, and the document's own
 * changes over it, each written as a step of undo, and taken away where it
 * comes back to what the elements over it leave. Shared by *What the
 * document contains* and the front page, which begins with the switch of
 * the title page (ADR 0056): one switch, wherever it stands.
 */

import type { GeneratedPart, Template } from '$lib/api/templates';
import {
  compositionPaths,
  hasPart,
  withCompositionPath,
  withoutCompositionPath,
  type CompositionChanges,
  type CompositionPath,
} from '$lib/document/composition';
import { t } from '$lib/i18n';
import { documents, templateName, templateUsedCached } from '$lib/preview/documents.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import type { Provenance } from '$lib/ui/settings/rows';

export class Composition {
  readonly #project: () => Project;
  readonly #at: () => string;

  /** Of the project and the element as they are given now: both may change under a part of Look. */
  constructor(project: () => Project, at: () => string) {
    this.#project = project;
    this.#at = at;
  }

  /** The project the element is of. */
  get project(): Project {
    return this.#project();
  }

  /** The element whose document it is. */
  get at(): string {
    return this.#at();
  }

  /** What the element sets of its own. */
  readonly own = $derived.by<CompositionChanges | undefined>(
    () => this.project.node(this.at)?.document.composition,
  );
  /** What the document sets with what the elements over it set, and which element sets each path. */
  readonly composition = $derived.by(() => this.project.compositionOf(this.at));
  /** What the document is, by the name the writer is shown. */
  readonly named = $derived.by(() =>
    templateName(
      this.project,
      documents.choice(this.project.documentOf(this.at).settings, this.project).template,
    ),
  );
  /** The template as the document uses it: what the rows show. Nothing until it has been read. */
  readonly used = $derived.by<Template | undefined>(() =>
    templateUsedCached(this.project, this.at),
  );
  /** The changes of the elements over this one: what its own are laid over. */
  readonly above = $derived.by<CompositionChanges>(() => {
    const way = this.project.pathTo(this.at);
    return way.length > 1 ? this.project.compositionOf(way[way.length - 2]).changes : {};
  });
  /** The template as the elements over this one leave it: what a change here is told from. */
  readonly given = $derived.by<Template | undefined>(() =>
    templateUsedCached(this.project, this.at, this.above),
  );

  /** Whether the document as used has a part the core makes. */
  has(part: GeneratedPart): boolean {
    return !!this.used && hasPart(this.used, part);
  }

  /** Writes changes of an element's own, as one step of undo; nothing where they are as they were. */
  write(element: string, next: CompositionChanges) {
    const before = this.project.node(element)?.document.composition;
    if (!this.project.node(element) || JSON.stringify(next) === JSON.stringify(before ?? {}))
      return;
    this.project.checkpoint();
    this.project.setDocument(element, {
      composition: compositionPaths(next).length ? next : undefined,
    });
    this.project.checkpoint();
  }

  /** Sets a value of the element's own; where it is what the elements above leave, takes the change away instead. */
  set(path: CompositionPath, value: unknown, left: unknown) {
    this.write(
      this.at,
      value === left
        ? withoutCompositionPath(this.own, path)
        : withCompositionPath(this.own, path, value),
    );
  }

  /** Turns a part the core makes on or off for this document. */
  setPart(part: GeneratedPart, on: boolean) {
    this.set(`parts.${part}`, on, this.given ? hasPart(this.given, part) : undefined);
  }

  /** Takes the template's value again: the change at a path goes from the element that makes it. */
  takeAgain(who: string, path: CompositionPath) {
    this.write(who, withoutCompositionPath(this.project.node(who)?.document.composition, path));
  }

  /** Where the value at a path comes from: nothing where it is the template's. */
  from(path: CompositionPath): Provenance | null {
    const who = this.composition.from.get(path);
    if (!who) return null;
    const name = this.project.node(who)?.title || t('project-untitled');
    return {
      words: who === this.at ? t('look-changed-here') : t('look-changed-in', { name }),
      again: {
        label: t('look-take-again', { layout: this.named }),
        take: () => this.takeAgain(who, path),
      },
    };
  }
}
