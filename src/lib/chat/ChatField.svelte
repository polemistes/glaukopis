<script lang="ts">
  /**
   * The field of the chat (record 0107): a small editor of its own, not
   * bound to the project's document, of lines of words with five marks;
   * under it one row, the buttons of the marks and of the emojis at the
   * left and *Send* at the right. Enter sends, Shift+Enter is a new line,
   * the marks come by the keys the text has for them, and Ctrl+Z takes back
   * what was written here and nothing else. What is written is its holder's
   * (`words`, `onwords`), so that it is kept when the panel is not there.
   */
  import { onDestroy, onMount, untrack } from 'svelte';
  import Bold from '@lucide/svelte/icons/bold';
  import Code from '@lucide/svelte/icons/code';
  import Italic from '@lucide/svelte/icons/italic';
  import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
  import Smile from '@lucide/svelte/icons/smile';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Underline from '@lucide/svelte/icons/underline';
  import { EditorState, Selection } from 'prosemirror-state';
  import { EditorView } from 'prosemirror-view';
  import { t } from '$lib/i18n';
  import type { ChatMarkKind, ChatWords } from '$lib/project/model/types';
  import { keysFor } from '$lib/shell/keys.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmojiPicker from '$lib/ui/EmojiPicker.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { FieldUndo, fieldPlugins, isEmpty, markOn, toggle } from './field';
  import { docOf, sameWords, wordsOf } from './written';

  interface Props {
    /** What stands in the field. */
    words: ChatWords;
    /** What is written, as it is written. */
    onwords: (words: ChatWords) => void;
    /** Enter, or *Send*. */
    onsend: () => void;
    /** Escape: whether it gave something up. */
    onescape: () => boolean;
    /** Whether there is anything to send. */
    cansend: boolean;
    /** Rises each time the field is to take the focus. */
    focus?: number;
  }

  let { words, onwords, onsend, onescape, cansend, focus = 0 }: Props = $props();

  let host = $state<HTMLDivElement>();
  let view: EditorView | undefined;
  /** The state of the field, for the buttons of the marks. */
  let current = $state.raw<EditorState | null>(null);
  const undo = new FieldUndo<EditorState>();

  const plugins = fieldPlugins({
    send: () => onsend(),
    escape: () => onescape(),
    undo: () => step(undo.undo(view!.state)),
    redo: () => step(undo.redo(view!.state)),
  });

  /** A state of the field holding some words, the cursor at their end. */
  function stateOf(of: ChatWords): EditorState {
    const doc = docOf(of);
    return EditorState.create({ doc, plugins, selection: Selection.atEnd(doc) });
  }

  /** Goes to a state of the field's undo, and tells what it holds. */
  function step(to: EditorState | null) {
    if (!to || !view) return;
    view.updateState(to);
    current = to;
    onwords(wordsOf(to.doc));
  }

  /** What the field says of itself: its place for the scripts, its label and its placeholder. */
  const attributes = (state: EditorState) => ({
    'data-chat-field': '',
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': t('chat-write'),
    'data-placeholder': t('chat-write'),
    class: isEmpty(state) ? 'empty' : '',
  });

  onMount(() => {
    if (!host) return;
    const state = stateOf(words);
    current = state;
    view = new EditorView(host, {
      state,
      attributes,
      dispatchTransaction(tr) {
        if (!view) return;
        const before = view.state;
        const next = before.apply(tr);
        view.updateState(next);
        current = next;
        if (tr.docChanged) {
          undo.changed(before);
          onwords(wordsOf(next.doc));
        }
      },
    });
  });

  onDestroy(() => {
    view?.destroy();
    view = undefined;
  });

  // What stands in the field is set from outside where it differs from
  // what was written in it: a message taken to be changed, what was being
  // written before coming back, a message sent. Its undo begins anew then.
  $effect(() => {
    const of = words;
    untrack(() => {
      if (!view || sameWords(of, wordsOf(view.state.doc))) return;
      const state = stateOf(of);
      view.updateState(state);
      current = state;
      undo.clear();
    });
  });

  // The words of the placeholder follow the language of the interface.
  $effect(() => {
    void t('chat-write');
    untrack(() => view?.setProps({ attributes }));
  });

  $effect(() => {
    if (focus) untrack(() => view?.focus());
  });

  /** The marks, in the order of their buttons, with the words and keys the text's tools have for them. */
  const MARKS: {
    kind: ChatMarkKind;
    label: () => string;
    icon: typeof Bold;
    key?: string;
  }[] = [
    { kind: 'strong', label: () => t('editor-bold'), icon: Bold, key: keysFor('writing-bold') },
    { kind: 'em', label: () => t('editor-italic'), icon: Italic, key: keysFor('writing-italic') },
    {
      kind: 'underline',
      label: () => t('editor-underline'),
      icon: Underline,
      key: keysFor('writing-underline'),
    },
    {
      kind: 'strike',
      label: () => t('editor-struck'),
      icon: Strikethrough,
      key: keysFor('writing-strike'),
    },
    { kind: 'code', label: () => t('editor-code-words'), icon: Code },
  ];

  function mark(kind: ChatMarkKind) {
    if (!view) return;
    toggle(kind)(view.state, view.dispatch);
    view.focus();
  }

  // ---- emojis ----
  let picking = $state(false);
  let emojiButton = $state<HTMLButtonElement>();

  /** Puts an emoji where the cursor is. */
  function put(emoji: string) {
    if (!view) return;
    view.dispatch(view.state.tr.insertText(emoji).scrollIntoView());
  }

  /** The buttons of the row keep the focus in the field. */
  const keep = (event: MouseEvent) => event.preventDefault();
</script>

<div class="chat-field">
  <div class="box" bind:this={host}></div>
  <div class="tools">
    {#each MARKS as m (m.kind)}
      <IconButton
        label={m.label()}
        shortcut={m.key}
        size="sm"
        side="top"
        active={!!current && markOn(current, m.kind)}
        data-chat-mark={m.kind}
        onmousedown={keep}
        onclick={() => mark(m.kind)}><m.icon size={14} /></IconButton
      >
    {/each}
    <IconButton
      label={t('chat-emoji')}
      size="sm"
      side="top"
      active={picking}
      bind:el={emojiButton}
      data-chat-emoji
      onmousedown={keep}
      onclick={() => (picking = !picking)}><Smile size={14} /></IconButton
    >
    <span class="gap"></span>
    <Button size="sm" variant="primary" disabled={!cansend} data-chat-send onclick={onsend}>
      <SendHorizontal size={14} />
      {t('chat-send')}
    </Button>
  </div>
  <EmojiPicker
    open={picking}
    anchor={emojiButton}
    stay
    onpick={put}
    onclose={() => {
      picking = false;
      view?.focus();
    }}
  />
</div>

<style>
  .chat-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .box :global(.ProseMirror) {
    max-height: 160px;
    overflow-y: auto;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-ui), var(--font-emoji);
    font-size: var(--text-md);
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    outline: none;
  }
  .box :global(.ProseMirror:focus) {
    border-color: var(--accent);
  }
  .box :global(.ProseMirror p) {
    margin: 0;
  }
  .box :global(.ProseMirror.empty::before) {
    content: attr(data-placeholder);
    position: absolute;
    color: var(--ink-4);
    pointer-events: none;
  }
  .box :global(.ProseMirror code) {
    padding: 0 2px;
    border-radius: 3px;
    background: var(--paper-sunken);
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .gap {
    flex: 1;
  }
</style>
