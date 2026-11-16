<!-- Help, the user's guide, in a window over whatever view is open: see help-ui. -->
<script lang="ts">
  import { t } from '$lib/i18n';
  import Dialog from '$lib/ui/Dialog.svelte';
  import HelpReader from './HelpReader.svelte';
  import { helpUi } from './help-ui.svelte';
</script>

<Dialog
  open={helpUi.open}
  title={t('help-title')}
  width={1120}
  tall
  padded={false}
  onclose={() => helpUi.hide()}
>
  <!-- Made anew each time Help opens, at the place it is to open at. -->
  <HelpReader />
</Dialog>
