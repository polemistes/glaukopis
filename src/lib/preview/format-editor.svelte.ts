/**
 * The editor of a document format, as it is asked for from anywhere in the
 * view of a project: from the preview, and from the tools for writing,
 * which open it at the look of a kind. The view mounts it once
 * (`ProjectView.svelte`).
 *
 * With it, the rows by which the look of a kind of paragraph or of words is
 * set, which the editor and the dialog for a kind of the writer's own share
 * (`PassageKindDialog.svelte`): what is not said is as the kind it is based
 * on has it. See ADR 0029.
 */

import type { DocumentFormat, KindFamily, Look } from '$lib/api/documents';
import { t } from '$lib/i18n';
import { lengthOk, rowsOf, type Choices, type Row } from '$lib/ui/settings/rows';

export interface FormatEditorRequest {
  /** The format to begin from. */
  id: string;
  /** The map whose document the format is shown on; the caller gives the map the format that is saved. */
  map?: string;
  /** The part of the format to open at: `kinds`, `page`, … */
  section?: string;
  /** The kind whose look is to be in view, in the part of the kinds. */
  kind?: string;
  /** Called with the id of the format as saved. */
  onsaved?: (id: string) => void;
}

class FormatEditorUi {
  /** What the editor is asked for; nothing while it is closed. */
  request = $state.raw<FormatEditorRequest | null>(null);

