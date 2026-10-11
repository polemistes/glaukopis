/**
 * TO BE DELETED AT THE MERGE. Stand-ins for what the model of ADR 0038
 * brings, so that the window and the editors could be built before it was
 * there: the templates in the store of documents (`documents.svelte.ts`),
 * the catalogue of the kinds of elements that make a document
 * (`project/parts.ts`), the checklist (`document/checklist.ts`), the usual
 * template in the settings, and a kind of the catalogue given to an
 * element. Every import from here is then taken from where the real thing
 * lives, under the same name.
 */

import { SvelteMap } from 'svelte/reactivity';
import type { DocumentFormat } from '$lib/api/documents';
import {
  templatesGet,
  templatesList,
  type PartGroup,
  type PartPlace,
  type Template,
  type TemplateSummary,
} from '$lib/api/templates';
import { documents as real } from '$lib/preview/documents.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import { settings } from '$lib/state/settings.svelte';

// ---- the usual template, in the settings ----

export function defaultTemplate(): string {
  return (settings.value as { defaultTemplate?: string }).defaultTemplate || 'plain';
}

export function setDefaultTemplate(id: string) {
  (settings.set as (key: string, value: unknown) => void)('defaultTemplate', id);
}

// ---- the templates, in the store of documents ----

/** The root of every template, as the core has it; given where the core has no templates yet. */
export const PLAIN: Template = {
  id: 'plain',
  name: 'Plain document',
  group: 'plain',
  description: 'A title page, the text, its notes and its bibliography.',
  contents: [{ part: 'title-page' }, { part: 'body' }, { part: 'notes' }, { part: 'bibliography' }],
  kinds: [],
  passageKinds: [],
  requirements: { words: null, abstractWords: null, keywords: null, anonymous: false, note: '' },
  outputs: [
    {
      id: 'document',
      targets: ['pdf', 'pdf-latex', 'docx', 'odt', 'latex', 'typst', 'markdown', 'html', 'epub'],
    },
  ],
};

const summaryOf = (t: Template): TemplateSummary => ({
  id: t.id,
  name: t.name,
  group: t.group,
  description: t.description,
  own: t.group === 'own',
  confidence: t.source?.confidence ?? '',
  checked: t.source?.checked ?? '',
});

const summaries = new SvelteMap<string, TemplateSummary>();
const whole = new SvelteMap<string, Template>();
const loading = new Map<string, Promise<Template>>();

async function loadTemplates() {
  let list: TemplateSummary[];
  try {
    list = await templatesList();
  } catch {
    list = [summaryOf(PLAIN)];
  }
  summaries.clear();
  for (const s of list) summaries.set(s.id, s);
}

interface WithTemplates {
  templates: TemplateSummary[];
  template(id: string): Promise<Template>;
  templateSummary(id: string | undefined): TemplateSummary | undefined;
  forgetTemplate(id: string): void;
  choice(document: { template?: string; style?: string; format?: string }): {
    template: string;
    style: string;
    format: string;
  };
}

const reload = real.reload.bind(real);
Object.defineProperties(real, {
  reload: { value: () => Promise.all([reload(), loadTemplates()]).then(() => {}) },
  templates: { get: () => [...summaries.values()] },
  template: {
    value: (id: string): Promise<Template> => {
      const known = whole.get(id);
      if (known) return Promise.resolve(known);
      let p = loading.get(id);
      if (!p) {
        p = templatesGet(id)
          .catch(() => ({ ...PLAIN, id, name: summaries.get(id)?.name ?? PLAIN.name }))
          .then((t) => {
            whole.set(id, t);
            loading.delete(id);
            return t;
          });
        loading.set(id, p);
      }
      return p;
    },
  },
  templateSummary: { value: (id: string | undefined) => (id ? summaries.get(id) : undefined) },
  forgetTemplate: {
    value: (id: string) => {
      whole.delete(id);
      real.changed++;
    },
  },
  choice: {
    value: (document: { template?: string; style?: string; format?: string }) => {
      const template = document.template || defaultTemplate();
      const t = whole.get(template);
      if (!t && !loading.has(template))
        void (real as typeof real & WithTemplates).template(template);
      return {
        template,
        style: document.style || t?.style || settings.value.defaultStyle,
        format: document.format || t?.layout || settings.value.defaultFormat,
      };
    },
  },
});

