<script lang="ts" module>
  import { Fragment, Schema, Slice, type Node } from 'prosemirror-model';
  import { bodySchema } from '$lib/editor/schema';

  /**
   * What the field can hold: one line of text with the marks a text can
   * have, but for links. A formula that came from what was said of a figure
   * is kept and shown; it is written in a text, not here.
   */
  export const captionSchema = new Schema({
    nodes: {
      doc: { content: 'line' },
      line: {
        content: 'inline*',
        parseDOM: [{ tag: 'p' }, { tag: 'div' }, { tag: 'figcaption' }, { tag: 'li' }],
        toDOM: () => ['div', { class: 'caption-line' }, 0],
      },
      text: { group: 'inline' },
      math: { ...bodySchema.spec.nodes.get('math')!, draggable: false },
    },
    marks: bodySchema.spec.marks.remove('link'),
  });

  /** What is pasted is made one line of. */
  function oneLine(slice: Slice): Slice {
    const out: Node[] = [];
    let lines = 0;
    slice.content.forEach((node) => {
      if (node.isInline) {
        out.push(node);
        return;
      }
      if (!node.content.size) return;
      if (lines++) out.push(captionSchema.text(' '));
      node.content.forEach((child) => out.push(child));
    });
    return new Slice(Fragment.fromArray(out), 0, 0);
  }
</script>

<script lang="ts">
  /**
   * A field for what is said of a picture: one line of text with marks. It
   * is an editor of its own, bound to no project; what it holds goes in and
   * out as the store keeps it.
   */
  import Italic from '@lucide/svelte/icons/italic';
  import { baseKeymap } from 'prosemirror-commands';
  import { keymap } from 'prosemirror-keymap';
  import { EditorState, TextSelection, type Command } from 'prosemirror-state';
  import { EditorView, type NodeView } from 'prosemirror-view';
  import { untrack } from 'svelte';
  import { captionNodes, captionOf, markActive, toggle } from '$lib/editor/commands';
  import { placeholder as placeholderPlugin } from '$lib/editor/plugins';
  import { showFormula } from '$lib/figures/math.svelte';
  import { t } from '$lib/i18n';
  import type { Inline } from '$lib/project/model/text';
  import { tooltip } from '$lib/ui/tooltip';

  interface Props {
    value: Inline[];
    /** Called with what the field holds, whenever that has changed. */
    onchange: (value: Inline[]) => void;
    /** The field was left, or Enter was pressed in it: what it holds is to be kept. */
    onkeep?: () => void;
    placeholder?: string;
    label?: string;
  }

  let { value, onchange, onkeep, placeholder = '', label }: Props = $props();

  let host = $state<HTMLDivElement>();
  let view: EditorView | undefined;
  let marks = $state<Record<string, boolean>>({});

  /** What was there before, for Ctrl+Z, and what was undone, for doing it again. */
  let past: EditorState[] = [];
  let future: EditorState[] = [];
  let changed = 0;

  const docOf = (inlines: Inline[]) =>
    captionSchema.node('doc', null, [
      captionSchema.node('line', null, captionNodes(captionSchema, inlines)),
    ]);
  const held = (state: EditorState): Inline[] =>
    state.doc.firstChild ? captionOf(state.doc.firstChild) : [];
  const same = (a: Inline[], b: Inline[]) => JSON.stringify(a) === JSON.stringify(b);

  /** A formula, shown as mathematics. */
  class Formula implements NodeView {
    dom: HTMLElement;
    #stop: () => void;
    constructor(node: Node) {
      this.dom = document.createElement('span');
      this.dom.className = 'math';
      this.dom.contentEditable = 'false';
      const tex = String(node.attrs.tex ?? '');
      this.#stop = $effect.root(() => {
        $effect(() => showFormula(this.dom, tex, false));
      });
    }
    ignoreMutation() {
      return true;
    }
    destroy() {
      this.#stop();
    }
  }

  function look(state: EditorState) {
    const next: Record<string, boolean> = {};
    for (const [name, type] of Object.entries(state.schema.marks))
      next[name] = markActive(state, type);
    marks = next;
  }

  function step(to: EditorState[], from: EditorState[]): Command {
    return () => {
      const state = from.pop();
      if (!view || !state) return true;
      to.push(view.state);
      changed = 0;
      view.updateState(state);
      look(state);
      onchange(held(state));
      return true;
    };
  }

  const keep: Command = () => {
    onkeep?.();
    return true;
  };

  $effect(() => {
    if (!host) return;
    const target = host;
    const created = untrack(
      () =>
        new EditorView(target, {
          state: EditorState.create({
            doc: docOf(value),
            plugins: [
              keymap({
                'Mod-z': step(future, past),
                'Mod-y': step(past, future),
                'Shift-Mod-z': step(past, future),
                'Mod-b': toggle('strong'),
                'Mod-i': toggle('em'),
                'Mod-.': toggle('sup'),
                'Mod-,': toggle('sub'),
                'Shift-Mod-k': toggle('smallcaps'),
                'Shift-Mod-x': toggle('strike'),
                Enter: keep,
                'Shift-Enter': keep,
                'Mod-Enter': keep,
              }),
              keymap(baseKeymap),
              placeholderPlugin(() => placeholder),
            ],
          }),
          attributes: {
            class: 'prose caption',
            spellcheck: 'true',
            role: 'textbox',
            'aria-label': label ?? t('pictures-caption'),
          },
          nodeViews: { math: (node) => new Formula(node) },
          transformPasted: oneLine,
          handleDOMEvents: {
            focus: (v) => {
              look(v.state);
              return false;
            },
            blur: () => {
              onkeep?.();
              return false;
            },
          },
          dispatchTransaction(tr) {
            const v = this as unknown as EditorView;
            if (v.isDestroyed) return;
            const before = v.state;
            const next = before.apply(tr);
            const mine = tr.docChanged && !tr.getMeta('fromOutside');
            if (mine) {
              // What is typed without a pause is undone together.
              const now = Date.now();
              if (now - changed > 800 || !past.length) past.push(before);
              if (past.length > 200) past.shift();
              changed = now;
              future = [];
            }
            v.updateState(next);
            look(next);
            if (mine) onchange(held(next));
          },
        }),
    );
    view = created;
    return () => {
      created.destroy();
      if (view === created) view = undefined;
    };
  });

  // What is said of the picture elsewhere meanwhile is shown here, unless
  // something else is being written here.
  $effect(() => {
    const wanted = value;
    untrack(() => {
      if (!view || view.hasFocus()) return;
      const next = docOf(wanted);
      if (same(captionOf(next.firstChild!), held(view.state))) return;
      past = [];
      future = [];
      const { state } = view;
      view.dispatch(
        state.tr.replaceWith(0, state.doc.content.size, next.content).setMeta('fromOutside', true),
      );
    });
  });

  function mark(name: 'em' | 'smallcaps') {
    if (!view) return;
    if (!view.hasFocus()) {
      view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
      view.focus();
    }
    toggle(name)(view.state, view.dispatch, view);
  }

  export function focus() {
    view?.focus();
  }