  open(request: FormatEditorRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const formatEditorUi = new FormatEditorUi();

// ---- the rows of a look ----

/** Where the rows of a look find it in what they set, and how they change it. */
export interface LookReach<T> {
  /** The look as it is; nothing where nothing is said of it yet. */
  get(target: T): Look | undefined;
  /** Says a measure of the look, or, with nothing, leaves it unsaid. */
  set(target: T, key: keyof Look, value: unknown): void;
}

/** The measures that are lengths, written with their unit. */
const LENGTHS: (keyof Look)[] = [
  'indentLeft',
  'indentRight',
  'firstLine',
  'spaceBefore',
  'spaceAfter',
];

/** Whether nothing is said: a measure left unsaid is as the base has it. */
export function unsaid(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Whether every length of a look is written with its unit; one that is unsaid is well. */
export function lengthsOk(look: Look | undefined): boolean {
  return LENGTHS.every((key) => {
    const value = look?.[key];
    return unsaid(value) || lengthOk(String(value));
  });
}

/**
 * Says a measure of a kind in a format, or leaves it unsaid. The format
 * says nothing of a kind of which nothing is left, and has no table of
 * kinds when it is empty, so that what is saved stays small.
 */
export function setKindLook(format: DocumentFormat, id: string, key: keyof Look, value: unknown) {
  if (unsaid(value)) {
    const look = format.kinds?.[id];
    if (!look || !format.kinds) return;
    delete look[key];
    if (Object.keys(look).length) return;
    delete format.kinds[id];
    if (!Object.keys(format.kinds).length) delete format.kinds;
    return;
  }
  format.kinds ??= {};
  const look = (format.kinds[id] ??= {}) as Record<string, unknown>;
  look[key] = value;
}

/**
 * The rows by which a look is set, for a kind of one family: each measure
 * as the base has it unless something is said. A kind of paragraph has
 * them all; a kind of words only what words can have. With `sign`, a row
 * for what stands in a break.
 */
export function lookRows<T>(
  family: KindFamily,
  reach: LookReach<T>,
  options: { sign?: boolean } = {},
): Row<T>[] {
  const { text, number, choice } = rowsOf<T>();
  const asBase = t('format-as-the-base');
  const get = (target: T, key: keyof Look) => reach.get(target)?.[key];

  /** As the base, yes, or no. */
  const yesNo = (label: string, key: keyof Look, hint?: string) =>
    choice(
      label,
      {
        get: (target) => {
          const value = get(target, key);
          return unsaid(value) ? '' : value ? 'yes' : 'no';
        },
        set: (target, value) =>
          reach.set(target, key, value === 'yes' ? true : value === 'no' ? false : undefined),
      },
      [
        ['', asBase],
        ['yes', t('format-yes')],
        ['no', t('format-no')],
      ],
      { hint },
    );
  /** One of a few words, or as the base. */
  const oneOf = (label: string, key: keyof Look, choices: Choices) =>
    choice(
      label,
      {
        get: (target) => String(get(target, key) ?? ''),
        set: (target, value) => reach.set(target, key, value === '' ? undefined : value),
      },
      [['', asBase], ...choices],
    );
  /** A length with its unit, or nothing for as the base. */
  const length = (label: string, key: keyof Look, hint?: string) =>
    text(
      label,
      {
        get: (target) => String(get(target, key) ?? ''),
        set: (target, value) => reach.set(target, key, value.trim() || undefined),
      },
      { placeholder: asBase, hint },
    );

  const italic = yesNo(t('format-italic'), 'italic');
  const bold = yesNo(t('format-bold'), 'bold');
  const underline = yesNo(t('format-underline'), 'underline');
  const letters = oneOf(t('format-letters'), 'case', [
    ['none', t('format-case-none')],
    ['upper', t('format-case-upper')],
    ['smallcaps', t('format-case-smallcaps')],
  ]);
  const size = number(
    t('format-size'),
    {
      get: (target) => (get(target, 'size') as number | undefined) ?? null,
      set: (target, value) => reach.set(target, 'size', value ?? undefined),
    },
    { min: 5, max: 72, unit: 'pt', nullable: true, blank: t('format-as-the-base-blank') },
  );
  const monospace = yesNo(t('format-equal-width'), 'monospace', t('format-equal-width-hint'));

  if (family === 'words') return [italic, bold, underline, letters, monospace, size];
  return [
    italic,
    bold,
    underline,
    letters,
    oneOf(t('format-alignment'), 'align', [
      ['left', t('format-align-left')],
      ['center', t('format-align-center')],
      ['right', t('format-align-right')],
      ['justified', t('format-align-justified')],
    ]),
    length(t('format-indent-left'), 'indentLeft'),
    length(t('format-indent-right'), 'indentRight'),
    length(t('format-first-line'), 'firstLine', t('format-first-line-hint')),
    length(t('format-space-before'), 'spaceBefore'),
    length(t('format-space-after'), 'spaceAfter'),
    size,
    monospace,
    yesNo(t('format-keep-with-next'), 'keepWithNext', t('format-keep-with-next-hint')),
    yesNo(t('format-new-page'), 'newPage'),
    ...(options.sign
      ? [
          text(
            t('format-break-text'),
            {
              get: (target) => String(get(target, 'text') ?? ''),
              set: (target, value) => reach.set(target, 'text', value || undefined),
            },
            { hint: t('format-break-text-hint'), placeholder: asBase, literal: true },
          ),
        ]
      : []),
  ];
}

/**
 * What a look says, in a few words: "italic, 10 pt, centred". Nothing where
 * nothing is said. For the line that sums up a kind, as `levelWords` does a
 * level of headings in the format editor.
 */
export function lookWords(look: Look | undefined, family: KindFamily): string {
  if (!look) return '';
  const out: string[] = [];
  const said = (value: boolean | undefined, yes: string, no: string) => {
    if (value === true) out.push(yes);
    else if (value === false) out.push(no);
  };
  const measure = (value: string | undefined, id: string) => {
    if (!unsaid(value)) out.push(t(id, { length: String(value) }));
  };
  if (!unsaid(look.size)) out.push(t('format-level-size', { size: look.size as number }));
  said(look.bold, t('format-level-bold'), t('format-look-not-bold'));
  said(look.italic, t('format-level-italic'), t('format-look-not-italic'));
  said(look.underline, t('format-look-underlined'), t('format-look-not-underlined'));
  if (look.case === 'upper') out.push(t('format-level-capitals'));
  else if (look.case === 'smallcaps') out.push(t('format-level-small-caps'));
  else if (look.case === 'none') out.push(t('format-look-as-written'));
  if (family === 'paragraph') {
    if (look.align === 'left') out.push(t('format-look-left'));
    else if (look.align === 'center') out.push(t('format-level-centred'));
    else if (look.align === 'right') out.push(t('format-level-right'));
    else if (look.align === 'justified') out.push(t('format-look-justified'));
    measure(look.indentLeft, 'format-look-indent-left');
    measure(look.indentRight, 'format-look-indent-right');
    measure(look.firstLine, 'format-look-first-line');
    measure(look.spaceBefore, 'format-look-space-before');
    measure(look.spaceAfter, 'format-look-space-after');
    if (!unsaid(look.lineSpacing))
      out.push(t('format-look-line-spacing', { spacing: look.lineSpacing as number }));
  }
  said(look.monospace, t('format-look-equal-width'), t('format-look-not-equal-width'));
  if (family === 'paragraph') {
    said(look.keepWithNext, t('format-look-kept'), t('format-look-not-kept'));
    said(look.newPage, t('format-level-new-page-said'), t('format-look-no-new-page'));
    if (look.text !== undefined) out.push(t('format-look-text', { text: look.text }));
  }
  return out.join(', ');
}
