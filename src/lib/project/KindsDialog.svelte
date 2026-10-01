<script lang="ts">
  /**
   * The kinds of elements of a project, looked through: each with its
   * colour and how many elements are of it. One is pressed to be changed;
   * a new one is made from here.
   */
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { kindColour } from './kinds';
  import { editKind, newKind } from './kinds.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    onclose: () => void;
  }

  let { project, onclose }: Props = $props();

  const counts = $derived.by(() => {
    const out = new Map<string, number>();
    for (const n of project.nodes.values()) if (n.kind) out.set(n.kind, (out.get(n.kind) ?? 0) + 1);
    return out;
  });
</script>

<Dialog open title={t('kinds-title')} subtitle={t('kinds-subtitle')} width={440} {onclose}>
  {#if project.kinds.length}
    <ul class="kinds">
      {#each project.kinds as k (k.id)}
        <li>
          <button
            type="button"
            class="kind"
            onclick={() => {
              onclose();
              editKind(k.id);
            }}
          >
            <span class="dot" style:background={kindColour(k.colour).ink}></span>
            <span class="name truncate">{k.name}</span>
            <span class="count">{t('kinds-elements', { count: counts.get(k.id) ?? 0 })}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="none">{t('kinds-none')}</p>
  {/if}

  {#snippet footer()}
    <Button
      variant="secondary"
      onclick={() => {
        onclose();
        newKind();
      }}
    >
      <Plus size={14} />
      {t('kinds-new')}
    </Button>
    <span class="gap"></span>
    <Button variant="primary" onclick={onclose}>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .kinds {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kind {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .kind:hover {
    background: var(--paper-hover);
  }
  .dot {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 550;
  }
  .count {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .none {
    color: var(--ink-3);
  }
  .gap {
    flex: 1;
  }
</style>
