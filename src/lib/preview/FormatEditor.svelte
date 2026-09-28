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

  const aligns: [Align, string][] = $derived([
    ['left', t('format-align-left')],
    ['center', t('format-align-center')],
    ['right', t('format-align-right')],
  ]);
  const cases: [Case, string][] = $derived([
    ['none', t('format-case-none')],
    ['upper', t('format-case-upper')],
    ['smallcaps', t('format-case-smallcaps')],
  ]);
  const positions: [Position, string][] = $derived([
    ['top-left', t('format-position-top-left')],
    ['top-center', t('format-position-top-center')],
    ['top-right', t('format-position-top-right')],
    ['bottom-left', t('format-position-bottom-left')],
    ['bottom-center', t('format-position-bottom-center')],
    ['bottom-right', t('format-position-bottom-right')],
  ]);
  const spacings: [number, string][] = $derived([
    [1, t('format-spacing-single')],
    [1.15, (1.15).toLocaleString(languages.current)],
    [1.5, t('format-spacing-one-and-a-half')],
    [2, t('format-spacing-double')],
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

  const stands: ['left' | 'center' | 'right', string][] = $derived([
    ['left', t('format-stands-left')],
    ['center', t('format-stands-center')],
    ['right', t('format-stands-right')],
  ]);

  function betweenChoices(called: string, kind: CaptionedKind): [Between, string][] {
    return [
      ['stop', t('format-between-stop', { called, kind })],
      ['colon', t('format-between-colon', { called, kind })],
      ['line', t('format-between-line', { kind })],
      ['other', t('format-between-other')],
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

{#snippet captioned(c: Captioned, kind: CaptionedKind)}
  {@const called = c.label.trim() ? `${c.label.trim()} 1` : '1'}
  {@const line = c.placeholder}
  {@render text(
    t('format-captioned-called', { kind }),
    () => c.label,
    (v) => (c.label = v),
    t('format-captioned-called-hint', { kind }),
  )}
  {@render text(
    t('format-captioned-reference'),
    () => c.reference ?? '',
    (v) => (c.reference = v),
    t('format-captioned-reference-hint', { kind }),
  )}
  {@render toggle(
    t('format-captioned-label-bold'),
    () => c.labelBold,
    (v) => (c.labelBold = v),
  )}
  {@render toggle(
    t('format-captioned-label-italic'),
    () => c.labelItalic,
    (v) => (c.labelItalic = v),
  )}
  {@render choice(
    t('format-captioned-between', { kind }),
    () => between(c.separator, kind),
    (v) => setBetween(c, v, kind),
    betweenChoices(called, kind),
  )}
  {#if between(c.separator, kind) === 'other'}
    {@render text(
      t('format-captioned-separator'),
      () => c.separator.replaceAll('\n', ''),
      (v) => setSeparator(c, v, c.separator.includes('\n'), kind),
      t('format-captioned-separator-hint'),
    )}
    {@render toggle(
      t('format-captioned-own-line', { kind }),
      () => c.separator.includes('\n'),
      (v) => setSeparator(c, c.separator, v, kind),
    )}
  {/if}
  <h4>{t('format-caption', { kind })}</h4>
  {@render choice(
    t('format-caption-stands', { kind }),
    () => c.captionPosition,
    (v) => (c.captionPosition = v),
    [
      ['below', t('format-caption-below', { kind })],
      ['above', t('format-caption-above', { kind })],
    ],
  )}
  {@render choice(
    t('format-alignment'),
    () => c.captionAlign,
    (v) => (c.captionAlign = v),
    [...aligns, ['justified', t('format-align-justified')]],
    t('format-caption-align-hint', { kind }),
  )}
  {@render number(
    t('format-size'),
    () => c.captionSize,
    (v) => (c.captionSize = v),
    {
      max: 36,
      unit: 'pt',
      zero: t('format-as-the-text-zero'),
      hint: t('format-size-zero-hint'),
    },
  )}
  {@render toggle(
    t('format-italic'),
    () => c.captionItalic,
    (v) => (c.captionItalic = v),
  )}
  {@render choice(
    t('format-line-spacing'),
    () => c.captionLineSpacing,
    (v) => (c.captionLineSpacing = v),
    [[0, t('format-as-the-text')], ...spacings],
  )}
  <div class="row">
    <span class="what">{t('format-as-it-will-stand')}</span>
    <span class="example"
      ><span class:bold={c.labelBold} class:italic={c.labelItalic}>{called}</span>{c.separator}<span
        class:italic={c.captionItalic}>{t('format-caption-example', { kind })}</span
      ></span
    >
  </div>
  <h4>{t('format-captioned-where', { kind })}</h4>
  {@render choice(
    t('format-captioned-stand', { kind }),
    () => c.align,
    (v) => (c.align = v),
    stands,
    t('format-unless-said'),
  )}
  {#if c.align !== 'center'}
    {@render toggle(
      t('format-captioned-wrap'),
      () => c.wrap,
      (v) => (c.wrap = v),
      t('format-unless-said'),
    )}
  {/if}
  {@render choice(
    t('format-captioned-placement'),
    () => c.placement,
    (v) => (c.placement = v),
    [
      ['in-text', t('format-captioned-in-text')],
      ['at-end', t('format-captioned-at-end')],
    ],
    t('format-captioned-placement-hint'),
  )}
  {#if c.placement === 'at-end'}
    {@render text(
      t('format-captioned-end-title', { kind }),
      () => c.endTitle,
      (v) => (c.endTitle = v),
      t('format-captioned-end-title-hint', { kind }),
    )}
    <label class="row">
      <span class="what"
        >{t('format-captioned-placeholder')}<small
          >{line.includes('{}')
            ? t('format-captioned-placeholder-shown', {
                line: line.replace('{}', () => called),
              })
            : t('format-captioned-placeholder-missing')}</small
        ></span
      >
      <input class:invalid={!line.includes('{}')} bind:value={c.placeholder} spellcheck="false" />
    </label>
  {/if}
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

      <div class="form">
        {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

        {#if section === 'page'}
          <h3>{t('format-section-page')}</h3>
          {@render choice(
            t('format-size'),
            () => f.page.size,
            (v) => (f.page.size = v),
            [
              ['a4', 'A4'],
              ['letter', 'US Letter'],
              ['a5', 'A5'],
              ['b5', 'B5'],
              ['legal', 'US Legal'],
              ['custom', t('format-page-custom')],
            ],
          )}
          {#if f.page.size === 'custom'}
            {@render length(
              t('format-page-width'),
              () => f.page.width,
              (v) => (f.page.width = v),
            )}
            {@render length(
              t('format-page-height'),
              () => f.page.height,
              (v) => (f.page.height = v),
            )}
          {/if}
          <h4>{t('format-margins')}</h4>
          {@render length(
            t('format-margin-top'),
            () => f.page.marginTop,
            (v) => (f.page.marginTop = v),
          )}
          {@render length(
            t('format-margin-bottom'),
            () => f.page.marginBottom,
            (v) => (f.page.marginBottom = v),
          )}
          {@render length(
            t('format-margin-left'),
            () => f.page.marginLeft,
            (v) => (f.page.marginLeft = v),
          )}
          {@render length(
            t('format-margin-right'),
            () => f.page.marginRight,
            (v) => (f.page.marginRight = v),
          )}
          <p class="hint">{t('format-lengths-hint')}</p>
          {@render toggle(
            t('format-line-numbers'),
            () => f.lineNumbers,
            (v) => (f.lineNumbers = v),
            t('format-line-numbers-hint'),
          )}
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
          {@render number(
            t('format-size'),
            () => f.font.size,
            (v) => (f.font.size = v),
            { min: 6, max: 36, unit: 'pt' },
          )}
          {@render choice(
            t('format-line-spacing'),
            () => f.text.lineSpacing,
            (v) => (f.text.lineSpacing = v),
            spacings,
          )}
          {@render choice(
            t('format-alignment'),
            () => f.text.align,
            (v) => (f.text.align = v),
            [
              ['left', t('format-align-ragged')],
              ['justified', t('format-align-justified')],
            ],
          )}
          {@render toggle(
            t('format-hyphenate'),
            () => f.text.hyphenate,
            (v) => (f.text.hyphenate = v),
          )}
        {:else if section === 'paragraphs'}
          <h3>{t('format-section-paragraphs')}</h3>
          {@render choice(
            t('format-paragraphs'),
            () => f.text.paragraphs,
            (v) => (f.text.paragraphs = v),
            [
              ['indent', t('format-paragraphs-indent')],
              ['spaced', t('format-paragraphs-spaced')],
            ],
          )}
          {#if f.text.paragraphs === 'indent'}
            {@render length(
              t('format-indent'),
              () => f.text.indent,
              (v) => (f.text.indent = v),
            )}
            {@render toggle(
              t('format-indent-first'),
              () => f.text.indentFirst,
              (v) => (f.text.indentFirst = v),
              t('format-indent-first-hint'),
            )}
          {:else}
            {@render length(
              t('format-space-between'),
              () => f.text.spaceBetween,
              (v) => (f.text.spaceBetween = v),
            )}
          {/if}
        {:else if section === 'headings'}
          <h3>{t('format-section-headings')}</h3>
          {@render toggle(
            t('format-numbered'),
            () => f.headings.numbered,
            (v) => (f.headings.numbered = v),
            '1, 1.1, 1.1.1',
          )}
          {#each f.headings.levels as level, i (i)}
            <details open={i === 0}>
              <summary>
                <strong>{t('format-level', { number: i + 1 })}</strong>
                <span>{levelWords(level)}</span>
              </summary>
              {@render number(
                t('format-size'),
                () => level.size,
                (v) => (level.size = v),
                { min: 6, max: 72, unit: 'pt' },
              )}
              {@render toggle(
                t('format-bold'),
                () => level.bold,
                (v) => (level.bold = v),
              )}
              {@render toggle(
                t('format-italic'),
                () => level.italic,
                (v) => (level.italic = v),
              )}
              {@render choice(
                t('format-letters'),
                () => level.case,
                (v) => (level.case = v),
                cases,
              )}
              {@render choice(
                t('format-alignment'),
                () => level.align,
                (v) => (level.align = v),
                aligns,
              )}
              {@render toggle(
                t('format-level-indent'),
                () => level.indent,
                (v) => (level.indent = v),
              )}
              {@render toggle(
                t('format-level-run-in-label'),
                () => level.runIn,
                (v) => (level.runIn = v),
                t('format-level-run-in-hint'),
              )}
              {#if !level.runIn}
                {@render length(
                  t('format-space-before'),
                  () => level.spaceBefore,
                  (v) => (level.spaceBefore = v),
                )}
                {@render length(
                  t('format-space-after'),
                  () => level.spaceAfter,
                  (v) => (level.spaceAfter = v),
                )}
              {/if}
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
          <h3>{t('format-section-title')}</h3>
          {@render choice(
            t('format-title-placement'),
            () => f.title.placement,
            (v) => (f.title.placement = v),
            [
              ['top', t('format-title-top')],
              ['own-page', t('format-title-own-page')],
            ],
          )}
          {@render number(
            t('format-size'),
            () => f.title.size,
            (v) => (f.title.size = v),
            { min: 6, max: 72, unit: 'pt' },
          )}
          {@render toggle(
            t('format-bold'),
            () => f.title.bold,
            (v) => (f.title.bold = v),
          )}
          {@render toggle(
            t('format-italic'),
            () => f.title.italic,
            (v) => (f.title.italic = v),
          )}
          {@render choice(
            t('format-letters'),
            () => f.title.case,
            (v) => (f.title.case = v),
            cases,
          )}
          {@render choice(
            t('format-alignment'),
            () => f.title.align,
            (v) => (f.title.align = v),
            aligns,
          )}
          <h4>{t('format-title-shown')}</h4>
          {@render toggle(
            t('format-title-anonymous'),
            () => f.title.anonymous,
            (v) => (f.title.anonymous = v),
            t('format-title-anonymous-hint'),
          )}
          {#if !f.title.anonymous}
            {@render toggle(
              t('format-title-authors'),
              () => f.title.showAuthors,
              (v) => (f.title.showAuthors = v),
            )}
            {@render toggle(
              t('format-title-affiliations'),
              () => f.title.showAffiliations,
              (v) => (f.title.showAffiliations = v),
            )}
          {/if}
          {@render toggle(
            t('format-title-date'),
            () => f.title.showDate,
            (v) => (f.title.showDate = v),
          )}
          {@render toggle(
            t('format-title-abstract'),
            () => f.title.showAbstract,
            (v) => (f.title.showAbstract = v),
          )}
          {#if f.title.showAbstract}
            {@render text(
              t('format-title-abstract-label'),
              () => f.title.abstractLabel,
              (v) => (f.title.abstractLabel = v),
            )}
            {@render text(
              t('format-title-keywords-label'),
              () => f.title.keywordsLabel,
              (v) => (f.title.keywordsLabel = v),
            )}
          {/if}
        {:else if section === 'quotations'}
          <h3>{t('format-quotations')}</h3>
          {@render length(
            t('format-quote-indent-left'),
            () => f.quote.indentLeft,
            (v) => (f.quote.indentLeft = v),
          )}
          {@render length(
            t('format-quote-indent-right'),
            () => f.quote.indentRight,
            (v) => (f.quote.indentRight = v),
          )}
          {@render number(
            t('format-size'),
            () => f.quote.size,
            (v) => (f.quote.size = v),
            {
              max: 36,
              unit: 'pt',
              zero: t('format-as-the-text-zero'),
              hint: t('format-size-zero-hint'),
            },
          )}
          {@render choice(
            t('format-line-spacing'),
            () => f.quote.lineSpacing,
            (v) => (f.quote.lineSpacing = v),
            [[0, t('format-as-the-text')], ...spacings],
          )}
          {@render toggle(
            t('format-italic'),
            () => f.quote.italic,
            (v) => (f.quote.italic = v),
          )}
          <h4>{t('format-quote-when')}</h4>
          {@render number(
            t('format-quote-from-words'),
            () => f.quote.fromWords ?? 0,
            (v) => (f.quote.fromWords = v || null),
            {
              max: 500,
              step: 1,
              zero: t('format-not-said'),
              hint: t('format-quote-from-words-hint'),
            },
          )}
          {@render number(
            t('format-quote-from-lines'),
            () => f.quote.fromLines ?? 0,
            (v) => (f.quote.fromLines = v || null),
            { max: 50, step: 1, zero: t('format-not-said') },
          )}
        {:else if section === 'notes'}
          <h3>{t('format-section-notes')}</h3>
          {@render choice(
            t('format-notes-kind'),
            () => f.notes.kind,
            (v) => (f.notes.kind = v),
            [
              ['footnotes', t('format-notes-footnotes')],
              ['endnotes', t('format-notes-endnotes')],
            ],
          )}
          {@render number(
            t('format-size'),
            () => f.notes.size,
            (v) => (f.notes.size = v),
            { min: 5, max: 36, unit: 'pt' },
          )}
          {@render choice(
            t('format-line-spacing'),
            () => f.notes.lineSpacing,
            (v) => (f.notes.lineSpacing = v),
            spacings,
          )}
          {#if f.notes.kind === 'endnotes'}
            {@render text(
              t('format-notes-title'),
              () => f.notes.title,
              (v) => (f.notes.title = v),
            )}
          {/if}
        {:else if section === 'bibliography'}
          <h3>{t('format-section-bibliography')}</h3>
          {@render text(
            t('format-bibliography-title'),
            () => f.bibliography.title,
            (v) => (f.bibliography.title = v),
            t('format-bibliography-title-hint'),
          )}
          {@render toggle(
            t('format-bibliography-new-page'),
            () => f.bibliography.newPage,
            (v) => (f.bibliography.newPage = v),
          )}
          {@render length(
            t('format-bibliography-hanging-indent'),
            () => f.bibliography.hangingIndent,
            (v) => (f.bibliography.hangingIndent = v),
          )}
          {@render choice(
            t('format-line-spacing'),
            () => f.bibliography.lineSpacing,
            (v) => (f.bibliography.lineSpacing = v),
            [[0, t('format-as-the-text')], ...spacings],
          )}
          {@render length(
            t('format-bibliography-entry-spacing'),
            () => f.bibliography.entrySpacing,
            (v) => (f.bibliography.entrySpacing = v),
          )}
          {@render number(
            t('format-size'),
            () => f.bibliography.size,
            (v) => (f.bibliography.size = v),
            { max: 36, unit: 'pt', zero: t('format-as-the-text-zero') },
          )}
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
          {@render captioned(f.figures, 'figure')}
          <h3>{t('format-tables')}</h3>
          {@render captioned(f.tables, 'table')}
          <h4>{t('format-table-itself')}</h4>
          {@render choice(
            t('format-table-rules'),
            () => f.tables.rules,
            (v) => (f.tables.rules = v),
            [
              ['horizontal', t('format-table-rules-horizontal')],
              ['grid', t('format-table-rules-grid')],
              ['none', t('format-table-rules-none')],
            ],
            t('format-table-rules-hint'),
          )}
          {@render toggle(
            t('format-table-header-bold'),
            () => f.tables.headerBold,
            (v) => (f.tables.headerBold = v),
          )}
          {@render number(
            t('format-size'),
            () => f.tables.size,
            (v) => (f.tables.size = v),
            {
              max: 36,
              unit: 'pt',
              zero: t('format-as-the-text-zero'),
              hint: t('format-size-zero-hint'),
            },
          )}
          {@render choice(
            t('format-line-spacing'),
            () => f.tables.lineSpacing,
            (v) => (f.tables.lineSpacing = v),
            [[0, t('format-as-the-text')], ...spacings],
          )}
          <h3>{t('format-equations')}</h3>
          {@render choice(
            t('format-equations-stand'),
            () => f.equations.align,
            (v) => (f.equations.align = v),
            stands,
            t('format-unless-said'),
          )}
          {@render text(
            t('format-equations-before'),
            () => f.equations.beforeNumber,
            (v) => (f.equations.beforeNumber = v),
          )}
          {@render text(
            t('format-equations-after'),
            () => f.equations.afterNumber,
            (v) => (f.equations.afterNumber = v),
          )}
          <div class="row">
            <span class="what">{t('format-as-it-will-stand')}</span>
            <span class="example">{f.equations.beforeNumber}1{f.equations.afterNumber}</span>
          </div>
        {:else if section === 'margins'}
          <h3>{t('format-page-numbers')}</h3>
          {@render toggle(
            t('format-page-numbers-show'),
            () => f.pageNumbers.show,
            (v) => (f.pageNumbers.show = v),
          )}
          {#if f.pageNumbers.show}
            {@render choice(
              t('format-page-numbers-where'),
              () => f.pageNumbers.position,
              (v) => (f.pageNumbers.position = v),
              positions,
            )}
            {@render toggle(
              t('format-page-numbers-first'),
              () => f.pageNumbers.firstPage,
              (v) => (f.pageNumbers.firstPage = v),
            )}
          {/if}
          <h3>{t('format-running-head')}</h3>
          {@render choice(
            t('format-running-head-content'),
            () => f.runningHead.content,
            (v) => (f.runningHead.content = v),
            [
              ['none', t('format-running-head-none')],
              ['title', t('format-running-head-title')],
              ['author', t('format-running-head-author')],
              ['author-title', t('format-running-head-author-title')],
              ['text', t('format-running-head-text')],
            ],
          )}
          {#if f.runningHead.content === 'text'}
            {@render text(
              t('format-running-head-words'),
              () => f.runningHead.text,
              (v) => (f.runningHead.text = v),
            )}
          {/if}
          {#if f.runningHead.content !== 'none'}
            {@render choice(
              t('format-alignment'),
              () => f.runningHead.align,
              (v) => (f.runningHead.align = v),
              aligns,
            )}
            {@render choice(
              t('format-letters'),
              () => f.runningHead.case,
              (v) => (f.runningHead.case = v),
              cases.slice(0, 2),
            )}
          {/if}
        {:else if section === 'limits'}
          <h3>{t('format-section-limits')}</h3>
          <p class="hint top">{t('format-limits-hint')}</p>
          {@render number(
            t('format-limits-words'),
            () => f.limits.words ?? 0,
            (v) => (f.limits.words = v || null),
            { max: 1000000, step: 500, zero: t('format-no-limit') },
          )}
          {@render number(
            t('format-limits-abstract-words'),
            () => f.limits.abstractWords ?? 0,
            (v) => (f.limits.abstractWords = v || null),
            { max: 5000, step: 10, zero: t('format-no-limit') },
          )}
          {@render number(
            t('format-limits-keywords'),
            () => f.limits.keywords ?? 0,
            (v) => (f.limits.keywords = v || null),
            { max: 50, step: 1, zero: t('format-no-limit') },
          )}
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
