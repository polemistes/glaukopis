<script lang="ts">
  import House from '@lucide/svelte/icons/house';
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import Images from '@lucide/svelte/icons/images';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { keysUi } from './keys.svelte';
  import Mark from './Mark.svelte';

  const view = $derived(router.route.view);
</script>

<nav class="rail" aria-label={t('shell-main')}>
  <a
    class="mark"
    href="#/"
    aria-label="Glaukopis"
    use:tooltip={{ text: 'Glaukopis', side: 'right' }}
  >
    <Mark size={26} />
  </a>

  <a
    href="#/"
    class="place"
    class:current={view === 'projects' || view === 'project'}
    aria-label={t('shell-projects')}
    use:tooltip={{ text: t('shell-projects'), shortcut: 'Ctrl+1', side: 'right' }}
  >
    <House size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/library"
    class="place"
    class:current={view === 'library'}
    aria-label={t('shell-library')}
    use:tooltip={{ text: t('shell-library'), shortcut: 'Ctrl+2', side: 'right' }}
  >
    <LibraryBig size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/pictures"
    class="place"
    class:current={view === 'pictures'}
    aria-label={t('shell-pictures')}
    use:tooltip={{ text: t('shell-pictures'), shortcut: 'Ctrl+3', side: 'right' }}
  >
    <Images size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/search"
    class="place"
    class:current={view === 'search'}
    aria-label={t('search-everything')}
    use:tooltip={{ text: t('search-everything-title'), shortcut: 'Ctrl+Shift+F', side: 'right' }}
  >
    <Search size={19} strokeWidth={1.7} />
  </a>

  <div class="spring"></div>

  <button
    type="button"
    class="place"
    class:current={keysUi.sheet}
    aria-label={t('keys-title')}
    use:tooltip={{ text: t('keys-title'), shortcut: 'Ctrl+/', side: 'right' }}
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
    use:tooltip={{ text: t('shell-settings'), shortcut: 'Ctrl+,', side: 'right' }}
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
  .mark {
    display: flex;
    margin-bottom: 12px;
    border-radius: var(--radius-m);
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
  .place:hover {
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
