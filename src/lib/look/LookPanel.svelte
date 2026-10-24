<script lang="ts">
  /**
   * The look of a document, in one place (ADR 0042), in the order of the
   * page (2026-10-19), a column of the typesetting pane beside the pages
   * (2026-10-23): at the top what the document is, with the button that
   * opens Document properties at its type, and the layout in a line; then the
   * search; then the few rows most writers reach for; then every part, from
   * the page inwards, each with its heading, the chips above them going to
   * each; and at the foot the layout itself, with the document's changes to
   * it. The reference style is a row under the notes, and among the first
   * rows only where the document cites. What is changed here is kept as the
   * document's own changes over its layout, never in the layout: every row
   * that is changed says where, and offers the layout's value again. A
   * layout of the writer's own is made on purpose, from the changes.
   *
   * The rows set a copy of the layout as the document uses it; a moment
   * after each change, what differs from what the elements above give is
   * written as the element's changes, each a step of undo of its own.
   */
  import { tick, untrack } from 'svelte';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import {
    fontsList,
    formatKindLooks,
    formatsDelete,
    formatsSave,
    type DocumentFormat,
    type HeadingLevel,
    type KindFamily,
    type Margin,
    type MarginItem,
    type Sides,
    type KindLooks,
    type OwnKind,
  } from '$lib/api/documents';
  import type { Template } from '$lib/api/templates';
  import { aboutDocumentUi } from '$lib/document/about-document.svelte';
  import { CATALOGUE, GROUPS, points, specOf } from '$lib/editor/kinds';
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
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
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
  import { LOOK_SECTIONS, lookUi, type LookRequest, type LookSection } from './look.svelte';
  import ContentsSection from './ContentsSection.svelte';
  import { Composition } from './composition.svelte';
  import { lookRows, lookWords, resolvedWords, setKindLook } from './rows.svelte';

  interface Props {
    project: Project;
    /** The element whose document's look is set. */
    at: string;
    /** The kinds of paragraph and of words of the writer's own. */
    passageKinds: PassageKindRecord[];
    /** Shows an element in the text: one that fills a place of its own in the document. */
    ongo: (element: string) => void;
    /** Closes the Look column. */
    onclose: () => void;
    /** The element the text is at, where the text is open on this document. */
    current?: () => string | null;
  }

  let { project, at, passageKinds, ongo, onclose, current }: Props = $props();

  // ---- where the changes hold (ADR 0059) ----

  /** The element under the document's that the changes are written on; nothing for the document's own. */
  let scope = $state<string | null>(null);
  /** Whether an element is under the document's, and not it. */
  const within = (id: string | null | undefined): id is string =>
    !!id && id !== at && project.tree(at).sequence.includes(id);
  /** The element whose look the rows show and set: the one chosen in the line of where they hold, or the document's. */
  const target = $derived(within(scope) ? scope : at);
  /** The element the text is at, as it was when Look was last asked for or the line was opened. */
  let here = $state<string | null>(null);
  function lookHere() {
    here = current?.() ?? null;
  }
  /** The elements the changes may be written on in place of the document's: where the chip pressed last stood, and where the text is. */
  const candidates = $derived(
    [...new Set([scope, lookUi.request.element, here])].filter((id) => within(id)) as string[],
  );
  /** Writes what waits to be written where it was meant for, then sets the changes on another element. */
  function chooseScope(id: string | null) {
    if (pending) write();
    scope = within(id) ? id : null;
  }

  // ---- what the document uses ----

  const node = $derived(project.node(target));
  /** What the element says of its own. */
  const own = $derived<DocumentSettings>(node?.document ?? {});
  /** What is said of the element with what it inherits, and which element says each thing. */
  const inherited = $derived(project.documentOf(target));
  const choice = $derived(documents.choice(inherited.settings, project));
  /** The layout as it comes, before the changes. */
  const layout = $derived(documents.formatCached(choice.format));
  /** The changes of the document, with the element that makes each. */
  const changes = $derived(project.lookOf(target));
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
    const way = project.pathTo(target);
    return way.length > 1 ? project.lookOf(way[way.length - 2]).changes : {};
  }

  /** Whether the lines of the page are numbered, where the elements over this one say. */
  function lineNumbersAbove(): boolean | undefined {
    const way = project.pathTo(target);
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
    const to = target;
    if (!effective || !layout || !project.node(to)) return;
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
      project.setDocument(to, patch);
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
    project.setDocument(target, patch);
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
      words: who === target ? t('look-changed-here') : t('look-changed-in', { name: nameOf(who) }),
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
    if (!who || who === target) return null;
    return nameOf(who);
  }
  const usualLayout = $derived(layoutName(documents.choice({}).format));
  const usualStyle = $derived(styleName(documents.choice({}).style));
  const broughtLayout = $derived(
    template?.layout ? layoutName(template.layout) : t('look-usual', { name: usualLayout }),
  );
  const broughtStyle = $derived(
    template?.style
      ? styleName(template.style)
      : layout?.style
        ? styleName(layout.style)
        : t('look-usual', { name: usualStyle }),
  );
  const formatFrom = $derived(own.format ? null : fromAbove('format'));
  const styleFrom = $derived(own.style ? null : fromAbove('style'));

  let browsing = $state(false);
  let editingStyle = $state<string | null>(null);

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
    const way = project.pathTo(target);
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
      const who = inherited.from.get('format') ?? target;
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

  /** The parts the panel shows, in their order. */
  const SHOWN: readonly LookSection[] = LOOK_SECTIONS;
  /** The part at the top of the panel as it is scrolled: its chip is marked. */
  let section = $state<LookSection | null>(null);
  let kindInView = $state<string | undefined>(undefined);
  let form = $state<HTMLDivElement>();
  let query = $state('');
  const searching = $derived(query.trim().length > 0);
  /** What the panel was last asked to bring into view, until the rows are there to bring it. */
  let aim = $state.raw<LookRequest | null>(null);

  // Asked for at a part, a kind, a level of heading or a heading within a part: the search is left, and it is brought into view.
  $effect(() => {
    void lookUi.asked;
    const asked = untrack(() => lookUi.request);
    untrack(() => {
      if (asked.section || asked.kind || asked.level || asked.at) query = '';
      if (asked.kind) kindInView = asked.kind;
      aim = asked;
      lookHere();
      // Asked for from a chip on a line of an element under the document's: the changes hold for it.
      if (asked.element) chooseScope(asked.element);
    });
  });
  $effect(() => {
    const wanted = aim;
    const f = form;
    if (!effective || !wanted || !f) return;
    untrack(() => {
      aim = null;
      void tick().then(() => bring(f, wanted));
    });
  });

  /** Brings what is asked for into view at the top of the panel, under the chips: a kind, a level, a heading, a part. */
  function bring(f: HTMLElement, wanted: LookRequest) {
    const safe = (id: string | undefined) => !!id && /^[\w-]+$/.test(id);
    let target: HTMLElement | null = null;
    if (safe(wanted.kind)) {
      const d = f.querySelector<HTMLDetailsElement>(`.part details[data-kind="${wanted.kind}"]`);
      if (d) d.open = true;
      target = d;
    }
    if (!target && wanted.level) {
      const d = f.querySelector<HTMLDetailsElement>(`details.level[data-level="${wanted.level}"]`);
      if (d) d.open = true;
      target = d;
    }
    if (!target && safe(wanted.at)) target = f.querySelector(`[data-at="${wanted.at}"]`);
    if (!target && wanted.section) target = f.querySelector(`.part[data-part="${wanted.section}"]`);
    if (!target) return;
    scrollTo(f, target, 'auto');
    const part = target.closest<HTMLElement>('.part[data-part]')?.dataset.part as LookSection;
    if (part) section = part;
  }

  /** Scrolls the panel so that an element stands at its top, under the chips. */
  function scrollTo(f: HTMLElement, target: HTMLElement, behavior: ScrollBehavior) {
    const chips = f.querySelector<HTMLElement>('.chips');
    const by =
      target.getBoundingClientRect().top -
      f.getBoundingClientRect().top -
      (chips?.offsetHeight ?? 0) -
      6;
    f.scrollTo({ top: f.scrollTop + by, behavior });
  }

  /** Goes to a part, from its chip. */
  function go(key: LookSection) {
    const f = form;
    const part = f?.querySelector<HTMLElement>(`.part[data-part="${key}"]`);
    if (!f || !part) return;
    section = key;
    scrollTo(f, part, 'smooth');
  }

  /** Marks the chip of the part at the top of the panel, as the panel is scrolled. */
  function follow() {
    const f = form;
    if (!f || searching) return;
    const chips = f.querySelector<HTMLElement>('.chips');
    const line = f.getBoundingClientRect().top + (chips?.offsetHeight ?? 0) + 12;
    const parts = Array.from(f.querySelectorAll<HTMLElement>('.part[data-part]'));
    let at: LookSection | null = null;
    for (const part of parts) {
      if (part.getBoundingClientRect().top > line) break;
      at = part.dataset.part as LookSection;
    }
    // At the very foot the last part is the one in view, though it never reaches the top.
    if (at && f.scrollTop + f.clientHeight >= f.scrollHeight - 2)
      at = (parts[parts.length - 1]?.dataset.part as LookSection) ?? at;
    if (at !== section) section = at;
  }

  // The marked chip is kept within the bar of chips, which is moved and not the panel.
  $effect(() => {
    const key = section;
    const f = form;
    if (!key || !f) return;
    const chip = f.querySelector<HTMLElement>(`.chips [data-section="${key}"]`);
    const bar = chip?.parentElement;
    if (!chip || !bar) return;
    const c = chip.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    if (c.left < b.left) bar.scrollLeft -= b.left - c.left + 12;
    else if (c.right > b.right) bar.scrollLeft += c.right - b.right + 12;
  });

  const sectionWords = $derived<Record<LookSection, string>>({
    page: t('look-section-page'),
    type: t('look-section-type'),
    paragraphs: t('look-section-paragraphs'),
    headings: t('look-section-headings'),
    numbers: t('look-section-line-numbers'),
    notes: t('look-section-notes'),
    figures: t('look-section-figures'),
    front: t('look-section-front'),
    contents: t('look-section-type-parts'),
    layout: t('look-section-the-layout'),
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
  /**
   * The fonts to choose from, in groups: those this document uses, its
   * layout's and those its elements and the elements over it set; those set
   * elsewhere in the project, in a look or by a layout chosen there; then
   * every other one, by name. The font in use is always among them.
   */
  const fontGroups = $derived.by(() => {
    const named = (family: unknown) =>
      typeof family === 'string' && family.trim() ? family.trim() : null;
    const here = new Set<string>();
    const add = (set: Set<string>, family: unknown) => {
      const n = named(family);
      if (n) set.add(n);
    };
    add(here, effective?.font.family);
    add(here, layout?.font.family);
    add(here, changes.changes.font?.family);
    for (const id of project.tree(at).sequence)
      add(here, project.node(id)?.document.look?.font?.family);
    const elsewhere = new Set<string>();
    for (const node of project.nodes.values()) {
      add(elsewhere, node.document.look?.font?.family);
      if (node.document.format)
        add(elsewhere, documents.formatCached(node.document.format)?.font.family);
    }
    for (const n of here) elsewhere.delete(n);
    const by = (a: string, b: string) => a.localeCompare(b, languages.current);
    const rest = [...new Set([...usual, ...fonts])].filter(
      (n) => !here.has(n) && !elsewhere.has(n),
    );
    return [
      { label: t('look-fonts-document'), fonts: [...here].sort(by) },
      { label: t('look-fonts-project'), fonts: [...elsewhere].sort(by) },
      { label: t('look-fonts-all'), fonts: rest.sort(by) },
    ].filter((g) => g.fonts.length);
  });

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
    const numbering =
      !effective?.headings.numbered || !l.numbering || l.numbering === 'as-above'
        ? ''
        : l.numbering === 'none'
          ? t('format-level-not-numbered')
          : t('format-level-numbered-as', { style: t(`format-level-numbering-${l.numbering}`) });
    return [
      numbering,
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
      l.begins === 'page'
        ? t('format-level-new-page-said')
        : l.begins === 'right-page'
          ? t('format-level-right-page-said')
          : '',
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
  const ptOrText = () => ({
    max: 36,
    unit: 'pt',
    zero: t('format-as-the-text-zero'),
  });
  const custom = (f: F) => f.page.size === 'custom';
  /** Whether the first line of a paragraph is indented at all. */
  const indented = (f: F) => (points(f.text.indent) ?? 0) !== 0;
  const named = (f: F) => !f.title.anonymous;
  const withAbstract = (f: F) => f.title.showAbstract;

  // ---- the header and the footer (ADR 0057) ----

  type Which = 'header' | 'footer';
  type Side = keyof Sides;
  const SIDES: Side[] = ['left', 'center', 'right'];
  const ITEMS: MarginItem['kind'][] = ['page-number', 'title', 'author', 'chapter', 'date', 'text'];

  function itemWords(kind: MarginItem['kind']): string {
    return t(`format-item-${kind}`);
  }

  /** The margin that holds the page number, the footer first; none where neither shows it. */
  function numberedMargin(f: F): Which | null {
    const holds = (m: Margin) =>
      [
        m.left,
        m.center,
        m.right,
        ...(m.alternate && m.even ? [m.even.left, m.even.center, m.even.right] : []),
      ]
        .flat()
        .some((i) => i.kind === 'page-number');
    if (holds(f.footer)) return 'footer';
    if (holds(f.header)) return 'header';
    return null;
  }

  /**
   * Whether the pages are numbered, as the first rows say it: the margin
   * that holds the number is shown. Turned on where none holds it, the
   * number goes in the middle of the footer.
   */
  const pagesNumbered = {
    get: (f: F) => {
      const which = numberedMargin(f);
      return which !== null && f[which].shown;
    },
    set: (f: F, on: boolean) => {
      const which = numberedMargin(f);
      if (which) f[which].shown = on;
      else if (on) {
        f.footer.center = [...f.footer.center, { kind: 'page-number' }];
        f.footer.shown = true;
      }
    },
  };

  /** The places of a margin as they are set: a list taken whole. */
  function setPlace(sides: Sides, side: Side, items: MarginItem[]) {
    sides[side] = items;
  }
  function addItem(sides: Sides, side: Side, kind: string) {
    if (!ITEMS.includes(kind as MarginItem['kind'])) return;
    const item = (kind === 'text' ? { kind, text: '' } : { kind }) as MarginItem;
    setPlace(sides, side, [...sides[side], item]);
  }
  function removeItem(sides: Sides, side: Side, i: number) {
    setPlace(
      sides,
      side,
      sides[side].filter((_, j) => j !== i),
    );
  }
  function setWords(sides: Sides, side: Side, i: number, text: string) {
    setPlace(
      sides,
      side,
      sides[side].map((item, j) => (j === i ? { kind: 'text', text } : item)),
    );
  }

  const sideWords: Record<Side, string> = $derived({
    left: t('format-margin-place-left'),
    center: t('format-margin-place-center'),
    right: t('format-margin-place-right'),
  });

  /** Whether a margin is shown, and where: first whether, then how (ADR 0056). */
  function marginSwitches(which: Which): Row<F>[] {
    const shown = (f: F) => f[which].shown;
    return [
      toggle(
        t('format-margin-shown'),
        { get: (f) => f[which].shown, set: (f, v) => (f[which].shown = v) },
        { path: `${which}.shown` },
      ),
      toggle(
        t('format-margin-first-page'),
        { get: (f) => f[which].firstPage, set: (f, v) => (f[which].firstPage = v) },
        { path: `${which}.firstPage`, when: shown },
      ),
      toggle(
        t('format-margin-openers'),
        { get: (f) => f[which].openers, set: (f, v) => (f[which].openers = v) },
        { path: `${which}.openers`, when: shown },
      ),
      toggle(
        t('format-margin-alternate'),
        {
          get: (f) => f[which].alternate,
          set: (f, v) => {
            const m = f[which];
            m.alternate = v;
            // Left pages begin as the right ones are, to be changed from there.
            if (v && !m.even)
              m.even = JSON.parse(
                JSON.stringify({ left: m.left, center: m.center, right: m.right }),
              );
          },
        },
        { path: `${which}.alternate`, when: shown },
      ),
    ];
  }

  /** How a margin is set: what stands between its items, its size, italics and letters. */
  function marginLook(which: Which): Row<F>[] {
    return [
      text(
        t('format-margin-separator'),
        { get: (f) => f[which].separator, set: (f, v) => (f[which].separator = v) },
        { path: `${which}.separator`, literal: true },
      ),
      number(
        t('format-size'),
        { get: (f) => f[which].size, set: (f, v) => (f[which].size = v ?? 0) },
        { ...ptOrText(), path: `${which}.size` },
      ),
      toggle(
        t('format-italic'),
        { get: (f) => f[which].italic, set: (f, v) => (f[which].italic = v) },
        { path: `${which}.italic` },
      ),
      chosen(
        t('format-letters'),
        { get: (f) => f[which].case, set: (f, v) => (f[which].case = v as F['header']['case']) },
        cases,
        { path: `${which}.case` },
      ),
    ];
  }

  const headerSwitches = $derived(marginSwitches('header'));
  const footerSwitches = $derived(marginSwitches('footer'));
  const headerLook = $derived(marginLook('header'));
  const footerLook = $derived(marginLook('footer'));
  const marginWords: Record<Which, string> = $derived({
    header: t('format-margin-header'),
    footer: t('format-margin-footer'),
  });

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
    chosen(t('format-refmarks'), 'text.refmarks', [
      ['raised', t('format-refmarks-raised')],
      ['margin', t('format-refmarks-margin')],
    ]),
  ]);

  const pageSizes: Choices = $derived([
    ['a4', 'A4'],
    ['letter', 'US Letter'],
    ['a5', 'A5'],
    ['b5', 'B5'],
    ['legal', 'US Legal'],
    ['custom', t('format-page-custom')],
  ]);

  /**
   * The first rows: the few most writers reach for, each also in its part
   * below, where it says the same and sets the same.
   */
  const firstRows: Row<F>[] = $derived([
    number(t('look-first-type-size'), 'font.size', pt(6, 36)),
    chosen(t('format-line-spacing'), 'text.lineSpacing', spacings),
    chosen(t('look-first-page-size'), 'page.size', pageSizes),
    toggle(t('format-page-numbers-show'), pagesNumbered, { path: 'footer.shown' }),
    toggle(t('look-first-headings-numbered'), 'headings.numbered'),
  ]);

  const pageRows: Row<F>[] = $derived([
    chosen(t('format-size'), 'page.size', pageSizes),
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
      { min: 1, max: 4, step: 1, path: 'page.columns' },
    ),
    length(
      t('format-column-gap'),
      {
        get: (f) => f.page.columnGap ?? '1cm',
        set: (f, value) => (f.page.columnGap = value),
      },
      { when: (f) => (f.page.columns ?? 1) > 1, path: 'page.columnGap' },
    ),
  ]);

  /** The numbers of the pages: their style. Whether they are shown is the header's or the footer's. */
  const numberingRows: Row<F>[] = $derived([
    { subheading: t('format-page-numbers'), at: 'page-numbers' },
    chosen(t('format-page-numbering'), 'page.numbering', [
      ['arabic', t('format-number-arabic')],
      ['roman', t('format-number-roman')],
      ['roman-lower', t('format-number-roman-lower')],
      ['letters', t('format-number-letters')],
      ['letters-lower', t('format-number-letters-lower')],
    ]),
    // Where the changes hold for an element under the document's: its pages may be counted anew.
    toggle(t('format-page-restart'), 'page.restart', { when: () => target !== at }),
  ]);

  const paragraphRows: Row<F>[] = $derived([
    length(t('format-indent-first-line'), 'text.indent'),
    toggle(t('format-indent-first'), 'text.indentFirst', { when: indented }),
    length(t('format-space-between'), 'text.spaceBetween'),
  ]);

  const headingRows: Row<F>[] = $derived([toggle(t('format-numbered'), 'headings.numbered')]);

  const levelRows: Row<HeadingLevel>[] = $derived([
    // First how it is numbered (ADR 0058), where the headings are: then its look.
    level.choice(
      t('format-level-numbering'),
      {
        get: (l) => l.numbering ?? 'as-above',
        set: (l, v) => (l.numbering = v as HeadingLevel['numbering']),
      },
      [
        ['as-above', t('format-level-numbering-as-above')],
        ['none', t('format-level-numbering-none')],
        ['arabic', t('format-level-numbering-arabic')],
        ['alpha', t('format-level-numbering-alpha')],
        ['alpha-lower', t('format-level-numbering-alpha-lower')],
        ['roman', t('format-level-numbering-roman')],
        ['roman-lower', t('format-level-numbering-roman-lower')],
      ],
      { when: () => !!effective?.headings.numbered },
    ),
    level.number(t('format-size'), 'size', pt()),
    level.toggle(t('format-bold'), 'bold'),
    level.toggle(t('format-italic'), 'italic'),
    level.choice(t('format-letters'), 'case', cases),
    level.choice(t('format-alignment'), 'align', aligns),
    level.toggle(t('format-level-indent'), 'indent'),
    level.toggle(t('format-level-begins-paragraph'), 'runIn'),
    level.choice(t('format-level-placement'), 'begins', [
      ['text', t('format-level-begins-text')],
      ['page', t('format-level-begins-page')],
      ['right-page', t('format-level-begins-right-page')],
    ]),
    level.length(t('format-space-before'), 'spaceBefore', { when: (l) => !l.runIn }),
    level.length(t('format-space-after'), 'spaceAfter', { when: (l) => !l.runIn }),
  ]);

  // First whether, then how (ADR 0056): the switch of the title page stands
  // over these rows; then what the title page shows; then how it is set.
  const titleRows: Row<F>[] = $derived([
    { subheading: t('format-title-include'), at: 'title-shown' },
    toggle(t('format-title-anonymize'), 'title.anonymous'),
    toggle(t('format-title-authors'), 'title.showAuthors', { when: named }),
    toggle(t('format-title-affiliations'), 'title.showAffiliations', { when: named }),
    toggle(t('format-title-date'), 'title.showDate'),
    toggle(t('format-title-abstract'), 'title.showAbstract'),
    text(t('format-title-abstract-label'), 'title.abstractLabel', { when: withAbstract }),
    text(t('format-title-keywords-label'), 'title.keywordsLabel', { when: withAbstract }),
    { subheading: t('format-title-formatting'), at: 'title-how' },
    chosen(t('format-title-placement'), 'title.placement', [
      ['top', t('format-title-top')],
      ['own-page', t('format-title-own-page')],
    ]),
    number(t('format-size'), 'title.size', pt()),
    toggle(t('format-bold'), 'title.bold'),
    toggle(t('format-italic'), 'title.italic'),
    chosen(t('format-letters'), 'title.case', cases),
    chosen(t('format-alignment'), 'title.align', aligns),
  ]);

  /** What the document contains, for the switch of the title page over the front page's rows. */
  const contained = new Composition(
    () => project,
    () => at,
  );
  /** Where the switch of the title page has its value from: nothing where it is the template's. */
  const titlePageFrom = $derived(contained.from('parts.title-page'));

  /**
   * Quotations in the text that the layout would have set off by their
   * length: a warning of the checklist, from this many words or lines. The
   * look of a quotation is that of the kind Quotation, under Paragraph kinds.
   */
  const warns = (f: F) => f.quote.fromWords != null || f.quote.fromLines != null;
  /** A limit of the warning: empty for none. */
  const limit = (most: number, path: string) => ({
    max: most,
    step: 1,
    nullable: true,
    blank: '',
    path,
    when: warns,
  });
  const quotationRows: Row<F>[] = $derived([
    toggle(t('format-quote-warn'), {
      get: warns,
      set: (f, on) => {
        if (on && !warns(f)) f.quote.fromWords = 40;
        else if (!on) {
          f.quote.fromWords = null;
          f.quote.fromLines = null;
        }
      },
    }),
    number(t('format-quote-from-words'), 'quote.fromWords', limit(500, 'quote.fromWords')),
    number(t('format-quote-from-lines'), 'quote.fromLines', limit(50, 'quote.fromLines')),
  ]);

  // Numbers belong to what they number (ADR 0041): the lines of a numbered
  // stretch are shown as the layout says where the stretch does not; the
  // lines of the page are the document's to number.
  const numbersRows: Row<F>[] = $derived([
    number(t('format-verse-every'), 'verse.every', { min: 1, max: 1000, step: 1 }),
    chosen(t('format-verse-side'), 'verse.side', [
      ['left', t('format-side-left')],
      ['right', t('format-side-right')],
    ]),
    { subheading: t('format-numbers-page') },
    toggle(t('format-line-numbers'), 'lineNumbers'),
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
    text(t('format-bibliography-title'), 'bibliography.title'),
    toggle(t('format-bibliography-new-page'), 'bibliography.newPage'),
    length(t('format-bibliography-hanging-indent'), 'bibliography.hangingIndent'),
    chosen(t('format-line-spacing'), 'bibliography.lineSpacing', spacingsOrText),
    length(t('format-bibliography-entry-spacing'), 'bibliography.entrySpacing'),
    number(t('format-size'), 'bibliography.size', ptOrText()),
  ]);

  /** How figures or tables are called and told apart from what is said of them. */
  function namingRows(kind: CaptionedKind, c: Captioned | undefined): Row<Captioned>[] {
    const number = c ? called(c) : '1';
    const other = (c: Captioned) => between(c.separator, kind) === 'other';
    const at = kind === 'figure' ? 'figures' : 'tables';
    return [
      captions.text(t('format-captioned-called', { kind }), 'label'),
      captions.text(t('format-captioned-reference'), 'reference'),
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
        { when: other },
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
      captions.choice(t('format-alignment'), 'captionAlign', [
        ...aligns,
        ['justified', t('format-align-justified')],
      ]),
      captions.number(t('format-size'), 'captionSize', ptOrText()),
      captions.toggle(t('format-italic'), 'captionItalic'),
      captions.choice(t('format-line-spacing'), 'captionLineSpacing', spacingsOrText),
    ];
  }

  /** Where figures or tables stand. */
  function placingRows(kind: CaptionedKind): Row<Captioned>[] {
    return [
      { subheading: t('format-captioned-where', { kind }) },
      captions.choice(t('format-captioned-stand', { kind }), 'align', stands),
      captions.toggle(t('format-captioned-wrap'), 'wrap', { when: (c) => c.align !== 'center' }),
      captions.choice(t('format-captioned-placement'), 'placement', [
        ['in-text', t('format-captioned-in-text')],
        ['at-end', t('format-captioned-at-end')],
      ]),
      captions.text(t('format-captioned-end-title', { kind }), 'endTitle', {
        when: (c) => c.placement === 'at-end',
      }),
    ];
  }

  const figureNaming = $derived(namingRows('figure', effective?.figures));
  const figurePlacing = $derived(placingRows('figure'));
  const tableNaming = $derived(namingRows('table', effective?.tables));
  const tablePlacing = $derived(placingRows('table'));

  const tableRows: Row<F>[] = $derived([
    { subheading: t('format-table-inside') },
    chosen(t('format-table-rules'), 'tables.rules', [
      ['horizontal', t('format-table-rules-horizontal')],
      ['grid', t('format-table-rules-grid')],
      ['none', t('format-table-rules-none')],
    ]),
    toggle(t('format-table-header-bold'), 'tables.headerBold'),
    number(t('format-size'), 'tables.size', ptOrText()),
    chosen(t('format-line-spacing'), 'tables.lineSpacing', spacingsOrText),
  ]);

  /** Equations, under a heading of the rank of Figures and Tables. */
  const equationRows: Row<F>[] = $derived([
    chosen(t('format-equations-stand'), 'equations.align', stands),
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

  // The kinds of paragraph this document uses, and whether it cites a work,
  // gathered a moment after the text changes, not at every key.
  let inUse = $state.raw<string[]>([]);
  let cites = $state(false);
  function gatherKinds() {
    const found = new Set<string>();
    for (const id of project.tree(at).sequence)
      for (const b of project.blocksOf(id)) if (b.kind === 'paragraph') found.add(b.name);
    const list = [...found];
    if (list.join('\n') !== inUse.join('\n')) inUse = list;
    const now = project.usedReferences(at).length > 0;
    if (now !== cites) cites = now;
  }

  /**
   * Whether the reference style stands among the first rows: where the
   * document cites a work, where a reference style is chosen for it, or
   * where what it is, or the layout that brings, names one. A document that
   * does not cite has the style under the notes only, where it is there
   * for whoever looks.
   */
  const citing = $derived(
    cites ||
      !!inherited.settings.style ||
      !!template?.style ||
      !!(template?.layout && documents.formatCached(template.layout)?.style),
  );
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
  /** The two families of kinds, each under a heading of its own, named as the bar's menus name them. */
  const FAMILIES: readonly KindFamily[] = ['paragraph', 'words'];
  const familyWords = $derived<Record<KindFamily, string>>({
    paragraph: t('look-at-paragraph-kinds'),
    words: t('look-at-words-kinds'),
  });

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
              hints: false,
              resolved: resolved[k.id]?.look,
              path: (key) => `kinds.${k.id}.${key}`,
            },
          ),
        ]),
    ),
  );

  /** Whether the layout as used says anything of a kind. */
  const says = (f: F, id: string) => Object.keys(f.kinds?.[id] ?? {}).length > 0;
  /** Whether the document changes anything of a kind. */
  const changesKind = (id: string) =>
    pathsOf(changes.changes).some((p) => p.startsWith(`kinds.${id}.`));

  // ---- finding ----

  /** Whether words of the search are in a row's label. */
  function fits(words: string | undefined): boolean {
    const q = query.trim().toLocaleLowerCase(languages.current);
    return !!words && words.toLocaleLowerCase(languages.current).includes(q);
  }
  /** The rows of a part that the search finds, without its headings and notes. */
  function found<T>(rows: Row<T>[]): Row<T>[] {
    return rows.filter((r) => 'kind' in r && fits(r.label));
  }
  /** What the search finds, part by part: rows that set the layout as used. */
  const foundRows = $derived.by(() => {
    if (!searching) return [];
    const parts: [LookSection, Row<F>[]][] = [
      [
        'page',
        [
          ...pageRows,
          ...headerSwitches,
          ...headerLook,
          ...footerSwitches,
          ...footerLook,
          ...numberingRows,
        ],
      ],
      ['type', typeRows],
      ['paragraphs', [...paragraphRows, ...quotationRows]],
      ['headings', headingRows],
      ['numbers', numbersRows],
      ['notes', [...noteRows, ...bibliographyRows]],
      ['figures', [...tableRows, ...equationRows]],
      ['front', titleRows],
    ];
    return parts.map(([key, rows]) => ({ key, rows: found(rows) })).filter((p) => p.rows.length);
  });
  const foundFont = $derived(searching && fits(t('format-typeface')));
  const foundKinds = $derived(
    searching ? kindGroups.flatMap((g) => g.kinds).filter((k) => fits(k.label)) : [],
  );
  const foundStyle = $derived(searching && fits(t('look-style')));
  const foundNothing = $derived(
    searching && !foundRows.length && !foundFont && !foundKinds.length && !foundStyle,
  );

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
    const place = /^(header|footer)\.(even\.)?(left|center|right)$/.exec(path);
    if (place) {
      const which = marginWords[place[1] as Which];
      const where = place[2] ? `${t('format-margin-left-pages')}, ` : '';
      return `${which}: ${where}${sideWords[place[3] as Side]}`;
    }
    const margin = /^(header|footer)\./.exec(path);
    for (const rows of [
      typeRows,
      pageRows,
      numberingRows,
      paragraphRows,
      headingRows,
      quotationRows,
      numbersRows,
      noteRows,
      bibliographyRows,
      tableRows,
      equationRows,
      titleRows,
    ] as Row<F>[][]) {
      const row = rows.find((r) => 'kind' in r && (r.path ?? r.at) === path);
      if (row && 'label' in row) return row.label;
    }
    if (margin) {
      const which = margin[1] as Which;
      const rows =
        which === 'header'
          ? [...headerSwitches, ...headerLook]
          : [...footerSwitches, ...footerLook];
      const row = rows.find((r) => 'kind' in r && r.path === path);
      if (row && 'label' in row) return `${marginWords[which]}: ${row.label}`;
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

<!-- The header or the footer (ADR 0057): first whether it is shown, then
     its three places, each a list of items, then how it is set. -->
{#snippet marginRows(f: F, which: Which, switches: Row<F>[], look: Row<F>[])}
  {@const m = f[which]}
  <h4 data-at={which}>{marginWords[which]}</h4>
  <Settings target={f} rows={switches} {from} />
  {#if m.shown}
    {#if m.alternate}<h5>{t('format-margin-right-pages')}</h5>{/if}
    {@render placeRows(m, which, '')}
    {#if m.alternate && m.even}
      <h5>{t('format-margin-left-pages')}</h5>
      {@render placeRows(m.even, which, 'even.')}
    {/if}
    <Settings target={f} rows={look} {from} />
  {/if}
{/snippet}

{#snippet placeRows(sides: Sides, which: Which, even: string)}
  {#each SIDES as side (side)}
    <div class="row margin-place" data-place="{which}.{even}{side}">
      <span class="what">{sideWords[side]}</span>
      <span class="items">
        {#each sides[side] as item, i (i)}
          <span class="item" data-item={item.kind}>
            {#if item.kind === 'text'}
              <input
                class="words"
                value={item.text}
                placeholder={t('format-margin-text-placeholder')}
                aria-label={itemWords('text')}
                oninput={(e) => setWords(sides, side, i, e.currentTarget.value)}
              />
            {:else}{itemWords(item.kind)}{/if}
            <button
              type="button"
              class="remove"
              aria-label={t('format-margin-remove', { item: itemWords(item.kind) })}
              onclick={() => removeItem(sides, side, i)}>×</button
            >
          </span>
        {/each}
        <select
          class="add"
          aria-label="{sideWords[side]}: {t('format-margin-add')}"
          value=""
          onchange={(e) => {
            addItem(sides, side, e.currentTarget.value);
            e.currentTarget.value = '';
          }}
        >
          <option value="">{t('format-margin-add')}</option>
          {#each ITEMS as kind (kind)}<option value={kind}>{itemWords(kind)}</option>{/each}
        </select>
      </span>
    </div>
    {@render fromLine(`${which}.${even}${side}`)}
  {/each}
{/snippet}

{#snippet fontRow(f: F)}
  <label class="row">
    <span class="what">{t('format-typeface')}</span>
    <select
      value={f.font.family}
      onchange={(e) => (f.font.family = e.currentTarget.value)}
      data-font
    >
      {#each fontGroups as group (group.label)}
        <optgroup label={group.label}>
          {#each group.fonts as family (family)}<option value={family}>{family}</option>{/each}
        </optgroup>
      {/each}
    </select>
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
  <Settings target={c} rows={placing} {from} {prefix} />
  {#if c.placement === 'at-end'}
    <label class="row">
      <span class="what"
        >{t('format-captioned-placeholder')}{#if !c.placeholder.includes('{}')}<small class="bad"
            >{t('format-captioned-placeholder-missing')}</small
          >{/if}</span
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

{#snippet styleRow()}
  <label class="row" data-style-row>
    <span class="what">{t('look-style')}</span>
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
          ? t('look-from-with', { name: styleFrom, what: styleName(choice.style) })
          : t('look-as-template', { name: broughtStyle })}
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
{/snippet}

<aside class="panel look" aria-label={t('look-title')}>
  <header>
    <h2>{t('look-title')}</h2>
    <IconButton label={t('look-hide')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="through settings" bind:this={form} onscroll={follow}>
    <!-- What the document is, with the button that opens Document properties at its type; and the layout, in a line. -->
    <section class="whole" aria-label={t('look-whole')}>
      <div class="type-line" data-template={choice.template}>
        <span class="name">{templateName(project, choice.template)}</span>
        <Button
          size="sm"
          data-document-type
          onclick={() => aboutDocumentUi.open({ project, at, section: 'type' })}
          >{t('look-document-type')}</Button
        >
      </div>
      <button
        type="button"
        class="link layout-line"
        data-layout={choice.format}
        data-changes={changed}
        onclick={() => form && bring(form, { section: 'layout' })}
        >{t('look-layout-line', { layout: nameOfLayout })}{#if changed}{' · '}{t('look-changes', {
            count: changed,
          })}{/if}</button
      >
      <!-- Where the changes hold: the whole document, or only an element under it (ADR 0059). -->
      {#if candidates.length}
        <label class="scope-line">
          <span>{t('look-scope')}</span>
          <select
            class="scope"
            data-scope={target === at ? '' : target}
            value={target === at ? '' : target}
            onfocus={lookHere}
            onchange={(e) => chooseScope(e.currentTarget.value || null)}
          >
            <option value="">{t('look-scope-document', { name: nameOf(at) })}</option>
            {#each candidates as id (id)}
              <option value={id}>{t('look-scope-only', { name: nameOf(id) })}</option>
            {/each}
          </select>
        </label>
      {/if}
    </section>

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
          {#each FAMILIES as family (family)}
            {@const kinds = foundKinds.filter((k) => k.family === family)}
            {#if kinds.length}
              <h4>{familyWords[family]}</h4>
              {#each kinds as k (k.id)}{@render kindLook(f, k)}{/each}
            {/if}
          {/each}
          {#if foundStyle}
            <h4>{t('look-at-citations')}</h4>
            {@render styleRow()}
          {/if}
          {#if foundNothing}<p class="hint">{t('look-search-nothing')}</p>{/if}
        </div>
      {:else}
        <!-- The rows most writers reach for, each also in its part below. -->
        <section class="first" data-first>
          {@render fontRow(f)}
          <Settings target={f} rows={firstRows} {from} />
          {#if citing}{@render styleRow()}{/if}
        </section>

        <nav class="chips" aria-label={t('look-sections')}>
          {#each SHOWN as key (key)}
            <button
              type="button"
              class:current={section === key}
              data-section={key}
              onclick={() => go(key)}>{sectionWords[key]}</button
            >
          {/each}
        </nav>

        <section class="part" data-part="page">
          <h3>{sectionWords.page}</h3>
          <Settings target={f} rows={pageRows} {from} />
          {@render marginRows(f, 'header', headerSwitches, headerLook)}
          {@render marginRows(f, 'footer', footerSwitches, footerLook)}
          <Settings target={f} rows={numberingRows} {from} />
        </section>

        <section class="part" data-part="type">
          <h3>{sectionWords.type}</h3>
          {@render fontRow(f)}
          <Settings target={f} rows={typeRows} {from} />
        </section>

        <section class="part" data-part="paragraphs">
          <h3>{sectionWords.paragraphs}</h3>
          <Settings target={f} rows={paragraphRows} {from} />
          <h4 data-at="quotations">{t('look-at-quotations-warning')}</h4>
          <Settings target={f} rows={quotationRows} {from} />
          <!-- The kinds of paragraph, then the kinds of words, each in the groups of the catalogue. -->
          {#each FAMILIES as family (family)}
            <h4 data-at={family === 'paragraph' ? 'kinds' : 'words-kinds'}>
              {familyWords[family]}
            </h4>
            {#each kindGroups as group (group.id)}
              {@const kinds = group.kinds.filter((k) => k.family === family)}
              {#if kinds.length}
                <h5>{group.label}</h5>
                {#each kinds as k (k.id)}{@render kindLook(f, k)}{/each}
              {/if}
            {/each}
          {/each}
        </section>

        <section class="part" data-part="headings">
          <h3>{sectionWords.headings}</h3>
          <Settings target={f} rows={headingRows} {from} />
          <h4>{t('look-heading-levels')}</h4>
          {@render fromLine('headings.levels')}
          {#each f.headings.levels as level, i (i)}
            <details class="level" data-level={i + 1} open={i === 0}>
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
        </section>

        <section class="part" data-part="numbers">
          <h3>{sectionWords.numbers}</h3>
          <Settings target={f} rows={numbersRows} {from} />
        </section>

        <section class="part" data-part="notes">
          <h3>{sectionWords.notes}</h3>
          <Settings target={f} rows={noteRows} {from} />
          <h4 data-at="citations">{t('look-at-citations')}</h4>
          {@render styleRow()}
          <div class="actions">
            <Button size="sm" onclick={() => (editingStyle = choice.style)}
              >{t('look-style-change')}</Button
            >
          </div>
          <h4 data-at="bibliography">{t('look-at-bibliography')}</h4>
          <Settings target={f} rows={bibliographyRows} {from} />
        </section>

        <section class="part" data-part="figures">
          <h3>{sectionWords.figures}</h3>
          <h4>{t('format-figures')}</h4>
          {@render captioned(f.figures, 'figure', figureNaming, figurePlacing)}
          <h4>{t('format-tables')}</h4>
          {@render captioned(f.tables, 'table', tableNaming, tablePlacing)}
          <Settings target={f} rows={tableRows} {from} />
          <h4 data-at="equations">{t('format-equations')}</h4>
          <Settings target={f} rows={equationRows} {from} />
        </section>

        <section class="part" data-part="front">
          <h3>{sectionWords.front}</h3>
          <!-- Whether the document has a title page: the switch of What the document contains, here too. -->
          <label class="row check" data-front-switch>
            <span class="what">{t('look-front-title-page')}</span>
            <input
              type="checkbox"
              data-part-switch="title-page"
              checked={contained.has('title-page')}
              disabled={!contained.used}
              onchange={(e) => contained.setPart('title-page', e.currentTarget.checked)}
            />
          </label>
          {#if titlePageFrom}
            {@const said = titlePageFrom}
            <p class="from" data-from>
              {said.words}{#if said.again}{' · '}<button
                  type="button"
                  class="again"
                  onclick={said.again.take}>{said.again.label}</button
                >{/if}
            </p>
          {/if}
          <Settings target={f} rows={titleRows} {from} />
        </section>

        <section class="part" data-part="contents">
          <h3>{sectionWords.contents}</h3>
          <ContentsSection {project} {at} {ongo} />
        </section>

        <!-- The layout itself: chosen here, with what this document changes of it. -->
        <section class="part" data-part="layout">
          <h3>{sectionWords.layout}</h3>
          <label class="row">
            <span class="what">{t('look-choose-layout')}</span>
            <select
              value={own.format ?? ''}
              onchange={(e) => setOwn({ format: e.currentTarget.value || undefined })}
            >
              <option value="">
                {formatFrom
                  ? t('look-from-with', { name: formatFrom, what: nameOfLayout })
                  : t('look-as-template', { name: broughtLayout })}
              </option>
              {#each formatGroups() as group (group.name)}
                <optgroup label={group.name}>
                  {#each group.formats as fm (fm.id)}
                    <option value={fm.id}>{fm.name}</option>
                  {/each}
                </optgroup>
              {/each}
              {#if own.format && !documents.formatSummary(own.format)}
                <option value={own.format}>{own.format}</option>
              {/if}
            </select>
          </label>

          {#if changed}
            <h4>{t('look-layout-modifications')}</h4>
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

          <div class="keep">
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
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={saving || !keptName.trim()}>{t('look-keep-save')}</Button
                >
                <Button size="sm" variant="ghost" onclick={() => (keeping = false)}
                  >{t('common-cancel')}</Button
                >
              </form>
            {:else}
              <Button
                size="sm"
                disabled={!changed || saving}
                onclick={() => {
                  keeping = true;
                  keptName = t('format-name-changed', { name: nameOfLayout });
                }}>{t('look-keep')}</Button
              >
              {#if ownLayout}
                <Button size="sm" disabled={!changed || saving} onclick={() => keep(null)}
                  >{t('look-put-into', { name: nameOfLayout })}</Button
                >
              {/if}
            {/if}
          </div>

          {#if layout}
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
            {#if ownLayout}
              <div class="actions">
                <Button size="sm" variant="danger" onclick={removeLayout}
                  >{t('look-delete-layout')}</Button
                >
              </div>
            {/if}
          {/if}
          <div class="actions about">
            <Button size="sm" onclick={() => aboutDocumentUi.open({ project, at })}
              >{t('about-menu')}</Button
            >
          </div>
        </section>
      {/if}
    {/if}
  </div>
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
  /* A place of the header or the footer: its items as chips, and a menu to add one. */
  .margin-place {
    align-items: start;
  }
  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 2px 1px 8px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: var(--text-sm);
    background: var(--paper);
  }
  .item .words {
    width: 9em;
    padding: 0 4px;
    border: none;
    background: transparent;
  }
  .item .remove {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .item .remove:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .items .add {
    flex: 1 0 100%;
  }
  .through :global(.row.check) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  /* What the document is, and the layout in a line under it. */
  .whole {
    margin: 0 -16px 10px;
    padding: 8px 16px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  /* What the document is, by name, and the plain button that opens its type in Document properties. */
  .type-line {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .type-line .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 16px;
  }
  .type-line :global(button) {
    flex: none;
  }
  .layout-line {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .layout-line:hover {
    color: var(--accent-strong);
  }
  /* Where the changes hold: a line of its own under the layout. */
  .scope-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .scope-line select {
    flex: 1 1 12em;
    min-width: 0;
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
  /* The first rows, before the parts. */
  .first {
    margin: 0 0 6px;
  }
  /* The chips that go to each part: one line, which stays at the top of the
     panel as it is scrolled and is moved sideways where it is too long. */
  .chips {
    position: sticky;
    top: -4px;
    z-index: 2;
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    margin: 0 -16px 4px;
    padding: 8px 16px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--line);
    background: var(--paper-raised);
  }
  /* The chips that do not fit fade at the right edge of the bar, which is moved sideways. */
  .chips::after {
    content: '';
    position: sticky;
    right: -16px;
    flex: none;
    width: 32px;
    margin-left: -32px;
    background: linear-gradient(to right, transparent, var(--paper-raised));
    pointer-events: none;
  }
  .chips button {
    flex: none;
    white-space: nowrap;
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
  .finds h4:first-child {
    margin-top: 4px;
  }
  /* Each part under its heading, one after another. */
  .part {
    padding: 4px 0 10px;
  }
  .part + .part {
    border-top: 1px solid var(--line);
  }
  .part h3 {
    margin: 12px 0 6px;
    font-size: var(--text-lg);
  }
  .part h5 {
    margin: 14px 0 2px;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--ink-3);
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
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
  /* A fault to mend, under the label of its row. */
  .what small.bad {
    color: var(--danger);
  }
  details :global(.row:last-child) {
    border-bottom: none;
  }
  .description {
    margin: 0 0 10px;
    line-height: 1.5;
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
    margin: 10px 0 14px;
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
