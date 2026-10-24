/** Reference styles, document formats and templates, as the interface holds them. */

import {
  formatsGet,
  formatsList,
  stylesList,
  toolsInfo,
  type DocumentFormat,
  type DocumentRequest,
  type ElementLook,
  type FormatSummary,
  type StyleSummary,
  type ToolsInfo,
} from '$lib/api/documents';
import {
  templatesGet,
  templatesList,
  type Template,
  type TemplateSummary,
} from '$lib/api/templates';
import { composed, type CompositionChanges } from '$lib/document/composition';
import { has, t } from '$lib/i18n';
import { laidOver, pathsOf } from '$lib/look/changes';
import { buildDocument } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import { defaultSettings } from '$lib/api/system';
import { settings } from '$lib/state/settings.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { SvelteMap } from 'svelte/reactivity';

/** The template every document has when none is chosen: title page, body, notes, bibliography. */
export const PLAIN_TEMPLATE = 'plain';

/** What a document uses, by the settings of its element and the writer's usual (ADR 0038). */
export interface Choice {
  /** The id of the template. */
  template: string;
  /** The id of the reference style. */
  style: string;
  /** The id of the format: the layout. */
  format: string;
}

class Documents {
  styles = $state.raw<StyleSummary[]>([]);
  formats = $state.raw<FormatSummary[]>([]);
  templates = $state.raw<TemplateSummary[]>([]);
  tools = $state.raw<ToolsInfo | null>(null);
  loaded = $state(false);
  /** Rises when a format or a template has been changed: what was made of it is made anew. */
  changed = $state(0);
  #formats = new SvelteMap<string, DocumentFormat>();
  /**
   * The templates that have been read, by their ids; null for one that
   * could not be. Reactive, so that what chose by a template not yet read
   * chooses again when it arrives.
   */
  #templates = new SvelteMap<string, Template | null>();
  #reading = new Map<string, Promise<Template>>();
  #loading: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    this.#loading ??= this.reload();
    return this.#loading;
  }

  async reload() {
    try {
      const [styles, formats, tools] = await Promise.all([
        stylesList(),
        formatsList(),
        toolsInfo(),
      ]);
      this.styles = styles;
      this.formats = formats;
      this.tools = tools;
      this.#formats.clear();
      this.#templates.clear();
      this.loaded = true;
    } catch (error) {
      notifyError(t('preview-reading-failed'), error);
    } finally {
      this.#loading = null;
    }
    // The templates apart: a document is made without them where they cannot be read.
    try {
      this.templates = await templatesList();
    } catch (error) {
      notifyError(t('preview-reading-failed'), error);
    }
  }

  async lookAgain() {
    try {
      this.tools = await toolsInfo(true);
    } catch (error) {
      notifyError(t('preview-looking-failed'), error);
    }
  }

  style(id: string | undefined): StyleSummary | undefined {
    return this.styles.find((s) => s.id === id);
  }

  formatSummary(id: string | undefined): FormatSummary | undefined {
    return this.formats.find((f) => f.id === id);
  }

  async format(id: string): Promise<DocumentFormat> {
    const known = this.#formats.get(id);
    if (known) return known;
    const format = await formatsGet(id);
    this.#formats.set(id, format);
    return format;
  }

  forgetFormat(id: string) {
    this.changed++;
    this.#formats.delete(id);
  }

  /**
   * A format as read already, reactive; one not read yet is asked for, and
   * what derives from this is made again when it arrives. Nothing until then.
   */
  formatCached(id: string): DocumentFormat | undefined {
    const known = this.#formats.get(id);
    if (known === undefined) queueMicrotask(() => this.format(id).catch(() => {}));
    return known;
  }

  /**
   * The layout of an element's document as it is to be used (ADR 0042): the
   * layout chosen, with the document's changes laid over it, and whether the
   * lines of the page are numbered where the document says so.
   */
  async formatFor(project: Project, at: string): Promise<DocumentFormat> {
    const { settings } = project.documentOf(at);
    const layout = $state.snapshot(
      await this.format(this.choice(settings, project).format),
    ) as DocumentFormat;
    return this.#laid(layout, project, at, settings.lineNumbers);
  }

  /** The same, as read already: reactive in the changes; nothing until the layout has arrived. */
  formatForCached(project: Project, at: string): DocumentFormat | undefined {
    const { settings } = project.documentOf(at);
    const layout = this.formatCached(this.choice(settings, project).format);
    if (!layout) return undefined;
    const key = `${layout.id}\n${this.changed}\n${settings.lineNumbers}\n${JSON.stringify(project.lookOf(at).changes)}`;
    const kept = this.#laidOut.get(key);
    if (kept && kept.layout === layout) return kept.format;
    const format = this.#laid(
      $state.snapshot(layout) as DocumentFormat,
      project,
      at,
      settings.lineNumbers,
    );
    if (this.#laidOut.size > 32) this.#laidOut.clear();
    this.#laidOut.set(key, { layout, format });
    return format;
  }

  /** What `formatForCached` has made, by what it was made of, so that the same is the same object. */
  #laidOut = new Map<string, { layout: DocumentFormat; format: DocumentFormat }>();

  #laid(layout: DocumentFormat, project: Project, at: string, lineNumbers: boolean | undefined) {
    const format = laidOver(layout, project.lookOf(at).changes);
    if (lineNumbers !== undefined) format.lineNumbers = lineNumbers;
    return format;
  }

  templateSummary(id: string | undefined): TemplateSummary | undefined {
    return this.templates.find((f) => f.id === id);
  }

  /** A template whole, read once and kept. */
  templateOf(id: string): Promise<Template> {
    const known = this.#templates.get(id);
    if (known) return Promise.resolve(known);
    let reading = this.#reading.get(id);
    if (!reading) {
      reading = templatesGet(id).then(
        (template) => {
          this.#templates.set(id, template);
          this.#reading.delete(id);
          return template;
        },
        (error) => {
          this.#templates.set(id, null);
          this.#reading.delete(id);
          throw error;
        },
      );
      this.#reading.set(id, reading);
    }
    return reading;
  }

  /**
   * A template as it has been read, for what cannot wait; it is asked for
   * when it has not been, and what asked is told when it arrives, where it
   * asked within an effect or a derivation. Nothing until then, or where it
   * could not be read.
   */
  templateCached(id: string): Template | undefined {
    const known = this.#templates.get(id);
    if (known === undefined) queueMicrotask(() => this.templateOf(id).catch(() => {}));
    return known ?? undefined;
  }

  forgetTemplate(id: string) {
    this.changed++;
    this.#templates.delete(id);
  }

  /**
   * The template, style and format a document uses: the template its
   * element says, or the writer's usual; the format its element says, else
   * what the template brings, else the writer's usual; the style its
   * element says, else what the template brings, else what the layout
   * brings (a publisher's layout goes with its style), else the writer's
   * usual. The template and the layout are read if they have not been, and
   * the choice made again when they arrive; where the application lacks
   * the template, the project's copy says what it brings. Where the
   * settings say none for a usual, a new document is of the plain type,
   * and the layout and the style are those of a fresh installation.
   */
  choice(
    document: { template?: string; style?: string; format?: string },
    project?: Project | null,
  ): Choice {
    const template = document.template || settings.value.defaultTemplate || PLAIN_TEMPLATE;
    const brings = this.templateCached(template) ?? project?.templateCopy(template);
    const format = document.format || brings?.layout || this.usualFormat();
    const layoutBrings = this.formatCached(format)?.style;
    return {
      template,
      style:
        document.style ||
        brings?.style ||
        (layoutBrings && this.style(layoutBrings) ? layoutBrings : '') ||
        settings.value.defaultStyle ||
        defaultSettings.defaultStyle,
      format,
    };
  }

  /** The layout of a document whose type brings none: the writer's usual, or a fresh installation's where the settings say none. */
  usualFormat(): string {
    return settings.value.defaultFormat || defaultSettings.defaultFormat;
  }

  /** Whether the writer has chosen a usual layout or style in the settings, rather than none. */
  chosenUsual(which: 'format' | 'style'): boolean {
    return !!(which === 'format' ? settings.value.defaultFormat : settings.value.defaultStyle);
  }
}

