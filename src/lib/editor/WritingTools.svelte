<script lang="ts">
  /**
   * The tools for writing, where they can be seen: the kind of paragraph,
   * the marks and the kinds of words, citing and notes. They act on the text
   * that has the cursor.
   *
   * The kind menu shows the kinds in hand, then the whole catalogue under
   * "More…", and at its foot names the format that sets them (ADR 0029).
   * The bar that appears over a selection does the same as the marks for
   * what is selected; the keys do it without either.
   */
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import Bold from '@lucide/svelte/icons/bold';
  import BookType from '@lucide/svelte/icons/book-type';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Clapperboard from '@lucide/svelte/icons/clapperboard';
  import Code from '@lucide/svelte/icons/code';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Drama from '@lucide/svelte/icons/drama';
  import Hash from '@lucide/svelte/icons/hash';
  import Highlighter from '@lucide/svelte/icons/highlighter';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Images from '@lucide/svelte/icons/images';
  import Italic from '@lucide/svelte/icons/italic';
  import Languages from '@lucide/svelte/icons/languages';
  import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
  import Link2 from '@lucide/svelte/icons/link-2';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import ListPlus from '@lucide/svelte/icons/list-plus';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Pencil from '@lucide/svelte/icons/pencil';
  import PenLine from '@lucide/svelte/icons/pen-line';
  import Pilcrow from '@lucide/svelte/icons/pilcrow';
  import Plus from '@lucide/svelte/icons/plus';
  import Quote from '@lucide/svelte/icons/quote';
  import Sheet from '@lucide/svelte/icons/sheet';
  import Sigma from '@lucide/svelte/icons/sigma';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import SpellCheck from '@lucide/svelte/icons/spell-check';
  import SplitSquareVertical from '@lucide/svelte/icons/split-square-vertical';
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
  import { showPictures } from '$lib/pictures/store.svelte';
  import { documents } from '$lib/preview/documents.svelte';
  import { formatEditorUi } from '$lib/preview/format-editor.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { spelling } from '$lib/spelling/spelling.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { askForTable, chooseTable } from '$lib/tables/ask';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import {
    insertEquation,
    insertFootnote,
    insertMath,
    kindMarkOf,
    kindOf,
    setKind,
    toggle,
    toggleKind,
  } from './commands';
  import { CATALOGUE, GROUPS, inHand, specOf, type KindGroup } from './kinds';
  import LineNumbersDialog from './LineNumbersDialog.svelte';
  import { editPassageKind, newPassageKind } from './own-kinds.svelte';
  import { editorUi, hooksOf } from './ui.svelte';
  import { insertParallel, numberLines, verseAt } from './verse';

  interface Props {
    project: Project;
    /** The part of the window whose texts the tools are for. */
    scope?: HTMLElement | null;
    /** The map whose texts they are. */
    map?: string | null;
    /**
     * Makes a new element, where the tools stand over the text of a whole
     * map: after the one the cursor is in, under it, or from the cursor on.
     * Without it there is no button for it, as in the box of one element.
     */
    onelement?: (what: 'after' | 'under' | 'split') => void;
  }

  let { project, scope = null, map = null, onelement }: Props = $props();

  const s = $derived.by(() => {
    const selection = editorUi.selection;
    if (!selection) return null;
    // A note is written in a panel of its own, which belongs to no part of the window.
    if (scope && selection.kind !== 'note' && !scope.contains(selection.view.dom)) return null;
    return selection;
  });
  const body = $derived(s?.kind === 'body');
  /** The id of the kind of paragraph the cursor is in. */
  const kind = $derived(s && body ? kindOf(s.view.state) : 'text');
  /** What the kind is called: by the catalogue, or by the writer. */
  const kindLabel = $derived(specOf(kind)?.label() ?? project.passageKind(kind)?.name ?? kind);
  const inVerse = $derived(kind === 'verse' || kind === 'speaker' || kind === 'direction');
  /** The kind of words at the cursor, or the first in what is selected. */
  const wordKind = $derived(s ? kindMarkOf(s.view.state) : null);
  /** Whether what is selected has any of what the words menu holds. */
  const wordsOn = $derived(
    !!s &&
      (!!wordKind || ['underline', 'sup', 'sub', 'strike', 'code'].some((name) => s.marks[name])),
  );

  // The format of the map: for the kinds it suggests, and its name at the foot of the kind menu.
  $effect(() => {
    documents.load();
  });
  const choice = $derived(documents.choice(project.map(map)?.document ?? {}));
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
  const suggests = $derived(format?.suggests ?? []);
  const formatName = $derived(
    documents.formatSummary(choice.format)?.name ?? format?.name ?? choice.format,
  );
  const ownParagraphs = $derived(project.passageKinds.filter((k) => k.family === 'paragraph'));
  const ownWords = $derived(project.passageKinds.filter((k) => k.family === 'words'));

  /** The icons of the kinds: by id for the plain kinds and the lines of verse, by group for the rest. */
  const ICONS: Record<string, typeof Pilcrow> = {
    text: Pilcrow,
    quote: TextQuote,
    list: List,
    numbered: ListOrdered,
    verse: AlignLeft,
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
    more: Type,
    words: WholeWord,
  };
  function iconOf(id: string): typeof Pilcrow {
    const spec = specOf(id);
    return spec ? (ICONS[id] ?? GROUP_ICONS[spec.group]) : PenLine;
  }

  /** The name of a kind, of the catalogue or the writer's own. */
  function nameOf(id: string): string {
    return specOf(id)?.label() ?? project.passageKind(id)?.name ?? id;
  }

  /** Whether a kind of the catalogue is set from the kind menu: everything but a mark on words. */
  function ofParagraphs(id: string): boolean {
    const spec = specOf(id);
    return spec ? spec.structure !== 'mark' : project.passageKind(id)?.family === 'paragraph';
  }

  /** The element whose text an editor holds. */
  function elementOf(view: EditorView | undefined): string | undefined {
    return view ? hooksOf.get(view)?.element : undefined;
  }

  /** A comment on what is selected, or on the element where nothing is. */
  function comment() {
    const view = s?.view;
    const element = elementOf(view);
    if (!view || !element) return;
    commentsUi.begin(element, selectedPassage(view));
  }

  /** How the lines of the verse the cursor is in are numbered, asked for in a dialog. */
  let numbering = $state<{ view: EditorView; start: number | null; by: number } | null>(null);
  function lineNumbers() {
    const view = s?.view;
    const at = view ? verseAt(view.state) : null;
    if (!view || !at) return;
    numbering = {
      view,
      start: at.verse.attrs.start as number | null,
      by: at.verse.attrs.by as number,
    };
  }

  function run(command: Command, view: EditorView | undefined = s?.view) {
    if (!view || view.isDestroyed) return;
    command(view.state, view.dispatch, view);
    view.focus();
  }

  /** A note opens a panel of its own, which takes the cursor: it is not taken back. */
  function note() {
    const view = s?.view;
    if (view) insertFootnote(view.state, view.dispatch, view);
  }

  function cite() {
    const view = s?.view;
    if (view) hooksOf.get(view)?.cite?.(view, false);
  }

  /** What stands in the text and is not text: pictures and mathematics. */
  function insert(event: MouseEvent) {
    const view = s?.view;
    if (!view) return;
    const hooks = hooksOf.get(view);
    openMenu(
      event.currentTarget as HTMLElement,
      [
        ...(body
          ? [
              {
                label: t('editor-picture-file'),
                hint: t('editor-picture-file-hint'),
                icon: ImagePlus,
                shortcut: 'Ctrl+Alt+P',
                action: () => hooks?.picture?.(view),
              },
              {
                label: t('editor-picture-store'),
                hint: t('editor-picture-store-hint'),
                icon: Images,
                action: () => {
                  // The cursor stays where the picture is to go.
                  showPictures('store');
                  view.focus();
                },
              },
              {
                label: t('editor-equation'),
                hint: t('editor-equation-hint'),
                icon: SquareFunction,
                shortcut: 'Ctrl+Alt+E',
                // It opens a panel of its own, which takes the cursor.
                action: () => void insertEquation(view.state, view.dispatch, view),
              },
              {
                label: t('editor-table'),
                hint: t('editor-table-hint'),
                icon: Table,
                shortcut: 'Ctrl+Alt+T',
                action: () => void askForTable(view),
              },
              {
                label: t('editor-table-file'),
                hint: t('editor-table-file-hint'),
                icon: Sheet,
                action: () => void chooseTable(view),
              },
              {
                label: t('editor-parallel'),
                hint: t('editor-parallel-hint'),
                icon: Columns2,
                action: () => run(insertParallel, view),
              },
            ]
          : []),
        {
          label: t('editor-formula'),
          hint: t('editor-formula-hint'),
          icon: Sigma,
          shortcut: 'Ctrl+Alt+M',
          action: () => void insertMath(view.state, view.dispatch, view),
        },
        ...(hooks?.point
          ? [
              { kind: 'separator' as const },
              {
                label: t('editor-pointer'),
                hint: t('editor-pointer-hint'),
                icon: Link2,
                shortcut: 'Ctrl+Alt+R',
                action: () => hooks.point?.(view),
              },
            ]
          : []),
      ],
      { align: 'start' },
    );
  }

  /** A new element, by the menu of the button: the keys do the same. */
  function newElement(event: MouseEvent) {
    if (!onelement) return;
    const add = onelement;
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('editor-new-after'),
          icon: Plus,
          shortcut: 'Alt+Enter',
          action: () => add('after'),
        },
        {
          label: t('editor-new-under'),
          icon: CornerDownRight,
          shortcut: 'Alt+Shift+Enter',
          action: () => add('under'),
        },
        {
          label: t('editor-new-split'),
          hint: t('editor-new-split-hint'),
          icon: SplitSquareVertical,
          shortcut: 'Ctrl+Enter',
          disabled: !body,
          action: () => add('split'),
        },
      ],
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
    return {
      label: nameOf(id),
      hint: spec?.hint(),
      icon: iconOf(id),
      shortcut: spec?.shortcut,
      checked: id === kind,
      action: () => run(setKind(id), view),
    };
  }

  /** The kinds of the catalogue that the kind menu sets, under the heading of each group. */
  function grouped(item: (id: string) => MenuItem, without: string[] = []): MenuItem[] {
    const out: MenuItem[] = [];
    for (const g of GROUPS) {
      const kinds = CATALOGUE.filter(
        (k) => k.group === g.id && ofParagraphs(k.id) && !without.includes(k.id),
      );
      if (!kinds.length) continue;
      out.push({ kind: 'heading', label: g.label() }, ...kinds.map((k) => item(k.id)));
    }
    return out;
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

  /** Every kind, with those in hand marked; choosing one pins it, or takes it out of hand. */
  function handItems(view: EditorView): MenuItem[] {
    const hand = new Set(inHand(project, map ?? '', suggests));
    const item = (id: string): MenuItem => ({
      label: nameOf(id),
      hint: specOf(id)?.hint(),
      icon: iconOf(id),
      checked: hand.has(id),
      action: () => {
        if (!map) return;
        const current = project.map(map)?.hand ?? { pinned: [], unpinned: [] };
        if (hand.has(id)) project.setHand(map, { unpinned: [...current.unpinned, id] });
        else project.setHand(map, { pinned: [...current.pinned, id] });
        view.focus();
      },
    });
    return [
      ...grouped(item, ['text']),
      ...(ownParagraphs.length
        ? [
            { kind: 'heading' as const, label: t('editor-kinds-own') },
            ...ownParagraphs.map((k) => item(k.id)),
          ]
        : []),
    ];
  }

  /** Opens the editor of the map's format at the look of the kind the cursor is in. */
  function changeFormat() {
    const id = map;
    if (!id) return;
    formatEditorUi.open({
      id: choice.format,
      map: id,
      section: 'kinds',
      kind,
      onsaved: (format) => project.setDocument(id, { format }),
    });
  }

  function kinds(event: MouseEvent) {
    // The text loses the cursor while the menu is open: what it was is kept.
    const view = s?.view;
    if (!view) return;
    // In hand, and with them the kinds of the group the cursor is in: a
    // speaker and a stage direction in verse, every part of a script in one.
    const group = specOf(kind)?.group;
    const wanted = new Set([
      ...inHand(project, map ?? '', suggests),
      ...CATALOGUE.filter((k) => group && k.group === group && group !== 'text').map((k) => k.id),
    ]);
    const inHandNow = [
      ...CATALOGUE.map((k) => k.id),
      ...project.passageKinds.map((k) => k.id),
    ].filter((id) => wanted.has(id) && ofParagraphs(id));
    openMenu(
      event.currentTarget as HTMLElement,
      [
        ...inHandNow.map((id) => kindItem(id, view)),
        { kind: 'separator' },
        { kind: 'submenu', label: t('editor-kinds-menu-more'), items: moreItems(view) },
        { kind: 'submenu', label: t('editor-kinds-in-hand'), items: handItems(view) },
        { kind: 'separator' },
        { kind: 'heading', label: t('editor-kinds-set-by', { format: formatName }) },
        {
          label: t('editor-kinds-change-format'),
          hint: t('editor-kinds-change-format-hint'),
          icon: SlidersHorizontal,
          disabled: !map,
          action: changeFormat,
        },
      ],
      { align: 'start' },
    );
  }

  // ---- the words ----

  function words(event: MouseEvent) {
    const view = s?.view;
    const marks = s?.marks;
    if (!view || !marks) return;
    const mark = (
      name: 'underline' | 'sup' | 'sub' | 'strike' | 'code',
      label: string,
      icon: typeof Pilcrow,
      shortcut?: string,
      hint?: string,
    ): MenuItem => ({
      label,
      hint,
      icon,
      shortcut,
      checked: !!marks[name],
      action: () => run(toggle(name), view),
    });
    const ofWords = (id: string): MenuItem => ({
      label: nameOf(id),
      hint: specOf(id)?.hint(),
      icon: iconOf(id),
      checked: wordKind?.name === id,
      action: () => run(toggleKind(id), view),
    });
    // The languages foreign words may be in: that of the map first.
    const language = project.map(map)?.document.language;
    const tags = [...(language ? [language] : []), ...TEXT_LANGUAGES.filter((l) => l !== language)];
    const foreign: MenuItem = {
      kind: 'submenu',
      label: t('editor-foreign'),
      icon: Languages,
      items: tags.map((tag) => ({
        label: languageName(tag),
        hint: tag === language ? t('editor-foreign-of-map') : undefined,
        checked: wordKind?.name === 'foreign' && wordKind.lang === tag,
        action: () => run(toggleKind('foreign', tag), view),
      })),
    };
    openMenu(
      event.currentTarget as HTMLElement,
      [
        mark('underline', t('editor-underline'), Underline, 'Ctrl+U'),
        mark('sup', t('editor-superscript'), Superscript, 'Ctrl+.'),
        mark('sub', t('editor-subscript'), Subscript, 'Ctrl+,'),
        mark('strike', t('editor-struck'), Strikethrough, 'Ctrl+Shift+X'),
        mark('code', t('editor-code-words'), Code, undefined, t('editor-code-words-hint')),
        { kind: 'separator' },
        foreign,
        ofWords('title'),
        ofWords('term'),
        ofWords('mention'),
        ofWords('highlight'),
        ...ownWords.map((k) => ofWords(k.id)),
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
  {#if onelement}
    <button
      type="button"
      class="word element"
      aria-label={t('editor-new-element')}
      use:tooltip={{ text: t('editor-new-element-hint'), shortcut: 'Alt+Enter', side: 'bottom' }}
      onclick={newElement}
    >
      <ListPlus size={14} />
      {t('editor-new-element')}
      <ChevronDown size={13} />
    </button>

    <span class="rule"></span>
  {/if}

  <button
    type="button"
    class="style"
    disabled={!body}
    aria-label={t('editor-paragraph-kind-now', { kind: kindLabel })}
    use:tooltip={{ text: t('editor-paragraph-kind'), side: 'bottom' }}
    onclick={kinds}
  >
    <span class="truncate">{kindLabel}</span>
    <ChevronDown size={13} />
  </button>

  {#if inVerse}
    <button
      type="button"
      class="lines"
      aria-label={t('editor-line-numbers')}
      use:tooltip={{ text: t('editor-line-numbers-hint'), side: 'bottom' }}
      onclick={lineNumbers}
    >
      <Hash size={14} />
    </button>
  {/if}

  <span class="rule"></span>

  <button
    type="button"
    class:on={s?.marks.em}
    disabled={!s}
    aria-label={t('editor-italic')}
    use:tooltip={{ text: t('editor-italic'), shortcut: 'Ctrl+I', side: 'bottom' }}
    onclick={() => run(toggle('em'))}
  >
    <Italic size={15} />
  </button>
  <button
    type="button"
    class:on={s?.marks.strong}
    disabled={!s || s.kind === 'title'}
    aria-label={t('editor-bold')}
    use:tooltip={{ text: t('editor-bold'), shortcut: 'Ctrl+B', side: 'bottom' }}
    onclick={() => run(toggle('strong'))}
  >
    <Bold size={15} />
  </button>
  <button
    type="button"
    class="caps"
    class:on={s?.marks.smallcaps}
    disabled={!s}
    aria-label={t('editor-small-capitals')}
    use:tooltip={{ text: t('editor-small-capitals'), shortcut: 'Ctrl+Shift+K', side: 'bottom' }}
    onclick={() => run(toggle('smallcaps'))}
  >
    <span>Sc</span>
  </button>
  <button
    type="button"
    class="words"
    class:on={wordsOn}
    disabled={!s || s.kind === 'title'}
    aria-label={t('editor-words')}
    use:tooltip={{ text: t('editor-words-hint'), side: 'bottom' }}
    onclick={words}
  >
    <WholeWord size={15} />
    {t('editor-words')}
    <ChevronDown size={13} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class="word cite"
    disabled={!s || s.kind === 'title'}
    use:tooltip={{ text: t('editor-cite-at-cursor'), shortcut: '@', side: 'bottom' }}
    onclick={cite}
  >
    <Quote size={13} />
    {t('editor-cite')}
  </button>
  <button
    type="button"
    class="word"
    disabled={!body}
    use:tooltip={{
      text: t('editor-note-hint'),
      shortcut: 'Ctrl+Alt+F',
      side: 'bottom',
    }}
    onclick={note}
  >
    <StickyNote size={13} />
    {t('editor-note')}
  </button>
  <button
    type="button"
    class="word"
    disabled={!body || !elementOf(s?.view)}
    use:tooltip={{
      text: s?.empty ? t('editor-comment-element-hint') : t('editor-comment-hint'),
      shortcut: 'Ctrl+Alt+C',
      side: 'bottom',
    }}
    onclick={comment}
  >
    <MessageSquare size={13} />
    {t('editor-comment')}
  </button>

  <button
    type="button"
    class="word"
    disabled={!s || s.kind === 'title'}
    use:tooltip={{ text: t('editor-insert-hint'), side: 'bottom' }}
    onclick={insert}
  >
    <Plus size={13} />
    {t('editor-insert')}
  </button>

  <span class="rule"></span>

  <!-- Spelling is turned off and on from here as from the settings: it holds everywhere, cursor or no cursor. -->
  <button
    type="button"
    class="spelling"
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
</div>

{#if numbering}
  <LineNumbersDialog
    start={numbering.start}
    by={numbering.by}
    onclose={() => (numbering = null)}
    onset={(start, by) => numbering && run(numberLines(start, by), numbering.view)}
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
    min-width: 28px;
    height: 26px;
    padding: 0 6px;
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
  .style {
    justify-content: space-between;
    width: 118px;
    padding: 0 6px 0 9px;
    font-weight: 500;
  }
  .word {
    padding: 0 9px 0 8px;
    font-weight: 500;
  }
  .words {
    gap: 4px;
    padding: 0 5px 0 7px;
    font-weight: 500;
  }
  .element {
    gap: 4px;
    padding: 0 5px 0 8px;
  }
  /* Not about the cursor: as plain while there is none as while there is. */
  .tools.idle .spelling {
    opacity: 1;
  }
  .cite:not(:disabled) {
    color: var(--accent-strong);
  }
  .caps span {
    font-variant-caps: small-caps;
    font-weight: 600;
    font-size: 13px;
  }
  .rule {
    flex: none;
    width: 1px;
    height: 16px;
    margin: 0 5px;
    background: var(--line);
  }
</style>
