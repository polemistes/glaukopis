<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import ConfirmHost from '$lib/ui/ConfirmHost.svelte';
  import DragGhost from '$lib/ui/DragGhost.svelte';
  import ReferenceHost from '$lib/library/ReferenceHost.svelte';
  import MenuHost from '$lib/ui/MenuHost.svelte';
  import Toaster from '$lib/ui/Toaster.svelte';
  import Rail from '$lib/shell/Rail.svelte';
  import ProjectsView from '$lib/home/ProjectsView.svelte';
  import LibraryView from '$lib/library/LibraryView.svelte';
  import PicturesView from '$lib/pictures/PicturesView.svelte';
  import ProjectView from '$lib/project/ProjectView.svelte';
  import SettingsView from '$lib/settings/SettingsView.svelte';

  const route = $derived(router.route);

  onMount(() => {
    settings.load();
  });

  $effect(() => {
    document.documentElement.dataset.theme = settings.theme;
  });

  $effect(() => {
    document.documentElement.style.setProperty('--text-size', `${settings.value.textSize}px`);
  });

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod || event.altKey || event.shiftKey) return;
    if (event.key === '1') router.go({ view: 'projects' });
    else if (event.key === '2') router.go({ view: 'library' });
    else if (event.key === '3') router.go({ view: 'pictures' });
    else if (event.key === ',') router.go({ view: 'settings' });
    else return;
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} oncontextmenu={(e) => e.preventDefault()} />

<div class="app">
  <Rail />
  <main>
    {#if route.view === 'projects'}
      <ProjectsView />
    {:else if route.view === 'library'}
      <LibraryView />
    {:else if route.view === 'pictures'}
      <PicturesView />
    {:else if route.view === 'project'}
      {#key route.project}
        <ProjectView projectId={route.project} />
      {/key}
    {:else if route.view === 'settings'}
      <SettingsView />
    {/if}
  </main>
</div>

<ReferenceHost />
<ConfirmHost />
<MenuHost />
<DragGhost />
<Toaster />

<style>
  .app {
    display: flex;
    height: 100%;
  }
  main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--paper);
  }
</style>
