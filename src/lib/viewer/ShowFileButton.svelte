<script lang="ts">
  /**
   * Show the file of a work, from within a map (ADR 0069, 0072): from a
   * citation's editor and from the references of a document. The file is
   * shown among the sources beside the text, so that the text one writes
   * stays where it is. Where the
   * work has several files that can be shown, a menu names them; where it
   * has none, nothing is shown.
   */
  import Eye from '@lucide/svelte/icons/eye';
  import { libraryGet, type StoredFile } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { showFile } from './show';

  interface Props {
    /** The id of the reference in the library. */
    reference: string;
  }

  let { reference }: Props = $props();

  let shown = $state.raw<StoredFile[]>([]);

  // The reference's files, once for each reference. It depends on the reference alone.
  $effect(() => {
    const id = reference;
    libraryGet(id)
      .then((r) => {
        if (id === reference)
          shown = r.files.filter((f) => f.exists && (f.kind === 'pdf' || f.kind === 'picture'));
      })
      .catch(() => (shown = []));
  });

  function show(event: MouseEvent) {
    if (shown.length === 1) {
      showFile(shown[0].hash);
      return;
    }
    openMenu(
      event.currentTarget as HTMLElement,
      shown.map((f) => ({
        label: t('project-show-file-named', { name: f.name }),
        action: () => showFile(f.hash),
      })),
      { align: 'start' },
    );
  }
</script>

{#if shown.length}
  <IconButton label={t('project-show-file')} size="sm" data-show-file={reference} onclick={show}>
    <Eye size={13} />
  </IconButton>
{/if}
