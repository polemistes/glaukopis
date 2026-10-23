<script lang="ts">
  /**
   * Who else is in a project while it is shared: a ring of their initials;
   * or, `compact`, a small sign with how many they are, which names them on
   * hover, as the head of the document pane shows it.
   */
  import Users from '@lucide/svelte/icons/users';
  import { t } from '$lib/i18n';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Other } from '$lib/project/model/project.svelte';
  import { initials } from './connection.svelte';

  let { people, compact = false }: { people: Other[]; compact?: boolean } = $props();

  /** One for each person, though they may have the project open in two windows. */
  const persons = $derived.by(() => {
    const seen = new Set<string>();
    return people.filter((p) => {
      const key = p.member ?? `owner:${p.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
  const shown = $derived(persons.slice(0, 4));
  const more = $derived(persons.slice(4));
</script>

{#if persons.length && compact}
  {@const names = t('sharing-present', { names: persons.map((p) => p.name).join(', ') })}
  <span class="sign" data-presence={persons.length} aria-label={names} use:tooltip={names}>
    <Users size={13} />
    <span>{persons.length}</span>
  </span>
{:else if persons.length}
  <div
    class="presence"
    aria-label={t('sharing-present', { names: persons.map((p) => p.name).join(', ') })}
  >
    {#each shown as p (p.client)}
      <span
        class="avatar"
        style:background={p.color}
        use:tooltip={t('sharing-is-here', { name: p.name })}>{initials(p.name)}</span
      >
    {/each}
    {#if more.length}
      <span class="avatar more" use:tooltip={more.map((p) => p.name).join(', ')}
        >+{more.length}</span
      >
    {/if}
  </div>
{/if}

<style>
  .presence {
    display: flex;
    align-items: center;
    flex: none;
    padding: 0 4px 0 6px;
  }
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-left: -5px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    color: #fff;
    font-size: 9.5px;
    font-weight: 650;
    letter-spacing: 0.02em;
    cursor: default;
  }
  .sign {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: none;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
    cursor: default;
  }
  .avatar.more {
    background: var(--paper-sunken);
    color: var(--ink-2);
  }
</style>
