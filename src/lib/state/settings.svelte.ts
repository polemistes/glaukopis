import { defaultSettings, settingsLoad, settingsSave, type Settings } from '$lib/api/system';
import { notifyError } from '$lib/ui/toast.svelte';

class SettingsState {
  value = $state<Settings>({ ...defaultSettings });
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
      this.value = { ...defaultSettings, ...(await settingsLoad()) };
    } catch (error) {
      notifyError('The settings could not be read', error);
    }
    this.loaded = true;
  }

  /** Writes at once what would otherwise be written in a moment. */
  async saveNow() {
    clearTimeout(this.#saveTimer);
    await settingsSave($state.snapshot(this.value));
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.value[key] = value;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      settingsSave($state.snapshot(this.value)).catch((error) =>
        notifyError('The settings could not be saved', error),
      );
    }, 300);
  }
}

export const settings = new SettingsState();
