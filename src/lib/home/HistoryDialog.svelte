<script lang="ts">
  import { onMount } from 'svelte';
  import {
    projectCopyFromHistory,
    projectHistory,
    type HistoryEntry,
    type ProjectInfo,
  } from '$lib/api/projects';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';

  interface Props {
    project: ProjectInfo;
    onclose: () => void;
    onopened: (copy: ProjectInfo) => void;
  }

  let { project, onclose, onopened }: Props = $props();

  let entries = $state.raw<HistoryEntry[] | null>(null);
  let busy = $state(false);

  onMount(async () => {
    try {
      entries = await projectHistory(project.id);
    } catch (error) {
      entries = [];
      notifyError('The earlier versions could not be read', error);
    }
  });

  function when(entry: HistoryEntry): string {
    return new Date(entry.time).toLocaleString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function open(entry: HistoryEntry) {
    if (busy) return;
    busy = true;
    try {
      const day = new Date(entry.time).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
      });
      const copy = await projectCopyFromHistory(
        project.id,
        entry.id,
        `${project.name}, as of ${day}`,
      );
      projects.put(copy);
      onopened(copy);
    } catch (error) {
      notifyError('That version could not be opened', error);
    } finally {
      busy = false;
    }
  }
</script>

<Dialog
  open
  title="Earlier versions"
  subtitle="Of “{project.name}”. A version is opened as a project of its own; this one stays as it is."
  width={520}
  {onclose}
>
  {#if entries === null}
    <div class="waiting"><Spinner size={18} /></div>
  {:else if !entries.length}
    <p class="none">
      None has been kept yet. A version is kept every now and then while you work: closely for what
      is recent, more sparsely for what is old.
    </p>
  {:else}
    <ul>
      {#each entries as entry (entry.id)}
        <li>
          <div class="when">
            <div class="date">{when(entry)}</div>
            <div class="ago">{ago(entry.time)}</div>
          </div>
          <Button size="sm" disabled={busy} onclick={() => open(entry)}>Open a copy</Button>
        </li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Close</Button>
  {/snippet}
</Dialog>

<style>
  .waiting {
    display: flex;
    justify-content: center;
    padding: 30px 0;
  }
  .none {
    color: var(--ink-2);
    line-height: 1.55;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 52vh;
    overflow-y: auto;
  }
  li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 9px 2px;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .when {
    flex: 1;
    min-width: 0;
  }
  .date {
    font-weight: 500;
  }
  .ago {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
