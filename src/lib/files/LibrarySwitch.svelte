<script lang="ts">
  /**
   * In the row over the library: its references, the notebook, or its
   * files, which all stand in its place (the notebook on the owner's word
   * of 2026-11-19: it had a place of its own in the row at the top).
   */
  import FileStack from '@lucide/svelte/icons/file-stack';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Notebook from '@lucide/svelte/icons/notebook';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';

  let { current }: { current: 'references' | 'notebook' | 'files' } = $props();
</script>

<span class="switch" data-library-switch>
  <Segmented
    value={current}
    label={t('library-switch')}
    size="sm"
    options={[
      { value: 'references', label: t('library-switch-references'), icon: LibraryBig },
      { value: 'notebook', label: t('library-switch-notebook'), icon: Notebook },
      { value: 'files', label: t('library-switch-files'), icon: FileStack },
    ]}
    onchange={(next) =>
      router.go(
        next === 'files'
          ? (router.lastFiles ?? { view: 'files' })
          : next === 'notebook'
            ? (router.lastNotebook ?? { view: 'notebook' })
            : (router.lastReferences ?? { view: 'library' }),
      )}
  />
</span>

<style>
  .switch {
    display: inline-flex;
    flex: none;
  }
</style>
