/** Reference styles and document formats, as the interface holds them. */

import {
  formatsGet,
  formatsList,
  stylesList,
  toolsInfo,
  type DocumentFormat,
  type FormatSummary,
  type StyleSummary,
  type ToolsInfo,
} from '$lib/api/documents';
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
      notifyError('The styles and formats could not be read', error);
    } finally {
      this.#loading = null;
    }
  }

  async lookAgain() {
    try {
      this.tools = await toolsInfo(true);
    } catch (error) {
      notifyError('The programs could not be looked for', error);
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

export const kindWords: Record<string, string> = {
  note: 'Notes',
  'author-date': 'Author and date',
  numeric: 'Numbers',
  label: 'Labels',
  author: 'Author',
  '': '',
};

export const formatKindWords: Record<string, string> = {
  own: 'Your own',
  general: 'General',
  'style-guide': 'Style guides',
  publisher: 'Publishers',
  journal: 'Journals',
};
