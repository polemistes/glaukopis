<script lang="ts">
  import { save } from '@tauri-apps/plugin-dialog';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import {
    documentExport,
    openPath,
    type DocumentRequest,
    type Exported,
    type Target,
  } from '$lib/api/documents';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import { documents } from './documents.svelte';

  interface Props {
    /** Makes the request anew, from the project as it is now. */
    request: () => Promise<DocumentRequest>;
    /** A name for the file, without extension. */
    name: string;
    onclose: () => void;
  }

  let { request, name, onclose }: Props = $props();

  interface Kind {
    target: Target;
    label: string;
    extension: string;
    about: string;
    needsTypst?: boolean;
    needsLatex?: boolean;
  }

  const kinds: Kind[] = [
    {
      target: 'pdf',
      label: 'PDF',
      extension: 'pdf',
      about: 'As the preview shows it',
      needsTypst: true,
    },
    {
      target: 'pdflatex',
      label: 'PDF, set by LaTeX',
      extension: 'pdf',
      about: 'The same document in the typesetting of LaTeX. It takes a little longer.',
      needsLatex: true,
    },
    {
      target: 'docx',
      label: 'Word',
      extension: 'docx',
      about: 'What most publishers and journals ask for',
    },
    {
      target: 'odt',
      label: 'OpenDocument',
      extension: 'odt',
      about: 'For LibreOffice Writer and others',
    },
    {
      target: 'latex',
      label: 'LaTeX',
      extension: 'tex',
      about: 'To be set with LuaLaTeX or XeLaTeX',
    },
    {
      target: 'markdown',
      label: 'Markdown',
      extension: 'md',
      about: 'Plain text, with the citations as keys',
    },
    {
      target: 'html',
      label: 'Web page',
      extension: 'html',
      about: 'One file, to be read in a browser',
    },
  ];

  let chosen = $state<Target>('docx');
  let biblatex = $state(false);
  let working = $state(false);
  let error = $state<string | null>(null);
  let done = $state<Exported | null>(null);

  const kind = $derived(kinds.find((k) => k.target === chosen)!);
  const typstMissing = $derived(!documents.tools?.typst);
  const latexMissing = $derived(!documents.tools?.latex.length);

  async function run() {
    error = null;
    done = null;
    const path = await save({
      title: `Export as ${kind.label}`,
      defaultPath: `${name}.${kind.extension}`,
      filters: [{ name: kind.label, extensions: [kind.extension] }],
    });
    if (!path) return;
    working = true;
    try {
      done = await documentExport(await request(), chosen, path, { biblatex });
    } catch (e) {
      error = describeError(e) ?? 'The document could not be made.';
    } finally {
      working = false;
    }
  }

  function fileName(path: string): string {
    return path.split(/[\\/]/).pop() ?? path;
  }
</script>

<Dialog open title="Export" width={540} dismissable={!working} {onclose}>
  {#if done}
    <div class="done">
      <span class="mark"><CircleCheck size={28} strokeWidth={1.5} /></span>
      <h3 class="selectable">{fileName(done.path)}</h3>
      {#each done.also as other}
        <p class="also selectable">with {fileName(other)}</p>
      {/each}
      {#if done.missing.length}
        <p class="warning">
          {done.missing.length === 1
            ? 'One work cited was'
            : `${done.missing.length} works cited were`} not found, and {done.missing.length === 1
            ? 'is'
            : 'are'} marked in the text.
        </p>
      {/if}
      {#each done.warnings.slice(0, 5) as w}
        <p class="warning selectable">{w}</p>
      {/each}
      <div class="actions">
        <Button
          variant="primary"
          onclick={() =>
            done &&
            openPath(done.path).catch((e) => notifyError('The file could not be opened', e))}
        >
          Open
        </Button>
        <Button
          onclick={() =>
            done &&
            openPath(done.path, true).catch((e) =>
              notifyError('The folder could not be opened', e),
            )}
        >
          Show in folder
        </Button>
      </div>
    </div>
  {:else}
    <div class="kinds" role="radiogroup" aria-label="Kind of file">
      {#each kinds as k (k.target)}
        {@const unavailable = (!!k.needsTypst && typstMissing) || (!!k.needsLatex && latexMissing)}
        <label class="kind" class:chosen={chosen === k.target} class:unavailable>
          <input
            type="radio"
            bind:group={chosen}
            value={k.target}
            disabled={unavailable || working}
          />
          <span class="name">{k.label}<small>.{k.extension}</small></span>
          <span class="about">
            {#if !unavailable}
              {k.about}
            {:else if k.needsLatex}
              LaTeX is needed for this, and was not found. It is installed as TeX Live.
            {:else}
              Typst is needed for this, and was not found
            {/if}
          </span>
        </label>
      {/each}
    </div>

    {#if chosen === 'latex'}
      <label class="option">
        <input type="checkbox" bind:checked={biblatex} disabled={working} />
        <span>
          Keep the citations as commands of BibLaTeX
          <small
            >The references are written to a .bib file beside the document. The reference style is
            then that of BibLaTeX nearest to the one chosen.</small
          >
        </span>
      </label>
    {/if}
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}
  {/if}

  {#snippet footer()}
    {#if done}
      <div class="left">
        <Button variant="ghost" onclick={() => (done = null)}>Export another</Button>
      </div>
      <Button onclick={onclose}>Close</Button>
    {:else}
      {#if working}<div class="left working"><Spinner /> Making the document…</div>{/if}
      <Button variant="ghost" disabled={working} onclick={onclose}>Cancel</Button>
      <Button variant="primary" disabled={working} onclick={run}>Export…</Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .kinds {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .kind {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 11px 13px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    cursor: pointer;
    transition:
      border-color var(--fast) var(--ease),
      background var(--fast) var(--ease);
  }
  .kind:hover {
    background: var(--paper-hover);
  }
  .kind.chosen {
    border-color: var(--accent);
    background: var(--accent-softer);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .kind.unavailable {
    opacity: 0.55;
    cursor: default;
  }
  .kind input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .kind:has(input:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }
  .name {
    font-weight: 600;
  }
  .name small {
    margin-left: 6px;
    font-weight: 400;
    color: var(--ink-3);
    font-family: var(--font-mono);
    font-size: 11.5px;
  }
  .about {
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.4;
  }
  .option {
    display: flex;
    gap: 9px;
    margin-top: 14px;
    cursor: pointer;
  }
  .option input {
    margin: 3px 0 0;
    accent-color: var(--accent);
  }
  .option small {
    display: block;
    margin-top: 2px;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.45;
  }
  .error {
    margin-top: 14px;
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
  .done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 0 4px;
    text-align: center;
  }
  .mark {
    color: var(--ok);
  }
  .done h3 {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 500;
  }
  .also {
    color: var(--ink-3);
  }
  .warning {
    max-width: 46ch;
    margin-top: 6px;
    font-size: var(--text-sm);
    color: var(--warn);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .left {
    margin-right: auto;
  }
  .working {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
