<script lang="ts">
  import { untrack } from 'svelte';
  import FileText from '@lucide/svelte/icons/file-text';
  import PackageX from '@lucide/svelte/icons/package-x';
  import Share from '@lucide/svelte/icons/share';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import { isBackendError } from '$lib/api/backend';
  import { documentPreview, type DocumentFormat, type DocumentRequest } from '$lib/api/documents';
  import { plural } from '$lib/library/format';
  import { buildDocument, countWords } from '$lib/project/model/document';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, toasts } from '$lib/ui/toast.svelte';
  import DocumentDetails from './DocumentDetails.svelte';
  import { documents, formatKindWords, kindWords } from './documents.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import FormatEditor from './FormatEditor.svelte';
  import StyleEditor from './StyleEditor.svelte';
  import StyleBrowser from './StyleBrowser.svelte';

  interface Props {
    project: Project;
    projectId: string;
    mapId: string;
    onclose: () => void;
  }

  let { project, projectId, mapId, onclose }: Props = $props();

  let pages = $state.raw<string[]>([]);
  let status = $state<'waiting' | 'working' | 'shown' | 'failed'>('waiting');
  let error = $state<{ kind: string; message: string } | null>(null);
  let warnings = $state.raw<string[]>([]);
  let missing = $state.raw<string[]>([]);
  let substitute = $state<string | null>(null);
  let format = $state.raw<DocumentFormat | null>(null);
  let browsing = $state(false);
  let detailing = $state(false);
  let exporting = $state(false);
  let editingFormat = $state<string | null>(null);
  let editingStyle = $state<string | null>(null);
  let round = 0;

  const map = $derived(project.map(mapId));
  const choice = $derived(documents.choice(map?.document ?? {}));
  const words = $derived.by(() => {
    void project.revision;
    return countWords(project, mapId);
  });

  $effect(() => {
    documents.load();
  });

  async function request(): Promise<DocumentRequest> {
    const f = await documents.format(choice.format);
    return {
      document: buildDocument(project, mapId),
      style: choice.style,
      format: $state.snapshot(f) as DocumentFormat,
      key: projectId,
    };
  }

  async function refresh() {
    const mine = ++round;
    status = pages.length ? 'working' : 'waiting';
    try {
      const r = await request();
      if (mine !== round) return;
      format = r.format;
      const preview = await documentPreview(r);
      if (mine !== round) return;
      release();
      pages = preview.pages.map((svg) =>
        URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      );
      warnings = preview.warnings;
      missing = preview.missing;
      substitute = preview.substitute;
      error = null;
      status = 'shown';
    } catch (e) {
      if (mine !== round) return;
      error = isBackendError(e)
        ? e
        : { kind: 'unknown', message: describeError(e) ?? 'The preview could not be made.' };
      status = 'failed';
    }
  }

  function release() {
    for (const url of pages) URL.revokeObjectURL(url);
  }

  // The preview follows the text, a moment behind it.
  $effect(() => {
    void project.revision;
    void mapId;
    void choice.style;
    void choice.format;
    void documents.loaded;
    if (!documents.loaded) return;
    const timer = setTimeout(() => untrack(refresh), pages.length ? 900 : 50);
    return () => clearTimeout(timer);
  });

  $effect(() => () => {
    round++;
    release();
  });

  function setStyle(id: string) {
    project.setDocument(mapId, { style: id });
  }

  async function setFormat(id: string) {
    const before = choice.style;
    project.checkpoint();
    project.setDocument(mapId, { format: id });
    // A publisher's format goes with a reference style: it is taken with it.
    try {
      const f = await documents.format(id);
      if (f.style && f.style !== before && documents.style(f.style)) {
        project.setDocument(mapId, { style: f.style });
        toasts.show({
          kind: 'info',
          message: `The reference style is now ${documents.style(f.style)?.title}`,
          detail: 'It is the one this format goes with.',
          action: {
            label: 'Keep the other',
            run: () => project.setDocument(mapId, { style: before }),
          },
        });
      }
    } catch {
      // The format will be reported as missing by the preview.
    }
    project.checkpoint();
  }

  const styleGroups = $derived.by(() => {
    const groups = new Map<string, typeof documents.styles>();
    for (const s of documents.styles) {
      const name = kindWords[s.kind] || 'Other';
      groups.set(name, [...(groups.get(name) ?? []), s]);
    }
    const order = ['Notes', 'Author and date', 'Numbers', 'Labels', 'Author', 'Other'];
    return [...groups].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  });

  const formatGroups = $derived.by(() => {
    const order = ['own', 'general', 'style-guide', 'publisher', 'journal'];
    return order
      .map((kind) => ({
        name: formatKindWords[kind],
        formats: documents.formats.filter((f) => f.kind === kind),
      }))
      .filter((g) => g.formats.length);
  });

  const over = $derived(!!format?.limits.words && words.text > format.limits.words);

  function problems(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        ...(substitute
          ? [
              { kind: 'heading' as const, label: 'Font' },
              {
                label: `${format?.font.family} is not installed`,
                hint: `${substitute} is used in its place. In a document you export, the font is named as the format asks.`,
                action: () => {},
              },
            ]
          : []),
        ...(missing.length
          ? [
              { kind: 'heading' as const, label: 'References' },
              {
                label: `${plural(missing.length, 'work')} cited ${missing.length === 1 ? 'was' : 'were'} not found`,
                hint: 'Neither in your library nor in the project. They are marked in the text.',
                action: () => {},
              },
            ]
          : []),
        ...(warnings.length
          ? [{ kind: 'heading' as const, label: 'Said while the document was made' }]
          : []),
        ...warnings
          .slice(0, 8)
          .map((w) => ({ label: w.length > 90 ? `${w.slice(0, 90)}…` : w, action: () => {} })),
      ],
      { side: 'top', align: 'start' },
    );
  }

  const issueCount = $derived(warnings.length + missing.length + (substitute ? 1 : 0));
