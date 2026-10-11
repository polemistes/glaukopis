<script lang="ts">
  /**
   * The sign of a project, the same wherever a project is named: on the
   * home page, in the pane of projects, and in the bar of a pane that shows
   * another project beside (ADR 0037). A book; with a small sign of people
   * for a project its owner shares, and of a link for one joined.
   */
  import Book from '@lucide/svelte/icons/book';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Users from '@lucide/svelte/icons/users';
  import { t } from '$lib/i18n';
  import { tooltip } from '$lib/ui/tooltip';

  interface Props {
    name: string;
    /** How it is shared: by its owner, or joined; none where it is not. */
    sharing?: { owner: boolean } | null;
    size?: number;
  }

  let { name, sharing = null, size = 16 }: Props = $props();

  const said = $derived(
    !sharing
      ? name
      : sharing.owner
        ? t('project-badge-shared', { name })
        : t('project-badge-joined', { name }),
  );
  const sign = $derived(Math.max(8, Math.round(size * 0.62)));
</script>

<span
  class="badge"
  role="img"
  aria-label={said}
  use:tooltip={{ text: said, side: 'bottom' }}
  style:width="{size}px"
  style:height="{size}px"
>
  <Book size={Math.round(size * 0.82)} strokeWidth={1.9} />
  {#if sharing}
    <span class="sign" class:joined={!sharing.owner} style:--sign="{sign}px">
      {#if sharing.owner}
        <Users size={sign - 2} strokeWidth={2.4} />
      {:else}
        <Link2 size={sign - 2} strokeWidth={2.4} />
      {/if}
    </span>
  {/if}
</span>

<style>
  .badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: var(--accent-strong);
  }
  /* The sign of sharing, small, at the lower corner, cut out of what is behind it. */
  .sign {
    position: absolute;
    right: calc(var(--sign) * -0.35);
    bottom: calc(var(--sign) * -0.3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--sign);
    height: var(--sign);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ok);
  }
  .sign.joined {
    color: var(--accent);
  }
</style>
