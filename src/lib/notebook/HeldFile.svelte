<script lang="ts">
  /**
   * A file a note holds, as it stands in the note: its name, with the icon
   * of its kind. It is opened by two presses, or by Enter where it is
   * selected (record 0101).
   */
  import FileIcon from '@lucide/svelte/icons/file';
  import type { FileView } from '$lib/api/files';
  import { KIND_ICONS } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import { heldFile, openHeldFile } from './files';

  let { hash, name }: { hash: string; name: string } = $props();

  let file = $state.raw<FileView | null>(null);
  $effect(() => {
    let stale = false;
    void heldFile(hash).then((found) => {
      if (!stale) file = found;
    });
    return () => {
      stale = true;
    };
  });

  const Icon = $derived(file ? KIND_ICONS[file.kind] : FileIcon);
  const shown = $derived(name || file?.name || hash.slice(0, 8));
</script>

<span
  class="held"
  class:missing={file !== null && !file.exists}
  role="button"
  tabindex="-1"
  aria-label={t('notebook-file-open-named', { name: shown })}
  ondblclick={() => void openHeldFile(hash)}
>
  <Icon size={15} strokeWidth={1.7} />
  <span class="name">{shown}</span>
</span>

<style>
  .held {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 3px 9px 3px 7px;
    border: 1px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    font-size: 0.92em;
    cursor: default;
    user-select: none;
  }
  .held.missing {
    color: var(--ink-3);
    border-style: dashed;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
