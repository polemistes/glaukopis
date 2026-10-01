/** Reference styles and document formats, as the interface holds them. */

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
import { t } from '$lib/i18n';
import { buildDocument } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import { settings } from '$lib/state/settings.svelte';
import { notifyError } from '$lib/ui/toast.svelte';

class Documents {
  styles = $state.raw<StyleSummary[]>([]);
  formats = $state.raw<FormatSummary[]>([]);
  tools = $state.raw<ToolsInfo | null>(null);
  loaded = $state(false);
  /** Rises when a format has been changed: what was made of it is made anew. */
  changed = $state(0);
  #formats = new Map<string, DocumentFormat>();
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
      this.loaded = true;
    } catch (error) {
      notifyError(t('preview-reading-failed'), error);
    } finally {
      this.#loading = null;
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

  /** The style and format a map uses: its own, or those of the settings. */
  choice(document: { style?: string; format?: string }): { style: string; format: string } {
    return {
      style: document.style || settings.value.defaultStyle,
      format: document.format || settings.value.defaultFormat,
    };
  }
}

export const documents = new Documents();

/**
 * The document of a map whole, with the style and the format the map
 * uses, for what is made of all of it: an export, the sample pages of a
 * format. The key is that of the project, by which the core knows one
 * making from another.
 */
export async function documentRequest(
  project: Project,
  projectId: string,
  mapId: string,
): Promise<DocumentRequest> {
  const choice = documents.choice(project.map(mapId)?.document ?? {});
  const format = await documents.format(choice.format);
  return {
    document: buildDocument(project, mapId),
    style: choice.style,
    format: $state.snapshot(format) as DocumentFormat,
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
