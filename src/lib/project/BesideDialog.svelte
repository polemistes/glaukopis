<script lang="ts">
  /**
   * The chooser of another project to show beside the one of the view: the
   * list of projects, with its folders, its field and the trees that unfold
   * under a project, in a dialog. A click on a project shows it beside at
   * its top; one on an element of its tree, at that element. The project of
   * the view is greyed and cannot be chosen: its own elements are chosen
   * through Another element….
   */
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import ProjectList from '$lib/home/ProjectList.svelte';
  import { ProjectActions } from '$lib/home/project-actions.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';

  interface Props {
    /** The project of the view, which is not chosen. */
    current: string;
    /** Shows the project chosen beside, at the element chosen or at its top. */
    onchoose: (project: string, at?: string) => void;
    onclose: () => void;
  }

  let { current, onchoose, onclose }: Props = $props();

  // The list asks for the actions of its place; where it chooses, none of them is offered.
  const actions = new ProjectActions({ open: () => {} });

  function choose(project: string, at?: string) {
    onclose();
    onchoose(project, at);
  }

  onMount(() => {
    if (!projects.loaded) void projects.load();
  });
</script>

<Dialog
  open
  title={t('project-beside-title')}
  subtitle={t('project-beside-subtitle')}
  width={440}
  {onclose}
>
  <div class="beside" data-beside-chooser>
    {#if projects.loaded}
      <ProjectList {actions} {current} {choose} />
    {:else}
      <div class="centre"><Spinner size={18} /></div>
    {/if}
  </div>
</Dialog>

<style>
  .beside {
    height: min(440px, 58vh);
    overflow-y: auto;
  }
  .centre {
    display: flex;
    justify-content: center;
    padding: 30px 0;
  }
</style>
