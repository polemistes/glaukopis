<script lang="ts">
  /**
   * Split view (ADR 0096): one button in the top row, whose menu chooses
   * what the other side shows. With one side it stands in the side's cell
   * just before its ×, of its size; with two, on the join of the two cells,
   * round. It is never lit: where it stands says whether the view is split.
   */
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { tooltip } from '$lib/ui/tooltip';

  interface Props {
    /** Whether it stands on the join of two cells. */
    join: boolean;
    /** Opens the menu at the button pressed. */
    onopen: (button: HTMLElement) => void;
  }

  let { join, onopen }: Props = $props();
</script>

{#if join}
  <button
    type="button"
    class="round"
    aria-haspopup="menu"
    aria-label={t('project-side-by-side')}
    data-side-by-side
    use:tooltip={{ text: t('project-side-by-side'), shortcut: keysFor('side-by-side') }}
    onclick={(e) => onopen(e.currentTarget)}
  >
    <Columns2 size={13} />
  </button>
{:else}
  <IconButton
    label={t('project-side-by-side')}
    shortcut={keysFor('side-by-side')}
    size="sm"
    aria-haspopup="menu"
    aria-pressed={undefined}
    data-side-by-side
    onclick={(e) => onopen(e.currentTarget)}
  >
    <Columns2 size={14} />
  </IconButton>
{/if}

<style>
  /* Over the line between the sides, centred on the join it stands in. */
  .round {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    transform: translate(-50%, -50%);
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper-raised);
    color: var(--ink-3);
    cursor: pointer;
    box-shadow: var(--shadow-1);
  }
  .round:hover {
    color: var(--ink);
    border-color: var(--accent);
  }
</style>
