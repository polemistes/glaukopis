<script lang="ts">
  import { onMount } from 'svelte';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { open as chooseFolder } from '@tauri-apps/plugin-dialog';
  import {
    importZotero,
    zoteroCollections,
    zoteroFind,
    zoteroInspect,
    type ZoteroCollection,
    type ZoteroInfo,
  } from '$lib/api/sources';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { plural } from './format';
  import { importPlan, type ZoteroRequest } from './references.svelte';

  let { request, onclose }: { request: ZoteroRequest; onclose: () => void } = $props();

  let found = $state.raw<ZoteroInfo[] | null>(null);
  let info = $state.raw<ZoteroInfo | null>(null);
  let collections = $state.raw<ZoteroCollection[]>([]);
  let library = $state('');
  let collection = $state('');
  let attachments = $state(true);
  let notes = $state(true);
  let error = $state<string | null>(null);
  let reading = $state(false);

  const chosen = $derived(info?.libraries.find((l) => String(l.id) === library) ?? null);
  const count = $derived(
    collection
      ? (collections.find((c) => c.key === collection)?.items ?? 0)
      : (chosen?.items ?? info?.items ?? 0),
  );

  onMount(async () => {
    try {
      found = await zoteroFind();
      if (found.length) await take(found[0]);
    } catch (e) {
      found = [];
      error = describeError(e) ?? null;
    }
  });

  async function take(next: ZoteroInfo) {
    info = next;
    error = null;
    const own = next.libraries.find((l) => l.kind === 'user') ?? next.libraries[0];
    library = own ? String(own.id) : '';
    collection = '';
    await readCollections();
  }

  async function readCollections() {
    if (!info) return;
    try {
      collections = await zoteroCollections(info.path, library ? Number(library) : null);
    } catch {
      collections = [];
    }
  }

  async function elsewhere() {
    const dir = await chooseFolder({ title: 'The data directory of Zotero', directory: true });
    if (typeof dir !== 'string') return;
    try {
      await take(await zoteroInspect(dir));
    } catch (e) {
      error = describeError(e) ?? 'There is no Zotero there.';
    }
  }

  async function read() {
    if (!info || reading) return;
    reading = true;
    error = null;
    try {
      const plan = await importZotero(info.path, {
        library: library ? Number(library) : null,
        attachments,
        notes,
        collection: collection || null,
      });
      const { resolve, collection: into } = request;
      onclose();
      resolve(await importPlan(plan, into));
    } catch (e) {
      error = describeError(e) ?? 'Zotero could not be read.';
    } finally {
      reading = false;
    }
  }

  function close() {
    request.resolve(null);
    onclose();
  }
</script>

<Dialog open title="Import from Zotero" width={520} dismissable={!reading} onclose={close}>
  <div class="content">
    {#if found === null}
      <div class="waiting"><Spinner size={18} /></div>
    {:else if !info}
      <p class="lead">
        No Zotero was found on this computer in the places where it usually keeps its data. If it
        keeps it elsewhere, show where: the folder that holds <code>zotero.sqlite</code>.
      </p>
    {:else}
      <p class="lead">
        What is imported is copied into your library, with its files. Zotero is only read, and
        nothing of it is changed; it may be running meanwhile.
      </p>
      <div class="where">
        <div class="path selectable">{info.path}</div>
        <div class="facts">
          {plural(info.items, 'reference')} · {plural(info.attachments, 'file')} ·
          {plural(info.collections, 'collection')}
        </div>
      </div>
      {#each info.warnings as warning}
        <p class="warning"><TriangleAlert size={13} /> {warning}</p>
      {/each}

      {#if info.libraries.length > 1}
        <Select
          bind:value={library}
          label="Library"
          options={info.libraries.map((l) => ({
            value: String(l.id),
            label: `${l.kind === 'user' ? 'My library' : l.name} (${l.items})`,
          }))}
          onchange={() => {
            collection = '';
            readCollections();
          }}
        />
      {/if}
      {#if collections.length}
        <Select
          bind:value={collection}
          label="What to import"
          options={[
            { value: '', label: 'Everything' },
            ...collections.map((c) => ({
              value: c.key,
              label: `${' '.repeat(Math.max(0, c.path.length - 1))}${c.name}`,
            })),
          ]}
        />
      {/if}
      <div class="options">
        <label
          ><input type="checkbox" bind:checked={attachments} /> With the files that are attached</label
        >
        <label><input type="checkbox" bind:checked={notes} /> With the notes, as annotations</label>
      </div>
    {/if}
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}
  </div>

  {#snippet footer()}
    <div class="left">
      <Button variant="ghost" size="sm" disabled={reading} onclick={elsewhere}>
        {#snippet icon()}<FolderOpen size={14} />{/snippet}
        {info ? 'Another place…' : 'Show where…'}
      </Button>
    </div>
    <Button variant="ghost" disabled={reading} onclick={close}>Cancel</Button>
    <Button variant="primary" disabled={!info || reading || !count} onclick={read}>
      {#if reading}
        Reading…
      {:else}
        Read {count ? plural(count, 'reference') : ''}
      {/if}
    </Button>
  {/snippet}
</Dialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 120px;
  }
  .waiting {
    display: flex;
    justify-content: center;
    padding: 30px 0;
  }
  .lead {
    color: var(--ink-2);
    line-height: 1.55;
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.93em;
  }
  .where {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .path {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .facts {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .warning {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .warning :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .options label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .options input {
    accent-color: var(--accent);
  }
  .error {
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  .left {
    margin-right: auto;
  }
</style>
