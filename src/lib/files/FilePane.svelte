<script lang="ts" module>
  import type { Looked } from '$lib/api/ocr';

  /** What was found of a PDF when it was first selected, by its hash: not asked again. */
  const looks = new Map<string, Looked | null>();
</script>

<script lang="ts">
  /**
   * One file of the library: named as the tabs name it, by its reference
   * where it has one (ADR 0074); the file itself, small, as a press on it
   * reads it; what it is called, where it stands, the references it
   * belongs to, where it came from; of an image, how large it is, what it
   * shows in words, and the projects in which it is a figure (ADR 0070);
   * and what can be done with it, by its kind. The pane is made anew for
   * every file.
   */
  import { onMount } from 'svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import PanelRight from '@lucide/svelte/icons/panel-right';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import { addToTabsMenu, anyProject } from '$lib/viewer/show';
  import FolderInput from '@lucide/svelte/icons/folder-input';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import FolderOutput from '@lucide/svelte/icons/folder-output';
  import Link from '@lucide/svelte/icons/link';
  import MapIcon from '@lucide/svelte/icons/map';
  import Network from '@lucide/svelte/icons/network';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import type { Component } from 'svelte';
  import type { FileView } from '$lib/api/files';
  import { attachmentOpen, attachmentReveal } from '$lib/api/library';
  import { ocrLook } from '$lib/api/ocr';
  import { pathOf } from '$lib/home/folders';
  import { t } from '$lib/i18n';
  import { dateWords, fileSize } from '$lib/library/format';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { fileEnding } from '$lib/util/file-name';
  import Thumb from './Thumb.svelte';
  import PdfMapDialog from '$lib/ocr/PdfMapDialog.svelte';
  import PictureTextDialog from '$lib/ocr/PictureTextDialog.svelte';
  import SearchableDialog from '$lib/ocr/SearchableDialog.svelte';
  import { library } from '$lib/state/library.svelte';
  import { formatRoute, router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import ReferenceChooser from './ReferenceChooser.svelte';
  import {
    KIND_ICONS,
    assign,
    bringInFile,
    exportFiles,
    fileLabel,
    figuresIn,
    files,
    kindWords,
    removeFile,
    renameFile,
    storedOf,
    unassign,
  } from './store.svelte';

  interface Props {
    /** The file, by the hash the store keeps it under. */
    hash: string;
    /** Opens the menu of folders to move the file to, from what was pressed. */
    onmove: (anchor: HTMLElement, file: FileView) => void;
    /** Called when the file has been removed. */
    onremoved?: () => void;
    /** Called when the file has been replaced by another, as a PDF made searchable is. */
    onreplaced?: (hash: string) => void;
    /** Reads a PDF or an image in the files view, in the place of the list (ADR 0073). */
    onread?: (hash: string) => void;
  }

  let { hash, onmove, onremoved, onreplaced, onread }: Props = $props();

  // svelte-ignore state_referenced_locally
  const own = hash;
  const file = $derived(files.get(own));

  // svelte-ignore state_referenced_locally
  let name = $state(files.get(own)?.name ?? '');
  let naming = false;
  // What is called otherwise elsewhere is shown, unless something is being written here.
  $effect(() => {
    const now = file?.name;
    if (now !== undefined && !naming) name = now;
  });

  let looked = $state.raw<Looked | null>(looks.get(own) ?? null);
  /**
   * Why the PDF could not be looked at, shown where its pages would be, so
   * that a look that failed is not taken for one not made. Not kept: the
   * file is looked at again when it is selected again.
   */
  let lookFailed = $state<string | null>(null);
  onMount(() => {
    const f = files.get(own);
    if (!f || f.kind !== 'pdf' || !f.exists || looks.has(own)) return;
    looks.set(own, null);
    ocrLook(f.path, true)
      .then((found) => {
        looks.set(own, found);
        looked = found;
      })
      .catch((error) => {
        console.warn(`the PDF ${f.path} could not be looked at`, error);
        looks.delete(own);
        lookFailed = describeError(error) ?? String(error);
      });
  });

  // ---- of an image: what it shows, in words ----

  // svelte-ignore state_referenced_locally
  let alt = $state(files.get(own)?.alt ?? '');
  let altTimer: ReturnType<typeof setTimeout> | undefined;
  /** What is written is kept a moment after the writing stops, and when the field is left. */
  function altChanged() {
    clearTimeout(altTimer);
    altTimer = setTimeout(() => void keepAlt(), 700);
  }
  async function keepAlt() {
    clearTimeout(altTimer);
    if (file && alt.trim() !== file.alt) await pictures.setAlt(file.hash, alt.trim());
  }

  /** The projects in which an image is a figure. */
  const usedIn = $derived(file?.kind === 'picture' ? figuresIn(file.hash) : []);
  /** The file a copy was made from: to be a figure, by editing, or to be smaller. */
  const madeFrom = $derived(file?.madeFrom ? files.get(file.madeFrom) : undefined);
  /** The copies made from it (ADR 0071). */
  const copies = $derived(
    file ? files.files.filter((f) => f.madeFrom === file.hash && f.exists) : [],
  );

  /** A dialog over the pane. */
  let open = $state<'assign' | 'searchable' | 'map' | 'read' | null>(null);

  async function keepName() {
    naming = false;
    if (file && name.trim() && name.trim() !== file.name) await renameFile(file, name);
    else if (file) name = file.name;
  }

  async function openElsewhere(path: string) {
    try {
      await attachmentOpen(path);
    } catch (error) {
      notifyError(t('library-file-open-failed'), error);
    }
  }

  async function reveal(path: string) {
    try {
      await attachmentReveal(path);
    } catch (error) {
      notifyError(t('library-pane-reveal-failed'), error);
    }
  }

  interface Action {
    /** What it is, for the tests. */
    id: string;
    label: string;
    icon: Component<{ size?: number | string }>;
    /** Done from the button pressed, which a menu opens from. */
    run: (anchor: HTMLElement) => void;
    disabled?: boolean;
  }

  /** What can be done with the file, in the order they are shown: what its kind allows, then the export. */
  function actions(f: FileView): Action[] {
    return [...kindActions(f), ...(f.exists ? [exporting(f)] : [])];
  }

  function exporting(f: FileView): Action {
    return {
      id: 'export',
      label: t('files-export'),
      icon: FolderOutput,
      run: () => void exportFiles({ kind: 'files', hashes: [f.hash] }, 1),
    };
  }

  /** What can be done with a file of its kind. */
  function kindActions(f: FileView): Action[] {
    // A PDF and an image are read here, and added to the project's tabs; every file can be
    // opened in another program.
    const shown: Action[] =
      f.kind === 'pdf' || f.kind === 'picture'
        ? [
            ...(onread
              ? [
                  {
                    id: 'read-file',
                    label: t('files-read'),
                    icon: BookOpen,
                    run: () => onread(f.hash),
                  },
                ]
              : []),
            // To a project chosen from a menu; nothing on screen changes (ADR 0074).
            {
              id: 'show',
              label: t('files-show'),
              icon: PanelRight,
              run: (anchor) => void addToTabsMenu(anchor, [f.hash]),
              disabled: !anyProject(),
            },
          ]
        : [];
    const opening: Action[] = [
      ...shown,
      {
        id: 'open',
        label: t('files-open-elsewhere'),
        icon: ExternalLink,
        run: () => void openElsewhere(f.path),
      },
      {
        id: 'reveal',
        label: t('files-reveal'),
        icon: FolderOpen,
        run: () => void reveal(f.path),
      },
    ];
    if (!f.exists) return [];
    switch (f.kind) {
      case 'pdf':
        return [
          ...opening,
          {
            id: 'searchable',
            label: t('files-searchable'),
            icon: ScanText,
            run: () => (open = 'searchable'),
          },
          { id: 'map', label: t('files-read-into'), icon: MapIcon, run: () => (open = 'map') },
        ];
      case 'picture':
        return [
          ...opening,
          { id: 'read', label: t('files-read-text'), icon: ScanText, run: () => (open = 'read') },
        ];
      case 'document':
        return [
          ...opening,
          {
            id: 'bring',
            label: t('files-bring-in'),
            icon: Network,
            run: () => void bringInFile(f),
          },
        ];
      default:
        return opening;
    }
  }

  const pages = $derived.by(() => {
    if (lookFailed) return t('files-pdf-unread', { reason: lookFailed });
    if (!looked || looked.picture) return '';
    const text =
      looked.withText === 0
        ? t('files-pdf-no-text')
        : looked.withText < looked.pages
          ? t('files-pdf-some-text', { count: looked.pages - looked.withText })
          : t('files-pdf-has-text');
    return t('files-pdf-pages', { count: looked.pages, text });
  });

  async function remove() {
    if (file && (await removeFile(file))) onremoved?.();
  }
</script>

{#if file}
  {@const Icon = KIND_ICONS[file.kind]}
  {@const label = fileLabel(file)}
  {@const first = file.references[0]}
  <div class="file-pane" data-file={file.hash}>
    <!-- Named as the tabs name it; its own name is among the facts, where it is changed. -->
    <div class="head">
      <span class="kind-icon"><Icon size={22} strokeWidth={1.4} /></span>
      <div class="heading" data-field="heading" title={file.name}>
        <span class="named">{label.name}</span>
        {#if first?.authors && first.title}<span class="sub">{first.title}</span>{/if}
      </div>
    </div>

    {#if file.exists && (file.kind === 'picture' || file.kind === 'pdf')}
      <button
        type="button"
        class="preview"
        title={t('files-read')}
        aria-label={t('files-read')}
        data-preview
        onclick={() => onread?.(file.hash)}
      >
        <Thumb hash={file.hash} extension={fileEnding(file.name)} small alt={file.alt} />
      </button>
    {:else}
      <div class="preview none" data-preview="none">
        <Icon size={28} strokeWidth={1.2} />
        <span>{t('files-preview-none')}</span>
      </div>
    {/if}

    <div class="where">
      <span class="label">{t('files-folder')}</span>
      <span class="path truncate" data-folder-path
        >{files.folderOf(file) ? pathOf(files.folders, file.folder!) : t('files-at-top')}</span
      >
      <Button
        variant="ghost"
        size="sm"
        onclick={(e) => onmove(e.currentTarget as HTMLElement, file)}
        data-move
      >
        {#snippet icon()}<FolderInput size={13} />{/snippet}
        {t('files-move')}
      </Button>
    </div>

    <section class="references" data-references>
      <div class="section-head">
        <h3 class="overline">{t('files-references')}</h3>
        <Button variant="ghost" size="sm" onclick={() => (open = 'assign')} data-assign>
          {#snippet icon()}<Link size={13} />{/snippet}
          {t('files-assign')}
        </Button>
      </div>
      {#each file.references as reference (reference.id)}
        <div class="reference" data-reference={reference.id}>
          <a href={formatRoute({ view: 'library', entry: reference.id })} class="link">
            <span class="who"
              >{reference.authors || '—'}{reference.year ? ` ${reference.year}` : ''}</span
            >
            <span class="title">{reference.title || t('library-untitled')}</span>
          </a>
          <IconButton
            label={t('files-unassign', { name: reference.title || reference.key })}
            size="sm"
            onclick={() => void unassign(file, reference.id)}
          >
            <X size={13} />
          </IconButton>
        </div>
      {:else}
        <p class="none">{t('files-unassigned')}</p>
      {/each}
    </section>

    {#if file.kind === 'picture'}
      <section class="image" data-image>
        <div class="field" data-field="alt">
          <TextField
            label={t('files-alt')}
            bind:value={alt}
            oninput={altChanged}
            onblur={() => void keepAlt()}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void keepAlt();
              }
            }}
          />
        </div>
        <div class="used" data-used>
          <h3 class="overline">{t('files-column-used')}</h3>
          {#each usedIn as project (project.id)}
            <a href={formatRoute({ view: 'project', project: project.id })} class="link"
              >{project.name}</a
            >
          {:else}
            <p class="none">{t('files-used-nowhere')}</p>
          {/each}
          {#if madeFrom}
            <p class="made" data-made-from>
              {t('files-made-from')}
              <a
                href={formatRoute({ view: 'files', file: madeFrom.hash })}
                class="link"
                title={madeFrom.name}>{fileLabel(madeFrom).name}</a
              >
            </p>
          {/if}
          {#if copies.length}
            <div class="copies" data-copies>
              <p class="made">{t('files-copies')}</p>
              {#each copies as copy (copy.hash)}
                <a
                  href={formatRoute({ view: 'files', file: copy.hash })}
                  class="link"
                  title={copy.name}>{fileLabel(copy).name}</a
                >
              {/each}
            </div>
          {/if}
        </div>
      </section>
    {/if}

    {#if actions(file).length}
      <section class="actions" data-actions>
        {#each actions(file) as action (action.id)}
          <Button
            variant="ghost"
            size="sm"
            disabled={action.disabled}
            onclick={(e) => action.run(e.currentTarget as HTMLElement)}
            data-action={action.id}
          >
            {#snippet icon()}<action.icon size={14} />{/snippet}
            {action.label}
          </Button>
        {/each}
      </section>
    {/if}

    <section>
      <h3 class="overline">{t('files-about')}</h3>
      <div class="naming">
        <div class="field" data-field="name">
          <TextField
            label={t('files-name')}
            bind:value={name}
            serif
            oninput={() => (naming = true)}
            onblur={() => void keepName()}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void keepName();
              } else if (e.key === 'Escape') {
                naming = false;
                name = file.name;
              }
            }}
          />
        </div>
      </div>
      <dl class="facts">
        <dt>{t('files-kind')}</dt>
        <dd>{kindWords(file.kind)}</dd>
        <dt>{t('files-size')}</dt>
        <dd>{file.exists ? fileSize(file.size) : t('files-missing')}</dd>
        {#if file.width && file.height}
          <dt>{t('files-pixels-label')}</dt>
          <dd data-pixels>{t('files-pixels', { width: file.width, height: file.height })}</dd>
        {/if}
        {#if pages}
          <dt>{t('files-pages')}</dt>
          <dd data-pages>{pages}</dd>
        {/if}
        <dt>{t('files-added')}</dt>
        <dd>{dateWords(file.added)}</dd>
        {#if file.origin}
          <dt>{t('files-origin')}</dt>
          <dd class="origin selectable">{file.origin}</dd>
        {/if}
      </dl>
    </section>

    <div class="last">
      <Button variant="danger" onclick={remove} data-remove>
        {#snippet icon()}<Trash2 size={14} />{/snippet}
        {t('files-remove')}
      </Button>
    </div>
  </div>

  {#if open === 'assign'}
    <ReferenceChooser
      title={t('files-assign-title', { name: file.name })}
      onpick={(id) => void assign(file, id)}
      onclose={() => (open = null)}
    />
  {:else if open === 'searchable'}
    <SearchableDialog
      file={storedOf(file)}
      ondone={async (made) => {
        await Promise.all([files.reload(), file.references.length ? library.reload() : null]);
        if (made.hash !== own) onreplaced?.(made.hash);
      }}
      onclose={() => (open = null)}
    />
  {:else if open === 'map'}
    <PdfMapDialog file={storedOf(file)} onclose={() => (open = null)} />
  {:else if open === 'read'}
    <PictureTextDialog file={storedOf(file)} onclose={() => (open = null)} />
  {/if}
{/if}

<style>
  .file-pane {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: 18px 20px 24px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .kind-icon {
    display: inline-flex;
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .heading {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .heading .named {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    line-height: 1.25;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .heading .sub {
    font-family: var(--font-text);
    font-size: var(--text-md);
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  /* The file's own name, first of the facts, and what names it by its reference. */
  .naming {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin: 6px 0 10px;
  }
  .naming .field {
    flex: 1;
    min-width: 0;
  }
  /* The file itself, small: no larger than the pane is wide, nor higher than it need be. */
  .preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 220px;
    padding: 0;
    border: none;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    overflow: hidden;
    /* A press reads the file: the hand of a button, not a magnifying glass. */
    cursor: pointer;
  }
  .preview:hover {
    box-shadow: 0 0 0 1px var(--line-strong);
  }
  .preview.none {
    flex-direction: column;
    gap: 8px;
    height: 120px;
    color: var(--ink-4);
    font-size: var(--text-sm);
    cursor: default;
  }
  .preview.none:hover {
    box-shadow: none;
  }
  .image {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .used {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .used .link {
    padding: 3px 8px;
    border-radius: var(--radius-s);
    color: var(--accent-strong);
    font-family: var(--font-text);
    text-decoration: none;
  }
  .used .link:hover {
    background: var(--paper-hover);
  }
  .made {
    margin: 4px 0 0;
    padding: 0 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .made .link {
    padding: 0;
  }
  .copies {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .where {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: calc(-1 * var(--space-2));
    font-size: var(--text-sm);
  }
  .where .label {
    color: var(--ink-3);
  }
  .where .path {
    flex: 1;
    min-width: 0;
    color: var(--ink);
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .reference {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
  }
  .reference .link {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    color: var(--ink);
    text-decoration: none;
  }
  .reference .link:hover {
    background: var(--paper-hover);
  }
  .who {
    font-weight: 550;
    color: var(--accent-strong);
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-text);
    color: var(--ink-2);
  }
  .none {
    margin: 0;
    padding: 4px 8px;
    color: var(--ink-4);
    font-size: var(--text-sm);
    font-style: italic;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 14px;
    margin: 6px 0 0;
    font-size: var(--text-sm);
  }
  .facts dt {
    color: var(--ink-3);
  }
  .facts dd {
    margin: 0;
    min-width: 0;
    color: var(--ink);
  }
  .origin {
    overflow-wrap: anywhere;
    color: var(--ink-2);
  }
  .last {
    display: flex;
    justify-content: flex-start;
    padding-top: var(--space-2);
  }
</style>
