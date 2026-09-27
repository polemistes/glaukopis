<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { inTauri } from '$lib/api/backend';
  import { outsideDrop, outsideLeave, outsideOver, type DragPayload } from '$lib/ui/drag.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { plural } from './format';
  import ImportDialog from './ImportDialog.svelte';
  import PasteDialog from './PasteDialog.svelte';
  import ReferenceDialog from './ReferenceDialog.svelte';
  import { dialogs, importDropped } from './references.svelte';
  import ZoteroDialog from './ZoteroDialog.svelte';

  // Files dragged in from the desktop. Where they are dropped decides what
  // becomes of them: on a reference they are attached to it, on an element of
  // a map their references are cited in it; anywhere else they are taken
  // into the library.
  onMount(() => {
    if (!inTauri) return;
    let files: DragPayload | null = null;
    const at = (p: { x: number; y: number }) => ({
      x: p.x / window.devicePixelRatio,
      y: p.y / window.devicePixelRatio,
    });
    const stop = getCurrentWebview().onDragDropEvent((event) => {
      const e = event.payload;
      if (e.type === 'enter') {
        files = { kind: 'files', data: e.paths, label: plural(e.paths.length, 'file') };
        const { x, y } = at(e.position);
        outsideOver(files, x, y);
      } else if (e.type === 'over') {
        const { x, y } = at(e.position);
        if (files) outsideOver(files, x, y);
      } else if (e.type === 'drop') {
        const { x, y } = at(e.position);
        const dropped: DragPayload = {
          kind: 'files',
          data: e.paths,
          label: plural(e.paths.length, 'file'),
        };
        files = null;
        // Not over a dialog: what is open there is in the middle of something else.
        if (document.querySelector('dialog[open]')) outsideLeave();
        else if (!outsideDrop(dropped, x, y)) void importDropped(e.paths);
      } else {
        files = null;
        outsideLeave();
      }
    });
    return () => void stop.then((off) => off());
  });
</script>

{#if dialogs.form}
  {#key dialogs.form}
    <ReferenceDialog request={dialogs.form} onclose={() => (dialogs.form = null)} />
  {/key}
{/if}

{#if dialogs.pasting}
  {#key dialogs.pasting}
    <PasteDialog request={dialogs.pasting} onclose={() => (dialogs.pasting = null)} />
  {/key}
{/if}

{#if dialogs.zotero}
  {#key dialogs.zotero}
    <ZoteroDialog request={dialogs.zotero} onclose={() => (dialogs.zotero = null)} />
  {/key}
{/if}

{#if dialogs.importing}
  {#key dialogs.importing}
    <ImportDialog request={dialogs.importing} onclose={() => (dialogs.importing = null)} />
  {/key}
{/if}

{#if dialogs.working}
  <div class="working" role="status">
    <Spinner size={14} />
    {dialogs.working}
  </div>
{/if}

<style>
  .working {
    position: fixed;
    left: 50%;
    bottom: 28px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-2);
    transform: translateX(-50%);
  }
</style>
