/**
 * Whether the settings are open. They are a window laid over whatever view
 * is open, so that closing them leaves the view as it was: the rail's gear
 * and Ctrl+, open and close it, and the old place `#/settings` opens it over
 * the projects.
 */
class SettingsUi {
  open = $state(false);

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }
}

export const settingsUi = new SettingsUi();
