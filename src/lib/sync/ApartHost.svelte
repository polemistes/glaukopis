<!--
  What the window is told of projects written in on two computers while
  they were apart (record 0119; see `apart.svelte.ts`): it listens, once for
  the window, looks at each project as it is opened, and shows the earlier
  versions of a project whose changes cannot be shown. Mounted once, by the
  window.
-->
<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import HistoryDialog from '$lib/home/HistoryDialog.svelte';
  import { openProjects } from '$lib/project/open-projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import { writtenApart } from './apart.svelte';

  onMount(() => {
    const listening = writtenApart.follow();
    return () => void listening.then((unlisten) => unlisten());
  });

  // Each project, once it is open. It depends on the projects open and on
  // whether each is open yet; what is done with one is read untracked.
  $effect(() => {
    const open = openProjects
      .all()
      .filter((p) => p.state === 'open')
      .map((p) => p.id);
    untrack(() => {
      for (const id of open) writtenApart.opened(id);
    });
  });
</script>

{#if writtenApart.earlier}
  <HistoryDialog
    project={writtenApart.earlier}
    onclose={() => (writtenApart.earlier = null)}
    onopened={(copy) => {
      writtenApart.earlier = null;
      router.go({ view: 'project', project: copy.id });
    }}
  />
{/if}
