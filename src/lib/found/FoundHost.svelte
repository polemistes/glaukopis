<script lang="ts">
  import type { Project } from '$lib/project/model/project.svelte';
  import FoundDialog from './FoundDialog.svelte';
  import { foundUi } from './found.svelte';

  interface Props {
    project: Project;
    /** Called when a work has been cited, with the id of its reference: the project keeps a copy. */
    onkeep: (reference: string) => void;
  }

  let { project, onkeep }: Props = $props();

  // Where this is, the citations of a project can be gone through; when it goes, the window goes.
  $effect(() => () => {
    foundUi.request = null;
  });
</script>

{#if foundUi.request && project.map(foundUi.request.map)}
  {#key foundUi.request}
    <FoundDialog
      {project}
      map={foundUi.request.map}
      at={foundUi.request.at}
      {onkeep}
      onclose={() => (foundUi.request = null)}
    />
  {/key}
{/if}