</script>

<aside class="preview" aria-label="Preview">
  <header>
    <div class="choices">
      <label>
        <span>Format</span>
        <select
          value={choice.format}
          onchange={(e) => setFormat(e.currentTarget.value)}
          aria-label="Document format"
        >
          {#each formatGroups as group (group.name)}
            <optgroup label={group.name}>
              {#each group.formats as f (f.id)}
                <option value={f.id}>{f.name}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </label>
      <label>
        <span>References</span>
        <select
          value={choice.style}
          onchange={(e) => {
            const v = e.currentTarget.value;
            if (v === '…') {
              e.currentTarget.value = choice.style;
              browsing = true;
            } else setStyle(v);
          }}
          aria-label="Reference style"
        >
          {#each styleGroups as [name, styles] (name)}
            <optgroup label={name}>
              {#each styles as s (s.id)}
                <option value={s.id}>{s.title}</option>
              {/each}
            </optgroup>
          {/each}
          {#if !documents.style(choice.style)}
            <option value={choice.style}>{choice.style}</option>
          {/if}
          <option value="…">More styles…</option>
        </select>
      </label>
    </div>
    <IconButton
      label="Change the format or the style"
      onclick={(e) =>
        openMenu(
          e.currentTarget as HTMLElement,
          [
            {
              label: 'Change this format…',
              hint: 'Page, type, spacing, headings',
              action: () => (editingFormat = choice.format),
            },
            {
              label: 'Change this reference style…',
              hint: 'To a publisher’s wishes',
              action: () => (editingStyle = choice.style),
            },
          ],
          { align: 'end' },
        )}
    >
      <SlidersHorizontal size={15} />
    </IconButton>
    <IconButton label="Title, authors, abstract" onclick={() => (detailing = true)}>
      <FileText size={15} />
    </IconButton>
    <Button variant="primary" size="sm" onclick={() => (exporting = true)}>
      {#snippet icon()}<Share size={13} />{/snippet}
      Export
    </Button>
    <IconButton label="Hide the preview" shortcut="Ctrl+P" onclick={onclose}
      ><X size={15} /></IconButton
    >
  </header>

  <div class="pages" class:working={status === 'working'}>
    {#if status === 'failed' && error}
      {#if error.kind === 'missing-program'}
        <EmptyState
          icon={PackageX}
          title={error.message.replace(' or could not be found', '')}
          text="Preview and export are made with Pandoc and Typst. Install them with the package manager of your system, or say in the settings where they are."
        >
          <Button onclick={() => documents.lookAgain().then(refresh)}>Look again</Button>
        </EmptyState>
      {:else}
        <EmptyState icon={TriangleAlert} title="The preview could not be made">
          <pre class="selectable">{error.message}</pre>
          <Button onclick={refresh}>Try again</Button>
        </EmptyState>
      {/if}
    {:else if !pages.length}
      <div class="centre"><Spinner size={22} /></div>
    {:else}
      {#each pages as url, i (url)}
        <img src={url} alt="Page {i + 1}" class="page" draggable="false" />
      {/each}
    {/if}
  </div>

  <footer>
    {#if status === 'working'}<Spinner size={11} />{/if}
    {#if pages.length}<span>{plural(pages.length, 'page')}</span>{/if}
    <span class:over>
      {words.text.toLocaleString()}{format?.limits.words
        ? ` of ${format.limits.words.toLocaleString()}`
        : ''} words
    </span>
    {#if words.withNotes !== words.text}
      <span>{words.withNotes.toLocaleString()} with notes</span>
    {/if}
    {#if issueCount}
      <button type="button" class="issues" onclick={problems}>
        <TriangleAlert size={12} />
        {plural(issueCount, 'remark')}
      </button>
    {/if}
  </footer>
</aside>

{#if browsing}
  <StyleBrowser
    onchoose={(id) => {
      browsing = false;
      setStyle(id);
    }}
    onclose={() => (browsing = false)}
  />
{/if}
{#if detailing}
  <DocumentDetails
    {project}
    {mapId}
    limits={format
      ? { abstractWords: format.limits.abstractWords, keywords: format.limits.keywords }
      : undefined}
    onclose={() => (detailing = false)}
  />
{/if}
{#if editingFormat}
  <FormatEditor
    id={editingFormat}
    {request}
    onsaved={(id) => {
      editingFormat = null;
      project.setDocument(mapId, { format: id });
      void refresh();
    }}
    onclose={() => (editingFormat = null)}
  />
{/if}
{#if editingStyle}
  <StyleEditor
    id={editingStyle}
    references={project.usedReferences(mapId)}
    language={map?.document.language}
    onsaved={(id) => {
      editingStyle = null;
      project.setDocument(mapId, { style: id || undefined });
      void refresh();
    }}
    onclose={() => (editingStyle = null)}
  />
{/if}
{#if exporting}
  <ExportDialog {request} name={map?.name ?? 'document'} onclose={() => (exporting = false)} />
{/if}

<style>
  .preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-sunken);
    border-left: 1px solid var(--line);
  }
  header {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    flex: none;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .choices {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  label span {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 26px;
    padding: 0 6px 0 0;
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    font-weight: 500;
    text-overflow: ellipsis;
    cursor: pointer;
    outline: none;
  }
  select:hover,
  select:focus-visible {
    border-bottom-color: var(--accent);
  }
  .pages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 22px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transition: opacity var(--slow) var(--ease);
  }
  .pages.working {
    opacity: 0.75;
  }
  .page {
    display: block;
    width: 100%;
    max-width: 820px;
    height: auto;
    background: #fff;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.12),
      0 8px 24px rgba(0, 0, 0, 0.08);
    user-select: none;
  }
  .centre {
    flex: 1;
    display: flex;
    align-items: center;
  }
  pre {
    max-width: 100%;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--danger-soft);
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 11.5px;
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
    height: 28px;
    padding: 0 14px;
    border-top: 1px solid var(--line);
    background: var(--paper);
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .over {
    color: var(--danger);
    font-weight: 600;
  }
  .issues {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding: 2px 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--warn);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .issues:hover {
    background: var(--gold-soft);
  }
</style>
