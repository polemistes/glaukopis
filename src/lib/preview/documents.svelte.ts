/** Reference styles, document formats and templates, as the interface holds them. */

import {
  formatsGet,
  formatsList,
  stylesList,
  toolsInfo,
  type DocumentFormat,
  type DocumentRequest,
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
import { t } from '$lib/i18n';
import { buildDocument } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
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
  #formats = new Map<string, DocumentFormat>();
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
   * element says, or the writer's usual; the style and the format its
   * element says, else what the template brings, else the writer's usual.
   * The template is read if it has not been, and the choice made again
   * when it arrives.
   */
  choice(document: { template?: string; style?: string; format?: string }): Choice {
    const template = document.template || settings.value.defaultTemplate || PLAIN_TEMPLATE;
    const brings = this.templateCached(template);
    return {
      template,
      style: document.style || brings?.style || settings.value.defaultStyle,
      format: document.format || brings?.layout || settings.value.defaultFormat,
    };
  }
}

export const documents = new Documents();

/**
 * The document of an element whole, with the template, the style and the
 * format it uses, for what is made of all of it: an export, the sample
 * pages of a format. The key is that of the project, by which the core
 * knows one making from another.
 */
export async function documentRequest(
  project: Project,
  projectId: string,
  at: string,
): Promise<DocumentRequest> {
  const choice = documents.choice(project.documentOf(at).settings);
  const template = await documents.templateOf(choice.template);
  // The choice again, with the template read: it may bring the style or the format.
  const chosen = documents.choice(project.documentOf(at).settings);
  const format = await documents.format(chosen.format);
  return {
    document: buildDocument(project, at),
    style: chosen.style,
    format: $state.snapshot(format) as DocumentFormat,
    template: $state.snapshot(template) as Template,
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