export const documents = new Documents();

/**
 * A template whole, for a document of a project: the application's, or
 * the project's copy where the application lacks it (ADR 0038). The
 * application's is the newer where both have it: the project's copy is
 * made from it. Without a copy, the application's or its error.
 */
export async function templateFor(
  project: Project | null | undefined,
  id: string,
): Promise<Template> {
  const copy = project?.templateCopy(id);
  if (!copy) return documents.templateOf(id);
  await documents.load();
  if (!documents.templateSummary(id)) return copy;
  return documents.templateOf(id).catch(() => copy);
}

/**
 * The template of an element's document as it is to be used (ADR 0054): the
 * template, with the document's changes laid over it, those of the elements
 * over it and its own (`Project.compositionOf`). What the preview, every
 * export and the checklist are made with; the core knows nothing of changes.
 */
export async function templateUsed(project: Project, at: string): Promise<Template> {
  const { settings } = project.documentOf(at);
  const template = await templateFor(project, documents.choice(settings, project).template);
  return composed(template, project.compositionOf(at).changes);
}

/**
 * The same, as read already: reactive in the changes; nothing until the
 * template has arrived. The template is the application's, or the
 * project's copy where the application lacks it, as `templateFor` has it.
 * With `changes`, those are laid over the template in place of the
 * document's: what an element has without a change of its own, for one.
 * The same changes over the same template give the same object.
 */
