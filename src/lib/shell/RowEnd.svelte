<script lang="ts">
  /**
   * The end of the row at the top of the window (ADR 0096): Help, the keys
   * and the settings; the search through everything is in the field of the list of
   * projects since record 0098. It stands at the right end of the project's
   * top row, and of the row over every other view.
   */
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import Settings from '@lucide/svelte/icons/settings';
  import { helpUi } from '$lib/help/help-ui.svelte';
  import { toggleHelp } from '$lib/help/open';
  import { t } from '$lib/i18n';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { keysFor, keysUi } from './keys.svelte';
</script>

<div class="row-end" data-row-end>
  <!-- Help is a window over the view, as the settings are: see help-ui. -->
  <button
    type="button"
    class="place"
    class:current={helpUi.open}
    aria-label={t('help-title')}
    data-place="help"
    use:tooltip={{ text: t('help-title'), shortcut: keysFor('help') }}
    onclick={() => toggleHelp()}
  >
    <CircleQuestionMark size={17} strokeWidth={1.7} />
  </button>
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