/** The store, with the templates: `choice` is the new one, which names the template too. */
export const documents = real as unknown as Omit<typeof real, 'choice'> & WithTemplates;

// ---- the catalogue of the kinds of elements that make a document ----

export interface PartKind {
  id: string;
  group: PartGroup;
  basedOn: string | null;
  place: PartPlace;
  /** Whether a document has one of it, or many. */
  one: boolean;
  label(): string;
}

const part = (
  id: string,
  group: PartGroup,
  basedOn: string | null,
  place: PartPlace,
  one: boolean,
  words: string,
): PartKind => ({ id, group, basedOn, place, one, label: () => words });

export const PART_CATALOGUE: PartKind[] = [
  part('front-section', 'front', null, 'front', false, 'Front section'),
  part('own-page', 'front', null, 'front', false, 'Page of its own'),
  part('abstract', 'front', 'front-section', 'front', true, 'Abstract'),
  part('dedication', 'front', 'own-page', 'front', false, 'Dedication'),
  part('epigraph', 'front', 'own-page', 'front', false, 'Epigraph'),
  part('copyright', 'front', 'own-page', 'front', true, 'Copyright'),
  part('foreword', 'front', 'front-section', 'front', false, 'Foreword'),
  part('preface', 'front', 'front-section', 'front', false, 'Preface'),
  part('cast', 'front', 'front-section', 'front', false, 'Cast'),
  part('setting', 'front', 'front-section', 'front', false, 'Setting'),
  part('standfirst', 'front', 'front-section', 'front', true, 'Standfirst'),
  part('back-section', 'back', null, 'back', false, 'Back section'),
  part('acknowledgements', 'back', 'back-section', 'back', false, 'Acknowledgements'),
  part('appendix', 'back', 'back-section', 'back', false, 'Appendix'),
  part('afterword', 'back', 'back-section', 'back', false, 'Afterword'),
  part('glossary', 'back', 'back-section', 'back', false, 'Glossary'),
  part('about-the-author', 'back', 'back-section', 'back', true, 'About the author'),
  part('signature', 'back', 'back-section', 'back', true, 'Signature'),
  part('cover', 'cover', null, 'cover', true, 'Cover'),
  part('blurb', 'cover', 'cover', 'cover', true, 'Blurb'),
];

export function isCatalogueKind(id: string | null | undefined): boolean {
  return !!id && PART_CATALOGUE.some((k) => k.id === id);
}

/** What a kind is in the document: a kind of the catalogue, or a kind of the project based on one; nothing otherwise. */
export function partOf(project: Project, kindId: string | null | undefined): PartKind | undefined {
  if (!kindId) return undefined;
  const own = PART_CATALOGUE.find((k) => k.id === kindId);
  if (own) return own;
  const record = project.kind(kindId) as { basedOn?: string } | undefined;
  return record?.basedOn ? PART_CATALOGUE.find((k) => k.id === record.basedOn) : undefined;
}

/** Gives an element a kind of the catalogue, which `setKind` does not yet take. */
export function setKindOf(project: Project, id: string, kind: string) {
  project.setKind([id], kind);
  if (project.node(id)?.kind === kind) return;
  project.transact(() => project.yNodes.get(id)?.set('kind', kind));
}

// ---- the checklist ----

export interface Remark {
  kind: string;
  text: string;
  elements?: string[];
}

export function checklist(
  project: Project,
  at: string,
  template: Template,
  _format: DocumentFormat | null,
): Remark[] {
  const out: Remark[] = [];
  const settings = project.documentOf(at).settings;
  const keywords = settings.keywords?.length ?? 0;
  const most = template.requirements.keywords;
  if (most && keywords > most)
    out.push({ kind: 'keywords', text: `${keywords} keywords, where ${most} are allowed.` });
  const children = project.tree().children.get(at) ?? [];
  for (const kind of PART_CATALOGUE.filter((k) => k.one)) {
    const of = children.filter((c) => partOf(project, project.node(c)?.kind)?.id === kind.id);
    if (of.length > 1)
      out.push({
        kind: 'doubled',
        text: `There are ${of.length} of the kind ${kind.label()}; the first is used.`,
        elements: of,
      });
  }
  return out;
}
