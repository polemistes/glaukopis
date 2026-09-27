<script lang="ts">
  import { projectPurge, projectRestore, type Trashed } from '$lib/api/projects';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';

  interface Props {
    trash: Trashed[];
    onchange: () => void;
    onclose: () => void;
  }

  let { trash, onchange, onclose }: Props = $props();

  /** The name of an entry begins with the time it was deleted: 20260927T101500Z_<id>. */
  function deleted(entry: string): string {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(entry);
    return m ? ago(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`) : '';
  }

  async function restore(t: Trashed) {
    try {
      projects.put(await projectRestore(t.entry));
      notifyOk(`“${t.info.name}” is back among the projects`);
      onchange();
    } catch (error) {
      notifyError('The project could not be brought back', error);
    }
  }

  async function purge(t: Trashed) {
    const ok = await confirm({
      title: `Remove “${t.info.name}” for good?`,
      message:
        'What the project holds cannot be brought back after this. Your references are not touched.',
      confirm: 'Remove for good',
      danger: true,
    });
    if (!ok) return;
    try {
      await projectPurge(t.entry);
      onchange();
    } catch (error) {
      notifyError('The project could not be removed', error);
    }
  }
</script>

<Dialog open title="Deleted projects" width={520} {onclose}>
  {#if !trash.length}
    <p class="none">There are none.</p>
  {:else}
    <ul>
      {#each trash as t (t.entry)}
        <li>
          <div class="what">
            <div class="name serif truncate">{t.info.name}</div>
            <div class="when">Deleted {deleted(t.entry)}</div>
          </div>
          <Button size="sm" variant="ghost" onclick={() => purge(t)}>Remove for good</Button>
          <Button size="sm" onclick={() => restore(t)}>Bring back</Button>
        </li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Close</Button>
  {/snippet}
</Dialog>

<style>
  .none {
    color: var(--ink-2);
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
    gap: 8px;
    padding: 9px 2px;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .what {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .when {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
