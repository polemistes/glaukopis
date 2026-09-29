<script lang="ts">
  import { EditorState, NodeSelection, TextSelection, AllSelection } from 'prosemirror-state';
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
  import { bodySchema, titleSchema } from './schema';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { editorUi, rectAt } from './ui.svelte';
  import { sharedUndo } from './undo';
  import { markActive, insideNode } from './commands';
  import { CitationView, FootnoteView } from './views.svelte';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { choosePicture, CrossRefView, FigureView, FormulaView } from '$lib/figures/views.svelte';
  import { insertCrossRef, insertFigure } from './commands';
  import { hooksOf, viewsByDom } from './ui.svelte';
  import { pressedFound } from '$lib/found/found.svelte';
  import { searchMarks } from '$lib/search/decorations';
  import { spellingOptions } from '$lib/spelling/menu';
  import { lookAgain, spellingPlugin } from '$lib/spelling/plugin';

  interface Props {
    project: Project;
    fragment: Y.XmlFragment;
    kind: 'body' | 'title';
    /** The element whose text it is: what stands in the text is numbered by it. */
    element?: string;
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
    /** Called when the selection or the text changes, for toolbars. */
    onstate?: (view: EditorView) => void;
    class?: string;
  }

  let {
    project,
    fragment,
    kind,
    element,
    placeholder = '',
    autofocus = null,
    editable = true,
    onaction,
    oncite,
    onfocus,
    onblur,
    onstate,
    class: className = '',
  }: Props = $props();

  export type FocusAt = 'start' | 'end' | 'all' | 'keep' | { left: number; top: number };

  let host = $state<HTMLDivElement>();
  let view: EditorView | undefined;

  /** The element whose name or text this is: its map has the language the spelling is checked in. */
  const owner = $derived(element ?? project.ownerOf(fragment));
  const language = $derived(project.map(project.node(owner)?.map)?.document.language ?? null);

  // The spelling is looked at again when the language of the map changes, or
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
   * is; or, with `at`, in place of the words that stand there.
   */
  function point(v: EditorView, at?: number) {
    const map = element ? project.node(element)?.map : undefined;
    if (!map) return;
    const from = at ?? v.state.selection.from;
    editorUi.pickTarget({
      anchor: rectAt(v, from),
      map,
      onpick: (target) => {
        editorUi.closeTargets(false);
        if (v.isDestroyed) return;
        v.focus();
        const there = at === undefined ? null : v.state.doc.nodeAt(at);
        if (at !== undefined && there?.type.name === 'crossref') {
          v.dispatch(v.state.tr.setNodeMarkup(at, undefined, { target: target.id, form: 'full' }));
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
    const nodes = state.schema.nodes;
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
      quote: !!nodes.blockquote && insideNode(state, nodes.blockquote),
      list: !!nodes.list_item && insideNode(state, nodes.list_item),
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
              }
            : {},
        attributes: {
          class: `prose ${kind}`,
          // Spelling is checked by the application, in the language of the map (ADR 0019).
          spellcheck: 'false',
        },
        handlePaste: (v, event) => kind === 'body' && pasted(v, event),
        // A citation that was found is gone through where it is pressed.
        handleClick: (_v, _pos, event) =>
          kind === 'body' &&
          event.button === 0 &&
          pressedFound(
            event.target,
            untrack(() => (element ? project.node(element)?.map : null)),
          ),
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

    const how = untrack(() => autofocus);
    if (how) {
      // The content arrives from the document a moment after the editor is made.
      setTimeout(() => {
        if (view !== created) return;
        focus(how);
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

<style>
  .rich-text {
    min-width: 0;
  }
</style>
