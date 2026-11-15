<script lang="ts">
  import type { Project } from '$lib/project/model/project.svelte';
  import TargetPicker from '$lib/figures/TargetPicker.svelte';
  import CitationEditor from './CitationEditor.svelte';
  import ReferencePicker from './ReferencePicker.svelte';
  import RefMarkDialog from './RefMarkDialog.svelte';
  import { keepReference, setProject } from './references.svelte';
  import { editorUi } from './ui.svelte';

  /** The project whose texts are written; none, where they are in no project: the notes of the notebook. */
  let { project }: { project: Project | null } = $props();

  $effect(() => {
    setProject(project);
    return () => {
      setProject(null);
      editorUi.closeAll();
    };
  });

  const used = $derived(project?.usedReferences() ?? []);

  /** The project keeps a copy of every reference it uses; where there is no project, the library has it. */
  export function keep(id: string) {
    return project ? keepReference(project, id) : Promise.resolve();
  }
</script>

{#if editorUi.picking}
  {#key editorUi.picking}
    <ReferencePicker
      request={{
        ...editorUi.picking,
        onpick: (id) => {
          keep(id);
          editorUi.picking?.onpick(id);
        },
      }}
      {used}
      onclose={(cancelled) => editorUi.closePicker(cancelled)}
    />
  {/key}
{/if}

{#if editorUi.pointing && project}
  {#key editorUi.pointing}
    <TargetPicker
      {project}
      request={editorUi.pointing}
      onclose={(cancelled) => editorUi.closeTargets(cancelled)}
    />
  {/key}
{/if}

{#if editorUi.citation}
  {#key editorUi.citation}
    <CitationEditor
      request={editorUi.citation}
      oncite={keep}
      onclose={() => editorUi.closeCitation()}
    />
  {/key}
{/if}

{#if editorUi.marking}
  {#key editorUi.marking}
    <RefMarkDialog
      request={editorUi.marking}
      onclose={(cancelled) => editorUi.closeMarking(cancelled)}
    />
  {/key}
{/if}
