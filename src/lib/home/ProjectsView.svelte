<script lang="ts">
  import { onMount } from 'svelte';
  import Copy from '@lucide/svelte/icons/copy';
  import History from '@lucide/svelte/icons/history';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Users from '@lucide/svelte/icons/users';
  import JoinDialog from '$lib/sharing/JoinDialog.svelte';
  import { projectTrash, type ProjectInfo, type Trashed } from '$lib/api/projects';
  import HistoryDialog from './HistoryDialog.svelte';
  import TrashDialog from './TrashDialog.svelte';
  import { plural } from '$lib/library/format';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import { ago } from '$lib/util/time';

  /** The dialog that asks for a name: for a new project, a renamed one, a copy. */
  let naming = $state<{
    purpose: 'new' | 'rename' | 'copy';
    project?: ProjectInfo;
    value: string;
    error: string | null;
  } | null>(null);
  let busy = $state(false);
  let joining = $state(false);
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

  function open(p: ProjectInfo) {
    router.go({ view: 'project', project: p.id });
  }

  async function commit() {
    if (!naming || busy) return;
    const name = naming.value.trim();
    if (!name) {
      naming.error = 'Give the project a name.';
      return;
    }
    busy = true;
    try {
      if (naming.purpose === 'new') {
        const made = await projects.create(name);
        naming = null;
        open(made);
      } else if (naming.purpose === 'rename' && naming.project) {
        await projects.rename(naming.project.id, name);
        naming = null;
      } else if (naming.purpose === 'copy' && naming.project) {
        await projects.duplicate(naming.project.id, name);
        naming = null;
      }
    } catch (error) {
      if (naming) naming.error = describeError(error) ?? 'That did not work.';
    } finally {
      busy = false;
    }
  }

  async function remove(p: ProjectInfo) {
    const ok = await confirm({
      title: `Delete “${p.name}”?`,
      message: p.sharing
        ? p.sharing.owner
          ? 'The project is moved to the trash of Glaukopis, from which it can be brought back. It stays on the server and with those you share it with; to take it off the server, open it and stop sharing it first.'
          : 'The project is moved to the trash of Glaukopis, from which it can be brought back. The others keep theirs.'
        : 'The project is moved to the trash of Glaukopis, from which it can be brought back. Your references are not touched.',
      confirm: 'Delete project',
      danger: true,
    });
    if (!ok) return;
    try {
      await projects.remove(p.id);
      notifyOk(`“${p.name}” was moved to the trash`);
      readTrash();
    } catch (error) {
      notifyError('The project could not be deleted', error);
    }
  }

  function items(p: ProjectInfo): MenuItem[] {
    return [
      { label: 'Open', action: () => open(p) },
      { kind: 'separator' },
      {
        label: 'Rename…',
        icon: Pencil,
        action: () => (naming = { purpose: 'rename', project: p, value: p.name, error: null }),
      },
      {
        label: 'Duplicate…',
        icon: Copy,
        action: () =>
          (naming = { purpose: 'copy', project: p, value: `${p.name}, copy`, error: null }),
      },
      { label: 'Earlier versions…', icon: History, action: () => (earlier = p) },
      { kind: 'separator' },
      { label: 'Delete', icon: Trash2, danger: true, action: () => remove(p) },
    ];
  }

  function facts(p: ProjectInfo): string {
    const parts: string[] = [];
    if (p.maps.length > 1) parts.push(plural(p.maps.length, 'map'));
    const elements = p.maps.reduce((n, m) => n + m.elements, 0);
    if (elements > 1) parts.push(plural(elements, 'element'));
    if (p.words) parts.push(plural(p.words, 'word'));
    if (p.references) parts.push(plural(p.references, 'reference'));
    return parts.join(' · ');
  }
</script>

<div class="home">
  <div class="inner">
    <header>
      <div class="title">
        <h1>Projects</h1>
      </div>
      {#if projects.list.length}
        <div class="actions">
          <Button variant="ghost" onclick={() => (joining = true)}>
            {#snippet icon()}<Users size={15} />{/snippet}
            Join a shared project
          </Button>
          <Button
            variant="primary"
            onclick={() => (naming = { purpose: 'new', value: '', error: null })}
          >
            {#snippet icon()}<Plus size={15} />{/snippet}
            New project
          </Button>
        </div>
      {/if}
    </header>

    {#if !projects.loaded}
      <div class="centre"><Spinner size={22} /></div>
    {:else if !projects.list.length}
      <div class="welcome">
        <Mark size={64} />
        <h2>Welcome to Glaukopis</h2>
        <p>
          A project holds the work on one book or article: the maps of your ideas, the texts you
          write into them, and the references they rest on.
        </p>
        <Button
          variant="primary"
          size="lg"
          onclick={() => (naming = { purpose: 'new', value: '', error: null })}
        >
          Begin a project
        </Button>
        <button type="button" class="quiet" onclick={() => (joining = true)}>
          or join a project that is shared with you
        </button>
      </div>
    {:else}
      <div class="grid">
        {#each projects.list as p (p.id)}
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
                {#if p.maps.length > 4}<li class="more">and {p.maps.length - 4} more</li>{/if}
              </ul>
            {/if}
            <div class="spring"></div>
            <div class="foot">
              <div class="meta">
                <div class="facts truncate">{facts(p) || 'Not begun'}</div>
                <div class="when">
                  {#if p.sharing}<span class="shared"><Users size={11} /> Shared ·</span>{/if}
                  Changed {ago(p.modified)}
                </div>
              </div>
              <button
                type="button"
                class="menu"
                aria-label="More for {p.name}"
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
    {/if}
    {#if projects.loaded && trash.length}
      <div class="under">
        <button type="button" class="quiet" onclick={() => (showTrash = true)}>
          <Trash2 size={13} />
          {plural(trash.length, 'deleted project')}
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
      ? 'New project'
      : naming.purpose === 'rename'
        ? 'Rename project'
        : 'Duplicate project'}
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
        label="Name"
        size="lg"
        serif
        placeholder="The working title of the book or article"
        error={naming.error}
        data-autofocus
        oninput={() => naming && (naming.error = null)}
      />
    </form>
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (naming = null)}>Cancel</Button>
      <Button variant="primary" disabled={busy || !naming?.value.trim()} onclick={commit}>
        {naming?.purpose === 'new'
          ? 'Create'
          : naming?.purpose === 'rename'
            ? 'Rename'
            : 'Duplicate'}
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
    padding: 70px 0;
    text-align: center;
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
