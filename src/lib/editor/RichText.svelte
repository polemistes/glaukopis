<script lang="ts">
  import {
    EditorState,
    NodeSelection,
    TextSelection,
    AllSelection,
    type Command,
  } from 'prosemirror-state';
  import { CellSelection } from 'prosemirror-tables';
  import { EditorView } from 'prosemirror-view';
  import { untrack } from 'svelte';
  import { ySyncPlugin, yCursorPlugin } from 'y-prosemirror';
  import type * as Y from 'yjs';
  import type { Project } from '$lib/project/model/project.svelte';
  import { t } from '$lib/i18n';
  import { insertCitation } from './commands';
  import {
    bodyPlugins,
    placeholder as placeholderPlugin,
    titlePlugins,
    type KeyAction,
  } from './plugins';
  import { copiedHtml, copiedText, pastedTextSlice } from './clipboard';
  import { bodySchema, titleSchema } from './schema';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { editorUi, rectAt } from './ui.svelte';
  import { sharedUndo } from './undo';
  import { markActive, setLanguage } from './commands';
  import {
    LAYOUT_NUMBERS,
    markLine,
    numberFrom,
    numbersAsked,
    numberStretch,
    relayoutNumbers,
    stretchAt,
    stretchToNumber,
    type NumbersAsked,
    type NumbersLayout,
  } from './numbers';
  import LanguageDialog from './LanguageDialog.svelte';
  import LineNumbersDialog from './LineNumbersDialog.svelte';
  import { documents } from '$lib/preview/documents.svelte';
  import { CitationView, FootnoteView, PageBreakView } from './views.svelte';
  import { RefMarkView } from './refmarks';
  import { topOf } from '$lib/figures/numbering.svelte';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { choosePicture, CrossRefView, FigureView, FormulaView } from '$lib/figures/views.svelte';
  import { insertCrossRef, insertFigure } from './commands';
  import { hooksOf, viewsByDom } from './ui.svelte';
  import { pressedFound } from '$lib/found/found.svelte';
  import { searchMarks } from '$lib/search/decorations';
  import { spellingOptions } from '$lib/spelling/menu';
  import { lookAgain, spellingPlugin } from '$lib/spelling/plugin';
  import { reviewMarks } from '$lib/review/editor';
  import { commentMarks, markComments, pressedThread } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';

  interface Props {
    project: Project;
    fragment: Y.XmlFragment;
    kind: 'body' | 'title';
    /** The element whose text it is: what stands in the text is numbered by it. */
    element?: string;
    /**
     * The element in view, in whose document what stands in the text is
     * numbered and pointed to; the tree under the project the element
     * stands in, where none is given.
     */
    at?: string;
    placeholder?: string;
    /** Where to put the cursor when the editor appears: at an end, or at a point of the window. */
    autofocus?: FocusAt | null;
    editable?: boolean;
    /** Keys that mean something outside the text. Returns whether the key was taken. */
    onaction?: (action: KeyAction, view: EditorView) => boolean;
    /** Called when a work has been cited, with its id: the project keeps a copy of the reference. */
    oncite?: (id: string) => void;
    onfocus?: (view: EditorView) => void;
    onblur?: (view: EditorView) => void;
    /** Called once `autofocus` has put the cursor in the editor. */
    onready?: (view: EditorView) => void;
    /** Called when the selection or the text changes, for toolbars. */
    onstate?: (view: EditorView) => void;
    class?: string;
  }

  let {
    project,
    fragment,
    kind,
    element,
    at,
    placeholder = '',
    autofocus = null,
    editable = true,
    onaction,
    oncite,
    onfocus,
    onblur,
    onready,
    onstate,
    class: className = '',
  }: Props = $props();

  export type FocusAt = 'start' | 'end' | 'all' | 'keep' | { left: number; top: number };

  let host = $state<HTMLDivElement>();
  let view: EditorView | undefined;
  /** Rises when an editor is made: what follows the editor follows this. */
  let made = $state(0);

  // The threads of comments on the element, drawn over their passages;
  // again whenever they change, and when the editor is made anew.
  $effect(() => {
    const threads = kind === 'body' && element ? project.threadsOf(element) : [];
    void made;
    untrack(() => {
      if (view) markComments(view, threads);
    });
  });

  /** The element whose name or text this is: its document has the language the spelling is checked in. */
  const owner = $derived(element ?? project.ownerOf(fragment));
  const language = $derived(
    owner && project.node(owner) ? (project.documentOf(owner).settings.language ?? null) : null,
  );

  // The text says what language it is in, by which a mentioned word takes
  // the quotation marks of the language (`:lang()` in the style sheet);
  // again when the language of the document changes, and when the editor
  // is made anew. The editor leaves alone what it did not set itself.
  $effect(() => {
    const now = language;
    void made;
    untrack(() => {
      if (!view) return;
      if (now) view.dom.setAttribute('lang', now);
      else view.dom.removeAttribute('lang');
    });
  });

  // What the layout of the document says of the numbers of a stretch that
  // does not say: every how many, and on which side (ADR 0041). The editor
  // is given it through a hook, and told to draw the numbers anew when it
  // changes, or when the kinds of the writer's own do.
  const numbersLayout = $derived.by<NumbersLayout>(() => {
    if (kind !== 'body' || !owner || !project.node(owner)) return LAYOUT_NUMBERS;
    const choice = documents.choice(project.documentOf(owner).settings, project);
    return documents.formatCached(choice.format)?.verse ?? LAYOUT_NUMBERS;
  });
  let numbersNow: NumbersLayout = LAYOUT_NUMBERS;
  $effect(() => {
    const now = numbersLayout;
    void project.passageKinds;
    void made;
    untrack(() => {
      const changed = now.every !== numbersNow.every || now.side !== numbersNow.side;
      numbersNow = now;
      if (view && kind === 'body' && changed) relayoutNumbers(view);
    });
  });

  /** The kinds of paragraph of the writer's own, as much as the shape of a text needs of them. */
  const ownKinds = $derived(project.passageKinds.filter((k) => k.family === 'paragraph'));

  // The dialogs the tools and the bracket of a run ask for through the
  // hooks: how the lines where the cursor is are numbered (ADR 0041), and
  // the language of what is selected (ADR 0020).
  let numbering = $state<(NumbersAsked & { view: EditorView }) | null>(null);
  let asking = $state<{ view: EditorView; tag: string | null } | null>(null);
  function askNumbers(v: EditorView) {
    const asked = numbersAsked(
      v.state,
      untrack(() => ownKinds),
    );
    if (asked) numbering = { ...asked, view: v };
  }
  function askLanguage(v: EditorView, tag: string | null) {
    asking = { view: v, tag };
  }
  /** Does something to the text of an editor, and gives it the cursor again. */
  function run(command: Command, v: EditorView) {
    if (v.isDestroyed) return;
    command(v.state, v.dispatch, v);
    v.focus();
  }

  // The spelling is looked at again when the language of the document changes, or
  // the words ignored in the project do.
  let lookedWith: { language: string | null; ignored: ReadonlySet<string> } | null = null;
  $effect(() => {
    const now = { language, ignored: project.ignored };
    untrack(() => {
      const before = lookedWith;
      lookedWith = now;
      if (view && before && (before.language !== now.language || before.ignored !== now.ignored))
        lookAgain(view);
    });
  });

  function cite(v: EditorView, typed: boolean) {
    const from = v.state.selection.from;
    editorUi.pick({
      anchor: rectAt(v, from),
      onpick: (id) => {
        editorUi.closePicker(false);
        v.focus();
        insertCitation([{ id }])(v.state, v.dispatch);
        oncite?.(id);
        // Straight on to the page number: the most common thing to add.
        const pos = v.state.selection.from - 1;
        const node = v.state.doc.nodeAt(pos);
        if (node?.type.name === 'citation') {
          const dom = v.nodeDOM(pos) as HTMLElement | null;
          editorUi.editCitation({
            anchor: dom?.getBoundingClientRect() ?? rectAt(v, pos),
            items: node.attrs.items,
            mode: node.attrs.mode,
            focus: 0,
            onchange: (items, mode) => {
              const found = findCitation(v, pos);
              if (found !== null) {
                v.dispatch(
                  items.length
                    ? v.state.tr.setNodeMarkup(found, undefined, { items, mode })
                    : v.state.tr.delete(found, found + 1),
                );
              }
            },
            onclose: () => v.focus(),
          });
        }
      },
      oncancel: () => {
        v.focus();
        // The sign that was typed is wanted as a sign after all.
        if (typed) v.dispatch(v.state.tr.insertText('@'));
      },
    });
  }

  /** Asks for a picture among the files, and puts a figure with it where the cursor is. */
  async function picture(v: EditorView) {
    const chosen = await choosePicture();
    if (!chosen || v.isDestroyed) return;
    insertFigure(chosen)(v.state, v.dispatch);
    v.focus();
  }

  /**
   * Asks what the text is to point to, and puts the words where the cursor
   * is; or, with `pos`, in place of the words that stand there. What can be
   * pointed to is what stands in the document of the element in view.
   */
  function point(v: EditorView, pos?: number) {
    if (!element || !project.node(element)) return;
    const from = pos ?? v.state.selection.from;
    editorUi.pickTarget({
      anchor: rectAt(v, from),
      at: at ?? topOf(project, element),
      onpick: (target) => {
        editorUi.closeTargets(false);
        if (v.isDestroyed) return;
        v.focus();
        const there = pos === undefined ? null : v.state.doc.nodeAt(pos);
        if (pos !== undefined && there?.type.name === 'crossref') {
          v.dispatch(v.state.tr.setNodeMarkup(pos, undefined, { target: target.id, form: 'full' }));
        } else {
          insertCrossRef(target.id)(v.state, v.dispatch);
        }
      },
      oncancel: () => v.focus(),
    });
  }

  /** Pictures that were pasted become figures. Returns whether there were any. */
  function pasted(v: EditorView, event: ClipboardEvent): boolean {
    const files = [...(event.clipboardData?.files ?? [])].filter((f) =>
      f.type.startsWith('image/'),
    );
    if (!files.length) return false;
    // With text beside them, as when something is copied from a page, the text is what is wanted.
    if (event.clipboardData?.getData('text/plain')?.trim()) return false;
    event.preventDefault();
    void (async () => {
      for (const file of files) {
        const taken = await pictures.addBlob(file, file.name || t('editor-pasted-picture'));
        if (!taken || v.isDestroyed) continue;
        insertFigure(taken)(v.state, v.dispatch);
      }
    })();
    return true;
  }

  /** Tells the interface what is selected, for the bar that formats it. */
  function report(v: EditorView) {
    const { state } = v;
    const { from, to, empty } = state.selection;
    let rect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
    try {
      const a = v.coordsAtPos(from);
      const b = v.coordsAtPos(to);
      const left = Math.min(a.left, b.left);
      const right = Math.max(a.right, b.right);
      rect = {
        left,
        right,
        top: a.top,
        bottom: b.bottom,
        width: right - left,
        height: b.bottom - a.top,
      };
    } catch {
      // The position is not on screen.
    }
    const marks: Record<string, boolean> = {};
    for (const [name, type] of Object.entries(state.schema.marks))
      marks[name] = markActive(state, type);
    editorUi.selection = {
      view: v,
      // A figure, a formula, a note or a citation that is selected is not
      // text that can be set in italics: each has a panel of its own. And
      // cells that are selected have the tools of their table.
      empty:
        empty ||
        state.selection instanceof NodeSelection ||
        state.selection instanceof CellSelection,
      rect,
      marks,
      kind,
    };
  }

  /** The citation at or next to a position, which may have shifted by a character or two. */
  function findCitation(v: EditorView, near: number): number | null {
    for (const pos of [near, near - 1, near + 1]) {
      if (
        pos >= 0 &&
        pos < v.state.doc.content.size &&
        v.state.doc.nodeAt(pos)?.type.name === 'citation'
      ) {
        return pos;
      }
    }
    return null;
  }

  $effect(() => {
    if (!host) return;
    const target = host;
    const f = fragment;
    const schema = kind === 'body' ? bodySchema : titleSchema;
    const hooks = {
      undo: () => project.undo(),
      redo: () => project.redo(),
      action: (action: KeyAction, v: EditorView) => untrack(() => onaction?.(action, v) ?? false),
      cite: kind === 'body' ? cite : undefined,
      picture: kind === 'body' ? picture : undefined,
      point: kind === 'body' ? point : undefined,
      element: untrack(() => element),
      at: untrack(() => at),
      // The kinds of the writer's own, for what they are based on: a line of verse, a kind that is counted, the name of a run.
      passageKinds: () => project.passageKinds,
      // What the layout says of the numbers of a stretch: see above.
      numbers: () => numbersNow,
      // The dialogs of the numbers and of a language, and the language of the document for the one of a language.
      askNumbers: kind === 'body' ? askNumbers : undefined,
      askLanguage: kind === 'body' ? askLanguage : undefined,
      language: () => untrack(() => language),
    };

    const created = untrack(() => {
      const plugins = [
        ySyncPlugin(f),
        yCursorPlugin(project.awareness),
        sharedUndo(project.undoManager),
        ...(kind === 'body' ? bodyPlugins(schema, hooks) : titlePlugins(hooks)),
        placeholderPlugin(() => placeholder),
        // What a search found, where the editor is to draw it: see `search/decorations.ts`.
        searchMarks(),
        // The changes that are reviewed, where they are: see `review/editor.ts`.
        reviewMarks(kind),
        // The passages that are commented on: see `comments/marks.ts`.
        commentMarks(),
        spellingPlugin(
          spellingOptions(
            () => project,
            () => owner,
          ),
        ),
      ];
      return new EditorView(target, {
        state: EditorState.create({ schema, plugins }),
        editable: () => editable,
        nodeViews:
          kind === 'body'
            ? {
                citation: (node, v, getPos) => new CitationView(node, v, getPos),
                footnote: (node, v, getPos) => new FootnoteView(node, v, getPos),
                math: (node, v, getPos) => new FormulaView(node, v, getPos),
                equation: (node, v, getPos) => new FormulaView(node, v, getPos),
                figure: (node, v, getPos) => new FigureView(node, v, getPos),
                crossref: (node, v, getPos) => new CrossRefView(node, v, getPos),
                refmark: (node, v, getPos) => new RefMarkView(node, v, getPos),
                pagebreak: (node) => new PageBreakView(node),
              }
            : {},
        attributes: {
          class: `prose ${kind}`,
          // Spelling is checked by the application, in the language of the text (ADR 0019).
          spellcheck: 'false',
        },
        handlePaste: (v, event) => kind === 'body' && pasted(v, event),
        // Text pasted as text keeps every line break (see `clipboard.ts`).
        clipboardTextParser:
          kind === 'body' ? (text, $context) => pastedTextSlice(text, $context, schema) : undefined,
        // What is copied carries its citations as they are shown.
        clipboardTextSerializer: (slice) => copiedText(slice, language),
        clipboardSerializer: copiedHtml(schema, () => language),
        // A citation that was found is gone through where it is pressed; a
        // commented passage shows its thread.
        handleClick: (_v, _pos, event) => {
          if (kind !== 'body' || event.button !== 0) return false;
          const thread = pressedThread(event.target);
          if (thread) {
            commentsUi.show(thread);
            return false;
          }
          return pressedFound(
            event.target,
            untrack(() =>
              element && project.node(element) ? (at ?? topOf(project, element)) : null,
            ),
          );
        },
        handleDOMEvents: {
          focus: (v) => {
            onfocus?.(v);
            report(v);
            return false;
          },
          blur: (v) => {
            onblur?.(v);
            if (editorUi.selection?.view === v) {
              // The bar that formats the selection takes the focus for a moment when used.
              setTimeout(() => {
                if (!v.hasFocus() && editorUi.selection?.view === v) editorUi.selection = null;
              }, 150);
            }
            return false;
          },
          mousedown: () => {
            editorUi.selecting = true;
            window.addEventListener('mouseup', () => (editorUi.selecting = false), { once: true });
            return false;
          },
        },
        dispatchTransaction(tr) {
          const v = this as unknown as EditorView;
          // What tells of the cursors of others is dispatched a moment after
          // it was asked for, when the editor may have been closed.
          if (v.isDestroyed) return;
          v.updateState(v.state.apply(tr));
          onstate?.(v);
          if (v.hasFocus()) report(v);
        },
      });
    });
    view = created;
    hooksOf.set(created, hooks);
    viewsByDom.set(created.dom, created);
    // Not read here: the effect that makes the editor must not follow what it tells.
    untrack(() => (made += 1));

    const how = untrack(() => autofocus);
    if (how) {
      // The content arrives from the document a moment after the editor is made.
      setTimeout(() => {
        if (view !== created) return;
        focus(how);
        untrack(() => onready)?.(created);
      }, 20);
    }

    return () => {
      created.destroy();
      if (view === created) view = undefined;
    };
  });

  export function focus(where: FocusAt = 'keep') {
    if (!view) return;
    const { state } = view;
    if (typeof where === 'object') {
      const at = view.posAtCoords(where);
      const selection = at
        ? TextSelection.near(state.doc.resolve(Math.min(at.pos, state.doc.content.size)))
        : TextSelection.atEnd(state.doc);
      view.dispatch(state.tr.setSelection(selection));
    } else if (where !== 'keep') {
      const selection =
        where === 'start'
          ? TextSelection.atStart(state.doc)
          : where === 'end'
            ? TextSelection.atEnd(state.doc)
            : state.doc.content.size > 2
              ? new AllSelection(state.doc)
              : TextSelection.atEnd(state.doc);
      view.dispatch(state.tr.setSelection(selection));
    }
    view.focus();
  }

  export function getView(): EditorView | undefined {
    return view;
  }

  export function hasFocus(): boolean {
    return view?.hasFocus() ?? false;
  }
