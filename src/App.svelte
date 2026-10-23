<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { inTauri } from '$lib/api/backend';
  import { languageSet, languagesInfo } from '$lib/api/system';
  import { noticesTake, onNotices } from '$lib/api/notices';
  import { languageName, languages, load, t } from '$lib/i18n';
  import { notifyError, toasts } from '$lib/ui/toast.svelte';
  import { readOwnWords } from '$lib/words/own';
  import { library } from '$lib/state/library.svelte';
  import { formatRoute, parseRoute, router, type Route } from '$lib/state/router.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { asItCloses } from '$lib/state/closing';
  import { placeWindow, windowPlace } from '$lib/state/window-place';
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
  import StartView from '$lib/home/StartView.svelte';
  import LibraryView from '$lib/library/LibraryView.svelte';
  import PicturesView from '$lib/pictures/PicturesView.svelte';
  import FilesView from '$lib/files/FilesView.svelte';
  import ProjectView, { viewing } from '$lib/project/ProjectView.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import SearchView from '$lib/search/SearchView.svelte';
  import SettingsDialog from '$lib/settings/SettingsDialog.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';

  const route = $derived(router.route);

  /** Whether the settings and the languages are known: nothing is shown before, lest it be shown in another language first. */
  let ready = $state(false);

  onMount(async () => {
    try {
      await begin();
    } finally {
      // Whatever came of it, the page is drawn and the window shown: a window
      // that stays hidden is the worst there is.
      ready = true;
      await tick();
      await showWindow();
    }
  });

  /** What is known before anything is shown: the settings, the languages, and the place to begin at. */
  async function begin() {
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
    await goToPlaceKept().catch((error) => console.warn('The place kept was not gone to', error));
  }

  /**
   * At start, where the address names no place: the place the window was at
   * when it was closed (ADR 0063). An address that names one wins, as a
   * link does. A project that is gone gives the start screen.
   */
  async function goToPlaceKept() {
    if (location.hash && location.hash !== '#' && location.hash !== '#/') return;
    const kept = settings.value.lastPlace;
    if (typeof kept !== 'string' || !kept) return;
    const place = parseRoute(kept);
    if (place.view === 'home' || place.view === 'settings') return;
    if (place.view === 'project') {
      await projects.load();
      if (!projects.list.some((p) => p.id === place.project)) return;
      // The project alone: its view is laid out as it was left, both sides
      // with it, where a place that names an element would show that one alone.
      router.replace({ view: 'project', project: place.project });
      return;
    }
    router.replace(place);
  }

  // The place is kept, a moment after it changes and before the window
  // closes, to be gone to at the next start. Not the settings, which stand
  // over another place and are replaced at once. It depends on the place.
  $effect(() => {
    if (!ready || route.view === 'settings') return;
    const place = formatRoute(route);
    if (untrack(() => settings.value.lastPlace) !== place) settings.set('lastPlace', place);
  });

  /**
   * The window, made hidden, is put where it was left and shown once the page
   * is drawn, so that it neither jumps nor flashes white. A failure to place
   * it is logged; it is shown whatever came before.
   */
  async function showWindow() {
    if (!inTauri) return;
    const window = getCurrentWindow();
    try {
      await placeWindow(window, settings.value.window);
    } catch (error) {
      console.warn('The window could not be put where it was left', error);
    } finally {
      await window.show().catch((error) => console.error('The window could not be shown', error));
    }
  }

  // Its size and place are kept as it closes, and written with the other settings.
  onMount(() =>
    asItCloses(async () => {
      const place = await windowPlace(getCurrentWindow(), settings.value.window);
      if (place) settings.set('window', place);
    }),
  );

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
  // `#/settings` opens it over the start screen, so that old links still work.
  $effect(() => {
    if (route.view !== 'settings') return;
    settingsUi.show();
    router.replace({ view: 'home' });
  });

  // The keys that hold wherever one is. Going to a place closes the settings,
  // which would otherwise lie over it.
  const go = (route: Route) => {
    settingsUi.hide();
    router.go(route);
  };
  onMount(() =>
    shortcuts.bind({
      // To the projects: the one shown last, where it was; else the start screen.
      projects: () => go(router.lastProject ?? { view: 'home' }),
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
          {#if settings.value.projectsList}
            <!-- Until the view says what its sides show, the project of the place is the one shown. -->
            <ProjectsPane
              sides={viewing.sides.length
                ? viewing.sides
                : [{ id: route.project, project: null, at: route.at ?? PROJECT, focused: true }]}
              onenter={(project, id) => viewing.enter?.(project, id)}
            />
          {/if}
          <div class="project-view">
            {#key route.project}
              <ProjectView projectId={route.project} />
            {/key}
          </div>
        </div>
      {:else if route.view === 'home' || route.view === 'settings'}
        <div class="in-project">
          {#if settings.value.projectsList}
            <ProjectsPane />
          {/if}
          <div class="project-view">
            <StartView />
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
