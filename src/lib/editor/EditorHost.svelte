<script lang="ts">
  import { libraryGet } from '$lib/api/library';
  import type { Project } from '$lib/project/model/project.svelte';
  import TargetPicker from '$lib/figures/TargetPicker.svelte';
  import CitationEditor from './CitationEditor.svelte';
  import FormatBar from './FormatBar.svelte';
  import ReferencePicker from './ReferencePicker.svelte';
  import { recordOf, setProject } from './references.svelte';
  import { editorUi } from './ui.svelte';

  let { project }: { project: Project } = $props();

  $effect(() => {
    setProject(project);
    return () => {
      setProject(null);
      editorUi.closeAll();
    };
  });

  const used = $derived(project.usedReferences());

  /** The project keeps a copy of every reference it uses. */
  export async function keep(id: string) {
    try {
      project.putReference(recordOf(await libraryGet(id)));
    } catch {
      // Not in this user's library: the project has its own copy already.
    }
  }
</script>

<FormatBar />

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

{#if editorUi.pointing}
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
