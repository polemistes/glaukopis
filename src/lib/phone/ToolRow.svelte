<script lang="ts">
  /**
   * The row of tools at the foot of a note on the phone, and so over the
   * keyboard (stage 2 of `docs/plans/an-app-for-android.md`, part D): Bold,
   * Italic, List and To do at the left, Undo at the right, with room
   * between for the two of stage 3 at 320 pixels. A press keeps the cursor
   * in the text and the keyboard up: the button refuses the press its usual
   * effect, as the row of the window of a note did under a phone's keyboard
   * in the trial. The four of the text are there to be pressed while the
   * text has the cursor; Undo while there is something to undo.
   */
  import type { EditorState } from 'prosemirror-state';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { toolOn, type TextTool } from './tools';

  interface Props {
    /** The state of the text, for what is on; none where the editor is not there. */
    state: EditorState | null;
    /** Whether the text has the cursor. */
    focused: boolean;
    canUndo: boolean;
    /** A tool of the text pressed. */
    onrun: (tool: TextTool) => void;
    onundo: () => void;
  }

  let { state, focused, canUndo, onrun, onundo }: Props = $props();

  const TEXT = [
    { tool: 'bold', label: () => t('editor-bold'), icon: Bold },
    { tool: 'italic', label: () => t('editor-italic'), icon: Italic },
    { tool: 'list', label: () => t('editor-list'), icon: List },
    { tool: 'todo', label: () => t('editor-todo'), icon: ListTodo },
  ] as const;

  /** The press keeps the cursor where it is, and the keyboard up. */
  const keep = (event: MouseEvent) => event.preventDefault();
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
    label={t('common-undo')}
    side="top"
    disabled={!canUndo}
    data-phone-tool="undo"
    onmousedown={keep}
    onclick={onundo}><Undo2 size={20} /></IconButton
  >
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