</script>

<div
  bind:this={host}
  class="rich-text {className}"
  use:dropTarget={{
    accepts: ['references', PICTURES_DRAGGED],
    disabled: kind !== 'body',
    ondrop: (event) => {
      if (!view) return;
      const at = view.posAtCoords({ left: event.x, top: event.y });
      if (event.payload.kind === PICTURES_DRAGGED) {
        // A picture of the store dropped into the text is a figure where it was dropped.
        let where = at?.pos;
        for (const hash of event.payload.data as string[]) {
          const known = pictures.get(hash);
          if (known) insertFigure(known, where)(view.state, view.dispatch);
          where = undefined;
        }
        view.focus();
        return;
      }
      // A reference dropped into the text is cited where it was dropped.
      const ids = event.payload.data as string[];
      const pos = at?.pos ?? view.state.selection.from;
      const node = view.state.schema.nodes.citation.create({
        items: ids.map((id) => ({ id })),
        mode: 'normal',
      });
      try {
        view.dispatch(view.state.tr.insert(pos, node));
        for (const id of ids) oncite?.(id);
        view.focus();
      } catch {
        // Not a place where a citation can stand.
      }
    },
  }}
></div>

{#if numbering}
  <LineNumbersDialog
    stretch={numbering.stretch}
    layout={numbersLayout}
    from={numbering.from}
    line={numbering.line}
    onclose={() => (numbering = null)}
    onset={(how, from, line) => {
      if (!numbering) return;
      const v = numbering.view;
      if (v.isDestroyed) return;
      // The stretch the cursor is in, or, where it is in none, the paragraphs a numbering is set on from there.
      const paragraphs = (stretchAt(v.state)?.paragraphs ?? stretchToNumber(v.state, ownKinds)).map(
        (p) => ({ pos: p.pos }),
      );
      run(numberStretch(paragraphs, how), v);
      if (from !== undefined && how.numbering !== 'none')
        run(numberFrom(paragraphs, from, ownKinds), v);
      if (line) run(markLine(line), v);
    }}
  />
{/if}

{#if asking}
  <LanguageDialog
    tag={asking.tag}
    onclose={() => (asking = null)}
    onset={(tag) => asking && run(setLanguage(tag), asking.view)}
  />
{/if}

<style>
  .rich-text {
    min-width: 0;
  }
</style>
