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
  import { t } from '$lib/i18n';
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

  // The names of kinds of file that are names of programs and standards are
  // the same in every language.
  const kinds: Kind[] = $derived([
    {
      target: 'pdf',
      label: 'PDF',
      extension: 'pdf',
      about: t('preview-export-pdf-about'),
      needsTypst: true,
    },
    {
      target: 'pdflatex',
      label: t('preview-export-pdflatex'),
      extension: 'pdf',
      about: t('preview-export-pdflatex-about'),
      needsLatex: true,
    },
    {
      target: 'docx',
      label: 'Word',
      extension: 'docx',
      about: t('preview-export-docx-about'),
    },
    {
      target: 'odt',
      label: 'OpenDocument',
      extension: 'odt',
      about: t('preview-export-odt-about'),
    },
    {
      target: 'latex',
      label: 'LaTeX',
      extension: 'tex',
      about: t('preview-export-latex-about'),
    },
    {
      target: 'markdown',
      label: 'Markdown',
      extension: 'md',
      about: t('preview-export-markdown-about'),
    },
    {
      target: 'html',
      label: t('preview-export-html'),
      extension: 'html',
      about: t('preview-export-html-about'),
    },
  ]);

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
      title: t('preview-export-as', { kind: kind.label }),
      defaultPath: `${name}.${kind.extension}`,
      filters: [{ name: kind.label, extensions: [kind.extension] }],
    });
    if (!path) return;
    working = true;
    try {
      done = await documentExport(await request(), chosen, path, { biblatex });
    } catch (e) {
      error = describeError(e) ?? t('preview-export-failed');
    } finally {
      working = false;
    }
  }

  function fileName(path: string): string {
    return path.split(/[\\/]/).pop() ?? path;
  }
</script>

<Dialog open title={t('preview-export')} width={540} dismissable={!working} {onclose}>
  {#if done}
    <div class="done">
      <span class="mark"><CircleCheck size={28} strokeWidth={1.5} /></span>
      <h3 class="selectable">{fileName(done.path)}</h3>
      {#each done.also as other}
        <p class="also selectable">{t('preview-export-also', { file: fileName(other) })}</p>
      {/each}
      {#if done.missing.length}
        <p class="warning">
          {t('preview-export-missing', { count: done.missing.length })}
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
            openPath(done.path).catch((e) => notifyError(t('preview-export-open-failed'), e))}
        >
          {t('common-open')}
        </Button>
        <Button
          onclick={() =>
            done &&
            openPath(done.path, true).catch((e) =>
              notifyError(t('preview-export-folder-failed'), e),
            )}
        >
          {t('preview-export-show-in-folder')}
        </Button>
      </div>
    </div>
  {:else}
    <div class="kinds" role="radiogroup" aria-label={t('preview-export-kind')}>
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
              {t('preview-export-latex-missing')}
            {:else}
              {t('preview-export-typst-missing')}
            {/if}
          </span>
        </label>
      {/each}
    </div>

    {#if chosen === 'latex'}
      <label class="option">
        <input type="checkbox" bind:checked={biblatex} disabled={working} />
        <span>
          {t('preview-export-biblatex')}
          <small>{t('preview-export-biblatex-hint')}</small>
        </span>
      </label>
    {/if}
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}
  {/if}

  {#snippet footer()}
    {#if done}
      <div class="left">
        <Button variant="ghost" onclick={() => (done = null)}>{t('preview-export-another')}</Button>
      </div>
      <Button onclick={onclose}>{t('common-close')}</Button>
    {:else}
      {#if working}<div class="left working"><Spinner /> {t('preview-export-working')}</div>{/if}
      <Button variant="ghost" disabled={working} onclick={onclose}>{t('common-cancel')}</Button>
      <Button variant="primary" disabled={working} onclick={run}>{t('preview-export-run')}</Button>
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
