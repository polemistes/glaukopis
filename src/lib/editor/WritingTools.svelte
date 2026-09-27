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
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import Pilcrow from '@lucide/svelte/icons/pilcrow';
  import Quote from '@lucide/svelte/icons/quote';
  import StickyNote from '@lucide/svelte/icons/sticky-note';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Subscript from '@lucide/svelte/icons/subscript';
  import Superscript from '@lucide/svelte/icons/superscript';
  import TextQuote from '@lucide/svelte/icons/text-quote';
  import type { Command } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { insertFootnote, setStyle, styleOf, toggle, type ParagraphStyle } from './commands';
  import { editorUi } from './ui.svelte';
  import { hooksOf } from './views.svelte';

  interface Props {
    /** The part of the window whose texts the tools are for. */
    scope?: HTMLElement | null;
  }

  let { scope = null }: Props = $props();

  const s = $derived.by(() => {
    const selection = editorUi.selection;
    if (!selection) return null;
    // A note is written in a panel of its own, which belongs to no part of the window.
    if (scope && selection.kind !== 'note' && !scope.contains(selection.view.dom)) return null;
    return selection;
  });
  const body = $derived(s?.kind === 'body');
  const style = $derived<ParagraphStyle>(s && body ? styleOf(s.view.state) : 'text');

  const STYLES: {
    value: ParagraphStyle;
    label: string;
    hint: string;
    icon: typeof Pilcrow;
    shortcut?: string;
  }[] = [
    { value: 'text', label: 'Text', hint: 'A paragraph', icon: Pilcrow },
    {
      value: 'quote',
      label: 'Quotation',
      hint: 'Set apart from the text',
      icon: TextQuote,
      shortcut: "Ctrl+'",
    },
    {
      value: 'list',
      label: 'List',
      hint: 'With a mark before each point',
      icon: List,
      shortcut: 'Ctrl+Shift+8',
    },
    {
      value: 'numbered',
      label: 'Numbered list',
      hint: 'With a number before each point',
      icon: ListOrdered,
      shortcut: 'Ctrl+Shift+7',
    },
  ];
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

  function styles(event: MouseEvent) {
    // The text loses the cursor while the menu is open: what it was is kept.
    const view = s?.view;
    if (!view) return;
    openMenu(
      event.currentTarget as HTMLElement,
      STYLES.map((x) => ({
        label: x.label,
        hint: x.hint,
        icon: x.icon,
        shortcut: x.shortcut,
        checked: x.value === style,
        action: () => run(setStyle(x.value), view),
      })),
      { align: 'start' },
    );
  }

  function more(event: MouseEvent) {
    const view = s?.view;
    const marks = s?.marks ?? {};
    if (!view) return;
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: 'Superscript',
          icon: Superscript,
          shortcut: 'Ctrl+.',
          checked: marks.sup,
          action: () => run(toggle('sup'), view),
        },
        {
          label: 'Subscript',
          icon: Subscript,
          shortcut: 'Ctrl+,',
          checked: marks.sub,
          action: () => run(toggle('sub'), view),
        },
        ...(s?.kind === 'title'
          ? []
          : [
              {
                label: 'Struck through',
                icon: Strikethrough,
                shortcut: 'Ctrl+Shift+X',
                checked: marks.strike,
                action: () => run(toggle('strike'), view),
              },
            ]),
        { kind: 'separator' as const },
        { kind: 'heading' as const, label: 'While typing' },
        {
          label: '>  -  1.',
          hint: 'At the start of a line: quotation, list, numbered list',
          disabled: true,
          action: () => {},
        },
        { label: '--  ---  ...', hint: 'Become –, — and …', disabled: true, action: () => {} },
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
  aria-label="Writing"
  tabindex="-1"
  onmousedown={(e) => e.preventDefault()}
>
  <button
    type="button"
    class="style"
    disabled={!body}
    aria-label="Kind of paragraph: {current.label}"
    use:tooltip={{ text: 'Kind of paragraph', side: 'bottom' }}
    onclick={styles}
  >
    <span class="truncate">{current.label}</span>
    <ChevronDown size={13} />
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class:on={s?.marks.em}
    disabled={!s}
    aria-label="Italic"
    use:tooltip={{ text: 'Italic', shortcut: 'Ctrl+I', side: 'bottom' }}
    onclick={() => run(toggle('em'))}
  >
    <Italic size={15} />
  </button>
  <button
    type="button"
    class:on={s?.marks.strong}
    disabled={!s || s.kind === 'title'}
    aria-label="Bold"
    use:tooltip={{ text: 'Bold', shortcut: 'Ctrl+B', side: 'bottom' }}
    onclick={() => run(toggle('strong'))}
  >
    <Bold size={15} />
  </button>
  <button
    type="button"
    class="caps"
    class:on={s?.marks.smallcaps}
    disabled={!s}
    aria-label="Small capitals"
    use:tooltip={{ text: 'Small capitals', shortcut: 'Ctrl+Shift+K', side: 'bottom' }}
    onclick={() => run(toggle('smallcaps'))}
  >
    <span>Sc</span>
  </button>

  <span class="rule"></span>

  <button
    type="button"
    class="word cite"
    disabled={!s || s.kind === 'title'}
    use:tooltip={{ text: 'Cite a work where the cursor is', shortcut: '@', side: 'bottom' }}
    onclick={cite}
  >
    <Quote size={13} />
    Cite
  </button>
  <button
    type="button"
    class="word"
    disabled={!body}
    use:tooltip={{
      text: 'A note, at the foot of the page or the end',
      shortcut: 'Ctrl+Alt+F',
      side: 'bottom',
    }}
    onclick={note}
  >
    <StickyNote size={13} />
    Note
  </button>

  <span class="spring"></span>

  <button
    type="button"
    disabled={!s}
    aria-label="More"
    use:tooltip={{ text: 'More, and what can be typed', side: 'bottom' }}
    onclick={more}
  >
    <Ellipsis size={15} />
  </button>
</div>

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