export function templateUsedCached(
  project: Project,
  at: string,
  changes?: CompositionChanges,
): Template | undefined {
  const id = documents.choice(project.documentOf(at).settings, project).template;
  const copy = project.templateCopy(id);
  const template =
    copy && !documents.templateSummary(id) ? copy : (documents.templateCached(id) ?? copy);
  if (!template) return undefined;
  const over = changes ?? project.compositionOf(at).changes;
  const key = `${id}\n${JSON.stringify(over)}`;
  const kept = madeUsed.get(key);
  if (kept && kept.template === template) return kept.used;
  const used = composed(template, over);
  if (madeUsed.size > 32) madeUsed.clear();
  madeUsed.set(key, { template, used });
  return used;
}

/** What `templateUsedCached` has made, by what it was made of, so that the same is the same object. */
const madeUsed = new Map<string, { template: Template; used: Template }>();

/**
 * The name of a template, for a document of a project: for one that comes
 * with the application, in the words of the interface where they name it
 * (`template-called-<id>`: the kinds of text, not the journals, publishers
 * and style guides, whose names are their own); else as the application
 * lists it, else as the project's copy has it, else its id.
 */
export function templateName(project: Project | null | undefined, id: string): string {
  const summary = documents.templateSummary(id);
  if (summary) return calledName(summary);
  return project?.templateCopy(id)?.name || id;
}

/** The name of a template as listed: in the words of the interface where they name one that comes with the application, else its own. */
export function calledName(summary: { id: string; name: string; own?: boolean }): string {
  return !summary.own && has(`template-called-${summary.id}`)
    ? t(`template-called-${summary.id}`)
    : summary.name || summary.id;
}

/**
 * The document of an element whole, with the template, the style and the
 * format it uses, for what is made of all of it: an export, the sample
 * pages of a format. The key is that of the project, by which the core
 * knows one making from another.
 */
/**
 * The looks of the elements under `at` that have changes, a layout or line
 * numbers of their own (ADR 0059): what holds for each one's stretch of the
 * document. Each is the layout as that element uses it, with the changes of
 * the elements over it too.
 */
export async function looksWithin(project: Project, at: string): Promise<ElementLook[]> {
  const out: ElementLook[] = [];
  for (const id of project.tree(at).sequence) {
    if (id === at) continue;
    const own = project.nodes.get(id)?.document;
    if (!own) continue;
    if (!pathsOf(own.look).length && !own.format && own.lineNumbers === undefined) continue;
    out.push({ element: id, format: await documents.formatFor(project, id) });
  }
  return out;
}

export async function documentRequest(
  project: Project,
  projectId: string,
  at: string,
): Promise<DocumentRequest> {
  const { settings } = project.documentOf(at);
  // As it is to be used, with the document's changes: a copy of its own, made of plain data.
  const template = await templateUsed(project, at);
  // The choice again, with the template read: it may bring the style or the format.
  const choice = documents.choice(settings, project);
  const format = await documents.formatFor(project, at);
  const looks = await looksWithin(project, at);
  return {
    document: { ...buildDocument(project, at), ...(looks.length ? { looks } : {}) },
    style: choice.style,
    format,
    template,
    output: 'document',
    key: projectId,
  };
}

const styleKinds: Record<string, () => string> = {
  note: () => t('style-kind-note'),
  'author-date': () => t('style-kind-author-date'),
  numeric: () => t('style-kind-numeric'),
  label: () => t('style-kind-label'),
  author: () => t('style-kind-author'),
  '': () => '',
};

/** A kind of reference style in words, in the language of the interface; nothing for one not known. */
export const kindWords = (kind: string): string | undefined => styleKinds[kind]?.();

const formatKinds: Record<string, () => string> = {
  own: () => t('format-kind-own'),
  general: () => t('format-kind-general'),
  'style-guide': () => t('format-kind-style-guide'),
  publisher: () => t('format-kind-publisher'),
  journal: () => t('format-kind-journal'),
  fiction: () => t('format-kind-fiction'),
  stage: () => t('format-kind-stage'),
  poetry: () => t('format-kind-poetry'),
};

/** A kind of document format in words, in the language of the interface. */
export const formatKindWords = (kind: string): string | undefined => formatKinds[kind]?.();
