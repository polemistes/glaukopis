<script lang="ts">
  /**
   * The window of a note (record 0109): one text, the text's own editor
   * over the body schema as the notebook's notes have it, with its marks,
   * its lists, its keys and its undo; over it one row, the buttons of the
   * marks and of the lists and *Add a file…* at the left and *To the
   * notebook* at the right. Pictures and files come in pasted, dropped on
   * the window, or chosen; each is copied beside the note until it is
   * sent. Ctrl+S sends; Escape closes the window where the note is empty
   * and does nothing where it is not. What is written is kept a moment
   * after each change and before the window closes, and is there when it
   * is next opened; sent, the window goes.
   */
  import { onMount, tick, untrack } from 'svelte';
  import ALargeSmall from '@lucide/svelte/icons/a-large-small';
  import Bold from '@lucide/svelte/icons/bold';
  import Code from '@lucide/svelte/icons/code';
  import Eraser from '@lucide/svelte/icons/eraser';
  import Highlighter from '@lucide/svelte/icons/highlighter';
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Underline from '@lucide/svelte/icons/underline';
  import { open as openFiles } from '@tauri-apps/plugin-dialog';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { Node } from 'prosemirror-model';
  import { Selection, type Command, type EditorState } from 'prosemirror-state';
  import type { EditorView } from 'prosemirror-view';
  import { prosemirrorToYXmlFragment } from 'y-prosemirror';
  import * as Y from 'yjs';
  import { inTauri } from '$lib/api/backend';
  import { noteWindowKeep, noteWindowSend, type Added, type NoteText } from '$lib/api/notewindow';
  import {
    insertFigure,
    kindOf,
    markActive,
    placeForBlock,
    setKind,
    toggle,
  } from '$lib/editor/commands';
  import type { TextHolder } from '$lib/editor/holder';
  import { insertBox } from '$lib/byhand/box';
  import { putBox } from '$lib/byhand/put';
  import { groundAt, groundItems, groundsOpenedIn } from '$lib/editor/ground';
  import RichText from '$lib/editor/RichText.svelte';
  import { bodySchema } from '$lib/editor/schema';
  import { t } from '$lib/i18n';
  import { keyOf, keysFor } from '$lib/shell/keys.svelte';
  import { testHook } from '$lib/shell/testing';
  import { beforeClose } from '$lib/state/closing';
  import Button from '$lib/ui/Button.svelte';
  import ConfirmHost from '$lib/ui/ConfirmHost.svelte';
  import { outsideDrop, outsideLeave, outsideOver, type DragPayload } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import MenuHost from '$lib/ui/MenuHost.svelte';
  import Toaster from '$lib/ui/Toaster.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { pastedFiles, pastedPaths } from '$lib/util/paste';
  import { addBlob, addPaths, figureOfAdded, noteHolder } from './holder';
  import { isEmptyNote, noteTextOf } from './text';

  let { unsent }: { unsent: NoteText | null } = $props();

  // ---- the text ----

  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('text');

  /** The note not sent before, as the field shows it: as it was, else its words line by line. */
  function shownOf(text: NoteText): Node | null {
    try {
      const node = Node.fromJSON(bodySchema, text.doc);
      node.check();
      return node;
    } catch {
      const lines = text.words.split(/\r?\n/).filter((l) => l.trim());
      if (!lines.length) return null;
      return bodySchema.node(
        'doc',
        null,
        lines.map((l) => bodySchema.node('paragraph', null, [bodySchema.text(l)])),
      );
    }
  }
  /** The note not sent before, as the window was opened with it: shown once, at the start. */
  const opened = untrack(() => unsent);
  // Before the history begins: what was there is not undone.
  const before = opened ? shownOf(opened) : null;
  if (before) prosemirrorToYXmlFragment(before, fragment);
  const holder: TextHolder = {
    ...noteHolder(doc, fragment),
    // Files dragged in from the desktop, dropped on the text: where they are dropped.
    drops: {
      accepts: ['files'],
      ondrop: (_v, at, dropped) => void addAndPut(dropped.data as string[], at ?? undefined),
    },
  };

  let editor = $state<RichText>();
  /** The state of the editor, for the buttons of the row. */
  let current = $state.raw<EditorState | null>(null);
  let empty = $state(!opened || isEmptyNote(opened));
  /** What went wrong when the note was last sent. */
  let problem = $state<string | null>(null);
  let sending = $state(false);

  const view = (): EditorView | undefined => editor?.getView();

  /** The note as it stands now; nothing where the editor is not there. */
  function textNow(): NoteText | null {
    const v = view();
    return v ? noteTextOf(v.state.doc) : null;
  }

  // ---- keeping what is written, and sending it ----

  /** How long after a change what is written is kept. */
  const KEEP_AFTER = 400;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The keepings and the sending, one after another, so that an older one never lands last. */
  let queue: Promise<unknown> = Promise.resolve();
  let sent = false;
  let lastDoc: Node | null = null;

  /** Keeps what is written now, after what was asked before. */
  function keepNow(): Promise<void> {
    clearTimeout(timer);
    const text = textNow();
    if (sent || !text) return queue.then(() => {});
    const done = queue.then(() => noteWindowKeep(text));
    queue = done.catch((error) => console.warn('the note was not kept', error));
    return done;
  }

  // What is written is kept before the window closes, by its own × or the
  // system: a failure keeps it open and is said, and a second closing closes it.
  onMount(() => beforeClose(() => keepNow(), 'first'));

  function changed(state: EditorState) {
    current = state;
    if (state.doc === lastDoc) return;
    lastDoc = state.doc;
    empty = isEmptyNote(noteTextOf(state.doc));
    problem = null;
    clearTimeout(timer);
    timer = setTimeout(() => void keepNow().catch(() => {}), KEEP_AFTER);
  }

  /** Writes the note into the notebook's inbox, and the window goes; where it cannot, it stays and says why. */
  async function send() {
    const text = textNow();
    if (!text || isEmptyNote(text) || sending) return;
    sending = true;
    clearTimeout(timer);
    try {
      await queue;
      await noteWindowSend(text);
      sent = true;
      if (inTauri) await getCurrentWindow().destroy();
    } catch (error) {
      problem = describeError(error) ?? String(error);
    } finally {
      sending = false;
    }
  }

  function close() {
    if (inTauri) void getCurrentWindow().close();
  }

  // ---- pictures and files ----

  /** Puts a file of the note where it was dropped, or where the cursor is: a picture as a figure, any other file by its name. */
  function putFile(v: EditorView, file: Added, at?: number) {
    const figure = figureOfAdded(file);
    if (figure) insertFigure(figure, at)(v.state, v.dispatch);
    else insertFile(file, at)(v.state, v.dispatch);
  }

  /** A file the note holds, where the cursor is, or at `at`, as the notebook shows one: a block of its own. */
  function insertFile(file: Added, at?: number): Command {
    return (state, dispatch) => {
      const type = state.schema.nodes.file;
      let from = state;
      if (at !== undefined) {
        const there = state.doc.resolve(Math.max(0, Math.min(at, state.doc.content.size)));
        from = state.apply(state.tr.setSelection(Selection.near(there)));
      }
      const where = placeForBlock(from, type);
      if (!where) return false;
      if (dispatch) {
        const node = type.create({ hash: file.hash, name: file.name, extension: file.extension });
        const tr = state.tr.replaceWith(where.from, where.to, node);
        tr.setSelection(Selection.near(tr.doc.resolve(where.from + node.nodeSize)));
        dispatch(tr.scrollIntoView());
      }
      return true;
    };
  }

  /** Adds files of this computer to the note, and puts them in it. */
  async function addAndPut(paths: string[], at?: number) {
    const added = await addPaths(paths);
    const v = view();
    if (!v || v.isDestroyed) return;
    for (const file of added) {
      putFile(v, file, at);
      at = undefined;
    }
    v.focus();
  }

  async function chooseFiles() {
    if (!inTauri) return;
    const chosen = await openFiles({ multiple: true, title: t('notebook-note-window-add-file') });
    const paths = Array.isArray(chosen) ? chosen : chosen ? [chosen] : [];
    await addAndPut(paths);
  }

  // The scripts add files by their paths, as the system's dialog gives them.
  testHook('__glaukopisNoteWindow', { add: (paths: string[]) => addAndPut(paths) });

  /**
   * Files pasted: those copied in a file manager, pictures or not, and a
   * picture on the clipboard alone, as a screenshot is. With words beside a
   * picture, as when something is copied from a page, the words are what is
   * pasted, by the editor. Taken here, before the editor sees the paste.
   */
  function onpaste(event: ClipboardEvent) {
    const data = event.clipboardData;
    const paths = [...pastedPaths(data).filter((p): p is string => !!p), ...pastedFiles(data)];
    const blobs = [...(data?.files ?? [])].filter(
      (file, i) => !pastedPaths(data)[i] && file.type.startsWith('image/'),
    );
    if (!paths.length && (!blobs.length || data?.getData('text/plain')?.trim())) return;
    event.preventDefault();
    event.stopPropagation();
    void (async () => {
      if (paths.length) await addAndPut(paths);
      for (const blob of paths.length ? [] : blobs) {
        const added = await addBlob(blob, blob.name || 'image.png');
        const v = view();
        if (added && v && !v.isDestroyed) putFile(v, added);
      }
    })();
  }

  // Files dragged in from the desktop: into the text where they are
  // dropped on it (the holder's drops, `holder.ts`), else where the cursor is.
  onMount(() => {
    if (!inTauri) return;
    const at = (p: { x: number; y: number }) => ({
      x: p.x / window.devicePixelRatio,
      y: p.y / window.devicePixelRatio,
    });
    const payload = (paths: string[]): DragPayload => ({ kind: 'files', data: paths, label: '' });
    const stop = getCurrentWebview().onDragDropEvent((event) => {
      const e = event.payload;
      if (e.type === 'enter' || e.type === 'over') {
        const { x, y } = at(e.position);
        if (e.type === 'enter') outsideOver(payload(e.paths), x, y);
        else outsideOver(payload([]), x, y);
      } else if (e.type === 'drop') {
        const { x, y } = at(e.position);
        if (!outsideDrop(payload(e.paths), x, y)) void addAndPut(e.paths);
      } else outsideLeave();
    });
    return () => void stop.then((off) => off());
  });

  // ---- keys ----

  /** The keys of what the window does not make (a note, a formula, a table, a reference to a place, a mark of a place): not taken. */
  const NOT_MADE = new Set(['f', 'm', 'e', 'r', 'k', 't']);

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && !event.shiftKey && !event.altKey && keyOf(event) === 's') {
      event.preventDefault();
      event.stopPropagation();
      void send();
      return;
    }
    if (mod && event.altKey && !event.shiftKey && NOT_MADE.has(keyOf(event))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // ---- the row ----

  const MARKS = [
    { mark: 'strong', label: () => t('editor-bold'), icon: Bold, key: keysFor('writing-bold') },
    { mark: 'em', label: () => t('editor-italic'), icon: Italic, key: keysFor('writing-italic') },
    {
      mark: 'underline',
      label: () => t('editor-underline'),
      icon: Underline,
      key: keysFor('writing-underline'),
    },
    {
      mark: 'strike',
      label: () => t('editor-struck'),
      icon: Strikethrough,
      key: keysFor('writing-strike'),
    },
    { mark: 'code', label: () => t('editor-code-words'), icon: Code, key: undefined },
  ] as const;

  const LISTS = [
    { kind: 'item', label: () => t('editor-list'), icon: List, key: keysFor('writing-list') },
    {
      kind: 'numbered',
      label: () => t('editor-numbered-list'),
      icon: ListOrdered,
      key: keysFor('writing-numbered'),
    },
    { kind: 'todo', label: () => t('editor-todo'), icon: ListTodo, key: keysFor('writing-todo') },
  ] as const;

  function run(command: Command) {
    const v = view();
    if (!v) return;
    command(v.state, v.dispatch, v);
    v.focus();
  }

  /** The buttons of the row keep the cursor in the text. */
  const keep = (event: MouseEvent) => event.preventDefault();

  /** Takes away everything that is written, in one step, which undo takes back: the note is as when the window was opened empty. */
  const clear: Command = (state, dispatch) => {
    if (dispatch) {
      const tr = state.tr.replaceWith(
        0,
        state.doc.content.size,
        bodySchema.nodes.paragraph.create(),
      );
      dispatch(tr.setSelection(Selection.atStart(tr.doc)).scrollIntoView());
    }
    return true;
  };

  /** Clears the note as a step of its own: undo brings back what was cleared, and nothing done just before it is undone with it. */
  function clearNote() {
    holder.undoManager.stopCapturing();
    run(clear);
    holder.undoManager.stopCapturing();
  }

  // ---- the window ----

  // Its title is the word for a note, in the language of the settings.
  $effect(() => {
    const title = t('notebook-note');
    document.title = title;
    if (inTauri)
      void getCurrentWindow()
        .setTitle(title)
        .catch(() => {});
  });

  // Shown once it is drawn, its text with the cursor in it.
  onMount(() => {
    void (async () => {
      await tick();
      if (!inTauri) return;
      const w = getCurrentWindow();
      await w.show().catch((error) => console.error('The window could not be shown', error));
      await w.setFocus().catch(() => {});
      editor?.focus('end');
    })();
  });
</script>

<!-- The window's own keys and pastes, seen before the editor sees them. -->
<div class="note-window" onkeydowncapture={onkeydown} onpastecapture={onpaste} role="presentation">
  <div class="tools">
    {#each MARKS as m (m.mark)}
      <IconButton
        label={m.label()}
        shortcut={m.key}
        size="sm"
        active={!!current && markActive(current, bodySchema.marks[m.mark])}
        data-note-window-mark={m.mark}
        onmousedown={keep}
        onclick={() => run(toggle(m.mark))}><m.icon size={14} /></IconButton
      >
    {/each}
    <span class="between"></span>
    {#each LISTS as l (l.kind)}
      <IconButton
        label={l.label()}
        shortcut={l.key}
        size="sm"
        active={!!current && kindOf(current) === l.kind}
        data-note-window-list={l.kind}
        onmousedown={keep}
        onclick={() =>
          run((state, dispatch, v) =>
            setKind(kindOf(state) === l.kind ? 'text' : l.kind)(state, dispatch, v),
          )}><l.icon size={14} /></IconButton
      >
    {/each}
    <!-- The highlight: the colour behind the words selected (ADR 0116), with its colours. -->
    <IconButton
      label={t('editor-highlight-colour')}
      shortcut={keysFor('writing-highlight')}
      size="sm"
      active={!!current && typeof groundAt(current) === 'string'}
      disabled={!current}
      data-note-window-highlight
      onmousedown={keep}
      onclick={(event: MouseEvent) => {
        const v = view();
        if (!v) return;
        groundsOpenedIn(v);
        openMenu(event.currentTarget as HTMLElement, groundItems(v), { align: 'start' });
      }}><Highlighter size={14} /></IconButton
    >
    <span class="between"></span>
    <!-- A box of rich text (ADR 0112), as Insert has it in the other texts. -->
    <IconButton
      label={t('byhand-name')}
      size="sm"
      disabled={!current || !insertBox(current)}
      data-note-window-rich
      onmousedown={keep}
      onclick={() => {
        const v = view();
        if (v) putBox(v);
      }}><ALargeSmall size={14} /></IconButton
    >
    <IconButton
      label={t('notebook-note-window-add-file')}
      size="sm"
      data-note-window-add
      onmousedown={keep}
      onclick={() => void chooseFiles()}><Paperclip size={14} /></IconButton
    >
    <span class="gap"></span>
    <!-- Clears the note: everything written is taken away, and undo brings it back. -->
    <IconButton
      label={t('notebook-note-window-clear')}
      size="sm"
      disabled={empty}
      data-note-window-clear
      onmousedown={keep}
      onclick={clearNote}><Eraser size={14} /></IconButton
    >
    <span
      use:tooltip={{
        text: t('notebook-note-window-send'),
        shortcut: keysFor('notebook-note-window-send'),
      }}
    >
      <Button
        size="sm"
        variant="primary"
        disabled={empty || sending}
        data-note-window-send
        onclick={() => void send()}>{t('notebook-note-window-send')}</Button
      >
    </span>
  </div>
  <div class="field" data-note-window-field>
    <RichText
      bind:this={editor}
      {holder}
      {fragment}
      kind="body"
      placeholder={t('notebook-note-window-placeholder')}
      autofocus="end"
      onready={(v) => (current = v.state)}
      onstate={(v) => changed(v.state)}
      onaction={(action) => {
        if (action !== 'escape') return false;
        // Where something is written, Escape does nothing: nothing is lost by a key.
        if (empty) close();
        return true;
      }}
    />
  </div>
  {#if problem}
    <p class="problem" role="alert" data-note-window-problem>
      {t('notebook-note-window-not-sent')}: {problem}
    </p>
  {/if}
</div>
<!-- What the tools of a text open, here as in the window of the application: the menus (of colours, of a sheet of rich text) and what is asked before something is taken away. -->
<ConfirmHost />
<MenuHost />
<Toaster />

<style>
  :global(html),
  :global(body),
  :global(#app) {
    height: 100%;
  }
  .note-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--paper);
    color: var(--ink);
  }
  .field {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 14px;
  }
  .field :global(.rich-text),
  .field :global(.ProseMirror) {
    min-height: 100%;
  }
  .field :global(.ProseMirror) {
    outline: none;
    font-family: var(--font-editor, var(--font-text));
    font-size: var(--text-size);
  }
  .problem {
    margin: 0;
    padding: 4px 14px;
    color: var(--danger, var(--ink));
    font-size: var(--text-sm);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--line);
  }
  .between {
    width: 8px;
  }
  .gap {
    flex: 1;
  }
</style>
