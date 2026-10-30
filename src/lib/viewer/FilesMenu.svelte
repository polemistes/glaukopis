<script lang="ts">
  /**
   * The menu of the files of the library over a side (ADR 0069): a button
   * beside the chevron of all projects, which has a menu of its own. It opens
   * the PDFs and images of the library in their folders, under a field that
   * finds a file by its name or by the work it belongs to, with the cursor in
   * the field; a file chosen is shown in that side. Enter in the field shows
   * the first file found; the arrow down goes to the rows.
   */
  import Files from '@lucide/svelte/icons/files';
  import Search from '@lucide/svelte/icons/search';
  import { tick } from 'svelte';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import Popover from '$lib/ui/Popover.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import LibraryTrees from './LibraryTrees.svelte';

  interface Props {
    /** The file this side shows, marked in the menu. */
    current?: string | null;
    /** Shows a file of the library in this side. */
    onfile: (hash: string) => void;
  }

  let { current = null, onfile }: Props = $props();

  /** Where the menu is open from. */
  let at = $state<HTMLElement | null>(null);
  let filter = $state('');
  let menu = $state<HTMLDivElement>();

  const field = () => menu?.querySelector<HTMLInputElement>('input');

  async function open(anchor: HTMLElement) {
    if (!files.loaded) void files.load();
    filter = '';
    at = anchor;
    await tick();
    field()?.focus();
  }

  function close() {
    at = null;
  }

  function choose(hash: string) {
    close();
    onfile(hash);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      menu?.querySelector<HTMLElement>('[data-tree-row]')?.focus();
    } else if (event.key === 'Enter' && filter.trim()) {
      const first = menu?.querySelector<HTMLElement>('[data-tree-kind="file"]');
      if (!first) return;
      event.preventDefault();
      first.click();
    }
  }
</script>

<button
  type="button"
  class="files"
  data-path-files
  aria-haspopup="dialog"
  aria-expanded={!!at}
  aria-label={t('viewer-files-menu')}
  use:tooltip={{ text: t('viewer-files-menu'), side: 'bottom' }}
  onclick={(e) => void open(e.currentTarget)}
>
  <Files size={14} />
</button>
<Popover
  open={!!at}
  anchor={at ?? undefined}
  width={340}
  label={t('viewer-files-menu')}
  onclose={close}
>
  <div class="menu" data-files-menu bind:this={menu}>
    <div class="tools">
      <TextField
        bind:value={filter}
        size="sm"
        placeholder={t('viewer-files-search')}
        aria-label={t('viewer-files-search')}
        {onkeydown}
      >
        {#snippet leading()}<Search size={14} />{/snippet}
      </TextField>
    </div>
    <LibraryTrees {current} {filter} onfile={choose} onup={() => field()?.focus()} />
  </div>
</Popover>

<style>
  .files {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .files:hover,
  .files[aria-expanded='true'] {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .menu {
    max-height: min(480px, 70vh);
    overflow-y: auto;
    padding: 8px 6px 0;
  }
  .tools {
    position: sticky;
    top: 0;
    z-index: 1;
    padding-bottom: 4px;
    background: var(--paper-raised, var(--paper));
  }
</style>
