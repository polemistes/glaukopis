<script lang="ts">
  import {
    EditorState,
    NodeSelection,
    TextSelection,
    AllSelection,
    type Command,
  } from 'prosemirror-state';
  import { CellSelection } from 'prosemirror-tables';
  import { insertPoint } from 'prosemirror-transform';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import { menuState } from '$lib/ui/menu.svelte';
  import { EditorView } from 'prosemirror-view';
  import { untrack } from 'svelte';
  import { ySyncPlugin, yCursorPlugin } from 'y-prosemirror';
  import type * as Y from 'yjs';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { RefRecord } from '$lib/project/model/types';
  import { library } from '$lib/state/library.svelte';
  import type { ResolvedPos, Slice } from 'prosemirror-model';
  import { languages, t } from '$lib/i18n';
  import { insertCitation } from './commands';
  import {
    bodyPlugins,
    placeholder as placeholderPlugin,
    titlePlugins,
    type KeyAction,
  } from './plugins';
  import { copiedHtml, copiedText, looksLikeOrg, pastedTextSlice } from './clipboard';
  import { bodySchema, titleSchema } from './schema';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { editorUi, rectAt } from './ui.svelte';
  import { sharedUndo } from './undo';
  import { markActive, setLanguage } from './commands';
  import {
    LAYOUT_NUMBERS,
    LAYOUT_STEP,
    lineAsked,
    markLine,
    numberFrom,
    numberingAsked,
    numberStretch,
    paragraphsFromHere,
    redrawShape,
    type LineAsked,
    type NumberingAsked,
    type NumbersLayout,
  } from './numbers';
  import LanguageDialog from './LanguageDialog.svelte';
  import LineDialog from './LineDialog.svelte';
  import LineNumberingDialog from './LineNumberingDialog.svelte';
  import { documents, templateUsedCached } from '$lib/preview/documents.svelte';
  import { kindKeysOf, kindName } from './kinds';
  import { toCm } from '$lib/ui/settings/rows';
  import { CitationView, FootnoteView, PageBreakView } from './views.svelte';
  import { RefMarkView } from './refmarks';
  import { topOf } from '$lib/figures/numbering.svelte';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { pastedPaths } from '$lib/util/paste';
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
  // does not say: every how many, and on which side (ADR 0041), and where
  // the annotations of lines stand (ADR 0067). The editor
  // is given it through a hook. The numbers of lines and the brackets of
  // runs are not drawn anew on every keystroke, so the editor is told to
  // draw them anew when what they are drawn with changes: the layout's
  // numbers, the kinds of the writer's own (which are counted, and their
  // names on the brackets), and the language of the interface, in which
  // the names of the kinds of the catalogue are said. That is what this
  // depends on; the rest is read untracked.
  const numbersLayout = $derived.by<NumbersLayout>(() => {
    if (kind !== 'body' || !owner || !project.node(owner)) return LAYOUT_NUMBERS;
    const format = documents.formatForCached(project, owner);
    const verse = format?.verse;
    const step = toCm(format?.text.indentStep ?? '');
    return {
      every: verse?.every ?? LAYOUT_NUMBERS.every,
      side: verse?.side ?? LAYOUT_NUMBERS.side,
      annotations: verse?.annotations ?? null,
      step: step !== null && step > 0 ? (step * 72) / 2.54 : LAYOUT_STEP,
    };
  });
  let drawnWith: { numbers: NumbersLayout; kinds: unknown; language: string } | null = null;
  $effect(() => {
    const now = {
      numbers: numbersLayout,
      kinds: project.passageKinds,
      language: languages.current,
    };
    void made;
    untrack(() => {
      // At first, the editor was made with what is now, and the layout's numbers as given.
      const was = drawnWith ?? { ...now, numbers: LAYOUT_NUMBERS };
      drawnWith = now;
      const changed =
        now.numbers.every !== was.numbers.every ||
        now.numbers.side !== was.numbers.side ||
        now.numbers.annotations !== was.numbers.annotations ||
        now.numbers.step !== was.numbers.step ||
        now.kinds !== was.kinds ||
        now.language !== was.language;
      if (view && kind === 'body' && changed) redrawShape(view);
    });
  });

  /**
   * What the Org form of what is copied or pasted needs: the kinds of the
   * writer's own, and the works, by whose keys citations are written and
   * read: those of the library, and over them those the project keeps.
   */
  const orgOptions = () => {
    const references: RefRecord[] = library.entries.map((e) => ({
      id: e.id,
      key: e.key,
      type: e.type,
      fields: {},
      names: {},
      modified: '',
      authors: e.authors,
      year: e.year,
      title: e.title,
      container: e.container,
    }));
    references.push(...project.refs.values());
    return { paragraphKinds: project.passageKinds, references };
  };

  /** Text pasted as text; the works it cites that the project keeps no copy of are kept. */
  function pastedText(text: string, $context: ResolvedPos): Slice {
    const slice = pastedTextSlice(text, $context, bodySchema, orgOptions);
    const cited = new Set<string>();
    slice.content.descendants((node) => {
      if (node.type.name !== 'citation') return;
      for (const item of node.attrs.items as { id: string }[])
        if (item?.id && !project.refs.has(item.id)) cited.add(item.id);
    });
    if (cited.size) queueMicrotask(() => cited.forEach((id) => oncite?.(id)));
    return slice;
  }

  /**
   * Org pasted as text into an empty paragraph of the text: its first
   * paragraph comes whole, of its own kind, where the editor would have
   * it take the kind of the paragraph it is pasted into.
   */
  function pastedOrg(v: EditorView, event: ClipboardEvent): boolean {
    const data = event.clipboardData;
    const text = data?.getData('text/plain') ?? '';
    if (!text || data?.getData('text/html') || !looksLikeOrg(text)) return false;
    const { empty } = v.state.selection;
    const at = v.state.selection.$from;
    if (!empty || at.depth !== 1 || !at.parent.isTextblock || at.parent.content.size) return false;
    event.preventDefault();
    v.dispatch(
      v.state.tr
        .replaceSelection(pastedText(text, at))
        .scrollIntoView()
        .setMeta('paste', true)
        .setMeta('uiEvent', 'paste'),
    );
    return true;
  }

  /** The kinds of paragraph of the writer's own, as much as the shape of a text needs of them. */
  const ownKinds = $derived(project.passageKinds.filter((k) => k.family === 'paragraph'));

  // The windows the menus and the bracket of a run ask for through the
  // hooks: how the lines are numbered from the cursor on, and what is said
  // of the line the cursor is in (ADR 0067); and the language of what is
  // selected (ADR 0020).
  let numbering = $state<(NumberingAsked & { view: EditorView }) | null>(null);
  let numberingLine = $state<(LineAsked & { view: EditorView }) | null>(null);
  let asking = $state<{ view: EditorView; tag: string | null } | null>(null);
  function askNumbering(v: EditorView) {
    const asked = numberingAsked(
      v.state,
      untrack(() => ownKinds),
    );
    if (asked) numbering = { ...asked, view: v };
  }
  function askLine(v: EditorView) {
    const asked = lineAsked(
      v.state,
      untrack(() => ownKinds),
      untrack(() => numbersLayout),
    );
    if (asked) numberingLine = { ...asked, view: v };
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
    if (pastedOrg(v, event)) return true;
    // A picture copied as a file in a file manager is taken in from where it is.
    const paths = pastedPaths(event.clipboardData);
    const files = [...(event.clipboardData?.files ?? [])]
      .map((file, i) => ({ file, path: paths[i] ?? null }))
      .filter(({ file }) => file.type.startsWith('image/'));
    if (!files.length) return false;
    // With text beside them, as when something is copied from a page, the text is what is wanted.
    if (event.clipboardData?.getData('text/plain')?.trim()) return false;
    event.preventDefault();
    void (async () => {
      for (const { file, path } of files) {
        const taken = path
          ? await pictures.addFile(path)
          : await pictures.addBlob(file, file.name || t('editor-pasted-picture'));
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
      numbers: () => drawnWith?.numbers ?? LAYOUT_NUMBERS,
      // The windows of the numbering and of a language, and the language of the document for the one of a language.
      askNumbering: kind === 'body' ? askNumbering : undefined,
      askLine: kind === 'body' ? askLine : undefined,
      askLanguage: kind === 'body' ? askLanguage : undefined,
      language: () => untrack(() => language),
      // The keys of the kinds, as the document type of the element written in gives them.
      kindKeys: () =>
        untrack(() =>
          kindKeysOf(owner && project.node(owner) ? templateUsedCached(project, owner) : null),
        ),
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
        // Text pasted as text is read as Org where it is, and keeps every line break where it is not (see `clipboard.ts`).
        clipboardTextParser: kind === 'body' ? pastedText : undefined,
        // What is copied as text is Org; as HTML, it carries its citations as they are shown.
        clipboardTextSerializer: (slice) => copiedText(slice, language, orgOptions),
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
        // Made by the press that opened a menu, the text's right-click menu,
        // it takes the cursor there but leaves the focus to the menu, so that
        // the menu's keys and Escape reach it.
        focus(how, !!menuState.current);
        untrack(() => onready)?.(created);
      }, 20);
    }

    return () => {
      created.destroy();
      if (view === created) view = undefined;
    };
  });

  export function focus(where: FocusAt = 'keep', quiet = false) {
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
    if (!quiet) view.focus();
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
  style:--step="{numbersLayout.step}pt"
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
      const citation = view.state.schema.nodes.citation;
      const node = citation.create({
        items: ids.map((id) => ({ id })),
        mode: 'normal',
      });
      // Where it was dropped, or the nearest place a citation can stand;
      // else where the cursor is. Nowhere: said, not a drop that vanishes.
      const doc = view.state.doc;
      const where =
        insertPoint(doc, pos, citation) ?? insertPoint(doc, view.state.selection.from, citation);
      if (where == null) {
        notify(t('editor-citation-no-place'));
        return;
      }
      try {
        view.dispatch(view.state.tr.insert(where, node));
        for (const id of ids) oncite?.(id);
        view.focus();
      } catch (error) {
        notifyError(t('editor-citation-no-place'), error);
      }
    },
  }}
></div>

{#if numbering}
  <LineNumberingDialog
    stretch={numbering.stretch}
    layout={numbersLayout}
    from={numbering.from}
    kinds={numbering.kinds.map((id) => ({ id, name: kindName(id, project.passageKinds) }))}
    onclose={() => (numbering = null)}
    onset={(how, from) => {
      if (!numbering) return;
      const v = numbering.view;
      if (v.isDestroyed) return;
      // From the paragraph the cursor is in, or those selected: the paragraphs before keep
      // their numbering. The first counted line from here is given the number the window
      // was filled in with, where it would not have it, so that a stretch parted here
      // goes on from the number it had.
      const paragraphs = paragraphsFromHere(v.state, ownKinds).map((p) => ({ pos: p.pos }));
      run(numberStretch(paragraphs, how), v);
      if (from !== undefined && how.numbering === 'counted')
        run(numberFrom(paragraphs, from, ownKinds), v);
    }}
  />
{/if}

{#if numberingLine}
  <LineDialog
    line={numberingLine}
    onclose={() => (numberingLine = null)}
    onset={(marks) => numberingLine && run(markLine(marks), numberingLine.view)}
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
