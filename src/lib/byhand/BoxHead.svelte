<script lang="ts">
  /**
   * The head of a box of rich text (ADR 0112, 0113): its name, the tools
   * that set the look by hand, and the menu of the box. It stands at the
   * top of the box and stays in view while the box is scrolled through. The
   * tools show while the cursor is in this box, each showing what is set of
   * what is selected: the font, the size and the colour of the words; bold,
   * italic and underlined; how the paragraphs stand; the lists; a panel
   * with the spacing and the indents; and what takes it all away. The head
   * is as high with the tools as without, so that nothing moves when the
   * cursor comes into the box. Where the head is too narrow for all of
   * them, as beside the typesetting pane or in the box of an element, those
   * that do not fit are folded into one menu at the end of the row. The
   * name is the grip by which the sheet is dragged to another place in the
   * text.
   */
  import Baseline from '@lucide/svelte/icons/baseline';
  import Bold from '@lucide/svelte/icons/bold';
  import ChevronsRight from '@lucide/svelte/icons/chevrons-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import RemoveFormatting from '@lucide/svelte/icons/remove-formatting';
  import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
  import TextAlignEnd from '@lucide/svelte/icons/text-align-end';
  import TextAlignJustify from '@lucide/svelte/icons/text-align-justify';
  import TextAlignStart from '@lucide/svelte/icons/text-align-start';
  import Underline from '@lucide/svelte/icons/underline';
  import UnfoldVertical from '@lucide/svelte/icons/unfold-vertical';
  import type { Command } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { kindOf, markActive, setKind, toggle } from '$lib/editor/commands';
  import { dragWhole } from '$lib/editor/dragged';
  import { hooksOf } from '$lib/editor/ui.svelte';
  import { t } from '$lib/i18n';
  import { fonts } from '$lib/look/fonts.svelte';
  import { testHook } from '$lib/shell/testing';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { boxAt } from './box';
  import { clearHand, handAt, handMarkAt, setHand, setHandMark } from './commands';
  import { fontOf, lengthOf, sizeOf, type HandAlign, type HandLook } from './hand';
  import { nowOf } from './now.svelte';

  interface Props {
    view: EditorView;
    /** Where the box stands in the text, as the editor knows it now. */
    getPos: () => number | undefined;
    /** Opens the menu of the box beside its button. */
    menu: (anchor: HTMLElement) => void;
  }
  let { view, getPos, menu }: Props = $props();

  // The editor of a box is the same for as long as the box is drawn.
  const now = $derived(nowOf(view));
  const editable = $derived(view.editable);
  /** The text as it stands, where the cursor is in this box and the text is written in. */
  const here = $derived.by(() => {
    const s = now.state;
    if (!editable || !now.writing || !s) return null;
    return boxAt(s)?.pos === getPos() ? s : null;
  });

  $effect(() => {
    if (here) fonts.ask();
  });

  function run(command: Command) {
    if (view.isDestroyed) return;
    command(view.state, view.dispatch, view);
    view.focus();
  }

  // ---- the words: font, size, colour ----

  const font = $derived(here ? handMarkAt(here, 'font') : null);
  const size = $derived(here ? handMarkAt(here, 'size') : null);
  const colour = $derived(here ? handMarkAt(here, 'colour') : null);

  /** The fonts set by hand in this text already, each once. */
  const fontsHere = $derived.by(() => {
    const used = new Set<string>();
    const type = here?.schema.marks.font;
    if (!here || !type) return [];
    here.doc.descendants((node) => {
      for (const mark of node.marks) if (mark.type === type) used.add(String(mark.attrs.family));
      return true;
    });
    return [...used].sort((a, b) => a.localeCompare(b));
  });
  const fontsRest = $derived(
    fonts.all.filter((f) => !fontsHere.includes(f)).sort((a, b) => a.localeCompare(b)),
  );

  /** The sizes offered, as a word processor offers them; any other is written into the field. */
  const SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

  function sizeTyped(event: Event) {
    const field = event.currentTarget as HTMLInputElement;
    const typed = field.value.trim().replace(',', '.');
    if (!typed) return run(setHandMark('size', null));
    const pt = sizeOf(typed);
    // What is no size is not set: the field shows again what the words have.
    if (pt === null) field.value = typeof size === 'number' ? String(size) : '';
    else run(setHandMark('size', pt));
  }

  const COLOURS: [string, string][] = [
    ['black', '#000000'],
    ['grey', '#666666'],
    ['red', '#b0322a'],
    ['orange', '#c46a16'],
    ['green', '#2f7a3e'],
    ['blue', '#2060a0'],
    ['purple', '#7a3f98'],
    ['brown', '#7b4a12'],
  ];

  /** The field by which the system's own chooser of colours is opened. */
  let any = $state<HTMLInputElement>();

  /** The colours to choose among: as the document, the plain ones, and any other. */
  function colourItems(): MenuItem[] {
    return [
      {
        label: t('byhand-as-document'),
        checked: colour === null,
        action: () => run(setHandMark('colour', null)),
      },
      { kind: 'separator' },
      ...COLOURS.map(([name, value]): MenuItem => ({
        label: t(`byhand-colour-${name}`),
        colour: value,
        checked: colour === value,
        action: () => run(setHandMark('colour', value)),
      })),
      { kind: 'separator' },
      { label: t('byhand-colour-other'), action: () => any?.click() },
    ];
  }

  function colours(event: MouseEvent) {
    openMenu(event.currentTarget as HTMLElement, colourItems(), { align: 'start' });
  }

  // For the scripts of the running application, which cannot press the system's chooser of colours: any colour, as if chosen there.
  testHook('__glaukopisRichColour', (value: string) => run(setHandMark('colour', value)));

  // ---- bold, italic, underlined; the lists ----

  const MARKS = [
    { mark: 'strong', label: () => t('editor-bold'), icon: Bold },
    { mark: 'em', label: () => t('editor-italic'), icon: Italic },
    { mark: 'underline', label: () => t('editor-underline'), icon: Underline },
  ] as const;
  const LISTS = [
    { kind: 'item', label: () => t('editor-list'), icon: List },
    { kind: 'numbered', label: () => t('editor-numbered-list'), icon: ListOrdered },
  ] as const;
  const own = () => hooksOf.get(view)?.passageKinds?.() ?? [];
  /** Makes the paragraphs selected points of a list of a kind, or text again where they are that. */
  const listed =
    (kind: string): Command =>
    (s, dispatch, v) =>
      setKind(kindOf(s) === kind ? 'text' : kind, own())(s, dispatch, v);

  // ---- the paragraphs: how they stand ----

  const stands = $derived(here ? handAt(here) : { look: {} as HandLook, mixed: [] });
  const ALIGNS: { align: HandAlign; label: () => string; icon: typeof Bold }[] = [
    { align: 'left', label: () => t('format-align-left'), icon: TextAlignStart },
    { align: 'center', label: () => t('format-align-center'), icon: TextAlignCenter },
    { align: 'right', label: () => t('format-align-right'), icon: TextAlignEnd },
    { align: 'justified', label: () => t('format-align-justified'), icon: TextAlignJustify },
  ];

  let paragraphOpen = $state(false);
  let paragraphButton = $state<HTMLElement>();
  const SPACINGS: [number, () => string][] = [
    [1, () => t('format-spacing-single')],
    [1.5, () => t('format-spacing-one-and-a-half')],
    [2, () => t('format-spacing-double')],
  ];
  /** The lengths of the panel, each with the unit a number alone is taken in. */
  const LENGTHS: { key: keyof HandLook; label: () => string; unit: string }[] = [
    { key: 'spaceBefore', label: () => t('format-space-before'), unit: 'pt' },
    { key: 'spaceAfter', label: () => t('format-space-after'), unit: 'pt' },
    { key: 'indentLeft', label: () => t('format-indent-left'), unit: 'cm' },
    { key: 'indentRight', label: () => t('format-indent-right'), unit: 'cm' },
    { key: 'firstLine', label: () => t('format-first-line'), unit: 'cm' },
  ];

  function lengthTyped(key: keyof HandLook, unit: string, event: Event) {
    const field = event.currentTarget as HTMLInputElement;
    const typed = field.value.trim().replace(',', '.');
    if (!typed) return void setHand({ [key]: null })(view.state, view.dispatch, view);
    const length = lengthOf(/^-?\d+(\.\d+)?$/.test(typed) ? `${typed}${unit}` : typed);
    if (length === null) field.value = String(stands.look[key] ?? '');
    else setHand({ [key]: length })(view.state, view.dispatch, view);
  }

  // ---- what fits in the head, and what is folded away ----

  /**
   * The tools in groups, each with the room it takes in the row, in pixels,
   * the line before it counted in. They stand in this order.
   */
  const ROOM = {
    font: 133,
    size: 47,
    colour: 25,
    marks: 84,
    aligns: 109,
    lists: 59,
    paragraph: 59,
  } as const;
  type Group = keyof typeof ROOM;
  /**
   * The order they are kept in where the head is narrow: the font, the size
   * and the colour longest, which nothing else in the window offers; how
   * the paragraphs stand next; then what the bar of the side has as well.
   */
  const KEPT: readonly Group[] = [
    'font',
    'size',
    'colour',
    'aligns',
    'paragraph',
    'marks',
    'lists',
  ];
  /** The room the button of what is folded away takes. */
  const FOLDED = 26;

  let headWidth = $state(0);
  let nameWidth = $state(0);
  /**
   * The groups that are shown in the row. All of them where there is room,
   * and before the head has been measured; where there is not, those that
   * fit beside the button of the rest, taken in the order they are kept in.
   */
  const shown = $derived.by(() => {
    // Beside the name, which reaches 18 over the sign before it: the room between the parts of the head, and the button of the box's menu.
    const room = headWidth - (nameWidth - 18) - 24 - 24;
    const all = KEPT.reduce((sum, group) => sum + ROOM[group], 0);
    if (!headWidth || room >= all) return new Set<Group>(KEPT);
    let left = room - FOLDED;
    const fit = new Set<Group>();
    // One that has no room does not keep a smaller one after it from the room that is left.
    for (const group of KEPT) {
      if (ROOM[group] > left) continue;
      fit.add(group);
      left -= ROOM[group];
    }
    return fit;
  });
  const folded = $derived(KEPT.some((group) => !shown.has(group)));

  let foldedButton = $state<HTMLElement>();

  /** The menu of the tools that have no room in the row: each as it is in the row, in the order of the row. */
  function foldedMenu(event: MouseEvent) {
    const s = here;
    if (!s) return;
    const items: MenuItem[] = [];
    const part = (group: Group, entries: MenuItem[]) => {
      if (shown.has(group)) return;
      if (items.length) items.push({ kind: 'separator' });
      items.push(...entries);
    };
    part('font', [
      {
        kind: 'submenu',
        label: t('format-typeface'),
        items: [
          {
            label: t('byhand-as-document'),
            checked: font === null,
            action: () => run(setHandMark('font', null)),
          },
          { kind: 'separator' },
          ...[...fontsHere, ...fontsRest].map((family): MenuItem => ({
            label: family,
            checked: font === family,
            action: () => run(setHandMark('font', family)),
          })),
        ],
      },
    ]);
    part('size', [
      {
        kind: 'submenu',
        label: t('format-size'),
        items: [
          {
            label: t('byhand-as-document'),
            checked: size === null,
            action: () => run(setHandMark('size', null)),
          },
          { kind: 'separator' },
          ...SIZES.map((pt): MenuItem => ({
            label: String(pt),
            checked: size === pt,
            action: () => run(setHandMark('size', pt)),
          })),
        ],
      },
    ]);
    part('colour', [{ kind: 'submenu', label: t('byhand-colour'), items: colourItems() }]);
    part(
      'marks',
      MARKS.map((m): MenuItem => ({
        label: m.label(),
        icon: m.icon,
        checked: markActive(s, s.schema.marks[m.mark]),
        action: () => run(toggle(m.mark)),
      })),
    );
    part(
      'aligns',
      ALIGNS.map((a): MenuItem => ({
        label: a.label(),
        icon: a.icon,
        checked: stands.look.align === a.align,
        action: () => run(setHand({ align: stands.look.align === a.align ? null : a.align })),
      })),
    );
    part(
      'lists',
      LISTS.map((l): MenuItem => ({
        label: l.label(),
        icon: l.icon,
        checked: kindOf(s) === l.kind,
        action: () => run(listed(l.kind)),
      })),
    );
    part('paragraph', [
      { label: t('byhand-paragraph'), icon: UnfoldVertical, action: () => (paragraphOpen = true) },
      { label: t('byhand-clear'), icon: RemoveFormatting, action: () => run(clearHand) },
    ]);
    openMenu(event.currentTarget as HTMLElement, items, { align: 'end' });
  }

  /** A press in the head leaves the cursor where it is in the text; a field or a list takes it, and gives it back. */
  function keep(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('select, input, [data-rich-grip]')) event.preventDefault();
  }

  let head = $state<HTMLElement>();
  /** The sheet is moved by its name, with all it holds: see `editor/dragged.ts`. */
  function drag(event: DragEvent) {
    const pos = getPos();
    if (pos === undefined || !dragWhole(view, pos, event, head)) event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="head" data-rich-head bind:this={head} bind:clientWidth={headWidth} onmousedown={keep}>
  <span
    class="name"
    class:grip={editable}
    data-rich-grip
    draggable={editable}
    ondragstart={drag}
    bind:clientWidth={nameWidth}>{t('byhand-name')}</span
  >
  {#if here}
    <div class="tools" role="toolbar" aria-label={t('byhand-name')} data-rich-tools>
      {#if shown.has('font')}
        <select
          class="font"
          aria-label={t('format-typeface')}
          use:tooltip={t('format-typeface')}
          data-rich-font
          value={font === undefined ? '\u0000' : (font ?? '')}
          onchange={(e) => run(setHandMark('font', fontOf(e.currentTarget.value)))}
        >
          {#if font === undefined}<option value={'\u0000'} disabled>{t('byhand-several')}</option
            >{/if}
          <option value="">{t('byhand-as-document')}</option>
          {#if fontsHere.length}
            <optgroup label={t('byhand-fonts-here')}>
              {#each fontsHere as family (family)}<option value={family}>{family}</option>{/each}
            </optgroup>
          {/if}
          <optgroup label={t('look-fonts-all')}>
            {#each fontsRest as family (family)}<option value={family}>{family}</option>{/each}
          </optgroup>
        </select>
      {/if}
      {#if shown.has('size')}
        <input
          class="size"
          type="text"
          inputmode="decimal"
          list="rich-sizes"
          aria-label={t('format-size')}
          use:tooltip={t('format-size')}
          data-rich-size
          placeholder={size === undefined ? '…' : ''}
          value={typeof size === 'number' ? String(size) : ''}
          onchange={sizeTyped}
          onkeydown={(e) => {
            // The key is taken here: the cursor goes back to the text while it is down, where it would break the line.
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              view.focus();
            }
          }}
        />
        <datalist id="rich-sizes">
          {#each SIZES as pt (pt)}<option value={String(pt)}></option>{/each}
        </datalist>
      {/if}
      {#if shown.has('colour')}
        <button
          type="button"
          class="tool colour"
          aria-label={t('byhand-colour')}
          aria-haspopup="menu"
          use:tooltip={t('byhand-colour')}
          data-rich-colour={typeof colour === 'string' ? colour : ''}
          onclick={colours}
        >
          <Baseline size={14} />
          <span class="swatch" style:background={typeof colour === 'string' ? colour : 'var(--ink)'}
          ></span>
        </button>
      {/if}
      <input
        bind:this={any}
        class="any"
        type="color"
        tabindex="-1"
        aria-hidden="true"
        value={typeof colour === 'string' ? colour : '#000000'}
        onchange={(e) => run(setHandMark('colour', e.currentTarget.value))}
      />
      {#if shown.has('marks')}
        <span class="between"></span>
        {#each MARKS as m (m.mark)}
          <button
            type="button"
            class="tool"
            class:active={markActive(here, here.schema.marks[m.mark])}
            aria-label={m.label()}
            aria-pressed={markActive(here, here.schema.marks[m.mark])}
            use:tooltip={m.label()}
            data-rich-mark={m.mark}
            onclick={() => run(toggle(m.mark))}><m.icon size={14} /></button
          >
        {/each}
      {/if}
      {#if shown.has('aligns')}
        <span class="between"></span>
        {#each ALIGNS as a (a.align)}
          <button
            type="button"
            class="tool"
            class:active={stands.look.align === a.align}
            aria-label={a.label()}
            aria-pressed={stands.look.align === a.align}
            use:tooltip={a.label()}
            data-rich-align={a.align}
            onclick={() => run(setHand({ align: stands.look.align === a.align ? null : a.align }))}
            ><a.icon size={14} /></button
          >
        {/each}
      {/if}
      {#if shown.has('lists')}
        <span class="between"></span>
        {#each LISTS as l (l.kind)}
          <button
            type="button"
            class="tool"
            class:active={kindOf(here) === l.kind}
            aria-label={l.label()}
            aria-pressed={kindOf(here) === l.kind}
            use:tooltip={l.label()}
            data-rich-list={l.kind}
            onclick={() => run(listed(l.kind))}><l.icon size={14} /></button
          >
        {/each}
      {/if}
      {#if shown.has('paragraph')}
        <span class="between"></span>
        <button
          bind:this={paragraphButton}
          type="button"
          class="tool"
          class:active={paragraphOpen}
          aria-label={t('byhand-paragraph')}
          aria-haspopup="dialog"
          use:tooltip={t('byhand-paragraph')}
          data-rich-paragraph
          onclick={() => (paragraphOpen = !paragraphOpen)}><UnfoldVertical size={14} /></button
        >
        <button
          type="button"
          class="tool"
          aria-label={t('byhand-clear')}
          use:tooltip={t('byhand-clear')}
          data-rich-clear
          onclick={() => run(clearHand)}><RemoveFormatting size={14} /></button
        >
      {/if}
      {#if folded}
        <!-- The tools that have no room in the row, in one menu. -->
        <button
          bind:this={foldedButton}
          type="button"
          class="tool"
          aria-label={t('byhand-more-tools')}
          aria-haspopup="menu"
          use:tooltip={t('byhand-more-tools')}
          data-rich-folded
          onclick={foldedMenu}><ChevronsRight size={14} /></button
        >
      {/if}
    </div>
  {/if}
  <span class="gap"></span>
  {#if editable}
    <button
      type="button"
      class="tool more"
      data-rich-menu
      aria-label={t('byhand-menu')}
      aria-haspopup="menu"
      use:tooltip={t('byhand-menu')}
      onclick={(e) => menu(e.currentTarget)}
    >
      <Ellipsis size={15} />
    </button>
  {/if}
</div>

<Popover
  open={paragraphOpen && !!here}
  anchor={paragraphButton ?? foldedButton}
  align="end"
  width={250}
  label={t('byhand-paragraph')}
  onclose={() => {
    paragraphOpen = false;
    if (!view.isDestroyed) view.focus();
  }}
>
  <div class="paragraph" data-rich-paragraph-panel>
    <label class="row">
      <span>{t('format-line-spacing')}</span>
      <select
        data-rich-spacing
        value={stands.look.lineSpacing ? String(stands.look.lineSpacing) : ''}
        onchange={(e) =>
          setHand({ lineSpacing: e.currentTarget.value ? Number(e.currentTarget.value) : null })(
            view.state,
            view.dispatch,
            view,
          )}
      >
        <option value="">{t('byhand-as-document')}</option>
        {#each SPACINGS as [value, label] (value)}<option value={String(value)}>{label()}</option
          >{/each}
        {#if stands.look.lineSpacing && !SPACINGS.some(([v]) => v === stands.look.lineSpacing)}
          <option value={String(stands.look.lineSpacing)}>{stands.look.lineSpacing}</option>
        {/if}
      </select>
    </label>
    {#each LENGTHS as l (l.key)}
      <label class="row">
        <span>{l.label()}</span>
        <input
          type="text"
          data-rich-length={l.key}
          placeholder={stands.mixed.includes(l.key) ? '…' : l.unit}
          value={String(stands.look[l.key] ?? '')}
          onchange={(e) => lengthTyped(l.key, l.unit, e)}
          onkeydown={(e) => {
            // Enter sets it, and the cursor stays in the field for the next.
            if (e.key === 'Enter') {
              e.preventDefault();
              lengthTyped(l.key, l.unit, e);
            }
          }}
        />
      </label>
    {/each}
    <p class="hint">{t('byhand-paragraph-empty')}</p>
  </div>
</Popover>

<style>
  /* The measures and the letters of the head are the sheet's (app.css), which draws the same head where a text is only shown. */
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 26px;
    min-width: 0;
  }
  /* The name is the grip the sheet is moved by; the sign before it is drawn by the sheet (app.css), over which the name reaches. */
  .name {
    flex: none;
    margin-left: -18px;
    padding-left: 18px;
    white-space: nowrap;
  }
  .name.grip {
    cursor: grab;
  }
  .gap {
    flex: 1;
  }
  /* What does not fit is not shown: the row never grows, and never wraps. */
  .tools {
    display: flex;
    align-items: center;
    gap: 1px;
    min-width: 0;
    overflow: hidden;
  }
  .between {
    flex: none;
    width: 1px;
    height: 14px;
    margin: 0 4px;
    background: var(--line-strong);
  }
  .tool {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tool:hover,
  .tool:focus-visible {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .tool.active {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .tool.more {
    color: var(--ink-3);
  }
  .colour {
    position: relative;
    flex-direction: column;
    gap: 0;
  }
  .swatch {
    width: 14px;
    height: 3px;
    margin-top: -3px;
    border-radius: 1px;
  }
  /* The system's chooser of colours is opened from the menu; its field is not seen. */
  .any {
    position: absolute;
    width: 0;
    height: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    pointer-events: none;
  }
  select,
  input[type='text'] {
    flex: none;
    height: 22px;
    padding: 0 4px;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    font-size: 0.72rem;
    line-height: 1;
  }
  .font {
    width: 132px;
  }
  .size {
    width: 40px;
    margin: 0 3px;
    text-align: right;
  }
  .paragraph {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    font-family: var(--font-ui);
    font-size: 0.78rem;
    color: var(--ink);
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 96px;
    align-items: center;
    gap: 8px;
  }
  .row select,
  .row input {
    width: 100%;
    font-size: 0.78rem;
    box-sizing: border-box;
  }
  .hint {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: 0.72rem;
  }
</style>
