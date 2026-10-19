<script lang="ts">
  /**
   * The look of a document, in one place (ADR 0042): everything that
   * decides how its pages look, in the order a writer reaches for it, with
   * the template, the layout and the reference style that make it in one
   * line at the top. What is changed here is kept as the document's own
   * changes over its layout, never in the layout: every row that is
   * changed says where, and offers the layout's value again. A layout of
   * the writer's own is made on purpose, from the changes.
   *
   * The rows set a copy of the layout as the document uses it; a moment
   * after each change, what differs from what the elements above give is
   * written as the element's changes, each a step of undo of its own.
   */
  import { tick, untrack, type Snippet } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import {
    fontsList,
    formatKindLooks,
    formatsDelete,
    formatsSave,
    openPath,
    type DocumentFormat,
    type HeadingLevel,
    type KindFamily,
    type KindLooks,
    type OwnKind,
  } from '$lib/api/documents';
  import type { Template } from '$lib/api/templates';
  import { templateChooserUi } from '$lib/document/chooser.svelte';
  import { CATALOGUE, GROUPS, specOf } from '$lib/editor/kinds';
  import { languages, t } from '$lib/i18n';
  import { documents, templateFor, templateName } from '$lib/preview/documents.svelte';
  import StyleBrowser from '$lib/preview/StyleBrowser.svelte';
  import StyleEditor from '$lib/preview/StyleEditor.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { DocumentSettings, PassageKindRecord } from '$lib/project/model/types';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Settings from '$lib/ui/settings/Settings.svelte';
  import { rowsOf, type Choices, type Provenance, type Row } from '$lib/ui/settings/rows';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import {
    changesBetween,
    countOf,
    laidOver,
    pathsOf,
    withoutPath,
    type LookChanges,
    type LookPath,
  } from './changes';
  import { formatGroups, layoutName, styleGroups, styleName } from './choosing.svelte';
  import { LOOK_SECTIONS, lookUi, type LookSection } from './look.svelte';
  import { lengthsOk, lookRows, lookWords, resolvedWords, setKindLook } from './rows.svelte';

  interface Props {
    project: Project;
    /** The element whose document's look is set. */
    at: string;
    /** The kinds of paragraph and of words of the writer's own. */
    passageKinds: PassageKindRecord[];
    /** Whether the preview is open beside the panel. */
    previewing: boolean;
    /** Opens the preview. */
    onpreview: () => void;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
  }

  let { project, at, passageKinds, previewing, onpreview, onclose, head }: Props = $props();

  // ---- what the document uses ----

  const node = $derived(project.node(at));
  /** What the element says of its own. */
  const own = $derived<DocumentSettings>(node?.document ?? {});
  /** What is said of the element with what it inherits, and which element says each thing. */
  const inherited = $derived(project.documentOf(at));
  const choice = $derived(documents.choice(inherited.settings, project));
  /** The layout as it comes, before the changes. */
  const layout = $derived(documents.formatCached(choice.format));
  /** The changes of the document, with the element that makes each. */
  const changes = $derived(project.lookOf(at));
  const changed = $derived(countOf(changes.changes));
  const nameOfLayout = $derived(layoutName(choice.format) || layout?.name || choice.format);
  const ownLayout = $derived(layout?.kind === 'own');

  $effect(() => {
    documents.load();
  });

  /** The name of an element, as the rows say a change was made in it. */
  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');

  /** The changes of the elements over this one: what its own are laid over. */
  function changesAbove(): LookChanges {
    const way = project.pathTo(at);
    return way.length > 1 ? project.lookOf(way[way.length - 2]).changes : {};
  }

  /** Whether the lines of the page are numbered, where the elements over this one say. */
  function lineNumbersAbove(): boolean | undefined {
    const way = project.pathTo(at);
    return way.length > 1
      ? project.documentOf(way[way.length - 2]).settings.lineNumbers
      : undefined;
  }

  /** The layout as the document uses it: what the rows show, made anew from what is written. */
  const wanted = $derived.by<DocumentFormat | null>(() => {
    if (!layout) return null;
    const f = laidOver($state.snapshot(layout) as DocumentFormat, changes.changes);
    f.lineNumbers = inherited.settings.lineNumbers ?? layout.lineNumbers;
    return f;
  });

  /** JSON with the keys in order, so that the same is said the same way. */
  function stable(value: unknown): string {
    return JSON.stringify(value, (_, v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
        : v,
    );
  }

  /** What the rows set. */
  let effective = $state<DocumentFormat | null>(null);
  /** The rows as last laid from what is written, to tell a change of the writer's from one that came. */
  let laid = '';
  /** A change of the writer's, about to be written. */
  let pending: ReturnType<typeof setTimeout> | undefined;

  // What is written comes into the rows: from another element, by undo, by
  // another writer. Not while a change of the writer's is on its way: it
  // will be written, and come back as it was made.
  $effect(() => {
    const w = wanted;
    if (!w) return;
    const json = stable(w);
    untrack(() => {
      if (pending) return;
      laid = json;
      if (effective && stable($state.snapshot(effective)) === json) return;
      effective = w;
    });
  });

  // What the writer changes is written a moment after.
  $effect(() => {
    if (!effective) return;
    const json = stable($state.snapshot(effective));
    if (json === untrack(() => laid)) return;
    clearTimeout(pending);
    pending = setTimeout(write, 250);
  });

  $effect(() => () => {
    if (pending) write();
  });

  /**
   * Writes what the rows say otherwise than the layout with the changes of
   * the elements above: the element's own changes, one step of undo.
   */
  function write() {
    clearTimeout(pending);
    pending = undefined;
    if (!effective || !layout || !project.node(at)) return;
    const now = $state.snapshot(effective) as DocumentFormat;
    const base = laidOver($state.snapshot(layout) as DocumentFormat, changesAbove());
    const mine = changesBetween(base, now);
    const patch: Partial<DocumentSettings> = {};
    if (stable(mine) !== stable(own.look ?? {})) patch.look = countOf(mine) ? mine : undefined;
    const numbered = lineNumbersAbove() ?? layout.lineNumbers;
    const lineNumbers = now.lineNumbers === numbered ? undefined : now.lineNumbers;
    if (lineNumbers !== own.lineNumbers) patch.lineNumbers = lineNumbers;
    if (Object.keys(patch).length) {
      project.checkpoint();
      project.setDocument(at, patch);
      project.checkpoint();
    }
    // What is written may say it otherwise than the rows: they take it.
    const w = wanted;
    if (!w) return;
    laid = stable(w);
    if (stable($state.snapshot(effective)) !== laid) effective = w;
  }

  /** Writes a setting of the document itself, as its own step of undo. */
  function setOwn(patch: Partial<DocumentSettings>) {
    if (pending) write();
    project.checkpoint();
    project.setDocument(at, patch);
    project.checkpoint();
  }

  /** Takes the layout's value again: the change at a path goes from the element that makes it. */
  function takeAgain(who: string, path: LookPath) {
    if (pending) write();
    project.checkpoint();
    if (path === 'lineNumbers') project.setDocument(who, { lineNumbers: undefined });
    else {
      const look = project.node(who)?.document.look;
      const left = withoutPath(look, path);
      project.setDocument(who, { look: countOf(left) ? left : undefined });
    }
    project.checkpoint();
  }

  /** Where the value at a path comes from: nothing where it is the layout's. */
  function from(path: string): Provenance | null {
    const who = path === 'lineNumbers' ? inherited.from.get('lineNumbers') : changes.from.get(path);
    if (!who) return null;
    return {
      words: who === at ? t('look-changed-here') : t('look-changed-in', { name: nameOf(who) }),
      again: {
        label: t('look-take-again', { layout: nameOfLayout }),
        take: () => takeAgain(who, path),
      },
    };
  }

  // ---- the template, the layout, the style ----

  /** The template in use, whole: for what it brings. */
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
          // The panel goes on without what the template brings; the log says why.
          console.error(`the template ${id} could not be read for the Look panel`, error);
          if (id === choice.template) template = null;
        }),
    );
  });

  /** The element over this one that a setting is taken from, by name; nothing where it is this one's. */
  function fromAbove(key: keyof DocumentSettings): string | null {
    const who = inherited.from.get(key);
    if (!who || who === at) return null;
    return nameOf(who);
  }
  const usualLayout = $derived(layoutName(documents.choice({}).format));
  const usualStyle = $derived(styleName(documents.choice({}).style));
  const broughtLayout = $derived(
    template?.layout
      ? layoutName(template.layout)
      : t('document-window-usual', { name: usualLayout }),
  );
  const broughtStyle = $derived(
    template?.style
      ? styleName(template.style)
      : layout?.style
        ? styleName(layout.style)
        : t('document-window-usual', { name: usualStyle }),
  );
  const formatFrom = $derived(own.format ? null : fromAbove('format'));
  const styleFrom = $derived(own.style ? null : fromAbove('style'));

  let browsing = $state(false);
  let editingStyle = $state<string | null>(null);
  /** Whether the list of what is changed is open, under the line at the top. */
  let listing = $state(false);

  // ---- keeping the changes as a layout ----

  let keeping = $state(false);
  let keptName = $state('');
  let saving = $state(false);
  let error = $state<string | null>(null);

  /**
   * The elements whose changes go into a layout made of them, and the one
   * the layout is set on: the highest that makes a change, or this one.
   */
  function makers(): { on: string; clear: string[] } {
    const way = project.pathTo(at);
    const first = way.findIndex((id) => countOf(project.node(id)?.document.look) > 0);
    const from = first < 0 ? way.length - 1 : first;
    return { on: way[from], clear: way.slice(from) };
  }

  /** Makes a layout of the layout with the changes, and sets it where the changes were. */
  async function keep(name: string | null) {
    if (!effective || !layout || saving) return;
    if (pending) write();
    saving = true;
    error = null;
    try {
      const made = $state.snapshot(effective) as DocumentFormat;
      made.lineNumbers = layout.lineNumbers;
      const saved = await formatsSave(
        name === null
          ? made
          : { ...made, id: '', name: name.trim(), basedOn: layout.id, kind: 'own' },
      );
      documents.forgetFormat(saved.id);
      await documents.reload();
      const { on, clear } = makers();
      project.checkpoint();
      project.transact(() => {
        for (const id of clear) {
          const patch: Partial<DocumentSettings> = { look: undefined };
          if (id === on || project.node(id)?.document.format) patch.format = saved.id;
          project.setDocument(id, patch);
        }
      });
      project.checkpoint();
      notifyOk(t('format-saved', { name: saved.name }));
      keeping = false;
      keptName = '';
    } catch (e) {
      error = describeError(e) ?? t('format-save-failed');
    } finally {
      saving = false;
    }
  }

  async function removeLayout() {
    if (!layout || !ownLayout) return;
    const ok = await confirm({
      title: t('format-delete-title', { name: layout.name }),
      message: t('format-delete-message'),
      confirm: t('format-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      const gone = layout;
      await formatsDelete(gone.id);
      documents.forgetFormat(gone.id);
      await documents.reload();
      const who = inherited.from.get('format') ?? at;
      // Back to the layout it was made from; one made from nothing gives the
      // element nothing of its own, so it takes the writer's usual again.
      setOwnAt(who, { format: gone.basedOn });
    } catch (e) {
      error = describeError(e) ?? t('format-delete-failed');
    }
  }

  function setOwnAt(who: string, patch: Partial<DocumentSettings>) {
    project.checkpoint();
    project.setDocument(who, patch);
    project.checkpoint();
  }

  /** Writes a new description of a layout of the writer's own, as it is left. */
  async function describe(words: string) {
    if (!layout || !ownLayout || words === layout.description) return;
    try {
      const saved = await formatsSave({
        ...($state.snapshot(layout) as DocumentFormat),
        description: words,
      });
      documents.forgetFormat(saved.id);
    } catch (e) {
      error = describeError(e) ?? t('format-save-failed');
    }
  }

  // ---- the parts, and finding a setting ----

  let section = $state<LookSection>('type');
  let kindInView = $state<string | undefined>(undefined);
  let form = $state<HTMLDivElement>();
  let query = $state('');
  const searching = $derived(query.trim().length > 0);

  // Asked for at a part, or at a kind: the kind is opened and brought into view.
  $effect(() => {
    void lookUi.asked;
    const asked = untrack(() => lookUi.request);
    untrack(() => {
      if (asked.section) section = asked.section;
      if (asked.kind) {
        section = 'kinds';
        query = '';
      }
      kindInView = asked.kind;
    });
  });
  $effect(() => {
    const wanted = kindInView;
    const f = form;
    if (!effective || !wanted || !f || !/^[\w-]+$/.test(wanted)) return;
    untrack(() => {
      if (section !== 'kinds') return;
      void tick().then(() => {
        const d = f.querySelector<HTMLDetailsElement>(`details[data-kind="${wanted}"]`);
        if (!d) return;
        d.open = true;
        d.scrollIntoView({ block: 'start' });
      });
    });
  });

  const sectionWords = $derived<Record<LookSection, string>>({
    type: t('look-section-type'),
    page: t('look-section-page'),
    paragraphs: t('look-section-paragraphs'),
    headings: t('look-section-headings'),
    kinds: t('look-section-kinds'),
    quotations: t('look-section-quotations'),
    numbers: t('look-section-numbers'),
    notes: t('look-section-notes'),
    bibliography: t('look-section-bibliography'),
    figures: t('look-section-figures'),
    title: t('look-section-title'),
    about: t('look-section-about'),
  });

  // ---- the rows ----

  let fonts = $state.raw<string[]>([]);
  $effect(() => {
    fontsList()
      .then((list) => (fonts = list))
      // The usual fonts are still offered; the log says why the others are not.
      .catch((error) => console.error('the fonts of this computer could not be listed', error));
  });
  const usual = [
    'Times New Roman',
    'Arial',
    'Calibri',
    'Garamond',
    'Georgia',
    'Palatino',
    'Libertinus Serif',
    'Gentium Plus',
    'New Athena Unicode',
  ];
  const fontChoices = $derived([...new Set([...usual, ...fonts])]);

  const aligns: Choices = $derived([
    ['left', t('format-align-left')],
    ['center', t('format-align-center')],
    ['right', t('format-align-right')],
  ]);
  const cases: Choices = $derived([
    ['none', t('format-case-none')],
    ['upper', t('format-case-upper')],
    ['smallcaps', t('format-case-smallcaps')],
  ]);
  const spacings: Choices = $derived([
    [1, t('format-spacing-single')],
    [1.15, (1.15).toLocaleString(languages.current)],
    [1.5, t('format-spacing-one-and-a-half')],
    [2, t('format-spacing-double')],
  ]);
  /** Line spacing, where nought is that of the text. */
  const spacingsOrText: Choices = $derived([[0, t('format-as-the-text')], ...spacings]);
  const stands: Choices = $derived([
    ['left', t('format-stands-left')],
    ['center', t('format-stands-center')],
    ['right', t('format-stands-right')],
  ]);

  // What stands between the number of a figure and its caption: the usual
  // ones are chosen by name, anything else is written out.
  type Between = 'stop' | 'colon' | 'line' | 'other';
  const usualBetween: [Between, string][] = [
    ['stop', '. '],
    ['colon', ': '],
    ['line', '\n'],
  ];
  // Holds the field open while something is written in it that happens to
  // be one of the usual ones.
  let betweenOther = $state<Record<string, boolean>>({});

  /** What figures and tables are both told: how what is said of them is set, and where they stand. */
  type Captioned = DocumentFormat['figures'] | DocumentFormat['tables'];
  type CaptionedKind = 'figure' | 'table';

  function between(separator: string, kind: CaptionedKind): Between {
    if (betweenOther[kind]) return 'other';
    return usualBetween.find(([, s]) => s === separator)?.[0] ?? 'other';
  }

  function setBetween(c: Captioned, v: Between, kind: CaptionedKind) {
    betweenOther[kind] = v === 'other';
    const found = usualBetween.find(([k]) => k === v);
    if (found) c.separator = found[1];
  }

  /** The separator as the words of it and whether a line break follows them. */
  function setSeparator(c: Captioned, words: string, ownLine: boolean, kind: CaptionedKind) {
    betweenOther[kind] = true;
    c.separator = words.replaceAll('\n', '') + (ownLine ? '\n' : '');
  }

  /** How a figure or a table is called, as it will stand: "Figure 1". */
  function called(c: Captioned): string {
    return c.label.trim() ? `${c.label.trim()} 1` : '1';
  }

  function addLevel() {
    if (!effective || effective.headings.levels.length >= 6) return;
    const last = effective.headings.levels[effective.headings.levels.length - 1];
    effective.headings.levels.push({ ...last, bold: false, italic: true });
  }

  function levelWords(l: HeadingLevel): string {
    return [
      t('format-level-size', { size: l.size }),
      l.bold ? t('format-level-bold') : '',
      l.italic ? t('format-level-italic') : '',
      l.case === 'upper'
        ? t('format-level-capitals')
        : l.case === 'smallcaps'
          ? t('format-level-small-caps')
          : '',
      l.align === 'center'
        ? t('format-level-centred')
        : l.align === 'right'
          ? t('format-level-right')
          : '',
      l.runIn ? t('format-level-run-in') : '',
      l.newPage ? t('format-level-new-page-said') : '',
    ]
      .filter(Boolean)
      .join(', ');
  }

  type F = DocumentFormat;
  const { toggle, text, length, number, choice: chosen } = rowsOf<F>();
  const level = rowsOf<HeadingLevel>();
  const captions = rowsOf<Captioned>();

  const pt = (least = 6, most = 72) => ({ min: least, max: most, unit: 'pt' });
  /** A size where nought is that of the text. */
  const ptOrText = (hint = true) => ({
    max: 36,
    unit: 'pt',
    zero: t('format-as-the-text-zero'),
    hint: hint ? t('format-size-zero-hint') : undefined,
  });
  /** A count where nought is none. */
  const counted = (most: number, step: number, zero: string, hint?: string) => ({
    max: most,
    step,
    zero,
    hint,
    nullable: true,
  });
  const custom = (f: F) => f.page.size === 'custom';
  const indented = (f: F) => f.text.paragraphs === 'indent';
  const named = (f: F) => !f.title.anonymous;
  const withAbstract = (f: F) => f.title.showAbstract;
  const numbered = (f: F) => f.pageNumbers.show;
  const headed = (f: F) => f.runningHead.content !== 'none';

  const typeRows: Row<F>[] = $derived([
    number(t('format-size'), 'font.size', pt(6, 36)),
    chosen(t('format-line-spacing'), 'text.lineSpacing', spacings),
    chosen(t('format-alignment'), 'text.align', [
      ['left', t('format-align-ragged')],
      ['justified', t('format-align-justified')],
    ]),
    toggle(t('format-hyphenate'), 'text.hyphenate'),
    chosen(t('format-italics'), 'text.italics', [
      ['italic', t('format-italics-italic')],
      ['underline', t('format-italics-underline')],
    ]),
    chosen(
      t('format-refmarks'),
      'text.refmarks',
      [
        ['raised', t('format-refmarks-raised')],
        ['margin', t('format-refmarks-margin')],
      ],
      { hint: t('format-refmarks-hint') },
    ),
  ]);

  const pageRows: Row<F>[] = $derived([
    chosen(t('format-size'), 'page.size', [
      ['a4', 'A4'],
      ['letter', 'US Letter'],
      ['a5', 'A5'],
      ['b5', 'B5'],
      ['legal', 'US Legal'],
      ['custom', t('format-page-custom')],
    ]),
    length(t('format-page-width'), 'page.width', { when: custom }),
    length(t('format-page-height'), 'page.height', { when: custom }),
    { subheading: t('format-margins') },
    length(t('format-margin-top'), 'page.marginTop'),
    length(t('format-margin-bottom'), 'page.marginBottom'),
    length(t('format-margin-left'), 'page.marginLeft'),
    length(t('format-margin-right'), 'page.marginRight'),
    { subheading: t('format-columns-heading') },
    // A layout written before there were columns has none to say: one column, and the gap as the core's default.
    number(
      t('format-columns'),
      {
        get: (f) => f.page.columns ?? 1,
        set: (f, value) => (f.page.columns = Math.max(1, Math.min(4, Math.round(value ?? 1)))),
      },
      { min: 1, max: 4, step: 1, hint: t('format-columns-hint'), path: 'page.columns' },
    ),
    length(
      t('format-column-gap'),
      {
        get: (f) => f.page.columnGap ?? '1cm',
        set: (f, value) => (f.page.columnGap = value),
      },
      { when: (f) => (f.page.columns ?? 1) > 1, path: 'page.columnGap' },
    ),
    { subheading: t('format-page-numbers') },
    toggle(t('format-page-numbers-show'), 'pageNumbers.show'),
    chosen(
      t('format-page-numbers-where'),
      'pageNumbers.position',
      [
        ['top-left', t('format-position-top-left')],
        ['top-center', t('format-position-top-center')],
        ['top-right', t('format-position-top-right')],
        ['bottom-left', t('format-position-bottom-left')],
        ['bottom-center', t('format-position-bottom-center')],
        ['bottom-right', t('format-position-bottom-right')],
      ],
      { when: numbered },
    ),
    toggle(t('format-page-numbers-first'), 'pageNumbers.firstPage', { when: numbered }),
    { subheading: t('format-running-head') },
    chosen(t('format-running-head-content'), 'runningHead.content', [
      ['none', t('format-running-head-none')],
      ['title', t('format-running-head-title')],
      ['author', t('format-running-head-author')],
      ['author-title', t('format-running-head-author-title')],
      ['text', t('format-running-head-text')],
    ]),
    text(t('format-running-head-words'), 'runningHead.text', {
      when: (f) => f.runningHead.content === 'text',
    }),
    chosen(t('format-alignment'), 'runningHead.align', aligns, { when: headed }),
    chosen(t('format-letters'), 'runningHead.case', cases.slice(0, 2), { when: headed }),
    { note: t('format-lengths-hint') },
  ]);

  const paragraphRows: Row<F>[] = $derived([
    chosen(t('format-paragraphs'), 'text.paragraphs', [
      ['indent', t('format-paragraphs-indent')],
      ['spaced', t('format-paragraphs-spaced')],
    ]),
    length(t('format-indent'), 'text.indent', { when: indented }),
    toggle(t('format-indent-first'), 'text.indentFirst', {
      hint: t('format-indent-first-hint'),
      when: indented,
    }),
    length(t('format-space-between'), 'text.spaceBetween', { when: (f) => !indented(f) }),
  ]);

  const headingRows: Row<F>[] = $derived([
    toggle(t('format-numbered'), 'headings.numbered', { hint: '1, 1.1, 1.1.1' }),
  ]);

  const levelRows: Row<HeadingLevel>[] = $derived([
    level.number(t('format-size'), 'size', pt()),
    level.toggle(t('format-bold'), 'bold'),
    level.toggle(t('format-italic'), 'italic'),
    level.choice(t('format-letters'), 'case', cases),
    level.choice(t('format-alignment'), 'align', aligns),
    level.toggle(t('format-level-indent'), 'indent'),
    level.toggle(t('format-level-run-in-label'), 'runIn', { hint: t('format-level-run-in-hint') }),
    level.toggle(t('format-level-new-page'), 'newPage', { hint: t('format-level-new-page-hint') }),
    level.length(t('format-space-before'), 'spaceBefore', { when: (l) => !l.runIn }),
    level.length(t('format-space-after'), 'spaceAfter', { when: (l) => !l.runIn }),
  ]);

  const titleRows: Row<F>[] = $derived([
    chosen(t('format-title-placement'), 'title.placement', [
      ['top', t('format-title-top')],
      ['own-page', t('format-title-own-page')],
    ]),
    number(t('format-size'), 'title.size', pt()),
    toggle(t('format-bold'), 'title.bold'),
    toggle(t('format-italic'), 'title.italic'),
    chosen(t('format-letters'), 'title.case', cases),
    chosen(t('format-alignment'), 'title.align', aligns),
    { subheading: t('format-title-shown') },
    toggle(t('format-title-anonymous'), 'title.anonymous', {
      hint: t('format-title-anonymous-hint'),
    }),
    toggle(t('format-title-authors'), 'title.showAuthors', { when: named }),
    toggle(t('format-title-affiliations'), 'title.showAffiliations', { when: named }),
    toggle(t('format-title-date'), 'title.showDate'),
    toggle(t('format-title-abstract'), 'title.showAbstract'),
    text(t('format-title-abstract-label'), 'title.abstractLabel', { when: withAbstract }),
    text(t('format-title-keywords-label'), 'title.keywordsLabel', { when: withAbstract }),
  ]);

  const quotationRows: Row<F>[] = $derived([
    length(t('format-quote-indent-left'), 'quote.indentLeft'),
    length(t('format-quote-indent-right'), 'quote.indentRight'),
    number(t('format-size'), 'quote.size', ptOrText()),
    chosen(t('format-line-spacing'), 'quote.lineSpacing', spacingsOrText),
    toggle(t('format-italic'), 'quote.italic'),
    { subheading: t('format-quote-when') },
    number(
      t('format-quote-from-words'),
      'quote.fromWords',
      counted(500, 1, t('format-not-said'), t('format-quote-from-words-hint')),
    ),
    number(t('format-quote-from-lines'), 'quote.fromLines', counted(50, 1, t('format-not-said'))),
  ]);

  // Numbers belong to what they number (ADR 0041): the lines of a numbered
  // stretch are shown as the layout says where the stretch does not; the
  // lines of the page are the document's to number.
  const numbersRows: Row<F>[] = $derived([
    { note: t('format-numbers-hint') },
    number(t('format-verse-every'), 'verse.every', {
      min: 1,
      max: 1000,
      step: 1,
      hint: t('format-verse-every-hint'),
    }),
    chosen(t('format-verse-side'), 'verse.side', [
      ['left', t('format-side-left')],
      ['right', t('format-side-right')],
    ]),
    { subheading: t('format-numbers-page') },
    toggle(t('format-line-numbers'), 'lineNumbers', { hint: t('format-line-numbers-hint') }),
  ]);

  const noteRows: Row<F>[] = $derived([
    chosen(t('format-notes-kind'), 'notes.kind', [
      ['footnotes', t('format-notes-footnotes')],
      ['endnotes', t('format-notes-endnotes')],
    ]),
    number(t('format-size'), 'notes.size', pt(5, 36)),
    chosen(t('format-line-spacing'), 'notes.lineSpacing', spacings),
    text(t('format-notes-title'), 'notes.title', { when: (f) => f.notes.kind === 'endnotes' }),
  ]);

  const bibliographyRows: Row<F>[] = $derived([
    text(t('format-bibliography-title'), 'bibliography.title', {
      hint: t('format-bibliography-title-hint'),
    }),
    toggle(t('format-bibliography-new-page'), 'bibliography.newPage'),
    length(t('format-bibliography-hanging-indent'), 'bibliography.hangingIndent'),
    chosen(t('format-line-spacing'), 'bibliography.lineSpacing', spacingsOrText),
    length(t('format-bibliography-entry-spacing'), 'bibliography.entrySpacing'),
    number(t('format-size'), 'bibliography.size', ptOrText(false)),
  ]);

  /** How figures or tables are called and told apart from what is said of them. */
  function namingRows(kind: CaptionedKind, c: Captioned | undefined): Row<Captioned>[] {
    const number = c ? called(c) : '1';
    const other = (c: Captioned) => between(c.separator, kind) === 'other';
    const at = kind === 'figure' ? 'figures' : 'tables';
    return [
      captions.text(t('format-captioned-called', { kind }), 'label', {
        hint: t('format-captioned-called-hint', { kind }),
      }),
      captions.text(t('format-captioned-reference'), 'reference', {
        hint: t('format-captioned-reference-hint', { kind }),
      }),
      captions.toggle(t('format-captioned-label-bold'), 'labelBold'),
      captions.toggle(t('format-captioned-label-italic'), 'labelItalic'),
      captions.choice(
        t('format-captioned-between', { kind }),
        {
          get: (c) => between(c.separator, kind),
          set: (c, v) => setBetween(c, v as Between, kind),
        },
        [
          ['stop', t('format-between-stop', { called: number, kind })],
          ['colon', t('format-between-colon', { called: number, kind })],
          ['line', t('format-between-line', { kind })],
          ['other', t('format-between-other')],
        ],
        { path: `${at}.separator` },
      ),
      captions.text(
        t('format-captioned-separator'),
        {
          get: (c) => c.separator.replaceAll('\n', ''),
          set: (c, v) => setSeparator(c, v, c.separator.includes('\n'), kind),
        },
        { hint: t('format-captioned-separator-hint'), when: other },
      ),
      captions.toggle(
        t('format-captioned-own-line', { kind }),
        {
          get: (c) => c.separator.includes('\n'),
          set: (c, v) => setSeparator(c, c.separator, v, kind),
        },
        { when: other },
      ),
      { subheading: t('format-caption', { kind }) },
      captions.choice(t('format-caption-stands', { kind }), 'captionPosition', [
        ['below', t('format-caption-below', { kind })],
        ['above', t('format-caption-above', { kind })],
      ]),
      captions.choice(
        t('format-alignment'),
        'captionAlign',
        [...aligns, ['justified', t('format-align-justified')]],
        { hint: t('format-caption-align-hint', { kind }) },
      ),
      captions.number(t('format-size'), 'captionSize', ptOrText()),
      captions.toggle(t('format-italic'), 'captionItalic'),
      captions.choice(t('format-line-spacing'), 'captionLineSpacing', spacingsOrText),
    ];
  }

  /** Where figures or tables stand. */
  function placingRows(kind: CaptionedKind): Row<Captioned>[] {
    return [
      { subheading: t('format-captioned-where', { kind }) },
      captions.choice(t('format-captioned-stand', { kind }), 'align', stands, {
        hint: t('format-unless-said'),
      }),
      captions.toggle(t('format-captioned-wrap'), 'wrap', {
        hint: t('format-unless-said'),
        when: (c) => c.align !== 'center',
      }),
      captions.choice(
        t('format-captioned-placement'),
        'placement',
        [
          ['in-text', t('format-captioned-in-text')],
          ['at-end', t('format-captioned-at-end')],
        ],
        { hint: t('format-captioned-placement-hint') },
      ),
      captions.text(t('format-captioned-end-title', { kind }), 'endTitle', {
        hint: t('format-captioned-end-title-hint', { kind }),
        when: (c) => c.placement === 'at-end',
      }),
    ];
  }

  const figureNaming = $derived(namingRows('figure', effective?.figures));
  const figurePlacing = $derived(placingRows('figure'));
  const tableNaming = $derived(namingRows('table', effective?.tables));
  const tablePlacing = $derived(placingRows('table'));

  const tableRows: Row<F>[] = $derived([
    { subheading: t('format-table-itself') },
    chosen(
      t('format-table-rules'),
      'tables.rules',
      [
        ['horizontal', t('format-table-rules-horizontal')],
        ['grid', t('format-table-rules-grid')],
        ['none', t('format-table-rules-none')],
      ],
      { hint: t('format-table-rules-hint') },
    ),
    toggle(t('format-table-header-bold'), 'tables.headerBold'),
    number(t('format-size'), 'tables.size', ptOrText()),
    chosen(t('format-line-spacing'), 'tables.lineSpacing', spacingsOrText),
    { heading: t('format-equations') },
    chosen(t('format-equations-stand'), 'equations.align', stands, {
      hint: t('format-unless-said'),
    }),
    text(t('format-equations-before'), 'equations.beforeNumber'),
    text(t('format-equations-after'), 'equations.afterNumber'),
  ]);

  // ---- the kinds of paragraph and of words ----

  /** A kind as the part of the kinds lists it: its name, and what it is based on, by name. */
  interface Listed {
    id: string;
    family: KindFamily;
    label: string;
    /** What it is based on, by name; nothing for text itself. */
    base: string;
  }

  /** The name of a kind, of the catalogue or the writer's own. */
  function kindName(id: string): string {
    return specOf(id)?.label() ?? passageKinds.find((k) => k.id === id)?.name ?? id;
  }

  /** What a kind is based on, by name: text, or plain words, where it says nothing; nothing for text itself. */
  function baseOf(id: string, family: KindFamily, basedOn: string | undefined): string {
    if (id === 'text') return '';
    if (basedOn) return kindName(basedOn);
    return family === 'words' ? t('editor-plain-words') : t('editor-text');
  }

  // The kinds of paragraph this document uses, gathered a moment after the
  // text changes, not at every key.
  let inUse = $state.raw<string[]>([]);
  function gatherKinds() {
    const found = new Set<string>();
    for (const id of project.tree(at).sequence)
      for (const b of project.blocksOf(id)) if (b.kind === 'paragraph') found.add(b.name);
    const list = [...found];
    if (list.join('\n') !== inUse.join('\n')) inUse = list;
  }
  $effect(() => {
    void at;
    untrack(gatherKinds);
    return project.onChange(gatherKinds, 1000);
  });

  /**
   * Every kind, with its look as resolved: those this document uses first,
   * then the catalogue's in their groups, then the writer's own. The layout
   * says of each only what differs; the base look of the kind, and the
   * kinds it is based on, give the rest (ADR 0040).
   */
  const kindGroups = $derived.by<{ id: string; label: string; kinds: Listed[] }[]>(() => {
    const all: Listed[] = [
      ...CATALOGUE.map((k): Listed => ({
        id: k.id,
        family: k.family,
        label: k.label(),
        base: baseOf(k.id, k.family, k.basedOn),
      })),
      ...passageKinds.map((k): Listed => ({
        id: k.id,
        family: k.family,
        label: k.name,
        base: baseOf(k.id, k.family, k.basedOn || undefined),
      })),
    ];
    const used = new Set(inUse.filter((id) => all.some((k) => k.id === id)));
    return [
      {
        id: 'in-use',
        label: t('look-kinds-in-use'),
        kinds: all.filter((k) => used.has(k.id)),
      },
      ...GROUPS.map((g) => ({
        id: g.id,
        label: g.label(),
        kinds: all.filter(
          (k) => g.kinds.includes(k.id) && !used.has(k.id) && CATALOGUE.some((c) => c.id === k.id),
        ),
      })),
      {
        id: 'own',
        label: t('editor-kinds-own'),
        kinds: all.filter((k) => passageKinds.some((p) => p.id === k.id) && !used.has(k.id)),
      },
    ].filter((g) => g.kinds.length);
  });

  // The look of every kind as it will stand, resolved by the core against
  // the base looks, the kinds each is based on and what the layout says;
  // again a moment after each change (ADR 0040).
  let resolved = $state.raw<KindLooks>({});
  /** Why the looks could not be resolved, the last time they were asked for. */
  let resolvedProblem = $state<string | null>(null);
  const ownKinds = $derived<OwnKind[]>(
    passageKinds.map(({ id, name, family, basedOn, look }) => ({
      id,
      name,
      family,
      basedOn,
      look,
    })),
  );
  $effect(() => {
    if (!effective) return;
    const snapshot = JSON.stringify($state.snapshot(effective));
    const kinds = ownKinds;
    const timer = setTimeout(() => {
      formatKindLooks(JSON.parse(snapshot), kinds).then(
        (looks) => {
          resolved = looks;
          resolvedProblem = null;
        },
        (error) => {
          // Not the looks of the layout before: each kind says it could not be worked out.
          console.error('the looks of the kinds could not be resolved', error);
          resolved = {};
          resolvedProblem = describeError(error) ?? String(error);
        },
      );
    }, 150);
    return () => clearTimeout(timer);
  });

  /** The rows of each kind's look, which write into the layout's table of kinds, by the id of the kind. */
  const kindRows = $derived(
    new Map(
      kindGroups
        .flatMap((g) => g.kinds)
        .map((k) => [
          k.id,
          lookRows<F>(
            k.family,
            {
              get: (f) => f.kinds?.[k.id],
              set: (f, key, value) => setKindLook(f, k.id, key, value),
            },
            {
              sign: k.id === 'break',
              resolved: resolved[k.id]?.look,
              path: (key) => `kinds.${k.id}.${key}`,
            },
          ),
        ]),
    ),
  );
  /** Whether every length said of a kind is written with its unit. */
  const kindsOk = $derived(Object.values(effective?.kinds ?? {}).every(lengthsOk));

  /** Whether the layout as used says anything of a kind. */
  const says = (f: F, id: string) => Object.keys(f.kinds?.[id] ?? {}).length > 0;
  /** Whether the document changes anything of a kind. */
  const changesKind = (id: string) =>
    pathsOf(changes.changes).some((p) => p.startsWith(`kinds.${id}.`));

  // ---- finding ----

  /** Whether words of the search are in a row's label or hint. */
  function fits(words: string | undefined): boolean {
    const q = query.trim().toLocaleLowerCase(languages.current);
    return !!words && words.toLocaleLowerCase(languages.current).includes(q);
  }
  /** The rows of a part that the search finds, without its headings and notes. */
  function found<T>(rows: Row<T>[]): Row<T>[] {
    return rows.filter((r) => 'kind' in r && (fits(r.label) || fits(r.hint)));
  }
  /** What the search finds, part by part: rows that set the layout as used. */
  const foundRows = $derived.by(() => {
    if (!searching) return [];
    const parts: [LookSection, Row<F>[]][] = [
      ['type', typeRows],
      ['page', pageRows],
      ['paragraphs', paragraphRows],
      ['headings', headingRows],
      ['quotations', quotationRows],
      ['numbers', numbersRows],
      ['notes', noteRows],
      ['bibliography', bibliographyRows],
      ['figures', tableRows],
      ['title', titleRows],
    ];
    return parts.map(([key, rows]) => ({ key, rows: found(rows) })).filter((p) => p.rows.length);
  });
  const foundFont = $derived(
    searching && (fits(t('format-typeface')) || fits(t('format-typeface-hint'))),
  );
  const foundKinds = $derived(
    searching ? kindGroups.flatMap((g) => g.kinds).filter((k) => fits(k.label)) : [],
  );
  const foundNothing = $derived(searching && !foundRows.length && !foundFont && !foundKinds.length);

  // ---- what is changed, in words ----

  /** A change by the words of its row: "Font", "Quotation: italic". */
  function changeWords(path: string): string {
    if (path === 'font.family') return t('format-typeface');
    const kind = /^kinds\.([\w-]+)\.(\w+)$/.exec(path);
    if (kind) {
      const row = (kindRows.get(kind[1]) ?? []).find((r) => 'path' in r && r.path === path);
      return `${kindName(kind[1])}: ${row && 'label' in row ? row.label : kind[2]}`;
    }
    if (path === 'headings.levels') return t('look-heading-levels');
    for (const rows of [
      typeRows,
      pageRows,
      paragraphRows,
      headingRows,
      quotationRows,
      numbersRows,
      noteRows,
      bibliographyRows,
      tableRows,
      titleRows,
    ] as Row<F>[][]) {
      const row = rows.find((r) => 'kind' in r && (r.path ?? r.at) === path);
      if (row && 'label' in row) return row.label;
    }
    for (const [prefix, rows] of [
      ['figures.', [...figureNaming, ...figurePlacing]],
      ['tables.', [...tableNaming, ...tablePlacing]],
    ] as [string, Row<Captioned>[]][]) {
      if (!path.startsWith(prefix)) continue;
      const row = rows.find((r) => 'kind' in r && (r.path ?? prefix + r.at) === path);
      if (row && 'label' in row)
        return `${prefix === 'figures.' ? t('format-figures') : t('format-tables')}: ${row.label}`;
    }
    return path;
  }
  const changeList = $derived(
    pathsOf(changes.changes).map((path) => ({
      path,
      words: changeWords(path),
      who: changes.from.get(path)!,
    })),
  );
</script>

{#snippet fromLine(path: string)}
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

{#snippet fontRow(f: F)}
  <label class="row">
    <span class="what">{t('format-typeface')}<small>{t('format-typeface-hint')}</small></span>
    <input list="look-fonts" bind:value={f.font.family} />
    <datalist id="look-fonts">
      {#each fontChoices as family (family)}<option value={family}></option>{/each}
    </datalist>
  </label>
  {@render fromLine('font.family')}
{/snippet}

{#snippet kindLook(f: F, k: Listed)}
  {@const said = says(f, k.id)}
  {@const look = resolved[k.id]?.look}
  <details
    open={k.id === kindInView}
    data-kind={k.id}
    data-said={said ? '' : null}
    data-changed={changesKind(k.id) ? '' : null}
  >
    <summary>
      <strong>{k.label}</strong>
      <span class="said" class:quiet={!said}
        >{said ? lookWords(f.kinds?.[k.id], k.family) : t('format-kind-as-base')}</span
      >
    </summary>
    <p class="base">
      {k.base ? t('format-kind-based-on', { base: k.base }) : t('format-kind-text-note')}
    </p>
    {#if look}
      {@const words = resolvedWords(look, k.family)}
      <p class="resolved" data-resolved>
        {words ? t('format-kind-resolved', { look: words }) : t('format-kind-resolved-nothing')}
      </p>
    {:else if resolvedProblem}
      <p class="resolved problem" data-resolved>
        {t('format-kind-resolved-failed', { reason: resolvedProblem })}
      </p>
    {/if}
    <Settings target={f} rows={kindRows.get(k.id) ?? []} {from} />
  </details>
{/snippet}

{#snippet captioned(
  c: Captioned,
  kind: CaptionedKind,
  naming: Row<Captioned>[],
  placing: Row<Captioned>[],
)}
  {@const prefix = kind === 'figure' ? 'figures.' : 'tables.'}
  <Settings target={c} rows={naming} {from} {prefix} />
  <div class="row">
    <span class="what">{t('format-as-it-will-stand')}</span>
    <span class="example"
      ><span class:bold={c.labelBold} class:italic={c.labelItalic}>{called(c)}</span
      >{c.separator}<span class:italic={c.captionItalic}
        >{t('format-caption-example', { kind })}</span
      ></span
    >
  </div>
  <Settings target={c} rows={placing} {from} {prefix} />
  {#if c.placement === 'at-end'}
    <label class="row">
      <span class="what"
        >{t('format-captioned-placeholder')}<small
          >{c.placeholder.includes('{}')
            ? t('format-captioned-placeholder-shown', {
                line: c.placeholder.replace('{}', () => called(c)),
              })
            : t('format-captioned-placeholder-missing')}</small
        ></span
      >
      <input
        class:invalid={!c.placeholder.includes('{}')}
        bind:value={c.placeholder}
        spellcheck="false"
      />
    </label>
    {@render fromLine(`${prefix}placeholder`)}
  {/if}
{/snippet}

<aside class="panel look" aria-label={t('look-title')}>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('look-title')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="through settings" bind:this={form}>
    <!-- What makes the look: the template, the layout with the document's changes, the citations. -->
    <section class="whole" aria-label={t('look-whole')}>
      <p class="map" data-map>
        <button
          type="button"
          class="link"
          title={t('look-template-hint')}
          onclick={() => templateChooserUi.open({ project, at })}
          >{templateName(project, choice.template)}</button
        >
        <span class="arrow" aria-hidden="true">→</span>
        <span class="layout-name">{nameOfLayout}</span>
        {#if changed}
          <button
            type="button"
            class="link changes"
            data-changes={changed}
            aria-expanded={listing}
            onclick={() => (listing = !listing)}>· {t('look-changes', { count: changed })}</button
          >
        {:else}
          <span class="changes none" data-changes="0">· {t('look-no-changes')}</span>
        {/if}
        <span class="arrow" aria-hidden="true">→</span>
        <span class="style-name">{styleName(choice.style)}</span>
      </p>
      {#if listing && changed}
        <ul class="changed">
          {#each changeList as c (c.path)}
            <li>
              <span>{c.words}</span>
              <small
                >{c.who === at
                  ? t('look-changed-here')
                  : t('look-changed-in', { name: nameOf(c.who) })}</small
              >
              <button type="button" class="again" onclick={() => takeAgain(c.who, c.path)}
                >{t('look-take-again', { layout: nameOfLayout })}</button
              >
            </li>
          {/each}
        </ul>
      {/if}

      <div class="row">
        <span class="what">{t('look-template')}<small>{t('look-template-hint')}</small></span>
        <Button size="sm" onclick={() => templateChooserUi.open({ project, at })}
          >{templateName(project, choice.template)}</Button
        >
      </div>
      <label class="row">
        <span class="what">{t('document-window-layout')}<small>{t('look-layout-hint')}</small></span
        >
        <select
          value={own.format ?? ''}
          onchange={(e) => setOwn({ format: e.currentTarget.value || undefined })}
        >
          <option value="">
            {formatFrom
              ? t('document-window-from-with', { name: formatFrom, what: nameOfLayout })
              : t('document-window-as-template', { name: broughtLayout })}
          </option>
          {#each formatGroups() as group (group.name)}
            <optgroup label={group.name}>
              {#each group.formats as f (f.id)}
                <option value={f.id}>{f.name}</option>
              {/each}
            </optgroup>
          {/each}
          {#if own.format && !documents.formatSummary(own.format)}
            <option value={own.format}>{own.format}</option>
          {/if}
        </select>
      </label>
      <label class="row">
        <span class="what"
          >{t('document-window-style')}<small>{t('look-citations-hint')}</small></span
        >
        <select
          value={own.style ?? ''}
          onchange={(e) => {
            const v = e.currentTarget.value;
            if (v === '…') {
              e.currentTarget.value = own.style ?? '';
              browsing = true;
            } else setOwn({ style: v || undefined });
          }}
        >
          <option value="">
            {styleFrom
              ? t('document-window-from-with', { name: styleFrom, what: styleName(choice.style) })
              : t('document-window-as-template', { name: broughtStyle })}
          </option>
          {#each styleGroups() as [name, styles] (name)}
            <optgroup label={name}>
              {#each styles as s (s.id)}
                <option value={s.id}>{s.title}</option>
              {/each}
            </optgroup>
          {/each}
          {#if own.style && !documents.style(own.style)}
            <option value={own.style}>{own.style}</option>
          {/if}
          <option value="…">{t('preview-style-more')}</option>
        </select>
      </label>
      <div class="actions">
        <Button size="sm" onclick={() => (editingStyle = choice.style)}
          >{t('document-window-style-change')}</Button
        >
      </div>
    </section>

    {#if !previewing}
      <p class="no-preview">
        {t('look-open-preview')}
        <Button size="sm" onclick={onpreview}>{t('look-open-preview-button')}</Button>
      </p>
    {/if}

    <label class="search">
      <Search size={14} />
      <input
        type="search"
        bind:value={query}
        placeholder={t('look-search')}
        aria-label={t('look-search')}
        spellcheck="false"
      />
    </label>

    {#if !effective}
      <div class="centre">
        {#if error}<p class="error">{error}</p>{:else}<Spinner size={20} />{/if}
      </div>
    {:else}
      {@const f = effective}
      {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

      {#if searching}
        <div class="finds" data-found>
          {#if foundFont}
            <h4>{sectionWords.type}</h4>
            {@render fontRow(f)}
          {/if}
          {#each foundRows as part (part.key)}
            {#if !(foundFont && part.key === 'type')}<h4>{sectionWords[part.key]}</h4>{/if}
            <Settings target={f} rows={part.rows} {from} />
          {/each}
          {#if foundKinds.length}
            <h4>{sectionWords.kinds}</h4>
            {#each foundKinds as k (k.id)}{@render kindLook(f, k)}{/each}
          {/if}
          {#if foundNothing}<p class="hint">{t('look-search-nothing')}</p>{/if}
        </div>
      {:else}
        <nav class="chips" aria-label={t('look-sections')}>
          {#each LOOK_SECTIONS as key (key)}
            <button
              type="button"
              class:current={section === key}
              data-section={key}
              onclick={() => (section = key)}>{sectionWords[key]}</button
            >
          {/each}
        </nav>

        <div class="part" data-part={section}>
          {#if section === 'type'}
            {@render fontRow(f)}
            <Settings target={f} rows={typeRows} {from} />
          {:else if section === 'page'}
            <Settings target={f} rows={pageRows} {from} />
          {:else if section === 'paragraphs'}
            <Settings target={f} rows={paragraphRows} {from} />
          {:else if section === 'headings'}
            <Settings target={f} rows={headingRows} {from} />
            <h4>{t('look-heading-levels')}</h4>
            {@render fromLine('headings.levels')}
            {#each f.headings.levels as level, i (i)}
              <details class="level" open={i === 0}>
                <summary>
                  <strong>{t('format-level', { number: i + 1 })}</strong>
                  <span class="said">{levelWords(level)}</span>
                </summary>
                <Settings target={level} rows={levelRows} />
              </details>
            {/each}
            <div class="actions">
              <Button size="sm" disabled={f.headings.levels.length >= 6} onclick={addLevel}>
                {#snippet icon()}<Plus size={13} />{/snippet}
                {t('format-level-add')}
              </Button>
              <Button
                size="sm"
                disabled={f.headings.levels.length <= 1}
                onclick={() => f.headings.levels.pop()}
              >
                {#snippet icon()}<Minus size={13} />{/snippet}
                {t('format-level-remove')}
              </Button>
            </div>
            <p class="hint">{t('format-levels-hint')}</p>
          {:else if section === 'kinds'}
            <p class="hint top">{t('format-kinds-hint')}</p>
            {#each kindGroups as group (group.id)}
              <h4>{group.label}</h4>
              {#each group.kinds as k (k.id)}{@render kindLook(f, k)}{/each}
            {/each}
            <p class="hint" class:bad={!kindsOk}>{t('format-lengths-hint')}</p>
          {:else if section === 'quotations'}
            <p class="hint top">{t('look-quotations-hint')}</p>
            <Settings target={f} rows={quotationRows} {from} />
          {:else if section === 'numbers'}
            <Settings target={f} rows={numbersRows} {from} />
          {:else if section === 'notes'}
            <Settings target={f} rows={noteRows} {from} />
          {:else if section === 'bibliography'}
            <Settings target={f} rows={bibliographyRows} {from} />
          {:else if section === 'figures'}
            <h4>{t('format-figures')}</h4>
            {@render captioned(f.figures, 'figure', figureNaming, figurePlacing)}
            <h4>{t('format-tables')}</h4>
            {@render captioned(f.tables, 'table', tableNaming, tablePlacing)}
            <Settings target={f} rows={tableRows} {from} />
            <div class="row">
              <span class="what">{t('format-as-it-will-stand')}</span>
              <span class="example">{f.equations.beforeNumber}1{f.equations.afterNumber}</span>
            </div>
          {:else if section === 'title'}
            <Settings target={f} rows={titleRows} {from} />
          {:else if section === 'about' && layout}
            <h4>{nameOfLayout}</h4>
            {#if ownLayout}
              <label class="row tall">
                <span class="what">{t('format-description')}</span>
                <textarea
                  rows="3"
                  value={layout.description}
                  onchange={(e) => describe(e.currentTarget.value)}></textarea>
              </label>
            {:else if layout.description}
              <p class="description">{layout.description}</p>
            {/if}
            {#if layout.source?.name}
              {@const s = layout.source}
              <div class="source selectable">
                <p class="overline">{t('format-source')}</p>
                <p class="serif">{s.name}</p>
                {#if s.url}
                  <button
                    type="button"
                    class="link"
                    onclick={() =>
                      openPath(s.url).catch((e) => notifyError(t('common-link-open-failed'), e))}
                  >
                    {s.url}
                    <ExternalLink size={11} />
                  </button>
                {/if}
                <p class="read">
                  {t('format-source-read', { date: s.checked })}
                  {s.confidence === 'high'
                    ? t('format-source-high')
                    : s.confidence === 'medium'
                      ? t('format-source-medium')
                      : t('format-source-low')}
                </p>
                {#if s.notes}<p class="notes">{s.notes}</p>{/if}
                {#if ownLayout}<p class="notes">{t('format-source-changed')}</p>{/if}
              </div>
            {:else}
              <p class="hint top">{t('format-source-none')}</p>
            {/if}
            {#if ownLayout}
              <div class="actions">
                <Button size="sm" variant="danger" onclick={removeLayout}
                  >{t('look-delete-layout')}</Button
                >
              </div>
            {:else}
              <p class="hint">{t('look-bundled')}</p>
            {/if}
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  <footer class="keep">
    {#if keeping}
      <form
        class="name"
        onsubmit={(e) => {
          e.preventDefault();
          if (keptName.trim()) void keep(keptName);
        }}
      >
        <input
          bind:value={keptName}
          placeholder={t('format-name')}
          aria-label={t('format-name')}
          class="kept-name"
        />
        <Button type="submit" size="sm" variant="primary" disabled={saving || !keptName.trim()}
          >{t('look-keep-save')}</Button
        >
        <Button size="sm" variant="ghost" onclick={() => (keeping = false)}
          >{t('common-cancel')}</Button
        >
      </form>
    {:else}
      <Button
        size="sm"
        disabled={!changed || !kindsOk || saving}
        onclick={() => {
          keeping = true;
          keptName = t('format-name-changed', { name: nameOfLayout });
        }}>{t('look-keep')}</Button
      >
      {#if ownLayout}
        <Button size="sm" disabled={!changed || !kindsOk || saving} onclick={() => keep(null)}
          >{t('look-put-into', { name: nameOfLayout })}</Button
        >
      {/if}
    {/if}
  </footer>
</aside>

{#if browsing}
  <StyleBrowser
    onchoose={(id) => {
      browsing = false;
      setOwn({ style: id });
    }}
    onclose={() => (browsing = false)}
  />
{/if}
{#if editingStyle}
  <StyleEditor
    id={editingStyle}
    references={project.usedReferences(at)}
    language={inherited.settings.language}
    onsaved={(id) => {
      editingStyle = null;
      // What the style holds may have changed under the same name: the pages are made anew.
      documents.changed++;
      setOwn({ style: id || undefined });
    }}
    onclose={() => (editingStyle = null)}
  />
{/if}

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    flex: none;
    padding: 0 8px 0 16px;
  }
  h2 {
    flex: 1;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .through {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 4px 16px 20px;
  }
  /* The panel is narrow: the values take less room than in a window. */
  .through :global(.row) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 140px);
    gap: 10px;
  }
  .through :global(.row.check) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .whole {
    margin: 0 -16px 10px;
    padding: 4px 16px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .map {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    margin: 0 0 6px;
    font-family: var(--font-text);
    font-size: 15px;
    line-height: 1.4;
  }
  .arrow {
    color: var(--ink-4);
  }
  .changes {
    font-size: var(--text-sm);
    color: var(--accent-strong);
  }
  .changes.none {
    color: var(--ink-4);
  }
  .link {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .changed {
    margin: 0 0 8px;
    padding: 6px 10px;
    list-style: none;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    font-size: var(--text-sm);
  }
  .changed li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding: 3px 0;
  }
  .changed small {
    color: var(--ink-3);
  }
  .again {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    text-decoration: underline;
    cursor: pointer;
  }
  .again:hover {
    color: var(--ink);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 4px;
  }
  .no-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--accent-soft);
    font-size: var(--text-sm);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 10px;
    color: var(--ink-3);
  }
  .search input {
    flex: 1;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0 0 12px;
  }
  .chips button {
    padding: 3px 9px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .chips button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .chips button.current {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .finds h4:first-child,
  .part > :global(h4:first-child) {
    margin-top: 4px;
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }
  .example {
    min-width: 0;
    font-family: var(--font-text);
    font-size: 15px;
    line-height: 1.35;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .example .bold {
    font-weight: 700;
  }
  .example .italic {
    font-style: italic;
  }
  details {
    margin-top: 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    padding: 0 10px;
  }
  details[open] {
    padding-bottom: 6px;
  }
  details[data-changed] {
    border-color: var(--accent);
  }
  summary {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-height: 34px;
    line-height: 34px;
    cursor: pointer;
    list-style-position: inside;
  }
  /* What the layout as used says of a kind, at the right of its line; quieter where it says nothing. */
  summary .said {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  summary .said.quiet {
    color: var(--ink-4);
    font-style: italic;
  }
  .base,
  .resolved {
    margin: 0 0 6px;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.5;
  }
  .resolved.problem {
    color: var(--danger);
  }
  .hint.bad {
    color: var(--danger);
  }
  details :global(.row:last-child) {
    border-bottom: none;
  }
  .description {
    margin: 0 0 10px;
    line-height: 1.5;
  }
  .source {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    line-height: 1.5;
  }
  .source .serif {
    margin-top: 2px;
    font-size: 15px;
  }
  .source .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .read {
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .notes {
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .error {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
  .keep {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: none;
    padding: 10px 16px;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .keep .name {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }
  .keep input {
    flex: 1;
    min-width: 140px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  .keep input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
</style>
