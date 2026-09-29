import {
  defaultSettings,
  settingsLoad,
  settingsSave,
  type FoundSettings,
  type Settings,
} from '$lib/api/system';
import { t } from '$lib/i18n';
import { notifyError } from '$lib/ui/toast.svelte';

class SettingsState {
  value = $state<Settings>({ ...defaultSettings, found: { ...defaultSettings.found } });
  loaded = $state(false);
  #systemDark = $state(false);
  #saveTimer: ReturnType<typeof setTimeout> | undefined;

  /** The theme in effect, with "system" resolved. */
  get theme(): 'light' | 'dark' {
    const t = this.value.theme;
    return t === 'system' ? (this.#systemDark ? 'dark' : 'light') : t;
  }

  async load() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    this.#systemDark = media.matches;
    media.addEventListener('change', (e) => (this.#systemDark = e.matches));
    try {
      const kept = await settingsLoad();
      // What was kept by a version that knew less of it has the rest as it is given.
      this.value = {
        ...defaultSettings,
        ...kept,
        found: { ...defaultSettings.found, ...(kept.found ?? {}) },
      };
    } catch (error) {
      notifyError(t('settings-error-read'), error);
    }
    this.loaded = true;
  }

  /** Writes at once what would otherwise be written in a moment. */
  async saveNow() {
    clearTimeout(this.#saveTimer);
    await settingsSave($state.snapshot(this.value));
  }

  /** What is done with citations that are found, changed in part. */
  setFound(change: Partial<FoundSettings>) {
    this.set('found', { ...$state.snapshot(this.value.found), ...change });
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.value[key] = value;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      settingsSave($state.snapshot(this.value)).catch((error) =>
        notifyError(t('settings-error-save'), error),
      );
    }, 300);
  }
}

export const settings = new SettingsState();
