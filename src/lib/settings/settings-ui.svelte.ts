/**
 * Whether the settings are open. They are a window laid over whatever view
 * is open, so that closing them leaves the view as it was: the gear in the row
 * and Ctrl+, open and close it, and the old place `#/settings` opens it over
 * the projects. One window lies over the view at a time: opening the
 * settings closes Help.
 */
import { helpUi } from '$lib/help/help-ui.svelte';

class SettingsUi {
  open = $state(false);

  show() {
    helpUi.hide();
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
    if (this.open) helpUi.hide();
  }
}

export const settingsUi = new SettingsUi();
