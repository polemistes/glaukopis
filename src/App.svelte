<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { languageSet, languagesInfo } from '$lib/api/system';
  import { noticesTake, onNotices } from '$lib/api/notices';
  import { languageName, languages, load, t } from '$lib/i18n';
  import { notifyError, toasts } from '$lib/ui/toast.svelte';
  import { readOwnWords } from '$lib/words/own';
  import { library } from '$lib/state/library.svelte';
  import { router, type Route } from '$lib/state/router.svelte';
  import { keysUi, shortcuts } from '$lib/shell/keys.svelte';
  import KeySheet from '$lib/shell/KeySheet.svelte';
  import Palette from '$lib/shell/Palette.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { applyOwn, clearOwn } from '$lib/theme/own';
  import ConfirmHost from '$lib/ui/ConfirmHost.svelte';
  import PickerHost from '$lib/project/PickerHost.svelte';
  import DragGhost from '$lib/ui/DragGhost.svelte';
  import ReferenceHost from '$lib/library/ReferenceHost.svelte';
  import MenuHost from '$lib/ui/MenuHost.svelte';
  import Toaster from '$lib/ui/Toaster.svelte';
  import Rail from '$lib/shell/Rail.svelte';
  import ProjectsPane from '$lib/home/ProjectsPane.svelte';
  import OwlView from '$lib/home/OwlView.svelte';
  import { upFromProject } from '$lib/home/list.svelte';
  import LibraryView from '$lib/library/LibraryView.svelte';
  import PicturesView from '$lib/pictures/PicturesView.svelte';
  import FilesView from '$lib/files/FilesView.svelte';
  import ProjectView, { viewing } from '$lib/project/ProjectView.svelte';
  import SearchView from '$lib/search/SearchView.svelte';
  import SettingsDialog from '$lib/settings/SettingsDialog.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';

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
      // The page goes on in English, the language it always has; the log is told.
      .catch((error) =>
        console.warn('The languages of the application could not be read: English is used', error),
      );
    // The own words, laid over those built in, by the interface and the core (ADR 0035).
    const own = readOwnWords().catch((error) => console.warn('Own words not read', error));
    await Promise.all([settings.load(), known, own]);
    // And the words of the language, lest the interface be shown in English first.
    // Those that do not come are tried again, and said, as the language is spoken below.
    const tag = interfaceTag();
    const spoken = await load(tag).then(
      () => true,
      () => false,
    );
    if (spoken) languages.current = tag;
    ready = true;
  });

  /** The language of the interface: the one chosen, or that of the system. */
  function interfaceTag(): string {
    const chosen = settings.value.language;
    return languages.interface.some((l) => l.tag === chosen) ? chosen : languages.interfaceDefault;
  }

  // The language of the interface, spoken once its words are loaded. Not
  // before the settings are read: the system's language would be loaded
  // first, and its slow words, coming last, would overrule the one chosen.
  $effect(() => {
    if (!ready) return;
    const tag = interfaceTag();
    document.documentElement.lang = tag;
    languageSet(tag).catch((error) => console.warn('The core was not told the language', error));
    // Only if it is still the one wanted: another may have been chosen meanwhile.
    // A language whose words did not come is not the one spoken: the
    // interface stays in the one it was, and says why.
    load(tag).then(
      () => {
        if (interfaceTag() === tag) languages.current = tag;
      },
      (error) => {
        if (interfaceTag() === tag)
          notifyError(t('settings-language-error-load', { language: languageName(tag) }), error);
      },
    );
  });

  // What the core tells without being asked, such as a file of its own set
  // aside because it could not be read: taken once the interface speaks
  // its language, and whenever the core says there is more. Each stays at
  // the foot of the window until it is dismissed.
  function takeNotices() {
    if (!ready) return;
    noticesTake()
      .then((told) => {
        for (const message of told) toasts.show({ kind: 'error', message }, 0);
      })
      .catch((error) => console.warn('What the core had to tell was not taken', error));
  }
  onMount(() => {
    const listening = onNotices(takeNotices);
    return () => void listening.then((unlisten) => unlisten());
  });
  $effect(() => {
    if (ready) takeNotices();
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

  // Whether the sign of a break within a paragraph is shown (app.css).
  $effect(() => {
    document.documentElement.dataset.breakSigns =
      settings.value.breakSigns === false ? 'off' : 'on';
  });

  // A colouring of the writer's own: its tokens are derived from the four colours chosen and laid on the root.
  $effect(() => {
    if (settings.theme === 'own') applyOwn(settings.value.ownTheme);
    else clearOwn();
  });

  $effect(() => {
    document.documentElement.style.setProperty('--text-size', `${settings.value.textSize}px`);
  });

  // The font of the text editor, where one is chosen; else that of the interface's text.
  $effect(() => {
    const font = settings.value.editorFont;
    if (font)
      document.documentElement.style.setProperty('--font-editor', `"${font}", var(--font-text)`);
    else document.documentElement.style.removeProperty('--font-editor');
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

  // The settings are a window over the view that is open. The old place
  // `#/settings` opens it over the projects, so that old links still work.
  $effect(() => {
    if (route.view !== 'settings') return;
    settingsUi.show();
    router.replace({ view: 'owl' });
  });

  // The keys that hold wherever one is. Going to a place closes the settings,
  // which would otherwise lie over it.
  const go = (route: Route) => {
    settingsUi.hide();
    router.go(route);
  };
  onMount(() =>
    shortcuts.bind({
      // To the map of all projects: from a project, at its folder with it selected.
      projects: () => {
        const here = router.route;
        settingsUi.hide();
        if (here.view === 'project') upFromProject(here.project);
        else router.go({ view: 'owl' });
      },
      library: () => go({ view: 'library' }),
      pictures: () => go({ view: 'pictures' }),
      files: () => go({ view: 'files' }),
      settings: () => settingsUi.toggle(),
      'search-everything': () => go({ view: 'search' }),
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
      {#if route.view === 'library'}
        <LibraryView />
      {:else if route.view === 'pictures'}
        <PicturesView />
      {:else if route.view === 'files'}
        <FilesView />
      {:else if route.view === 'project'}
        <!-- The pane of projects stands outside the view of a project, which is made anew for each. -->
        <div class="in-project">
          {#if settings.value.projectsPane}
            <ProjectsPane
              current={route.project}
              project={viewing.project}
              at={viewing.at}
              onenter={(id) => viewing.enter?.(id)}
            />
          {/if}
          <div class="project-view">
            {#key route.project}
              <ProjectView projectId={route.project} />
            {/key}
          </div>
        </div>
      {:else if route.view === 'owl' || route.view === 'settings'}
        <div class="in-project">
          {#if settings.value.projectsPane}
            <ProjectsPane owlAt={route.view === 'owl' ? (route.at ?? null) : null} />
          {/if}
          <div class="project-view">
            <OwlView at={route.view === 'owl' ? route.at : undefined} />
          </div>
        </div>
      {:else if route.view === 'search'}
        <SearchView />
      {/if}
    </main>
  </div>

  <ReferenceHost />
  <ConfirmHost />
  <PickerHost />
  {#if keysUi.sheet}<KeySheet onclose={() => (keysUi.sheet = false)} />{/if}
  {#if keysUi.palette}<Palette onclose={() => (keysUi.palette = false)} />{/if}
  <SettingsDialog />
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
  .in-project {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .project-view {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
</style>
