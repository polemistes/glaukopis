<script lang="ts">
  import { onMount } from 'svelte';
  import Copy from '@lucide/svelte/icons/copy';
  import History from '@lucide/svelte/icons/history';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import List from '@lucide/svelte/icons/list';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Users from '@lucide/svelte/icons/users';
  import Waypoints from '@lucide/svelte/icons/waypoints';
  import JoinDialog from '$lib/sharing/JoinDialog.svelte';
  import FileInput from '@lucide/svelte/icons/file-input';
  import { isDocumentPath, isPlainTextPath } from '$lib/api/imported';
  import { isReadPath } from '$lib/api/ocr';
  import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
  import { goThroughWhenOpen } from '$lib/found/found.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import {
    projectTrash,
    type Folder,
    type ProjectInfo,
    type ProjectsShown,
    type Trashed,
  } from '$lib/api/projects';
  import HistoryDialog from './HistoryDialog.svelte';
  import ProjectList from './ProjectList.svelte';
  import ProjectsMapDialog from './ProjectsMapDialog.svelte';
  import TrashDialog from './TrashDialog.svelte';
  import { sharingRename } from '$lib/api/sharing';
  import { t } from '$lib/i18n';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import { ago } from '$lib/util/time';

  /** The dialog that asks for a name: for a new project, a renamed one, a copy; a new folder, a renamed one. */
  let naming = $state<{
    purpose: 'new' | 'rename' | 'copy' | 'folder' | 'folder-rename';
    project?: ProjectInfo;
    folder?: Folder;
    /** The folder a new folder is made in. */
    parent?: string | null;
    value: string;
    error: string | null;
  } | null>(null);
  let busy = $state(false);
  let joining = $state(false);
  /** The dialog that makes a map of the projects. */
  let mapping = $state(false);

  /** How many of the last used projects the cards show; the rest are in the list. */
  const RECENT = 12;
  const recent = $derived(projects.list.slice(0, RECENT));

  const forms: { value: ProjectsShown; label: string; icon: typeof LayoutGrid }[] = $derived([
    { value: 'recent', label: t('home-recent'), icon: LayoutGrid },
    { value: 'list', label: t('home-all'), icon: List },
  ]);

  function pageMenu(anchor: HTMLElement) {
    openMenu(
      anchor,
      [{ label: t('home-map-menu'), icon: Waypoints, action: () => (mapping = true) }],
      {
        align: 'end',
      },
    );
  }
  let earlier = $state<ProjectInfo | null>(null);
  let trash = $state.raw<Trashed[]>([]);
  let showTrash = $state(false);

  async function readTrash() {
    try {
      trash = await projectTrash();
    } catch (error) {
      console.error(error);
    }
  }

  onMount(() => {
    projects.load();
    readTrash();
  });

  /** Opens a project; with a mode, in that view rather than where it was left. */
  function open(p: ProjectInfo, mode?: MapMode) {
    router.go({ view: 'project', project: p.id, mode });
  }

  // A PDF or a picture has its text read.
  const written = (path: string) =>
    isDocumentPath(path) || isPlainTextPath(path) || isReadPath(path);

  /**
   * A project is made of a document, named after it, with the document as
   * its map: of the file that is chosen, or of one that was dropped here.
   */
  async function fromDocument(dropped?: string) {
    const path = dropped ?? (await chooseDocument());
    const brought = path ? await bringIn(path, null) : null;
    // The citations that were found in it are gone through when the project is open.
    if (brought?.project && brought.goThrough) goThroughWhenOpen(brought.project.id, brought.map);
    if (brought?.project)
      router.go({ view: 'project', project: brought.project.id, map: brought.map, mode: 'text' });
  }

  async function commit() {
    if (!naming || busy) return;
    const name = naming.value.trim();
    if (!name) {
      naming.error =
        naming.purpose === 'folder' || naming.purpose === 'folder-rename'
          ? t('home-folder-name-missing')
          : t('home-name-missing');
      return;
    }
    busy = true;
    try {
      if (naming.purpose === 'new') {
        const made = await projects.create(name);
        naming = null;
        // The first time, on its text: a new project begins with writing.
        open(made, 'text');
      } else if (naming.purpose === 'folder') {
        await projects.createFolder(name, naming.parent ?? null);
        naming = null;
      } else if (naming.purpose === 'folder-rename' && naming.folder) {
        await projects.renameFolder(naming.folder.id, name);
        naming = null;
      } else if (naming.purpose === 'rename' && naming.project) {
        await projects.rename(naming.project.id, name);
        // Those who share it are told the name by the server; the server itself takes no harm from failing.
        if (naming.project.sharing?.owner) sharingRename(naming.project.id, name).catch(() => {});
        naming = null;
      } else if (naming.purpose === 'copy' && naming.project) {
        await projects.duplicate(naming.project.id, name);
        naming = null;
      }
    } catch (error) {
      if (naming) naming.error = describeError(error) ?? t('home-failed');
    } finally {
      busy = false;
    }
  }

  async function remove(p: ProjectInfo) {
    const ok = await confirm({
      title: t('home-delete-title', { name: p.name }),
      message: p.sharing
        ? p.sharing.owner
          ? t('home-delete-owner')
          : t('home-delete-member')
        : t('home-delete-message'),
      confirm: t('home-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await projects.remove(p.id);
      notifyOk(t('home-deleted', { name: p.name }));
      readTrash();
    } catch (error) {
      notifyError(t('home-delete-failed'), error);
    }
  }

  function items(p: ProjectInfo): MenuItem[] {
    return [
      { label: t('common-open'), action: () => open(p) },
      { kind: 'separator' },
      {
        label: t('home-menu-rename'),
        icon: Pencil,
        action: () => (naming = { purpose: 'rename', project: p, value: p.name, error: null }),
      },
      {
        label: t('home-menu-duplicate'),
        icon: Copy,
        action: () =>
          (naming = {
            purpose: 'copy',
            project: p,
            value: t('home-copy-name', { name: p.name }),
            error: null,
          }),
      },
      { label: t('home-menu-history'), icon: History, action: () => (earlier = p) },
      { kind: 'separator' },
      { label: t('common-delete'), icon: Trash2, danger: true, action: () => remove(p) },
    ];
  }

  function facts(p: ProjectInfo): string {
    const parts: string[] = [];
    if (p.maps.length > 1) parts.push(t('home-maps', { count: p.maps.length }));
    const elements = p.maps.reduce((n, m) => n + m.elements, 0);
    if (elements > 1) parts.push(t('home-elements', { count: elements }));
    if (p.words) parts.push(t('home-words', { count: p.words }));
    if (p.references) parts.push(t('home-references', { count: p.references }));
    return parts.join(' · ');
  }
</script>

<div
  class="home"
  use:dropTarget={{
    accepts: (p) => p.kind === 'files' && (p.data as string[]).some(written),
    ondrop: (e) => fromDocument((e.payload.data as string[]).find(written)),
  }}
>
  <div class="inner">
    <div class="welcome" class:alone={projects.loaded && !projects.list.length}>
      <Mark size={120} />
      <h2>{t('home-welcome')}</h2>
      <p>
        {t('home-welcome-text')}
      </p>
      <div class="actions">
        <Button
          variant="secondary"
          onclick={() => (naming = { purpose: 'new', value: '', error: null })}
        >
          {#snippet icon()}<Plus size={15} />{/snippet}
          {t('home-begin')}
        </Button>
        <Button variant="secondary" onclick={() => (joining = true)}>
          {#snippet icon()}<Users size={15} />{/snippet}
          {t('home-join')}
        </Button>
        <Button variant="secondary" onclick={() => fromDocument()}>
          {#snippet icon()}<FileInput size={15} />{/snippet}
          {t('home-from-document')}
        </Button>
      </div>
    </div>

    {#if !projects.loaded}
      <div class="centre"><Spinner size={22} /></div>
    {:else if projects.list.length}
      <header>
        <div class="title">
          <h1>{t('home-title')}</h1>
        </div>
        <div class="forms">
          <Segmented
            value={projects.shown}
            options={forms}
            label={t('home-shown')}
            size="sm"
            onchange={(kind) => projects.show(kind)}
          />
          <IconButton
            label={t('home-page-menu')}
            size="sm"
            onclick={(e) => pageMenu(e.currentTarget)}
          >
            <Ellipsis size={16} />
          </IconButton>
        </div>
      </header>
      {#if projects.shown === 'list'}
        <ProjectList
          {open}
          {items}
          onnewfolder={(parent) => (naming = { purpose: 'folder', parent, value: '', error: null })}
          onrenamefolder={(folder) =>
            (naming = { purpose: 'folder-rename', folder, value: folder.name, error: null })}
        />
      {:else}
        <div class="grid">
          {#each recent as p (p.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="card"
              role="button"
              tabindex="0"
              onclick={() => open(p)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open(p);
                }
              }}
              oncontextmenu={(e) => openContextMenu(e, items(p))}
            >
              <h3 class="serif">{p.name}</h3>
              {#if p.description}<p class="description">{p.description}</p>{/if}
              {#if p.maps.length > 1}
                <ul class="maps">
                  {#each p.maps.slice(0, 4) as m (m.id)}
                    <li class="truncate">{m.name}</li>
                  {/each}
                  {#if p.maps.length > 4}<li class="more">
                      {t('home-more-maps', { count: p.maps.length - 4 })}
                    </li>{/if}
                </ul>
              {/if}
              <div class="spring"></div>
              <div class="foot">
                <div class="meta">
                  <div class="facts truncate">{facts(p) || t('home-not-begun')}</div>
                  <div class="when">
                    {#if p.sharing}<span class="shared"
                        ><Users size={11} /> {t('home-shared')} ·</span
                      >{/if}
                    {t('home-changed', { ago: ago(p.modified) })}
                  </div>
                </div>
                <button
                  type="button"
                  class="menu"
                  aria-label={t('home-more-for', { name: p.name })}
                  onclick={(e) => {
                    e.stopPropagation();
                    openMenu(e.currentTarget, items(p), { align: 'end' });
                  }}
                >
                  <Ellipsis size={16} />
                </button>
              </div>
            </div>
          {/each}
        </div>
        {#if projects.list.length > RECENT}
          <div class="under">
            <button type="button" class="quiet" onclick={() => projects.show('list')}>
              <List size={13} />
              {t('home-show-all', { count: projects.list.length })}
            </button>
          </div>
        {/if}
      {/if}
    {/if}
    {#if projects.loaded && trash.length}
      <div class="under">
        <button type="button" class="quiet" onclick={() => (showTrash = true)}>
          <Trash2 size={13} />
          {t('home-deleted-projects', { count: trash.length })}
        </button>
      </div>
    {/if}
  </div>
</div>

{#if earlier}
  <HistoryDialog
    project={earlier}
    onclose={() => (earlier = null)}
    onopened={(copy) => {
      earlier = null;
      open(copy);
    }}
  />
{/if}

{#if showTrash}
  <TrashDialog
    {trash}
    onchange={async () => {
      await readTrash();
      if (!trash.length) showTrash = false;
    }}
    onclose={() => (showTrash = false)}
  />
{/if}

<DocumentHost />

{#if mapping}
  <ProjectsMapDialog
    onclose={() => (mapping = false)}
    onmade={({ project, map }) => {
      mapping = false;
      router.go({ view: 'project', project, map, mode: 'text' });
    }}
  />
{/if}

{#if joining}
  <JoinDialog
    onclose={() => (joining = false)}
    onjoined={(p) => {
      joining = false;
      open(p);
    }}
  />
{/if}

{#if naming}
  <Dialog
    open
    title={naming.purpose === 'new'
      ? t('home-new')
      : naming.purpose === 'rename'
        ? t('home-rename-title')
        : naming.purpose === 'copy'
          ? t('home-duplicate-title')
          : naming.purpose === 'folder'
            ? t('home-new-folder')
            : t('home-folder-rename-title')}
    width={440}
    onclose={() => (naming = null)}
  >
    <form
      onsubmit={(e) => {
        e.preventDefault();
        commit();
      }}
    >
      <TextField
        bind:value={naming.value}
        label={t('home-name')}
        size="lg"
        serif={naming.purpose !== 'folder' && naming.purpose !== 'folder-rename'}
        placeholder={naming.purpose === 'folder' || naming.purpose === 'folder-rename'
          ? t('home-folder-name-placeholder')
          : t('home-name-placeholder')}
        error={naming.error}
        data-autofocus
        oninput={() => naming && (naming.error = null)}
      />
    </form>
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (naming = null)}>{t('common-cancel')}</Button>
      <Button variant="primary" disabled={busy || !naming?.value.trim()} onclick={commit}>
        {naming?.purpose === 'new' || naming?.purpose === 'folder'
          ? t('home-create')
          : naming?.purpose === 'rename' || naming?.purpose === 'folder-rename'
            ? t('common-rename')
            : t('home-duplicate')}
      </Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .home {
    height: 100%;
    overflow-y: auto;
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 44px 40px 60px;
  }
  header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .forms {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 4px;
  }
  .under {
    display: flex;
    justify-content: center;
    margin-top: 36px;
  }
  .quiet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--ink-3);
    font-size: var(--text-md);
    cursor: pointer;
  }
  .quiet:hover {
    color: var(--accent-strong);
    text-decoration: underline;
  }
  .shared {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--accent-strong);
  }
  h1 {
    font-family: var(--font-text);
    font-size: var(--text-3xl);
    font-weight: 500;
    letter-spacing: -0.015em;
  }
  .centre {
    display: flex;
    justify-content: center;
    padding: 80px 0;
  }
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 36px 0 40px;
    text-align: center;
  }
  .welcome.alone {
    padding-top: 70px;
  }
  .welcome .actions {
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 6px;
  }
  .welcome h2 {
    margin-top: 10px;
    font-family: var(--font-text);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .welcome p {
    max-width: 46ch;
    margin-bottom: 10px;
    color: var(--ink-2);
    font-family: var(--font-text);
    font-size: 16px;
    line-height: 1.6;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 18px;
  }
  .card {
    display: flex;
    flex-direction: column;
    min-height: 168px;
    padding: 20px 14px 12px 22px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    transition:
      box-shadow var(--slow) var(--ease),
      transform var(--slow) var(--ease),
      border-color var(--slow) var(--ease);
  }
  .card:hover {
    box-shadow: var(--shadow-2);
    border-color: var(--line-strong);
    transform: translateY(-1px);
  }
  .card h3 {
    font-size: 19px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.005em;
    padding-right: 8px;
  }
  .description {
    margin-top: 6px;
    color: var(--ink-2);
    line-height: 1.5;
    padding-right: 8px;
  }
  .maps {
    margin: 10px 0 0;
    padding: 0 8px 0 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.6;
  }
  .maps li::before {
    content: '·';
    margin-right: 7px;
    color: var(--ink-4);
  }
  .maps .more {
    color: var(--ink-4);
  }
  .spring {
    flex: 1;
    min-height: 14px;
  }
  .foot {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .meta {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
  }
  .facts {
    color: var(--ink-2);
  }
  .when {
    color: var(--ink-4);
  }
  .menu {
    display: inline-flex;
    padding: 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .card:hover .menu,
  .card:focus-within .menu {
    opacity: 1;
  }
  .menu:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
</style>
