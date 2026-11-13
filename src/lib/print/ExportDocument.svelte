<!--
  The dialog of the kinds of file a document is exported as, for the
  document of a side, whether the typesetting pane is open or not (record
  0091). It is the dialog the pane has, given what the pane gives it: the
  document made anew when it is asked for, its name, and the kinds of file
  that its template makes. It is shown once those are known, so that the
  kinds do not change under the eye.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { OutputTarget } from '$lib/api/templates';
  import { t } from '$lib/i18n';
  import { documents, templateUsed } from '$lib/preview/documents.svelte';
  import ExportDialog from '$lib/preview/ExportDialog.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import { requestOf } from './document';

  interface Props {
    project: Project;
    projectId: string;
    /** The element whose branch is the document. */
    at: string;
    onclose: () => void;
  }

  let { project, projectId, at, onclose }: Props = $props();

  /** The kinds of file the template of the document makes; every kind where it cannot be read. */
  let targets = $state.raw<OutputTarget[] | undefined>();
  let ready = $state(false);

  onMount(() => {
    let gone = false;
    void (async () => {
      // What LaTeX is installed is read for the dialog.
      await documents.load();
      try {
        const template = await templateUsed(project, at);
        targets = template.outputs.find((o) => o.id === 'document')?.targets;
      } catch {
        // The dialog says what failed when the file is asked for.
      }
      if (!gone) ready = true;
    })();
    return () => (gone = true);
  });
</script>

{#if ready}
  <ExportDialog
    request={() => requestOf(project, projectId, at)}
    {targets}
    name={project.node(at)?.title || t('preview-file-name')}
    {onclose}
  />
{/if}
