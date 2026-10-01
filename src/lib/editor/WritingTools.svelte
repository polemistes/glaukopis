<script lang="ts">
  /**
   * The tools for writing, where they can be seen: the kind of paragraph, the
   * marks, citing and notes. They act on the text that has the cursor.
   *
   * The bar that appears over a selection does the same for what is
   * selected; the keys do it without either.
   */
  import Bold from '@lucide/svelte/icons/bold';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Images from '@lucide/svelte/icons/images';
  import Italic from '@lucide/svelte/icons/italic';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Plus from '@lucide/svelte/icons/plus';
  import Sigma from '@lucide/svelte/icons/sigma';
  import SquareFunction from '@lucide/svelte/icons/square-function';
  import Sheet from '@lucide/svelte/icons/sheet';
  import Table from '@lucide/svelte/icons/table';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import Pilcrow from '@lucide/svelte/icons/pilcrow';
  import Quote from '@lucide/svelte/icons/quote';
  import StickyNote from '@lucide/svelte/icons/sticky-note';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Subscript from '@lucide/svelte/icons/subscript';
  import Superscript from '@lucide/svelte/icons/superscript';
  import TextQuote from '@lucide/svelte/icons/text-quote';
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Drama from '@lucide/svelte/icons/drama';
  import Clapperboard from '@lucide/svelte/icons/clapperboard';
  import Hash from '@lucide/svelte/icons/hash';
  import LineNumbersDialog from './LineNumbersDialog.svelte';
  import { insertParallel, numberLines, verseAt } from './verse';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import type { Command } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { goThrough } from '$lib/found/found.svelte';
  import { countFound } from '$lib/found/gather';
  import { t } from '$lib/i18n';
  import { showPictures } from '$lib/pictures/store.svelte';
  import { askForTable, chooseTable } from '$lib/tables/ask';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import {
    insertEquation,
    insertFootnote,
    insertMath,
    setStyle,
    styleOf,
    toggle,
    type ParagraphStyle,
  } from './commands';
  import { currentProject } from './references.svelte';
  import { editorUi } from './ui.svelte';
  import { hooksOf } from './ui.svelte';

  interface Props {
    /** The part of the window whose texts the tools are for. */
    scope?: HTMLElement | null;
    /** The map whose texts they are. */
    map?: string | null;
  }

  let { scope = null, map = null }: Props = $props();

  const s = $derived.by(() => {
    const selection = editorUi.selection;
    if (!selection) return null;
    // A note is written in a panel of its own, which belongs to no part of the window.
    if (scope && selection.kind !== 'note' && !scope.contains(selection.view.dom)) return null;
    return selection;
  });
  const body = $derived(s?.kind === 'body');
  const style = $derived<ParagraphStyle>(s && body ? styleOf(s.view.state) : 'text');

  const STYLES = $derived<
    {
      value: ParagraphStyle;
      label: string;
      hint: string;
      icon: typeof Pilcrow;
      shortcut?: string;
    }[]
  >([
    { value: 'text', label: t('editor-text'), hint: t('editor-text-hint'), icon: Pilcrow },
    {
      value: 'quote',
      label: t('editor-quotation'),
      hint: t('editor-quotation-hint'),
      icon: TextQuote,
      shortcut: "Ctrl+'",
    },
    {
      value: 'list',
      label: t('editor-list'),
      hint: t('editor-list-hint'),
      icon: List,
      shortcut: 'Ctrl+Shift+8',
    },
    {
      value: 'numbered',
      label: t('editor-numbered-list'),
      hint: t('editor-numbered-list-hint'),
      icon: ListOrdered,
      shortcut: 'Ctrl+Shift+7',
    },
    {
      value: 'verse',
      label: t('editor-verse'),
      hint: t('editor-verse-hint'),
      icon: AlignLeft,
    },
    {
      value: 'speaker',
      label: t('editor-speaker'),
      hint: t('editor-speaker-hint'),
      icon: Drama,
    },
    {
      value: 'direction',
      label: t('editor-direction'),
      hint: t('editor-direction-hint'),
      icon: Drama,
    },
    { value: 'scene', label: t('editor-scene'), hint: t('editor-scene-hint'), icon: Clapperboard },
    {
      value: 'action',
      label: t('editor-action'),
      hint: t('editor-action-hint'),
      icon: Clapperboard,
    },
    {
      value: 'character',
      label: t('editor-character'),
      hint: t('editor-character-hint'),
      icon: Clapperboard,
    },
    {
      value: 'dialogue',
      label: t('editor-dialogue'),
      hint: t('editor-dialogue-hint'),
      icon: Clapperboard,
    },
    {
      value: 'parenthetical',
      label: t('editor-parenthetical'),
      hint: t('editor-parenthetical-hint'),
      icon: Clapperboard,
    },
    {
      value: 'transition',
      label: t('editor-transition'),
      hint: t('editor-transition-hint'),
      icon: Clapperboard,
    },
  ]);
  /** The kinds in groups, for the menu: text, verse, script. */
  const GROUPS = $derived([
    { label: t('editor-kinds-text'), from: 0, to: 4 },
    { label: t('editor-kinds-verse'), from: 4, to: 7 },
    { label: t('editor-kinds-script'), from: 7, to: 13 },
  ]);
  const inVerse = $derived(style === 'verse' || style === 'speaker' || style === 'direction');

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
  const current = $derived(STYLES.find((x) => x.value === style) ?? STYLES[0]);

  function run(command: Command, view: EditorView | undefined = s?.view) {
    if (!view) return;
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
        ...(body
          ? [
              { kind: 'separator' as const },
              {
                label: t('editor-dropped'),
                disabled: true,
                action: () => {},
              },
            ]
          : []),
      ],
      { align: 'start' },
    );
  }

  function styles(event: MouseEvent) {
    // The text loses the cursor while the menu is open: what it was is kept.
    const view = s?.view;
    if (!view) return;
    openMenu(
      event.currentTarget as HTMLElement,
      GROUPS.flatMap((g) => [
        { kind: 'heading' as const, label: g.label },
        ...STYLES.slice(g.from, g.to).map((x) => ({
          label: x.label,
          hint: x.hint,
          icon: x.icon,
          shortcut: x.shortcut,
          checked: x.value === style,
          action: () => run(setStyle(x.value), view),
        })),
      ]),
      { align: 'start' },
    );
  }

  function more(event: MouseEvent) {
    const view = s?.view;
    const marks = s?.marks ?? {};
    const project = currentProject();
    const of = map && project?.map(map) ? map : null;
    if (!view && !of) return;
    const found = of && project ? countFound(project, of) : 0;
    openMenu(
      event.currentTarget as HTMLElement,
      [
        ...(view
          ? [
              {
                label: t('editor-superscript'),
                icon: Superscript,
                shortcut: 'Ctrl+.',
                checked: marks.sup,
                action: () => run(toggle('sup'), view),
              },
              {
                label: t('editor-subscript'),
                icon: Subscript,
                shortcut: 'Ctrl+,',
                checked: marks.sub,
                action: () => run(toggle('sub'), view),
              },
            ]
          : []),
        ...(view && s?.kind !== 'title'
          ? [
              {
                label: t('editor-struck'),
                icon: Strikethrough,
                shortcut: 'Ctrl+Shift+X',
                checked: marks.strike,
                action: () => run(toggle('strike'), view),
              },
            ]
          : []),
        ...(of
          ? [
              { kind: 'separator' as const },
              {
                label: t('editor-found'),
                hint: found ? t('editor-found-count', { count: found }) : t('editor-found-none'),
                icon: TextSearch,
                action: () => goThrough(of),
              },
            ]
          : []),
        { kind: 'separator' as const },
        { kind: 'heading' as const, label: t('editor-while-typing') },
        {
          label: '>  -  1.',
          hint: t('editor-typing-line-hint'),
          disabled: true,
          action: () => {},
        },
        {
          label: '--  ---  ...',
          hint: t('editor-typing-dashes-hint'),
          disabled: true,
          action: () => {},
        },
      ],
      { align: 'end' },
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
    class="style"
    disabled={!body}
    aria-label={t('editor-paragraph-kind-now', { kind: current.label })}
    use:tooltip={{ text: t('editor-paragraph-kind'), side: 'bottom' }}
    onclick={styles}
  >
    <span class="truncate">{current.label}</span>
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
    disabled={!s || s.kind === 'title'}
    use:tooltip={{ text: t('editor-insert-hint'), side: 'bottom' }}
    onclick={insert}
  >
    <Plus size={13} />
    {t('editor-insert')}
  </button>

  <span class="spring"></span>

  <button
    type="button"
    disabled={!s && !map}
    aria-label={t('editor-more')}
    use:tooltip={{ text: t('editor-more-hint'), side: 'bottom' }}
    onclick={more}
  >
    <Ellipsis size={15} />
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
  .spring {
    flex: 1;
  }
</style>
