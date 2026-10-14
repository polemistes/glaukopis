<script lang="ts">
  /** At the head of the library: its references, or its files, which stand in its place. */
  import FileStack from '@lucide/svelte/icons/file-stack';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';

  let { current }: { current: 'references' | 'files' } = $props();
</script>

<span class="switch" data-library-switch>
  <Segmented
    value={current}
    label={t('library-switch')}
    size="sm"
    options={[
      { value: 'references', label: t('library-switch-references'), icon: LibraryBig },
      { value: 'files', label: t('library-switch-files'), icon: FileStack },
    ]}
    onchange={(next) => router.go({ view: next === 'files' ? 'files' : 'library' })}
  />
</span>

<style>
  .switch {
    display: inline-flex;
    flex: none;
  }
</style>
