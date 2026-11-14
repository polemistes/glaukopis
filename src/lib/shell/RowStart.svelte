<script lang="ts">
  /**
   * The start of the row at the top of the window (ADR 0096): the house, the
   * library, then the list's button. It stands in the head of the list of
   * projects while the list is shown, else at the left end of the row over
   * the view.
   */
  import House from '@lucide/svelte/icons/house';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import { listPane, toggleProjectsPane } from '$lib/home/list.svelte';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { keysFor } from './keys.svelte';

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

<div class="row-start" data-row-start>
  <a
    href="#/"
    class="place"
    class:current={view === 'project' || view === 'file' || view === 'home'}
    aria-label={t('shell-projects')}
    data-place="projects"
    onclick={toProjects}
    use:tooltip={{ text: t('shell-projects'), shortcut: keysFor('projects') }}
  >
    <House size={17} strokeWidth={1.7} />
  </a>
  <a
    href="#/library"
    class="place"
    class:current={view === 'library' || view === 'files'}
    aria-label={t('shell-library')}
    data-place="library"
    onclick={toLibrary}
    use:tooltip={{ text: t('shell-library'), shortcut: keysFor('library') }}
  >
    <LibraryBig size={17} strokeWidth={1.7} />
  </a>
  <!-- Where there is no list, its button is shown disabled, so that the row does not change. -->
  <button
    type="button"
    class="place"
    class:current={listed && listPane.shown}
    aria-label={t('home-pane-toggle')}
    aria-pressed={listed && listPane.shown}
    disabled={!listed}
    data-place="list"
    data-projects-button
    use:tooltip={{ text: t('home-pane-toggle'), shortcut: keysFor('projects-pane') }}
    onclick={toggleProjectsPane}
  >
    <PanelLeft size={17} strokeWidth={1.7} />
  </button>
</div>

<style>
  .row-start {
    display: flex;
    align-items: center;
    flex: none;
    gap: 2px;
    padding: 0 6px;
  }
</style>
