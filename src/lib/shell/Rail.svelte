<script lang="ts">
  import House from '@lucide/svelte/icons/house';
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import { toggleProjectsPane } from '$lib/home/list.svelte';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { keysFor, keysUi } from './keys.svelte';

  const view = $derived(router.route.view);
  /** The list of projects stands beside a project and beside the start screen, and nowhere else. */
  const listed = $derived(
    view === 'project' || view === 'file' || view === 'home' || view === 'settings',
  );

  /** The house goes back to the project shown last, where it was; else to the start screen. */
  function toProjects(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    settingsUi.hide();
    router.go(router.lastProject ?? { view: 'home' });
  }

  /** The book goes back to the library as it was left: its references or its files, where one was. */
  function toLibrary(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    settingsUi.hide();
    router.go(router.lastLibrary ?? { view: 'library' });
  }
</script>

<nav class="rail" aria-label={t('shell-main')}>
  <!-- The list's button stands where the owl stood (ADR 0065); the owl is on the start screen. -->
  <button
    type="button"
    class="place list"
    class:current={listed && settings.value.projectsList}
    aria-label={t('home-pane-toggle')}
    aria-pressed={listed && settings.value.projectsList}
    disabled={!listed}
    data-projects-button
    use:tooltip={{ text: t('home-pane-toggle'), shortcut: keysFor('projects-pane'), side: 'right' }}
    onclick={toggleProjectsPane}
  >
    <PanelLeft size={19} strokeWidth={1.7} />
  </button>

  <a
    href="#/"
    class="place"
    class:current={view === 'project' || view === 'file' || view === 'home'}
    aria-label={t('shell-projects')}
    onclick={toProjects}
    use:tooltip={{ text: t('shell-projects'), shortcut: keysFor('projects'), side: 'right' }}
  >
    <House size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/library"
    class="place"
    class:current={view === 'library' || view === 'files'}
    aria-label={t('shell-library')}
    onclick={toLibrary}
    use:tooltip={{ text: t('shell-library'), shortcut: keysFor('library'), side: 'right' }}
  >
    <LibraryBig size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/search"
    class="place"
    class:current={view === 'search'}
    aria-label={t('search-everything')}
    use:tooltip={{
      text: t('search-everything-title'),
      shortcut: keysFor('search-everything'),
      side: 'right',
    }}
  >
    <Search size={19} strokeWidth={1.7} />
  </a>

  <div class="spring"></div>

  <button
    type="button"
    class="place"
    class:current={keysUi.sheet}
    aria-label={t('keys-title')}
    use:tooltip={{ text: t('keys-title'), shortcut: keysFor('sheet'), side: 'right' }}
    onclick={() => keysUi.toggleSheet()}
  >
    <Keyboard size={19} strokeWidth={1.7} />
  </button>

  <!-- The settings are a window over the view, not a place: see settings-ui. -->
  <button
    type="button"
    class="place"
    class:current={settingsUi.open}
    aria-label={t('shell-settings')}
    use:tooltip={{ text: t('shell-settings'), shortcut: keysFor('settings'), side: 'right' }}
    onclick={() => settingsUi.toggle()}
  >
    <Settings size={19} strokeWidth={1.7} />
  </button>
</nav>

<style>
  .rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: var(--rail-w);
    flex: none;
    padding: 10px 0 10px;
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
  }
  /* The places below stand where they stood under the owl. */
  .list {
    margin-bottom: 2px;
  }
  .place {
    position: relative;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-m);
    color: var(--ink-3);
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .place:disabled {
    cursor: default;
    opacity: 0.4;
  }
  .place:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--ink);
    text-decoration: none;
  }
  .place.current {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .spring {
    flex: 1;
  }
</style>
