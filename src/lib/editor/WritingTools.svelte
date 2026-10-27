<script lang="ts">
  /**
   * The tools for writing, where they can be seen: in a side's bar and in
   * the box of an element (ADR 0064). Three menus, Paragraph kind, Words
   * kind and Marks, the first two naming the kind the cursor is in; what
   * stands between them and the rest, where the bar gives it (undo and
   * redo); spelling and the marks of whitespace; and Insert, which holds
   * citing, notes, comments and what stands in the text and is not text.
   * They act on the text that has the cursor; while the side shows no text
   * they are disabled, not hidden, so that the bar does not shift.
   *
   * The kind menu shows the kinds written together with the run the cursor
   * is in, then the kinds at hand, then the whole catalogue under "More…",
   * and at its foot names the layout that sets them (ADR 0041). The bar that
   * appears over a selection does the same as the marks for what is
   * selected; the keys do it without either.
   */
  import type { Snippet } from 'svelte';
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import Bold from '@lucide/svelte/icons/bold';
  import BookType from '@lucide/svelte/icons/book-type';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Clapperboard from '@lucide/svelte/icons/clapperboard';
  import Code from '@lucide/svelte/icons/code';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Columns3 from '@lucide/svelte/icons/columns-3';
  import Drama from '@lucide/svelte/icons/drama';
  import FileMinus from '@lucide/svelte/icons/file-minus';
  import Globe from '@lucide/svelte/icons/globe';
  import Highlighter from '@lucide/svelte/icons/highlighter';
  import Images from '@lucide/svelte/icons/images';
  import Italic from '@lucide/svelte/icons/italic';
  import Languages from '@lucide/svelte/icons/languages';
  import Link2 from '@lucide/svelte/icons/link-2';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Milestone from '@lucide/svelte/icons/milestone';
  import Pencil from '@lucide/svelte/icons/pencil';
  import PenLine from '@lucide/svelte/icons/pen-line';
  import Pilcrow from '@lucide/svelte/icons/pilcrow';
  import Plus from '@lucide/svelte/icons/plus';
  import Quote from '@lucide/svelte/icons/quote';
  import Sheet from '@lucide/svelte/icons/sheet';
  import Sigma from '@lucide/svelte/icons/sigma';
  import Palette from '@lucide/svelte/icons/palette';
  import SpellCheck from '@lucide/svelte/icons/spell-check';
  import SquareFunction from '@lucide/svelte/icons/square-function';
  import StickyNote from '@lucide/svelte/icons/sticky-note';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Subscript from '@lucide/svelte/icons/subscript';
  import Superscript from '@lucide/svelte/icons/superscript';
  import Table from '@lucide/svelte/icons/table';
  import Tag from '@lucide/svelte/icons/tag';
  import TextQuote from '@lucide/svelte/icons/text-quote';
  import Type from '@lucide/svelte/icons/type';
  import Underline from '@lucide/svelte/icons/underline';
  import WholeWord from '@lucide/svelte/icons/whole-word';
  import type { Command } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import type { DocumentFormat } from '$lib/api/documents';
  import { selectedPassage } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import { languageName, t, TEXT_LANGUAGES } from '$lib/i18n';
  import { keysFor, kindKeys as keysOfDigit } from '$lib/shell/keys.svelte';
  import { showPictures } from '$lib/figures/images.svelte';
  import { documents, templateUsedCached } from '$lib/preview/documents.svelte';
  import { lookUi } from '$lib/look/look.svelte';
  import { panes } from '$lib/project/panes.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { spelling } from '$lib/spelling/spelling.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { askForTable, chooseTable } from '$lib/tables/ask';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { runAt } from './brackets';
  import {
    insertBreak,
    insertEquation,
    insertFootnote,
    insertMath,
    kindMarkOf,
    kindOf,
    kindsIn,
    languageOf,
    setKind,
    setLanguage,
    toggle,
    toggleKind,
  } from './commands';
  import {
    digitOfKind,
    fellowsOf,
    GROUPS,
    groupOf,
    inHand,
    kindKeysOf,
    specOf,
    WORD_KINDS,
    type KindGroup,
  } from './kinds';
  import LanguageDialog from './LanguageDialog.svelte';
  import { languageItems } from './language-menu';
  import { editPassageKind, newPassageKind } from './own-kinds.svelte';
  import { editorUi, hooksOf } from './ui.svelte';
  import { askRefMark } from './refmarks';
  import { insertParallel } from './parallel';

  interface Props {
    project: Project;
    /** The part of the window whose texts the tools are for. */
    scope?: HTMLElement | null;
    /** The element in view: whose document sets the tools, where no text has the cursor. */
    at?: string | null;
    /** Whether the side shows no text, as when it shows the diagram: the menus are disabled. */
    disabled?: boolean;
    /** What stands between the menus and spelling, where the bar has it: undo and redo. */
    middle?: Snippet;
  }

  let { project, scope = null, at = null, disabled = false, middle }: Props = $props();

  const s = $derived.by(() => {
    if (disabled) return null;
    const selection = editorUi.selection;
    if (!selection) return null;
    // A note is written in a panel of its own, which belongs to no part of the window.
    if (scope && selection.kind !== 'note' && !scope.contains(selection.view.dom)) return null;
    return selection;
  });
  const body = $derived(s?.kind === 'body');
  /** The kinds of paragraph of the writer's own, as much as the shape of a text needs of them. */
  const own = $derived(project.passageKinds.filter((k) => k.family === 'paragraph'));
  /** The id of the kind of paragraph the cursor is in, or that the selection begins in. */
  const kind = $derived(s && body ? kindOf(s.view.state) : 'text');
  /** Whether the selection runs over paragraphs of more kinds than one. */
  const mixed = $derived(s && body ? kindsIn(s.view.state).length > 1 : false);
  /** What the kind is called: by the catalogue, or by the writer; or "Mixed". */
  const kindLabel = $derived(mixed ? t('editor-kinds-mixed') : nameOf(kind));
  /** The kind of words at the cursor, or the first in what is selected. */
  const wordKind = $derived(s ? kindMarkOf(s.view.state) : null);
  /** What the button of the words kind says: the kind at the cursor, foreign words with their language; else the menu's name. */
  const wordsLabel = $derived(
    wordKind
      ? wordKind.name === 'foreign' && wordKind.lang
        ? `${nameOf('foreign')}: ${languageName(wordKind.lang)}`
        : nameOf(wordKind.name)
      : t('editor-words-kind'),
  );
  /** The language of the passage at the cursor, or the first in what is selected, where it has one of its own. */
  const passageLanguage = $derived(s ? languageOf(s.view.state) : null);

  /** The marks, in the order of their menu, each with its icon and its key. */
  const MARKS = [
    { name: 'em', label: () => t('editor-italic'), icon: Italic, key: keysFor('writing-italic') },
    { name: 'strong', label: () => t('editor-bold'), icon: Bold, key: keysFor('writing-bold') },
    {
      name: 'smallcaps',
      label: () => t('editor-small-capitals'),
      icon: Type,
      key: keysFor('writing-smallcaps'),
    },
    {
      name: 'underline',
      label: () => t('editor-underline'),
      icon: Underline,
      key: keysFor('writing-underline'),
    },
    {
      name: 'sup',
      label: () => t('editor-superscript'),
      icon: Superscript,
      key: keysFor('writing-raised'),
    },
    {
      name: 'sub',
      label: () => t('editor-subscript'),
      icon: Subscript,
      key: keysFor('writing-lowered'),
    },
    {
      name: 'strike',
      label: () => t('editor-struck'),
      icon: Strikethrough,
      key: keysFor('writing-strike'),
    },
    { name: 'code', label: () => t('editor-code-words'), icon: Code, key: undefined },
  ] as const;
  /** Whether what is selected has any of the marks. */
  const marked = $derived(!!s && MARKS.some((m) => s.marks[m.name]));

  /** The element whose text has the cursor, or, where none has it, the one in view: its document sets the tools. */
  const element = $derived(elementOf(s?.view) ?? at ?? null);
  /** What is said of that element as a document, with what it inherits, and from where. */
  const ofDocument = $derived(
    element && project.node(element) ? project.documentOf(element) : null,
  );
  // The format of the document: for the kinds it suggests, and its name at the foot of the kind menu.
  $effect(() => {
    documents.load();
  });
  const choice = $derived(documents.choice(ofDocument?.settings ?? {}, project));
  let format = $state.raw<DocumentFormat | null>(null);
  $effect(() => {
    const id = choice.format;
    void documents.changed;
    let stale = false;
    documents.format(id).then(
      (f) => {
        if (!stale) format = f;
      },
      () => {
        if (!stale) format = null;
      },
    );
    return () => {
      stale = true;
    };
  });
  // The kinds Ctrl+Alt with a digit gives in the document type of the element, for the menu to show (ADR 0066).
  const kindKeys = $derived(
    kindKeysOf(element && ofDocument ? templateUsedCached(project, element) : null),
  );
  // The kinds the template puts in hand (ADR 0038); nothing until the template is read.
  const suggests = $derived(documents.templateCached(choice.template)?.passageKinds ?? []);
  const formatName = $derived(
    documents.formatSummary(choice.format)?.name ?? format?.name ?? choice.format,
  );
  const ownParagraphs = $derived(project.passageKinds.filter((k) => k.family === 'paragraph'));
  const ownWords = $derived(project.passageKinds.filter((k) => k.family === 'words'));

  /** The icons of the kinds: by id for the plain kinds and the lines of verse, by group for the rest. */
  const ICONS: Record<string, typeof Pilcrow> = {
    text: Pilcrow,
    quote: TextQuote,
    item: List,
    numbered: ListOrdered,
    line: AlignLeft,
    speaker: Drama,
    direction: Drama,
    foreign: Languages,
    title: BookType,
    term: Tag,
    mention: Quote,
    highlight: Highlighter,
  };
  const GROUP_ICONS: Record<KindGroup, typeof Pilcrow> = {
    text: Pilcrow,
    quotation: TextQuote,
    verse: AlignLeft,
    script: Clapperboard,
    list: List,
    more: Type,
    words: WholeWord,
  };
  function iconOf(id: string): typeof Pilcrow {
    const spec = specOf(id);
    return spec ? (ICONS[spec.id] ?? GROUP_ICONS[groupOf(spec.id)]) : PenLine;
  }

  /** The name of a kind, of the catalogue or the writer's own. */
  function nameOf(id: string): string {
    return specOf(id)?.label() ?? project.passageKind(id)?.name ?? id;
  }

  /** Whether a kind is set from the kind menu: a kind of paragraph, not a kind of words. */
  function ofParagraphs(id: string): boolean {
    const spec = specOf(id);
    return spec ? spec.family === 'paragraph' : project.passageKind(id)?.family === 'paragraph';
  }

  /** The element whose text an editor holds. */
  function elementOf(view: EditorView | undefined): string | undefined {
    return view ? hooksOf.get(view)?.element : undefined;
  }

  /** A comment on what is selected, or on the element where nothing is. */
  function comment(view: EditorView) {
    const element = elementOf(view);
    if (element) commentsUi.begin(element, selectedPassage(view));
  }

  /** The language of what is selected, by its tag, asked for in a dialog. */
  let asking = $state<{ view: EditorView; tag: string | null } | null>(null);

  function run(command: Command, view: EditorView | undefined = s?.view) {
    if (!view || view.isDestroyed) return;
    command(view.state, view.dispatch, view);
    view.focus();
  }

  /**
   * What is put in the text: a citation, a note, a comment; then what stands
   * in the text and is not text. The names say what each is. An image is
   * chosen among the images, which the document pane shows, and put in at
   * the cursor from there, where an image from a file is taken in as well.
   */
  function insert(event: MouseEvent) {
    const view = s?.view;
    if (!view) return;
    const hooks = hooksOf.get(view);
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('editor-citation'),
          icon: Quote,
          shortcut: keysFor('writing-cite-keys'),
          action: () => hooks?.cite?.(view, false),
        },
        {
          label: t('editor-note'),
          icon: StickyNote,
          shortcut: keysFor('writing-note'),
          disabled: !body,
          // A note opens a panel of its own, which takes the cursor: it is not taken back.
          action: () => insertFootnote(view.state, view.dispatch, view),
        },
        {
          label: t('editor-comment'),
          icon: MessageSquare,
          shortcut: keysFor('comment'),
          disabled: !body || !elementOf(view),
          action: () => comment(view),
        },
        { kind: 'separator' },
        {
          label: t('editor-image'),
          icon: Images,
          disabled: !body,
          action: () => {
            // The cursor stays where the image is to go.
            showPictures('library');
            view.focus();
          },
        },
        {
          label: t('editor-table'),
          icon: Table,
          shortcut: keysFor('writing-table'),
          disabled: !body,
          action: () => void askForTable(view),
        },
        {
          label: t('editor-table-file'),
          icon: Sheet,
          disabled: !body,
          action: () => void chooseTable(view),
        },
        {
          label: t('editor-formula'),
          icon: Sigma,
          shortcut: keysFor('writing-formula'),
          action: () => void insertMath(view.state, view.dispatch, view),
        },
        {
          label: t('editor-equation'),
          icon: SquareFunction,
          shortcut: keysFor('writing-equation'),
          disabled: !body,
          // It opens a panel of its own, which takes the cursor.
          action: () => void insertEquation(view.state, view.dispatch, view),
        },
        {
          label: t('editor-pointer'),
          icon: Link2,
          shortcut: keysFor('writing-crossref'),
          disabled: !hooks?.point,
          action: () => hooks?.point?.(view),
        },
        {
          label: t('editor-inline-number'),
          icon: Milestone,
          shortcut: keysFor('writing-refmark'),
          action: () => void askRefMark(view),
        },
        {
          label: t('editor-parallel'),
          icon: Columns2,
          disabled: !body,
          action: () => run(insertParallel, view),
        },
        { kind: 'separator' },
        {
          label: t('editor-page-break'),
          icon: FileMinus,
          disabled: !body,
          action: () => run(insertBreak('page'), view),
        },
        {
          label: t('editor-column-break'),
          icon: Columns3,
          disabled: !body,
          action: () => run(insertBreak('column'), view),
        },
      ],
      { align: 'start' },
    );
  }

  /** The marks: a look chosen by hand, on any run of letters. Those a name cannot have are disabled in a name. */
  function marks(event: MouseEvent) {
    const view = s?.view;
    const on = s?.marks;
    if (!view || !on) return;
    const schema = view.state.schema;
    openMenu(
      event.currentTarget as HTMLElement,
      MARKS.map((m): MenuItem => ({
        label: m.label(),
        icon: m.icon,
        shortcut: m.key,
        checked: !!on[m.name],
        disabled: !schema.marks[m.name],
        action: () => run(toggle(m.name), view),
      })),
      { align: 'start' },
    );
  }

  /** Turns the checking of spelling off or on, for everything, as the settings do. */
  function turnSpelling() {
    settings.set('spelling', !spelling.on);
    spelling.anew();
  }

  // ---- the kind of paragraph ----

  /** An item of the kind menu, which makes the paragraphs that are selected of the kind. */
  function kindItem(id: string, view: EditorView): MenuItem {
    const spec = specOf(id);
    // The key the document type gives the kind, before one of its own.
    const digit = digitOfKind(kindKeys, id);
    return {
      label: nameOf(id),
      hint: spec?.hint(),
      icon: iconOf(id),
      shortcut: digit !== undefined ? keysOfDigit(digit) : spec?.shortcut,
      checked: !mixed && id === kind,
      action: () => run(setKind(id, own), view),
    };
  }

  /** The kinds of the catalogue that the kind menu sets, under the heading of each group. */
  function grouped(item: (id: string) => MenuItem): MenuItem[] {
    const out: MenuItem[] = [];
    for (const g of GROUPS) {
      const kinds = g.kinds.filter((id) => !!specOf(id) && ofParagraphs(id));
      if (!kinds.length) continue;
      out.push({ kind: 'heading', label: g.label() }, ...kinds.map((id) => item(id)));
    }
    return out;
  }

  /**
   * The kinds written together with the run the cursor is in: for lines of
   * verse, lines, speakers and directions; for a part of a script, every
   * part; for a headword, headwords and glosses; of the catalogue and the
   * writer's own. Nothing in text.
   */
  function rolesOf(view: EditorView): string[] {
    const at = runAt(view.state, own);
    if (!at || at.run.kind === 'text') return [];
    return fellowsOf(at.run.kind, own).filter((id) => ofParagraphs(id));
  }

  /** The kinds of the writer's own, each to be changed in its dialog. */
  function changeOwn(
    kinds: { id: string; name: string }[],
    family: 'paragraph' | 'words',
  ): MenuItem[] {
    if (!kinds.length) return [];
    return [
      {
        kind: 'submenu',
        label: t('editor-kinds-change-own'),
        icon: Pencil,
        items: kinds.map((k) => ({
          label: k.name,
          icon: PenLine,
          action: () => editPassageKind(k.id, family),
        })),
      },
    ];
  }

  /** The whole catalogue, the writer's own kinds, and the making of a kind. */
  function moreItems(view: EditorView): MenuItem[] {
    return [
      ...grouped((id) => kindItem(id, view)),
      ...(ownParagraphs.length
        ? [
            { kind: 'heading' as const, label: t('editor-kinds-own') },
            ...ownParagraphs.map((k) => kindItem(k.id, view)),
          ]
        : []),
      { kind: 'separator' },
      {
        label: t('editor-kinds-make'),
        icon: Plus,
        // The kind is put on the paragraphs that were selected when it is made.
        action: () => newPassageKind('paragraph', (id) => run(setKind(id), view)),
      },
      ...changeOwn(ownParagraphs, 'paragraph'),
    ];
  }

  /** Opens the look of the document at the look of the kind the cursor is in. */
  function changeLook() {
    lookUi.open({ section: 'paragraphs', kind });
  }

  function kinds(event: MouseEvent) {
    // The text loses the cursor while the menu is open: what it was is kept.
    const view = s?.view;
    if (!view) return;
    // The kinds written with the run the cursor is in first: a speaker and a
    // stage direction in verse, every part of a script in one; then the kinds
    // at hand, less those shown already.
    const roles = rolesOf(view);
    const hand = inHand(project, suggests).filter((id) => ofParagraphs(id) && !roles.includes(id));
    openMenu(
      event.currentTarget as HTMLElement,
      [
        ...roles.map((id) => kindItem(id, view)),
        ...(roles.length && hand.length ? [{ kind: 'separator' as const }] : []),
        ...hand.map((id) => kindItem(id, view)),
        { kind: 'separator' },
        { kind: 'submenu', label: t('editor-kinds-menu-more'), items: moreItems(view) },
        { kind: 'separator' },
        { kind: 'heading', label: t('editor-kinds-set-by', { format: formatName }) },
        {
          label: t('editor-kinds-change-look', { kind: nameOf(kind) }),
          icon: Palette,
          disabled: !element,
          action: changeLook,
        },
      ],
      { align: 'start' },
    );
  }

  // ---- the kinds of words ----

  /**
   * The kinds of words: roles whose look the format gives, so that a term
   * is a term in every format. Foreign words with their language, those of
   * the catalogue, the writer's own; then the language of the passage, which
   * is no kind but is said of words as well; then the making of a kind.
   */
  function wordsKind(event: MouseEvent) {
    const view = s?.view;
    if (!view) return;
    const ofWords = (id: string): MenuItem => ({
      label: nameOf(id),
      hint: specOf(id)?.hint(),
      icon: iconOf(id),
      checked: wordKind?.name === id,
      action: () => run(toggleKind(id), view),
    });
    // The languages foreign words may be in: that of the text first.
    const language = ofDocument?.settings.language;
    const tags = [...(language ? [language] : []), ...TEXT_LANGUAGES.filter((l) => l !== language)];
    const foreign: MenuItem = {
      kind: 'submenu',
      label: t('editor-foreign'),
      icon: Languages,
      items: tags.map((tag) => ({
        label: languageName(tag),
        hint: tag === language ? t('editor-foreign-of-text') : undefined,
        checked: wordKind?.name === 'foreign' && wordKind.lang === tag,
        action: () => run(toggleKind('foreign', tag), view),
      })),
    };
    // The language of what is selected: the languages of texts but the text's own, and any other by its tag.
    const ofPassage: MenuItem = {
      kind: 'submenu',
      label: t('editor-language'),
      icon: Globe,
      items: languageItems({
        language,
        current: passageLanguage,
        set: (tag) => run(setLanguage(tag), view),
        other: () => (asking = { view, tag: passageLanguage }),
      }),
    };
    openMenu(
      event.currentTarget as HTMLElement,
      [
        foreign,
        // The kinds of words, then a speaker and a direction within a line.
        ...WORD_KINDS.filter((id) => id !== 'foreign').map((id) => ofWords(id)),
        ...ownWords.map((k) => ofWords(k.id)),
        { kind: 'separator' },
        ofPassage,
        { kind: 'separator' },
        {
          label: t('editor-words-make'),
          icon: Plus,
          // The kind is put on the words that were selected when it is made.
          action: () => newPassageKind('words', (id) => run(toggleKind(id), view)),
        },
        ...changeOwn(ownWords, 'words'),
      ],
      { align: 'start' },
    );
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="tools"
  class:idle={!s}
  role="toolbar"
  aria-label={t('editor-writing')}
  tabindex="-1"
  onmousedown={(e) => e.preventDefault()}
>
  <button
    type="button"
    class="kind"
    disabled={!body}
    data-paragraph-kind
    aria-label={t('editor-paragraph-kind-now', { kind: kindLabel })}
    use:tooltip={{ text: t('editor-paragraph-kind'), side: 'bottom' }}
    onclick={kinds}
  >
    <span class="truncate">{kindLabel}</span>
    <ChevronDown size={13} />
  </button>
  <button
    type="button"
    class="kind"
    class:on={!!wordKind}
    disabled={!s || s.kind === 'title'}
    data-words-kind
    aria-label={wordKind
      ? t('editor-words-kind-now', { kind: wordsLabel })
      : t('editor-words-kind')}
    use:tooltip={{ text: t('editor-words-kind'), side: 'bottom' }}
    onclick={wordsKind}
  >
    <span class="truncate">{wordsLabel}</span>
    <ChevronDown size={13} />
  </button>
  <button
    type="button"
    class="opens"
    class:on={marked}
    disabled={!s}
    data-marks
    aria-haspopup="menu"
    aria-label={t('editor-marks')}
    use:tooltip={{ text: t('editor-marks'), side: 'bottom' }}
    onclick={marks}
  >
    <Italic size={15} />
    <ChevronDown size={12} />
  </button>

  {#if middle}
    <span class="rule" role="separator"></span>
    {@render middle()}
  {/if}

  <span class="rule" role="separator"></span>

  <!-- Spelling is turned off and on from here as from the settings: it holds everywhere, cursor or no cursor. -->
  <button
    type="button"
    class="always"
    class:on={spelling.on}
    aria-pressed={spelling.on}
    aria-label={t('spelling-check')}
    use:tooltip={{
      text: spelling.on ? t('editor-spelling-on') : t('editor-spelling-off'),
      side: 'bottom',
    }}
    onclick={turnSpelling}
  >
    <SpellCheck size={15} />
  </button>
  <!-- The marks of whitespace, ¶ ↵ and the ring of a hard space, shown or not: in every text of the window. -->
  <button
    type="button"
    class="always"
    class:on={panes.marks}
    aria-pressed={panes.marks}
    aria-label={t('editor-marks-shown')}
    data-whitespace
    {disabled}
    use:tooltip={{
      text: t('editor-marks-shown'),
      shortcut: keysFor('writing-marks'),
      side: 'bottom',
    }}
    onclick={() => (panes.marks = !panes.marks)}
  >
    <Pilcrow size={15} />
  </button>

  <span class="rule" role="separator"></span>

  <button
    type="button"
    class="opens"
    disabled={!s || s.kind === 'title'}
    data-insert
    aria-haspopup="menu"
    aria-label={t('editor-insert')}
    use:tooltip={{ text: t('editor-insert'), side: 'bottom' }}
    onclick={insert}
  >
    <Plus size={15} />
    <ChevronDown size={12} />
  </button>
</div>

{#if asking}
  <LanguageDialog
    tag={asking.tag}
    onclose={() => (asking = null)}
    onset={(tag) => asking && run(setLanguage(tag), asking.view)}
  />
{/if}

<style>
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    min-width: 0;
    color: var(--ink-2);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 26px;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease),
      opacity var(--fast) var(--ease);
  }
  button:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  button:disabled {
    opacity: 0.38;
    cursor: default;
  }
  /* Before there is a cursor in a text, the tools wait quietly. */
  .tools.idle button:disabled {
    opacity: 0.3;
  }
  /* The two menus of kinds name the kind: that is what they tell. */
  .kind {
    justify-content: space-between;
    width: 112px;
    padding: 0 5px 0 8px;
    font-weight: 500;
  }
  /* A menu by its icon: the classname "menu" is the menus' own. */
  .opens {
    gap: 1px;
    padding: 0 3px 0 5px;
  }
  /* Not about the cursor: as plain while there is none as while there is. */
  .tools.idle .always:not(:disabled) {
    opacity: 1;
  }
  .rule {
    flex: none;
    width: 1px;
    height: 16px;
    margin: 0 4px;
    background: var(--line);
  }
</style>
