<script lang="ts">
  import { open as openFile } from '@tauri-apps/plugin-dialog';
  import Check from '@lucide/svelte/icons/check';
  import Download from '@lucide/svelte/icons/download';
  import Search from '@lucide/svelte/icons/search';
  import { stylesFetch, stylesImport, stylesSearch, type StyleFound } from '$lib/api/documents';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { documents, kindWords } from './documents.svelte';

  interface Props {
    /** Called with the id of the style chosen. */
    onchoose: (id: string) => void;
    onclose: () => void;
  }

  let { onchoose, onclose }: Props = $props();

  let query = $state('');
  let found = $state.raw<StyleFound[]>([]);
  let fetching = $state<string | null>(null);
  let error = $state<string | null>(null);
  let round = 0;

  $effect(() => {
    const q = query;
    const mine = ++round;
    if (!q.trim()) {
      found = [];
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await stylesSearch(q);
        if (mine === round) found = result;
      } catch (e) {
        if (mine === round) error = describeError(e) ?? null;
      }
    }, 150);
    return () => clearTimeout(timer);
  });

  async function choose(style: StyleFound) {
    error = null;
    if (style.installed) {
      onchoose(style.id);
      return;
    }
    fetching = style.id;
    try {
      const got = await stylesFetch(style.id);
      await documents.reload();
      onchoose(got.id);
    } catch (e) {
      error = describeError(e) ?? 'The style could not be fetched.';
    } finally {
      fetching = null;
    }
  }

  async function fromFile() {
    const path = await openFile({
      title: 'Import a reference style',
      multiple: false,
      filters: [{ name: 'Citation Style Language', extensions: ['csl', 'xml'] }],
    });
    if (!path || Array.isArray(path)) return;
    try {
      const got = await stylesImport(path);
      await documents.reload();
      onchoose(got.id);
    } catch (e) {
      error = describeError(e) ?? 'The file could not be read.';
    }
  }
</script>

<Dialog
  open
  title="Reference styles"
  subtitle="More than ten thousand styles of journals and publishers, by name"
  width={620}
  tall
  padded={false}
  {onclose}
>
  <div class="browser">
    <div class="field">
      <Search size={15} />
      <input
        bind:value={query}
        placeholder="The name of a journal, a publisher or a style"
        aria-label="Search styles"
        spellcheck="false"
        data-autofocus
      />
    </div>
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

    <div class="results">
      {#each found as style (style.id)}
        <button
          type="button"
          class="row"
          disabled={fetching !== null}
          onclick={() => choose(style)}
        >
          <div class="text">
            <div class="title">{style.title}</div>
            <div class="meta">
              {[kindWords[style.kind] ?? style.kind, style.fields.slice(0, 3).join(', ')]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
          {#if fetching === style.id}
            <Spinner size={14} />
          {:else if style.installed}
            <span class="have"><Check size={14} /> Here</span>
          {:else}
            <span class="get"><Download size={14} /> Fetch</span>
          {/if}
        </button>
      {:else}
        <p class="none">
          {#if query.trim()}
            No style has these words in its name.
          {:else}
            Styles are fetched from the repository of the Citation Style Language project and kept
            with your own. Those you have can be changed to a publisher’s wishes in the style
            editor.
          {/if}
        </p>
      {/each}
    </div>
  </div>

  {#snippet footer()}
    <div class="left"><Button variant="ghost" onclick={fromFile}>Import a file…</Button></div>
    <Button onclick={onclose}>Close</Button>
  {/snippet}
</Dialog>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 var(--space-5) var(--space-3);
    padding: 0 12px;
    height: 38px;
    flex: none;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    color: var(--ink-3);
  }
  .field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: var(--text-lg);
    color: var(--ink);
  }
  .error {
    margin: 0 var(--space-5) var(--space-3);
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  .results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 var(--space-4) var(--space-4);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .row:hover:not(:disabled) {
    background: var(--paper-hover);
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-family: var(--font-text);
    font-size: 14.5px;
  }
  .meta {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .have,
  .get {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    font-size: var(--text-sm);
  }
  .have {
    color: var(--ok);
  }
  .get {
    color: var(--accent-strong);
    opacity: 0;
  }
  .row:hover .get {
    opacity: 1;
  }
  .none {
    padding: 24px 12px;
    color: var(--ink-3);
    line-height: 1.6;
    max-width: 52ch;
  }
  .left {
    margin-right: auto;
  }
</style>
