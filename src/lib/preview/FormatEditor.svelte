<script lang="ts">
  import { untrack } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import {
    documentPreviewWhole,
    fontsList,
    formatsDelete,
    formatsGet,
    formatsSave,
    openPath,
    type Align,
    type Case,
    type DocumentFormat,
    type DocumentRequest,
    type HeadingLevel,
    type Position,
  } from '$lib/api/documents';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Settings from '$lib/ui/settings/Settings.svelte';
  import { rowsOf, type Choices, type Row } from '$lib/ui/settings/rows';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import { documents } from './documents.svelte';

  interface Props {
    /** The format to begin from. */
    id: string;
    /** Makes a request for the document in view, to show the format on. */
    request?: () => Promise<DocumentRequest>;
    /** Called with the id of the format as saved. */
    onsaved: (id: string) => void;
    onclose: () => void;
  }

  let { id, request, onsaved, onclose }: Props = $props();

  let format = $state<DocumentFormat | null>(null);
  let original = '';
  let name = $state('');
  let section = $state('page');
  let fonts = $state.raw<string[]>([]);
  let error = $state<string | null>(null);
  let saving = $state(false);

  let pages = $state.raw<string[]>([]);
  let previewing = $state(false);
  let previewError = $state<string | null>(null);
  let round = 0;

  const own = $derived(format?.kind === 'own');
  const changed = $derived(!!format && JSON.stringify($state.snapshot(format)) !== original);

  $effect(() => {
    const wanted = id;
    untrack(async () => {
      try {
        const loaded = await formatsGet(wanted);
        original = JSON.stringify(loaded);
        format = loaded;
        betweenOther = {};
        name =
          loaded.kind === 'own' ? loaded.name : t('format-name-changed', { name: loaded.name });
      } catch (e) {
        error = describeError(e) ?? t('format-read-failed');
      }
      fontsList()
        .then((list) => (fonts = list))
        .catch(() => {});
    });
  });

  // The sample follows the changes, a moment behind.
  $effect(() => {
    if (!format || !request) return;
    const snapshot = JSON.stringify($state.snapshot(format));
    const timer = setTimeout(() => untrack(() => show(snapshot)), pages.length ? 700 : 100);
    return () => clearTimeout(timer);
  });

  async function show(snapshot: string) {
    if (!request) return;
    const mine = ++round;
    previewing = true;
    try {
      const r = await request();
      r.format = JSON.parse(snapshot);
      r.key = `${r.key}-format`;
      // The first pages are what is shown: no others are made.
      const preview = await documentPreviewWhole(r, [1, 2, 3, 4, 5, 6]);
      if (mine !== round) return;
      for (const url of pages) URL.revokeObjectURL(url);
      pages = preview.pages.map((page) =>
        URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' })),
      );
      previewError = null;
    } catch (e) {
      if (mine === round) previewError = describeError(e) ?? t('format-sample-failed');
    } finally {
      if (mine === round) previewing = false;
    }
  }

  $effect(() => () => {
    round++;
    for (const url of pages) URL.revokeObjectURL(url);
  });

  async function save() {
    if (!format || saving) return;
    saving = true;
    error = null;
    try {
      const snapshot = $state.snapshot(format) as DocumentFormat;
      snapshot.name = name.trim() || snapshot.name;
      const saved = await formatsSave(snapshot);
      documents.forgetFormat(saved.id);
      await documents.reload();
      notifyOk(t('format-saved', { name: saved.name }));
      onsaved(saved.id);
    } catch (e) {
      error = describeError(e) ?? t('format-save-failed');
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (!format || !own) return;
    const ok = await confirm({
      title: t('format-delete-title', { name: format.name }),
      message: t('format-delete-message'),
      confirm: t('format-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await formatsDelete(format.id);
      documents.forgetFormat(format.id);
      await documents.reload();
      onsaved(format.basedOn ?? 'manuscript');
    } catch (e) {
      error = describeError(e) ?? t('format-delete-failed');
    }
  }

  async function close() {
    if (changed) {
      const ok = await confirm({
        title: t('format-leave-title'),
        message: t('format-leave-message'),
        confirm: t('format-leave-confirm'),
        cancel: t('format-leave-cancel'),
      });
      if (!ok) return;
    }
    onclose();
  }

  const sections: [string, string][] = $derived([
    ['page', t('format-section-page')],
    ['type', t('format-section-type')],
    ['paragraphs', t('format-section-paragraphs')],
    ['headings', t('format-section-headings')],
    ['title', t('format-section-title')],
    ['quotations', t('format-section-quotations')],
    ['notes', t('format-section-notes')],
    ['bibliography', t('format-section-bibliography')],
    ['figures', t('format-section-figures')],
    ['margins', t('format-section-margins')],
    ['limits', t('format-section-limits')],
    ['about', t('format-section-about')],
  ]);

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
    if (!format || format.headings.levels.length >= 6) return;
    const last = format.headings.levels[format.headings.levels.length - 1];
    format.headings.levels.push({ ...last, bold: false, italic: true });
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

  // ---- the settings, section by section ----

  type F = DocumentFormat;
  const { toggle, text, length, number, choice } = rowsOf<F>();
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

  const pageRows: Row<F>[] = $derived([
    { heading: t('format-section-page') },
    choice(t('format-size'), 'page.size', [
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
    { note: t('format-lengths-hint') },
    toggle(t('format-line-numbers'), 'lineNumbers', { hint: t('format-line-numbers-hint') }),
  ]);

  const typeRows: Row<F>[] = $derived([
    number(t('format-size'), 'font.size', pt(6, 36)),
    choice(t('format-line-spacing'), 'text.lineSpacing', spacings),
    choice(t('format-alignment'), 'text.align', [
      ['left', t('format-align-ragged')],
      ['justified', t('format-align-justified')],
    ]),
    toggle(t('format-hyphenate'), 'text.hyphenate'),
  ]);

  const paragraphRows: Row<F>[] = $derived([
    { heading: t('format-section-paragraphs') },
    choice(t('format-paragraphs'), 'text.paragraphs', [
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
    { heading: t('format-section-headings') },
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
    { heading: t('format-section-title') },
    choice(t('format-title-placement'), 'title.placement', [
      ['top', t('format-title-top')],
      ['own-page', t('format-title-own-page')],
    ]),
    number(t('format-size'), 'title.size', pt()),
    toggle(t('format-bold'), 'title.bold'),
    toggle(t('format-italic'), 'title.italic'),
    choice(t('format-letters'), 'title.case', cases),
    choice(t('format-alignment'), 'title.align', aligns),
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
    { heading: t('format-quotations') },
    length(t('format-quote-indent-left'), 'quote.indentLeft'),
    length(t('format-quote-indent-right'), 'quote.indentRight'),
    number(t('format-size'), 'quote.size', ptOrText()),
    choice(t('format-line-spacing'), 'quote.lineSpacing', spacingsOrText),
    toggle(t('format-italic'), 'quote.italic'),
    { subheading: t('format-quote-when') },
    number(
      t('format-quote-from-words'),
      'quote.fromWords',
      counted(500, 1, t('format-not-said'), t('format-quote-from-words-hint')),
    ),
    number(t('format-quote-from-lines'), 'quote.fromLines', counted(50, 1, t('format-not-said'))),
  ]);

  const noteRows: Row<F>[] = $derived([
    { heading: t('format-section-notes') },
    choice(t('format-notes-kind'), 'notes.kind', [
      ['footnotes', t('format-notes-footnotes')],
      ['endnotes', t('format-notes-endnotes')],
    ]),
    number(t('format-size'), 'notes.size', pt(5, 36)),
    choice(t('format-line-spacing'), 'notes.lineSpacing', spacings),
    text(t('format-notes-title'), 'notes.title', { when: (f) => f.notes.kind === 'endnotes' }),
  ]);

  const bibliographyRows: Row<F>[] = $derived([
    { heading: t('format-section-bibliography') },
    text(t('format-bibliography-title'), 'bibliography.title', {
      hint: t('format-bibliography-title-hint'),
    }),
    toggle(t('format-bibliography-new-page'), 'bibliography.newPage'),
    length(t('format-bibliography-hanging-indent'), 'bibliography.hangingIndent'),
    choice(t('format-line-spacing'), 'bibliography.lineSpacing', spacingsOrText),
    length(t('format-bibliography-entry-spacing'), 'bibliography.entrySpacing'),
    number(t('format-size'), 'bibliography.size', ptOrText(false)),
  ]);

  /** How figures or tables are called and told apart from what is said of them. */
  function namingRows(kind: CaptionedKind, c: Captioned | undefined): Row<Captioned>[] {
    const number = c ? called(c) : '1';
    const other = (c: Captioned) => between(c.separator, kind) === 'other';
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

  const figureNaming = $derived(namingRows('figure', format?.figures));
  const figurePlacing = $derived(placingRows('figure'));
  const tableNaming = $derived(namingRows('table', format?.tables));
  const tablePlacing = $derived(placingRows('table'));

  const tableRows: Row<F>[] = $derived([
    { subheading: t('format-table-itself') },
    choice(
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
    choice(t('format-line-spacing'), 'tables.lineSpacing', spacingsOrText),
    { heading: t('format-equations') },
    choice(t('format-equations-stand'), 'equations.align', stands, {
      hint: t('format-unless-said'),
    }),
    text(t('format-equations-before'), 'equations.beforeNumber'),
    text(t('format-equations-after'), 'equations.afterNumber'),
  ]);

  const marginRows: Row<F>[] = $derived([
    { heading: t('format-page-numbers') },
    toggle(t('format-page-numbers-show'), 'pageNumbers.show'),
    choice(
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
    { heading: t('format-running-head') },
    choice(t('format-running-head-content'), 'runningHead.content', [
      ['none', t('format-running-head-none')],
      ['title', t('format-running-head-title')],
      ['author', t('format-running-head-author')],
      ['author-title', t('format-running-head-author-title')],
      ['text', t('format-running-head-text')],
    ]),
    text(t('format-running-head-words'), 'runningHead.text', {
      when: (f) => f.runningHead.content === 'text',
    }),
    choice(t('format-alignment'), 'runningHead.align', aligns, { when: headed }),
    choice(t('format-letters'), 'runningHead.case', cases.slice(0, 2), { when: headed }),
  ]);

  const limitRows: Row<F>[] = $derived([
    { heading: t('format-section-limits') },
    { note: t('format-limits-hint') },
    number(t('format-limits-words'), 'limits.words', counted(1000000, 500, t('format-no-limit'))),
    number(
      t('format-limits-abstract-words'),
      'limits.abstractWords',
      counted(5000, 10, t('format-no-limit')),
    ),
    number(t('format-limits-keywords'), 'limits.keywords', counted(50, 1, t('format-no-limit'))),
  ]);
</script>

{#snippet captioned(
  c: Captioned,
  kind: CaptionedKind,
  naming: Row<Captioned>[],
  placing: Row<Captioned>[],
)}
  <Settings target={c} rows={naming} />
  <div class="row">
    <span class="what">{t('format-as-it-will-stand')}</span>
    <span class="example"
      ><span class:bold={c.labelBold} class:italic={c.labelItalic}>{called(c)}</span
      >{c.separator}<span class:italic={c.captionItalic}
        >{t('format-caption-example', { kind })}</span
      ></span
    >
  </div>
  <Settings target={c} rows={placing} />
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
  {/if}
{/snippet}

<Dialog
  open
  title={t('format-editor')}
  width={1180}
  tall
  padded={false}
  dismissable={false}
  onclose={close}
>
  {#snippet header()}
    <div class="head">
      <h2>{t('format-editor')}</h2>
      <input
        class="name"
        bind:value={name}
        aria-label={t('format-name')}
        placeholder={t('format-name')}
      />
    </div>
  {/snippet}

  {#if !format}
    <div class="centre">
      {#if error}<p class="error">{error}</p>{:else}<Spinner size={22} />{/if}
    </div>
  {:else}
    {@const f = format}
    <div class="editor" class:with-sample={!!request}>
      <nav aria-label={t('format-sections')}>
        {#each sections as [key, words] (key)}
          <button type="button" class:current={section === key} onclick={() => (section = key)}
            >{words}</button
          >
        {/each}
      </nav>

      <div class="form settings">
        {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

        {#if section === 'page'}
          <Settings target={f} rows={pageRows} />
        {:else if section === 'type'}
          <h3>{t('format-section-type')}</h3>
          <label class="row">
            <span class="what"
              >{t('format-typeface')}<small>{t('format-typeface-hint')}</small></span
            >
            <input list="fonts" bind:value={f.font.family} />
            <datalist id="fonts">
              {#each fontChoices as family (family)}<option value={family}></option>{/each}
            </datalist>
          </label>
          <Settings target={f} rows={typeRows} />
        {:else if section === 'paragraphs'}
          <Settings target={f} rows={paragraphRows} />
        {:else if section === 'headings'}
          <Settings target={f} rows={headingRows} />
          {#each f.headings.levels as level, i (i)}
            <details open={i === 0}>
              <summary>
                <strong>{t('format-level', { number: i + 1 })}</strong>
                <span>{levelWords(level)}</span>
              </summary>
              <Settings target={level} rows={levelRows} />
            </details>
          {/each}
          <div class="levels">
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
        {:else if section === 'title'}
          <Settings target={f} rows={titleRows} />
        {:else if section === 'quotations'}
          <Settings target={f} rows={quotationRows} />
        {:else if section === 'notes'}
          <Settings target={f} rows={noteRows} />
        {:else if section === 'bibliography'}
          <Settings target={f} rows={bibliographyRows} />
          <label class="row">
            <span class="what"
              >{t('format-bibliography-style')}<small>{t('format-bibliography-style-hint')}</small
              ></span
            >
            <select
              value={f.style ?? ''}
              onchange={(e) => (f.style = e.currentTarget.value || undefined)}
            >
              <option value="">{t('format-bibliography-style-none')}</option>
              {#each documents.styles as s (s.id)}
                <option value={s.id}>{s.title}</option>
              {/each}
              {#if f.style && !documents.style(f.style)}<option value={f.style}>{f.style}</option
                >{/if}
            </select>
          </label>
        {:else if section === 'figures'}
          <h3>{t('format-figures')}</h3>
          {@render captioned(f.figures, 'figure', figureNaming, figurePlacing)}
          <h3>{t('format-tables')}</h3>
          {@render captioned(f.tables, 'table', tableNaming, tablePlacing)}
          <Settings target={f} rows={tableRows} />
          <div class="row">
            <span class="what">{t('format-as-it-will-stand')}</span>
            <span class="example">{f.equations.beforeNumber}1{f.equations.afterNumber}</span>
          </div>
        {:else if section === 'margins'}
          <Settings target={f} rows={marginRows} />
        {:else if section === 'limits'}
          <Settings target={f} rows={limitRows} />
          <label class="row tall">
            <span class="what">{t('format-limits-note')}</span>
            <textarea
              rows="3"
              bind:value={f.limits.note}
              placeholder={t('format-limits-note-placeholder')}></textarea>
          </label>
        {:else if section === 'about'}
          <h3>{t('format-section-about')}</h3>
          <label class="row tall">
            <span class="what">{t('format-description')}</span>
            <textarea rows="3" bind:value={f.description}></textarea>
          </label>
          {#if f.source?.name}
            {@const s = f.source}
            <div class="source selectable">
              <p class="overline">{t('format-source')}</p>
              <p class="serif">{s.name}</p>
              {#if s.url}
                <button type="button" class="link" onclick={() => openPath(s.url).catch(() => {})}>
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
              {#if own}<p class="notes">{t('format-source-changed')}</p>{/if}
            </div>
          {:else}
            <p class="hint top">{t('format-source-none')}</p>
          {/if}
        {/if}
      </div>

      {#if request}
        <div class="sample" class:working={previewing}>
          {#if previewError}
            <p class="error selectable">{previewError}</p>
          {:else if !pages.length}
            <div class="centre"><Spinner size={20} /></div>
          {:else}
            {#each pages as url, i (url)}
              <img src={url} alt={t('format-sample-page', { number: i + 1 })} draggable="false" />
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#snippet footer()}
    {#if own}
      <div class="left">
        <Button variant="danger" onclick={remove}>{t('format-delete')}</Button>
      </div>
    {:else}
      <div class="left note">{t('format-bundled')}</div>
    {/if}
    <Button variant="ghost" onclick={close}>{t('common-cancel')}</Button>
    <Button
      variant="primary"
      disabled={saving || !format || !name.trim() || (own && !changed && name === format.name)}
      onclick={save}
    >
      {own ? t('common-save') : t('format-save-own')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .head h2 {
    flex: none;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
  }
  .name {
    flex: 1;
    max-width: 420px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    font-family: var(--font-text);
    font-size: 15px;
    outline: none;
  }
  .name:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }
  .editor {
    display: grid;
    grid-template-columns: 210px minmax(360px, 1fr);
    height: 100%;
    min-height: 0;
    border-top: 1px solid var(--line);
  }
  .editor.with-sample {
    grid-template-columns: 210px minmax(360px, 440px) minmax(0, 1fr);
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 12px 8px;
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }
  nav button {
    min-height: 30px;
    padding: 5px 12px;
    line-height: 1.3;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  nav button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  nav button.current {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .form {
    padding: 18px 24px 28px;
    overflow-y: auto;
    min-width: 0;
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
    margin-top: 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    padding: 0 12px;
  }
  details[open] {
    padding-bottom: 6px;
  }
  summary {
    display: flex;
    align-items: baseline;
    gap: 10px;
    height: 36px;
    line-height: 36px;
    cursor: pointer;
    list-style-position: inside;
  }
  summary span {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  details :global(.row:last-child) {
    border-bottom: none;
  }
  .levels {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .source {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    line-height: 1.5;
  }
  .source .serif {
    margin-top: 2px;
    font-size: 15px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
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
  .sample {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 18px;
    background: var(--paper-sunken);
    border-left: 1px solid var(--line);
    overflow-y: auto;
    transition: opacity var(--slow) var(--ease);
  }
  .sample.working {
    opacity: 0.7;
  }
  .sample img {
    width: 100%;
    max-width: 640px;
    background: #fff;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.12),
      0 6px 18px rgba(0, 0, 0, 0.08);
  }
  .error {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
  .left {
    margin-right: auto;
  }
  .note {
    max-width: 52ch;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.4;
  }
</style>
