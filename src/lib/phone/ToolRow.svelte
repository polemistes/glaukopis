<script lang="ts">
  /**
   * The row of tools at the foot of a note on the phone, and so over the
   * keyboard (stage 2 of `docs/plans/an-app-for-android.md`, part D, and
   * stage 3): Bold, Italic, List and To do at the left, Picture or file,
   * Photograph and Undo at the right, so that the seven stand within 320
   * pixels. A press keeps the cursor in the text and the keyboard up: the
   * button refuses the press its usual effect, as the row of the window of
   * a note did under a phone's keyboard in the trial. The four of the text
   * are there to be pressed while the text has the cursor; Undo while there
   * is something to undo; Picture or file and Photograph whether the text
   * has the cursor or not, and not while a file is being taken in.
   *
   * Those two press a hidden field of files: the system's picker, of any
   * kind of file and several at once, and the phone's camera, which on a
   * computer is the dialog of files, since nothing there takes a photograph
   * for a page. The row remembers whether the text had the cursor at the
   * press, since the picker takes it away, and hands that on with the files.
   */
  import type { EditorState } from 'prosemirror-state';
  import Bold from '@lucide/svelte/icons/bold';
  import Camera from '@lucide/svelte/icons/camera';
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { toolOn, type FileTool, type TextTool } from './tools';

  interface Props {
    /** The state of the text, for what is on; none where the editor is not there. */
    state: EditorState | null;
    /** Whether the text has the cursor. */
    focused: boolean;
    canUndo: boolean;
    /** Whether a file is being taken in: the two that take files are not there to be pressed. */
    taking?: boolean;
    /** A tool of the text pressed. */
    onrun: (tool: TextTool) => void;
    onundo: () => void;
    /** Files chosen or photographed, with whether the text had the cursor when the button was pressed. */
    ontake: (files: File[], from: FileTool, cursor: boolean) => void;
  }

  let { state, focused, canUndo, taking = false, onrun, onundo, ontake }: Props = $props();

  const TEXT = [
    { tool: 'bold', label: () => t('editor-bold'), icon: Bold },
    { tool: 'italic', label: () => t('editor-italic'), icon: Italic },
    { tool: 'list', label: () => t('editor-list'), icon: List },
    { tool: 'todo', label: () => t('editor-todo'), icon: ListTodo },
  ] as const;

  /** The hidden fields of files, by the tool that presses them. */
  const fields: Record<FileTool, HTMLInputElement | undefined> = {
    file: undefined,
    photograph: undefined,
  };
  /** Whether the text had the cursor when each was pressed. */
  const cursorAt: Record<FileTool, boolean> = { file: false, photograph: false };

  /** The press keeps the cursor where it is, and the keyboard up. */
  const keep = (event: MouseEvent) => event.preventDefault();

  /** Presses the field of a tool: the picker or the camera opens. */
  function open(tool: FileTool) {
    cursorAt[tool] = focused;
    fields[tool]?.click();
  }

  /** The files a field has been given are handed on, and the field is emptied so that the same file can be chosen again. */
  function chosen(tool: FileTool, event: Event) {
    const field = event.currentTarget as HTMLInputElement;
    const files = Array.from(field.files ?? []);
    field.value = '';
    if (files.length) ontake(files, tool, cursorAt[tool]);
  }
</script>

<div class="tools" role="toolbar" aria-label={t('notebook-note')} data-phone-tools>
  {#each TEXT as item (item.tool)}
    <IconButton
      label={item.label()}
      side="top"
      active={focused && toolOn(state, item.tool)}
      disabled={!focused}
      data-phone-tool={item.tool}
      onmousedown={keep}
      onclick={() => onrun(item.tool)}><item.icon size={20} /></IconButton
    >
  {/each}
  <span class="gap"></span>
  <IconButton
    label={t('phone-picture-or-file')}
    side="top"
    disabled={taking}
    data-phone-tool="file"
    onmousedown={keep}
    onclick={() => open('file')}><Paperclip size={20} /></IconButton
  >
  <IconButton
    label={t('phone-photograph')}
    side="top"
    disabled={taking}
    data-phone-tool="photograph"
    onmousedown={keep}
    onclick={() => open('photograph')}><Camera size={20} /></IconButton
  >
  <IconButton
    label={t('common-undo')}
    side="top"
    disabled={!canUndo}
    data-phone-tool="undo"
    onmousedown={keep}
    onclick={onundo}><Undo2 size={20} /></IconButton
  >
  <input
    bind:this={fields.file}
    type="file"
    multiple
    hidden
    data-phone-input="file"
    onchange={(event) => chosen('file', event)}
  />
  <input
    bind:this={fields.photograph}
    type="file"
    accept="image/*"
    capture="environment"
    hidden
    data-phone-input="photograph"
    onchange={(event) => chosen('photograph', event)}
  />
</div>

<style>
  .tools {
    display: flex;
    align-items: center;
    flex: none;
    padding: 0 6px;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .gap {
    flex: 1;
  }
</style>
