<!-- The settings, in a window over whatever view is open: see settings-ui. -->
<script lang="ts">
  import { t } from '$lib/i18n';
  import Dialog from '$lib/ui/Dialog.svelte';
  import SettingsView from './SettingsView.svelte';
  import { settingsUi } from './settings-ui.svelte';
</script>

<Dialog
  open={settingsUi.open}
  title={t('settings-title')}
  width={860}
  tall
  onclose={() => settingsUi.hide()}
>
  <SettingsView />
</Dialog>
