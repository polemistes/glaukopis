<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { languageSet, languagesInfo } from '$lib/api/system';
  import { languages, t } from '$lib/i18n';
  import { library } from '$lib/state/library.svelte';
  import { router } from '$lib/state/router.svelte';
  import { keysUi, shortcuts } from '$lib/shell/keys.svelte';
  import KeySheet from '$lib/shell/KeySheet.svelte';
  import Palette from '$lib/shell/Palette.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { applyOwn, clearOwn } from '$lib/theme/own';
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
  import SearchView from '$lib/search/SearchView.svelte';
  import SettingsView from '$lib/settings/SettingsView.svelte';

  const route = $derived(router.route);

  /** Whether the settings and the languages are known: nothing is shown before, lest it be shown in another language first. */
  let ready = $state(false);

  onMount(async () => {
    const known = languagesInfo()
      .then((info) => {
        languages.system = info.system;
        languages.interface = info.interface;
        languages.interfaceDefault = info.interfaceDefault;
        languages.texts = info.texts;
        languages.textDefault = info.textDefault;
      })
      .catch(() => {});
    await Promise.all([settings.load(), known]);
    ready = true;
  });

  // The language of the interface: the one chosen, or that of the system.
  $effect(() => {
    const chosen = settings.value.language;
    const tag = languages.interface.some((l) => l.tag === chosen)
      ? chosen
      : languages.interfaceDefault;
    languages.current = tag;
    document.documentElement.lang = tag;
    languageSet(tag).catch(() => {});
  });

  // Words the stylesheet shows where the page has no element for them.
  $effect(() => {
    const root = document.documentElement.style;
    const say = (name: string, id: string) => root.setProperty(name, JSON.stringify(t(id)));
    say('--words-picture-absent', 'figures-picture-absent');
    say('--words-picture-caption', 'figures-caption-placeholder');
    say('--words-table-caption', 'tables-caption-empty');
  });

  // The language new texts are given.
  $effect(() => {
    const chosen = settings.value.textLanguage;
    languages.newTexts = chosen && chosen !== 'system' ? chosen : languages.textDefault;
  });

  $effect(() => {
    document.documentElement.dataset.theme = settings.theme;
  });

  // A colouring of the writer's own: its tokens are derived from the four colours chosen and laid on the root.
  $effect(() => {
    if (settings.theme === 'own') applyOwn(settings.value.ownTheme);
    else clearOwn();
  });

  $effect(() => {
    document.documentElement.style.setProperty('--text-size', `${settings.value.textSize}px`);
  });

  // The size of the whole interface, as the window's own zoom: everything
  // grows alike, and the pointer stays where it is drawn.
  $effect(() => {
    const size = settings.value.interfaceSize;
    if (ready)
      void getCurrentWebview()
        .setZoom(size > 0 ? size : 1)
        .catch(() => {});
  });

  // The keys that hold wherever one is.
  onMount(() =>
    shortcuts.bind({
      projects: () => router.go({ view: 'projects' }),
      library: () => router.go({ view: 'library' }),
      pictures: () => router.go({ view: 'pictures' }),
      settings: () => router.go({ view: 'settings' }),
      'search-everything': () => router.go({ view: 'search' }),
      palette: () => keysUi.togglePalette(),
      sheet: () => keysUi.toggleSheet(),
    }),
  );

  // Every key comes here, and is done where it is bound: see `shell/keys`.
  function onkeydown(event: KeyboardEvent) {
    shortcuts.handle(event);
  }
</script>

<!-- Changes made to the library file from outside are taken up on coming back, wherever one is. -->
<svelte:window
  {onkeydown}
  onfocus={() => library.checkForChanges()}
  oncontextmenu={(e) => e.preventDefault()}
/>

{#if ready}
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
      {:else if route.view === 'search'}
        <SearchView />
      {:else if route.view === 'settings'}
        <SettingsView />
      {/if}
    </main>
  </div>

  <ReferenceHost />
  <ConfirmHost />
  {#if keysUi.sheet}<KeySheet onclose={() => (keysUi.sheet = false)} />{/if}
  {#if keysUi.palette}<Palette onclose={() => (keysUi.palette = false)} />{/if}
  <MenuHost />
  <DragGhost />
{/if}
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
