<script lang="ts">
  import { untrack } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import {
    documentPreview,
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
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
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
        betweenOther = false;
        name = loaded.kind === 'own' ? loaded.name : `${loaded.name}, changed`;
      } catch (e) {
        error = describeError(e) ?? 'The format could not be read.';
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
      const preview = await documentPreview(r);
      if (mine !== round) return;
      for (const url of pages) URL.revokeObjectURL(url);
      pages = preview.pages
        .slice(0, 6)
        .map((svg) => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
      previewError = null;
    } catch (e) {
      if (mine === round) previewError = describeError(e) ?? 'The sample could not be made.';
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
      notifyOk(`“${saved.name}” is saved among your own formats`);
      onsaved(saved.id);
    } catch (e) {
      error = describeError(e) ?? 'The format could not be saved.';
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (!format || !own) return;
    const ok = await confirm({
      title: `Delete the format “${format.name}”?`,
      message: 'Maps that use it will use the general manuscript format instead.',
      confirm: 'Delete format',
      danger: true,
    });
    if (!ok) return;
    try {
      await formatsDelete(format.id);
      documents.forgetFormat(format.id);
      await documents.reload();
      onsaved(format.basedOn ?? 'manuscript');
    } catch (e) {
      error = describeError(e) ?? 'The format could not be deleted.';
    }
  }

  async function close() {
    if (changed) {
      const ok = await confirm({
        title: 'Leave without saving?',
        message: 'The changes you have made to the format will be lost.',
        confirm: 'Leave',
        cancel: 'Go on editing',
      });
      if (!ok) return;
    }
    onclose();
  }

  const sections: [string, string][] = [
    ['page', 'Page'],
    ['type', 'Type and spacing'],
    ['paragraphs', 'Paragraphs'],
    ['headings', 'Headings'],
    ['title', 'Title and abstract'],
    ['quotations', 'Quotations'],
    ['notes', 'Notes'],
    ['bibliography', 'Bibliography'],
    ['figures', 'Figures and equations'],
    ['margins', 'Page numbers and running head'],
    ['limits', 'Limits'],
    ['about', 'About this format'],
  ];

  const aligns: [Align, string][] = [
    ['left', 'Left'],
    ['center', 'Centred'],
    ['right', 'Right'],
  ];
  const cases: [Case, string][] = [
    ['none', 'As written'],
    ['upper', 'CAPITALS'],
    ['smallcaps', 'Small capitals'],
  ];
  const positions: [Position, string][] = [
    ['top-left', 'Top, left'],
    ['top-center', 'Top, centre'],
    ['top-right', 'Top, right'],
    ['bottom-left', 'Foot, left'],
    ['bottom-center', 'Foot, centre'],
    ['bottom-right', 'Foot, right'],
  ];
  const spacings: [number, string][] = [
    [1, 'Single'],
    [1.15, '1.15'],
    [1.5, 'One and a half'],
    [2, 'Double'],
  ];
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
  let betweenOther = $state(false);

  function between(separator: string): Between {
    if (betweenOther) return 'other';
    return usualBetween.find(([, s]) => s === separator)?.[0] ?? 'other';
  }

  function setBetween(f: DocumentFormat, v: Between) {
    betweenOther = v === 'other';
    const found = usualBetween.find(([k]) => k === v);
    if (found) f.figures.separator = found[1];
  }

  /** The separator as the words of it and whether a line break follows them. */
  function setSeparator(f: DocumentFormat, words: string, ownLine: boolean) {
    betweenOther = true;
    f.figures.separator = words.replaceAll('\n', '') + (ownLine ? '\n' : '');
  }

  function betweenChoices(called: string): [Between, string][] {
    return [
      ['stop', `Full stop (${called}. Caption)`],
      ['colon', `Colon (${called}: Caption)`],
      ['line', 'Caption on a line of its own'],
      ['other', 'Other…'],
    ];
  }

  function lengthOk(value: string): boolean {
    return /^\s*-?\d+([.,]\d+)?\s*(pt|mm|cm|in)\s*$/i.test(value);
  }

  function addLevel() {
    if (!format || format.headings.levels.length >= 6) return;
    const last = format.headings.levels[format.headings.levels.length - 1];
    format.headings.levels.push({ ...last, bold: false, italic: true });
  }

  function levelWords(l: HeadingLevel): string {
    return [
      `${l.size} pt`,
      l.bold ? 'bold' : '',
      l.italic ? 'italic' : '',
      l.case === 'upper' ? 'capitals' : l.case === 'smallcaps' ? 'small capitals' : '',
      l.align === 'center' ? 'centred' : l.align === 'right' ? 'right' : '',
      l.runIn ? 'runs into the text' : '',
    ]
      .filter(Boolean)
      .join(', ');
  }
</script>

{#snippet length(label: string, get: () => string, set: (v: string) => void, hint = '')}
  {@const value = get()}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input
      class="short"
      class:invalid={!lengthOk(value)}
      {value}
      spellcheck="false"
      oninput={(e) => set(e.currentTarget.value)}
    />
  </label>
{/snippet}

{#snippet number(
  label: string,
  get: () => number,
  set: (v: number) => void,
  options: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    hint?: string;
    zero?: string;
  } = {},
)}
  <label class="row">
    <span class="what"
      >{label}{#if options.hint}<small>{options.hint}</small>{/if}</span
    >
    <span class="with-unit">
      <input
        class="short"
        type="number"
        min={options.min ?? 0}
        max={options.max ?? 100}
        step={options.step ?? 0.5}
        value={get()}
        oninput={(e) => {
          const v = Number(e.currentTarget.value);
          if (Number.isFinite(v)) set(v);
        }}
      />
      <em>{options.zero && get() === 0 ? options.zero : (options.unit ?? '')}</em>
    </span>
  </label>
{/snippet}

{#snippet toggle(label: string, get: () => boolean, set: (v: boolean) => void, hint = '')}
  <label class="row check">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input type="checkbox" checked={get()} onchange={(e) => set(e.currentTarget.checked)} />
  </label>
{/snippet}

{#snippet choice<T extends string | number>(
  label: string,
  get: () => T,
  set: (v: T) => void,
  options: [T, string][],
  hint = '',
)}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <select
      value={String(get())}
      onchange={(e) => {
        const found = options.find(([v]) => String(v) === e.currentTarget.value);
        if (found) set(found[0]);
      }}
    >
      {#each options as [value, words] (value)}
        <option value={String(value)}>{words}</option>
      {/each}
      {#if !options.some(([v]) => v === get())}
        <option value={String(get())}>{get()}</option>
      {/if}
    </select>
  </label>
{/snippet}

{#snippet text(label: string, get: () => string, set: (v: string) => void, hint = '')}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input value={get()} oninput={(e) => set(e.currentTarget.value)} />
  </label>
{/snippet}

<Dialog
  open
  title="Document format"
  width={1180}
  tall
  padded={false}
  dismissable={false}
  onclose={close}
>
  {#snippet header()}
    <div class="head">
      <h2>Document format</h2>
      <input
        class="name"
        bind:value={name}
        aria-label="Name of the format"
        placeholder="Name of the format"
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
      <nav aria-label="Parts of the format">
        {#each sections as [key, words] (key)}
          <button type="button" class:current={section === key} onclick={() => (section = key)}
            >{words}</button
          >
        {/each}
      </nav>

      <div class="form">
        {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

        {#if section === 'page'}
          <h3>Page</h3>
          {@render choice(
            'Size',
            () => f.page.size,
            (v) => (f.page.size = v),
            [
              ['a4', 'A4'],
              ['letter', 'US Letter'],
              ['a5', 'A5'],
              ['b5', 'B5'],
              ['legal', 'US Legal'],
              ['custom', 'Another size'],
            ],
          )}
          {#if f.page.size === 'custom'}
            {@render length(
              'Width',
              () => f.page.width,
              (v) => (f.page.width = v),
            )}
            {@render length(
              'Height',
              () => f.page.height,
              (v) => (f.page.height = v),
            )}
          {/if}
          <h4>Margins</h4>
          {@render length(
            'Top',
            () => f.page.marginTop,
            (v) => (f.page.marginTop = v),
          )}
          {@render length(
            'Bottom',
            () => f.page.marginBottom,
            (v) => (f.page.marginBottom = v),
          )}
          {@render length(
            'Left',
            () => f.page.marginLeft,
            (v) => (f.page.marginLeft = v),
          )}
          {@render length(
            'Right',
            () => f.page.marginRight,
            (v) => (f.page.marginRight = v),
          )}
          <p class="hint">Lengths are written with their unit: 2.5cm, 1in, 25mm, 12pt.</p>
          {@render toggle(
            'Number the lines',
            () => f.lineNumbers,
            (v) => (f.lineNumbers = v),
            'As some journals ask for review',
          )}
        {:else if section === 'type'}
          <h3>Type and spacing</h3>
          <label class="row">
            <span class="what"
              >Typeface<small>Where it is not installed, the nearest is used in the preview</small
              ></span
            >
            <input list="fonts" bind:value={f.font.family} />
            <datalist id="fonts">
              {#each fontChoices as family (family)}<option value={family}></option>{/each}
            </datalist>
          </label>
          {@render number(
            'Size',
            () => f.font.size,
            (v) => (f.font.size = v),
            { min: 6, max: 36, unit: 'pt' },
          )}
          {@render choice(
            'Line spacing',
            () => f.text.lineSpacing,
            (v) => (f.text.lineSpacing = v),
            spacings,
          )}
          {@render choice(
            'Alignment',
            () => f.text.align,
            (v) => (f.text.align = v),
            [
              ['left', 'Left, ragged right'],
              ['justified', 'Justified'],
            ],
          )}
          {@render toggle(
            'Divide words at the ends of lines',
            () => f.text.hyphenate,
            (v) => (f.text.hyphenate = v),
          )}
        {:else if section === 'paragraphs'}
          <h3>Paragraphs</h3>
          {@render choice(
            'Paragraphs are told apart by',
            () => f.text.paragraphs,
            (v) => (f.text.paragraphs = v),
            [
              ['indent', 'An indented first line'],
              ['spaced', 'Space between them'],
            ],
          )}
          {#if f.text.paragraphs === 'indent'}
            {@render length(
              'Indent',
              () => f.text.indent,
              (v) => (f.text.indent = v),
            )}
            {@render toggle(
              'Also after a heading',
              () => f.text.indentFirst,
              (v) => (f.text.indentFirst = v),
              'Typographic custom leaves the first paragraph unindented; APA and others indent it',
            )}
          {:else}
            {@render length(
              'Space between paragraphs',
              () => f.text.spaceBetween,
              (v) => (f.text.spaceBetween = v),
            )}
          {/if}
        {:else if section === 'headings'}
          <h3>Headings</h3>
          {@render toggle(
            'Numbered',
            () => f.headings.numbered,
            (v) => (f.headings.numbered = v),
            '1, 1.1, 1.1.1',
          )}
          {#each f.headings.levels as level, i (i)}
            <details open={i === 0}>
              <summary>
                <strong>Level {i + 1}</strong>
                <span>{levelWords(level)}</span>
              </summary>
              {@render number(
                'Size',
                () => level.size,
                (v) => (level.size = v),
                { min: 6, max: 72, unit: 'pt' },
              )}
              {@render toggle(
                'Bold',
                () => level.bold,
                (v) => (level.bold = v),
              )}
              {@render toggle(
                'Italic',
                () => level.italic,
                (v) => (level.italic = v),
              )}
              {@render choice(
                'Letters',
                () => level.case,
                (v) => (level.case = v),
                cases,
              )}
              {@render choice(
                'Alignment',
                () => level.align,
                (v) => (level.align = v),
                aligns,
              )}
              {@render toggle(
                'Indented as a paragraph is',
                () => level.indent,
                (v) => (level.indent = v),
              )}
              {@render toggle(
                'Runs into the text',
                () => level.runIn,
                (v) => (level.runIn = v),
                'The heading begins the paragraph and ends with a full stop',
              )}
              {#if !level.runIn}
                {@render length(
                  'Space before',
                  () => level.spaceBefore,
                  (v) => (level.spaceBefore = v),
                )}
                {@render length(
                  'Space after',
                  () => level.spaceAfter,
                  (v) => (level.spaceAfter = v),
                )}
              {/if}
            </details>
          {/each}
          <div class="levels">
            <Button size="sm" disabled={f.headings.levels.length >= 6} onclick={addLevel}>
              {#snippet icon()}<Plus size={13} />{/snippet}
              A deeper level
            </Button>
            <Button
              size="sm"
              disabled={f.headings.levels.length <= 1}
              onclick={() => f.headings.levels.pop()}
            >
              {#snippet icon()}<Minus size={13} />{/snippet}
              Remove the deepest
            </Button>
          </div>
          <p class="hint">
            Headings deeper than the deepest level described are printed as that level.
          </p>
        {:else if section === 'title'}
          <h3>Title and abstract</h3>
          {@render choice(
            'The title stands',
            () => f.title.placement,
            (v) => (f.title.placement = v),
            [
              ['top', 'At the top of the first page'],
              ['own-page', 'On a page of its own'],
            ],
          )}
          {@render number(
            'Size',
            () => f.title.size,
            (v) => (f.title.size = v),
            { min: 6, max: 72, unit: 'pt' },
          )}
          {@render toggle(
            'Bold',
            () => f.title.bold,
            (v) => (f.title.bold = v),
          )}
          {@render toggle(
            'Italic',
            () => f.title.italic,
            (v) => (f.title.italic = v),
          )}
          {@render choice(
            'Letters',
            () => f.title.case,
            (v) => (f.title.case = v),
            cases,
          )}
          {@render choice(
            'Alignment',
            () => f.title.align,
            (v) => (f.title.align = v),
            aligns,
          )}
          <h4>What is shown</h4>
          {@render toggle(
            'Without the names of the authors',
            () => f.title.anonymous,
            (v) => (f.title.anonymous = v),
            'For review: the authors are left out everywhere, the running head too',
          )}
          {#if !f.title.anonymous}
            {@render toggle(
              'Authors',
              () => f.title.showAuthors,
              (v) => (f.title.showAuthors = v),
            )}
            {@render toggle(
              'Their affiliations',
              () => f.title.showAffiliations,
              (v) => (f.title.showAffiliations = v),
            )}
          {/if}
          {@render toggle(
            'Date',
            () => f.title.showDate,
            (v) => (f.title.showDate = v),
          )}
          {@render toggle(
            'Abstract and keywords',
            () => f.title.showAbstract,
            (v) => (f.title.showAbstract = v),
          )}
          {#if f.title.showAbstract}
            {@render text(
              'Heading of the abstract',
              () => f.title.abstractLabel,
              (v) => (f.title.abstractLabel = v),
            )}
            {@render text(
              'Word before the keywords',
              () => f.title.keywordsLabel,
              (v) => (f.title.keywordsLabel = v),
            )}
          {/if}
        {:else if section === 'quotations'}
          <h3>Quotations set off from the text</h3>
          {@render length(
            'Indent on the left',
            () => f.quote.indentLeft,
            (v) => (f.quote.indentLeft = v),
          )}
          {@render length(
            'Indent on the right',
            () => f.quote.indentRight,
            (v) => (f.quote.indentRight = v),
          )}
          {@render number(
            'Size',
            () => f.quote.size,
            (v) => (f.quote.size = v),
            { max: 36, unit: 'pt', zero: 'as the text', hint: '0 for the size of the text' },
          )}
          {@render choice(
            'Line spacing',
            () => f.quote.lineSpacing,
            (v) => (f.quote.lineSpacing = v),
            [[0, 'As the text'], ...spacings],
          )}
          {@render toggle(
            'Italic',
            () => f.quote.italic,
            (v) => (f.quote.italic = v),
          )}
          <h4>When a quotation is set off</h4>
          {@render number(
            'From this many words',
            () => f.quote.fromWords ?? 0,
            (v) => (f.quote.fromWords = v || null),
            { max: 500, step: 1, zero: 'not said', hint: 'A reminder: the writer decides' },
          )}
          {@render number(
            'Or this many lines',
            () => f.quote.fromLines ?? 0,
            (v) => (f.quote.fromLines = v || null),
            { max: 50, step: 1, zero: 'not said' },
          )}
        {:else if section === 'notes'}
          <h3>Notes</h3>
          {@render choice(
            'Notes stand',
            () => f.notes.kind,
            (v) => (f.notes.kind = v),
            [
              ['footnotes', 'At the foot of the page'],
              ['endnotes', 'At the end of the text'],
            ],
          )}
          {@render number(
            'Size',
            () => f.notes.size,
            (v) => (f.notes.size = v),
            { min: 5, max: 36, unit: 'pt' },
          )}
          {@render choice(
            'Line spacing',
            () => f.notes.lineSpacing,
            (v) => (f.notes.lineSpacing = v),
            spacings,
          )}
          {#if f.notes.kind === 'endnotes'}
            {@render text(
              'Heading of the notes',
              () => f.notes.title,
              (v) => (f.notes.title = v),
            )}
          {/if}
        {:else if section === 'bibliography'}
          <h3>Bibliography</h3>
          {@render text(
            'Heading',
            () => f.bibliography.title,
            (v) => (f.bibliography.title = v),
            'Bibliography, References, Works Cited',
          )}
          {@render toggle(
            'Begins on a new page',
            () => f.bibliography.newPage,
            (v) => (f.bibliography.newPage = v),
          )}
          {@render length(
            'Hanging indent',
            () => f.bibliography.hangingIndent,
            (v) => (f.bibliography.hangingIndent = v),
          )}
          {@render choice(
            'Line spacing',
            () => f.bibliography.lineSpacing,
            (v) => (f.bibliography.lineSpacing = v),
            [[0, 'As the text'], ...spacings],
          )}
          {@render length(
            'Space between entries',
            () => f.bibliography.entrySpacing,
            (v) => (f.bibliography.entrySpacing = v),
          )}
          {@render number(
            'Size',
            () => f.bibliography.size,
            (v) => (f.bibliography.size = v),
            { max: 36, unit: 'pt', zero: 'as the text' },
          )}
          <label class="row">
            <span class="what"
              >Reference style<small
                >The one this format goes with; it is taken when the format is chosen</small
              ></span
            >
            <select
              value={f.style ?? ''}
              onchange={(e) => (f.style = e.currentTarget.value || undefined)}
            >
              <option value="">None in particular</option>
              {#each documents.styles as s (s.id)}
                <option value={s.id}>{s.title}</option>
              {/each}
              {#if f.style && !documents.style(f.style)}<option value={f.style}>{f.style}</option
                >{/if}
            </select>
          </label>
        {:else if section === 'figures'}
          {@const called = f.figures.label.trim() ? `${f.figures.label.trim()} 1` : '1'}
          {@const line = f.figures.placeholder}
          <h3>Figures</h3>
          {@render text(
            'A figure is called',
            () => f.figures.label,
            (v) => (f.figures.label = v),
            'Figure, Fig., Abbildung',
          )}
          {@render toggle(
            'The word and number in bold',
            () => f.figures.labelBold,
            (v) => (f.figures.labelBold = v),
          )}
          {@render toggle(
            'The word and number in italic',
            () => f.figures.labelItalic,
            (v) => (f.figures.labelItalic = v),
          )}
          {@render choice(
            'Between the number and the caption',
            () => between(f.figures.separator),
            (v) => setBetween(f, v),
            betweenChoices(called),
          )}
          {#if between(f.figures.separator) === 'other'}
            {@render text(
              'What stands between them',
              () => f.figures.separator.replaceAll('\n', ''),
              (v) => setSeparator(f, v, f.figures.separator.includes('\n')),
              'Spaces count: write them where they are wanted',
            )}
            {@render toggle(
              'Then the caption on a line of its own',
              () => f.figures.separator.includes('\n'),
              (v) => setSeparator(f, f.figures.separator, v),
            )}
          {/if}
          <h4>Caption</h4>
          {@render choice(
            'The caption stands',
            () => f.figures.captionPosition,
            (v) => (f.figures.captionPosition = v),
            [
              ['below', 'Below the picture'],
              ['above', 'Above the picture'],
            ],
          )}
          {@render choice(
            'Alignment',
            () => f.figures.captionAlign,
            (v) => (f.figures.captionAlign = v),
            [...aligns, ['justified', 'Justified']],
          )}
          {@render number(
            'Size',
            () => f.figures.captionSize,
            (v) => (f.figures.captionSize = v),
            { max: 36, unit: 'pt', zero: 'as the text', hint: '0 for the size of the text' },
          )}
          {@render toggle(
            'Italic',
            () => f.figures.captionItalic,
            (v) => (f.figures.captionItalic = v),
          )}
          {@render choice(
            'Line spacing',
            () => f.figures.captionLineSpacing,
            (v) => (f.figures.captionLineSpacing = v),
            [[0, 'As the text'], ...spacings],
          )}
          <div class="row">
            <span class="what">As it will stand</span>
            <span class="example"
              ><span class:bold={f.figures.labelBold} class:italic={f.figures.labelItalic}
                >{called}</span
              >{f.figures.separator}<span class:italic={f.figures.captionItalic}>Caption</span
              ></span
            >
          </div>
          <h4>Where figures stand</h4>
          {@render choice(
            'Figures stand',
            () => f.figures.placement,
            (v) => (f.figures.placement = v),
            [
              ['in-text', 'In the text'],
              ['at-end', 'Gathered at the end'],
            ],
            'Many journals ask for them at the end of a manuscript',
          )}
          {#if f.figures.placement === 'at-end'}
            {@render text(
              'Heading over the figures',
              () => f.figures.endTitle,
              (v) => (f.figures.endTitle = v),
              'Figures, Illustrations; empty for none',
            )}
            <label class="row">
              <span class="what"
                >Line left in the text<small
                  >{line.includes('{}')
                    ? `{} stands for the word and number: ${line.replace('{}', () => called)}`
                    : 'It must hold {}, where the word and number go'}</small
                ></span
              >
              <input
                class:invalid={!line.includes('{}')}
                bind:value={f.figures.placeholder}
                spellcheck="false"
              />
            </label>
          {/if}
          <h3>Equations</h3>
          {@render text(
            'Before the number',
            () => f.equations.beforeNumber,
            (v) => (f.equations.beforeNumber = v),
          )}
          {@render text(
            'After the number',
            () => f.equations.afterNumber,
            (v) => (f.equations.afterNumber = v),
          )}
          <div class="row">
            <span class="what">As it will stand</span>
            <span class="example">{f.equations.beforeNumber}1{f.equations.afterNumber}</span>
          </div>
        {:else if section === 'margins'}
          <h3>Page numbers</h3>
          {@render toggle(
            'Pages are numbered',
            () => f.pageNumbers.show,
            (v) => (f.pageNumbers.show = v),
          )}
          {#if f.pageNumbers.show}
            {@render choice(
              'Where',
              () => f.pageNumbers.position,
              (v) => (f.pageNumbers.position = v),
              positions,
            )}
            {@render toggle(
              'On the first page too',
              () => f.pageNumbers.firstPage,
              (v) => (f.pageNumbers.firstPage = v),
            )}
          {/if}
          <h3>Running head</h3>
          {@render choice(
            'At the top of every page',
            () => f.runningHead.content,
            (v) => (f.runningHead.content = v),
            [
              ['none', 'Nothing'],
              ['title', 'The title'],
              ['author', 'The authors'],
              ['author-title', 'Authors and title'],
              ['text', 'Words of my own'],
            ],
          )}
          {#if f.runningHead.content === 'text'}
            {@render text(
              'The words',
              () => f.runningHead.text,
              (v) => (f.runningHead.text = v),
            )}
          {/if}
          {#if f.runningHead.content !== 'none'}
            {@render choice(
              'Alignment',
              () => f.runningHead.align,
              (v) => (f.runningHead.align = v),
              aligns,
            )}
            {@render choice(
              'Letters',
              () => f.runningHead.case,
              (v) => (f.runningHead.case = v),
              cases.slice(0, 2),
            )}
          {/if}
        {:else if section === 'limits'}
          <h3>Limits</h3>
          <p class="hint top">
            The preview counts the words of the text against these, and the dialog for title and
            abstract counts against the others. Nothing is cut.
          </p>
          {@render number(
            'Words of text',
            () => f.limits.words ?? 0,
            (v) => (f.limits.words = v || null),
            { max: 1000000, step: 500, zero: 'no limit' },
          )}
          {@render number(
            'Words of abstract',
            () => f.limits.abstractWords ?? 0,
            (v) => (f.limits.abstractWords = v || null),
            { max: 5000, step: 10, zero: 'no limit' },
          )}
          {@render number(
            'Keywords',
            () => f.limits.keywords ?? 0,
            (v) => (f.limits.keywords = v || null),
            { max: 50, step: 1, zero: 'no limit' },
          )}
          <label class="row tall">
            <span class="what">What the limits count</span>
            <textarea
              rows="3"
              bind:value={f.limits.note}
              placeholder="Notes included; bibliography not"></textarea>
          </label>
        {:else if section === 'about'}
          <h3>About this format</h3>
          <label class="row tall">
            <span class="what">Description</span>
            <textarea rows="3" bind:value={f.description}></textarea>
          </label>
          {#if f.source?.name}
            {@const s = f.source}
            <div class="source selectable">
              <p class="overline">Where the requirements are from</p>
              <p class="serif">{s.name}</p>
              {#if s.url}
                <button type="button" class="link" onclick={() => openPath(s.url).catch(() => {})}>
                  {s.url}
                  <ExternalLink size={11} />
                </button>
              {/if}
              <p class="read">
                Read {s.checked}.
                {s.confidence === 'high'
                  ? 'The values are those of the source.'
                  : s.confidence === 'medium'
                    ? 'The source could only be read in part or in an earlier state: check what matters to you.'
                    : 'Little could be verified: treat the values as a beginning.'}
              </p>
              {#if s.notes}<p class="notes">{s.notes}</p>{/if}
              {#if own}<p class="notes">
                  You have changed this format; the source describes what it was made from.
                </p>{/if}
            </div>
          {:else}
            <p class="hint top">This format follows no publisher’s requirements in particular.</p>
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
              <img src={url} alt="Sample page {i + 1}" draggable="false" />
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#snippet footer()}
    {#if own}
      <div class="left"><Button variant="danger" onclick={remove}>Delete this format</Button></div>
    {:else}
      <div class="left note">
        Formats that come with Glaukopis stay as they are. Your changes are saved as a format of
        your own.
      </div>
    {/if}
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button
      variant="primary"
      disabled={saving || !format || !name.trim() || (own && !changed && name === format.name)}
      onclick={save}
    >
      {own ? 'Save' : 'Save as my own'}
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
  h3 {
    margin: 0 0 12px;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 500;
  }
  h3:not(:first-child) {
    margin-top: 26px;
  }
  h4 {
    margin: 18px 0 6px;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 14px;
    align-items: center;
    min-height: 38px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
  }
  .row.tall {
    align-items: start;
    padding: 8px 0;
  }
  .row.check {
    grid-template-columns: minmax(0, 1fr) auto;
    cursor: pointer;
  }
  .what {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .what small {
    font-size: var(--text-xs);
    color: var(--ink-3);
    line-height: 1.35;
  }
  input:not([type='checkbox']),
  select,
  textarea {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  textarea {
    height: auto;
    padding: 6px 8px;
    resize: vertical;
    line-height: 1.45;
  }
  :is(input, select, textarea):focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input.short {
    width: 96px;
    justify-self: end;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  input.invalid {
    border-color: var(--danger);
  }
  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    justify-self: end;
    margin: 0;
  }
  .with-unit {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .with-unit em {
    min-width: 34px;
    font-style: normal;
    font-size: var(--text-sm);
    color: var(--ink-3);
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
  .hint {
    margin-top: 10px;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.5;
  }
  .hint.top {
    margin: 0 0 12px;
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
  details .row:last-child {
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