</script>

<!-- The keys the field has taken mean nothing to what is around it. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="caption-field"
  onkeydown={(e) => {
    if (e.defaultPrevented) e.stopPropagation();
  }}
>
  <div class="box" bind:this={host}></div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="marks" onmousedown={(e) => e.preventDefault()}>
    <button
      type="button"
      class:on={marks.em}
      aria-label={t('pictures-italic')}
      aria-pressed={!!marks.em}
      tabindex="-1"
      use:tooltip={{ text: t('pictures-italic'), shortcut: 'Ctrl+I', side: 'bottom' }}
      onclick={() => mark('em')}
    >
      <Italic size={14} />
    </button>
    <button
      type="button"
      class="caps"
      class:on={marks.smallcaps}
      aria-label={t('pictures-small-caps')}
      aria-pressed={!!marks.smallcaps}
      tabindex="-1"
      use:tooltip={{ text: t('pictures-small-caps'), shortcut: 'Ctrl+Shift+K', side: 'bottom' }}
      onclick={() => mark('smallcaps')}
    >
      <span>Sc</span>
    </button>
  </div>
</div>

<style>
  .caption-field {
    display: flex;
    align-items: flex-start;
    gap: 2px;
    padding: 0 3px 0 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    transition:
      border-color var(--fast) var(--ease),
      box-shadow var(--fast) var(--ease);
  }
  .caption-field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .box {
    flex: 1;
    min-width: 0;
  }
  .box :global(.prose.caption) {
    min-height: calc(var(--control-h) - 2px);
    padding: 4px 9px;
    font-size: 14.5px;
    line-height: 1.45;
  }
  .box :global(.prose.caption .math) {
    cursor: default;
  }
  .marks {
    display: flex;
    flex: none;
    gap: 1px;
    padding-top: 2px;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  button.on {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .caps span {
    font-variant-caps: small-caps;
    font-weight: 600;
    font-size: 12.5px;
  }
</style>
