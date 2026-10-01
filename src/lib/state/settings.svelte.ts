import {
  defaultSettings,
  settingsLoad,
  settingsSave,
  type FoundSettings,
  type Settings,
} from '$lib/api/system';
import type { KindFamily, Look } from '$lib/api/documents';
import { t } from '$lib/i18n';
import { notifyError } from '$lib/ui/toast.svelte';

/**
 * A kind of paragraph or of words of the writer's own, as it is remembered
 * across projects: offered by name when a kind is made, with what it was
 * based on and how it differed. See `editor/own-kinds.svelte.ts`.
 */
export interface RememberedPassageKind {
  name: string;
  family: KindFamily;
  basedOn: string;
  look: Look;
}

/** What is kept in the settings beyond what `api/system.ts` declares. */
export interface MoreSettings {
  /** The kinds of paragraph and of words made in any project, the latest first. */
  passageKinds: RememberedPassageKind[];
}

export type AllSettings = Settings & MoreSettings;

const more = (kept: Partial<AllSettings> = {}): MoreSettings => ({
  passageKinds: Array.isArray(kept.passageKinds)
    ? kept.passageKinds.filter((k) => k && typeof k.name === 'string')
    : [],
});

class SettingsState {
  value = $state<AllSettings>({
    ...defaultSettings,
    ...more(),
    found: { ...defaultSettings.found },
  });
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
        ...more(kept),
        found: { ...defaultSettings.found, ...(kept.found ?? {}) },
      };
      // Who this installation is in the history of projects: made once, and kept.
      if (!this.value.person) {
        this.value.person = crypto.randomUUID();
        await this.saveNow();
      }
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

  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  set<K extends keyof MoreSettings>(key: K, value: MoreSettings[K]): void;
  set(key: keyof AllSettings, value: AllSettings[keyof AllSettings]) {
    Object.assign(this.value, { [key]: value });
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      settingsSave($state.snapshot(this.value)).catch((error) =>
        notifyError(t('settings-error-save'), error),
      );
    }, 300);
  }
}

export const settings = new SettingsState();
