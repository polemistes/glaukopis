<script lang="ts">
  /**
   * The sheet of the boxes of a note on the phone (stage 2 of
   * `docs/plans/an-app-for-android.md`, part D): each box, the note's own
   * marked; one pressed, the note is moved there and the sheet closes. At
   * its foot a new box is made by its name, and the note moved into it.
   * Boxes are not renamed, put in order or deleted here.
   */
  import Check from '@lucide/svelte/icons/check';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';
  import { boxName } from '$lib/notebook/page.svelte';
  import Sheet from './Sheet.svelte';

  interface Props {
    notebook: Notebook;
    /** The note that is moved. */
    note: string;
    open: boolean;
    onclose: () => void;
  }

  let { notebook, note, open, onclose }: Props = $props();

  const own = $derived(notebook.note(note)?.box ?? null);
  let name = $state('');

  /** Moves the note into a box, as a step of undo of its own. */
  function moveTo(box: string) {
    notebook.checkpoint();
    notebook.moveToBox([note], box);
    notebook.checkpoint();
  }

  function choose(box: string) {
    if (box !== own) moveTo(box);
    onclose();
  }

  /** Makes a box by the name given, and moves the note into it, in one step of undo. */
  function make() {
    if (!name.trim()) return;
    notebook.checkpoint();
    const box = notebook.addBox(name);
    notebook.moveToBox([note], box);
    notebook.checkpoint();
    name = '';
    onclose();
  }
</script>

<Sheet {open} title={t('notebook-move-to')} {onclose}>
  <ul class="boxes" data-phone-boxes>
    {#each notebook.boxes as box (box.id)}
      <li>
        <button
          type="button"
          class="row"
          class:own={box.id === own}
          aria-current={box.id === own ? 'true' : undefined}
          data-phone-box-row={box.id}
          onclick={() => choose(box.id)}
        >
          <span class="name">{boxName(box)}</span>
          {#if box.id === own}<Check size={18} />{/if}
        </button>
      </li>
    {/each}
  </ul>
  <form
    class="new"
    onsubmit={(event) => {
      event.preventDefault();
      make();
    }}
  >
    <div class="field">
      <TextField
        bind:value={name}
        label={t('notebook-box-name')}
        enterkeyhint="done"
        data-phone-box-name
      />
    </div>
    <Button type="submit" disabled={!name.trim()} data-phone-box-new>
      {t('notebook-box-new')}
    </Button>
  </form>
</Sheet>

<style>
  .boxes {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row.own {
    color: var(--accent-strong);
    font-weight: 600;
  }
  .row:active {
    background: var(--paper-hover);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .new {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 16px 16px;
    border-top: 1px solid var(--line);
  }
  .field {
    flex: 1 1 10em;
    min-width: 0;
  }
</style>
