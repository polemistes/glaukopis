<script lang="ts">
  /**
   * The end of the row at the top of the window (ADR 0096): the library,
   * the search, the keys and the settings. It stands at the right end of the
   * project's top row, and of the row over every other view.
   */
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { keysFor, keysUi } from './keys.svelte';

  const view = $derived(router.route.view);

  /** The book goes back to the library as it was left: its references or its files, where one was. */
  function toLibrary(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    settingsUi.hide();
    router.go(router.lastLibrary ?? { view: 'library' });
  }
</script>

<div class="row-end" data-row-end>
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
  <a
    href="#/search"
    class="place"
    class:current={view === 'search'}
    aria-label={t('search-everything')}
    data-place="search"
    use:tooltip={{ text: t('search-everything-title'), shortcut: keysFor('search-everything') }}
  >
    <Search size={17} strokeWidth={1.7} />
  </a>
  <button
    type="button"
    class="place"
    class:current={keysUi.sheet}
    aria-label={t('keys-title')}
    data-place="keys"
    use:tooltip={{ text: t('keys-title'), shortcut: keysFor('sheet') }}
    onclick={() => keysUi.toggleSheet()}
  >
    <Keyboard size={17} strokeWidth={1.7} />
  </button>
  <!-- The settings are a window over the view, not a place: see settings-ui. -->
  <button
    type="button"
    class="place"
    class:current={settingsUi.open}
    aria-label={t('shell-settings')}
    data-place="settings"
    use:tooltip={{ text: t('shell-settings'), shortcut: keysFor('settings') }}
    onclick={() => settingsUi.toggle()}
  >
    <Settings size={17} strokeWidth={1.7} />
  </button>
</div>

<style>
  .row-end {
    display: flex;
    align-items: center;
    flex: none;
    gap: 2px;
    padding: 0 8px 0 6px;
  }
</style>
