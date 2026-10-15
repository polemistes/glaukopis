<script lang="ts">
  /**
   * A line at the head of the files that says how many of the folder in
   * view, with those under it, belong to no reference, and offers to go
   * through them. It stands until they are gone through, or until it is
   * hidden for the session; it comes back when more files are taken in.
   */
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';

  interface Props {
    count: number;
    ongo: () => void;
    onhide: () => void;
  }
  let { count, ongo, onhide }: Props = $props();
</script>

<div class="bar" data-unassigned-bar data-count={count} role="status">
  <span class="icon"><ListChecks size={15} strokeWidth={1.6} /></span>
  <span class="words">{t('files-unassigned-here', { count })}</span>
  <Button size="sm" onclick={ongo} data-unassigned-go>{t('files-unassigned-go')}</Button>
  <IconButton label={t('files-unassigned-hide')} size="sm" onclick={onhide} data-unassigned-hide>
    <X size={13} />
  </IconButton>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    min-height: 32px;
    padding: 2px 8px 2px 14px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .icon {
    display: flex;
    flex: none;
  }
  .words {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
