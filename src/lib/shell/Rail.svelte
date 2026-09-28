<script lang="ts">
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Images from '@lucide/svelte/icons/images';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Settings from '@lucide/svelte/icons/settings';
  import { router } from '$lib/state/router.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import Mark from './Mark.svelte';

  const view = $derived(router.route.view);
</script>

<nav class="rail" aria-label="Main">
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
    aria-label="Projects"
    use:tooltip={{ text: 'Projects', shortcut: 'Ctrl+1', side: 'right' }}
  >
    <FolderOpen size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/library"
    class="place"
    class:current={view === 'library'}
    aria-label="Library"
    use:tooltip={{ text: 'Library', shortcut: 'Ctrl+2', side: 'right' }}
  >
    <LibraryBig size={19} strokeWidth={1.7} />
  </a>
  <a
    href="#/pictures"
    class="place"
    class:current={view === 'pictures'}
    aria-label="Pictures"
    use:tooltip={{ text: 'Pictures', shortcut: 'Ctrl+3', side: 'right' }}
  >
    <Images size={19} strokeWidth={1.7} />
  </a>

  <div class="spring"></div>

  <a
    href="#/settings"
    class="place"
    class:current={view === 'settings'}
    aria-label="Settings"
    use:tooltip={{ text: 'Settings', shortcut: 'Ctrl+,', side: 'right' }}
  >
    <Settings size={19} strokeWidth={1.7} />
  </a>
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
