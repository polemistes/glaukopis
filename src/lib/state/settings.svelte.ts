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
import { beforeClose } from './closing';

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
  /**
   * The writes asked for, one after another: two at once on the thread
   * pool of the core could land out of order, and the older settings be
   * those left in the file.
   */
  #saving: Promise<void> = Promise.resolve();
  /** Whether something was changed that is not yet written, or could not be. */
  #unsaved = false;

  constructor() {
    // A setting changed a moment before the window closes is written before it goes.
    beforeClose(() => this.flush(), 'first');
  }

  /** The theme in effect, with "system" resolved. */
  get theme(): 'light' | 'dark' | 'mellow' | 'own' {
    const t = this.value.theme;
    return t === 'system' ? (this.#systemDark ? 'dark' : 'light') : t;
  }

  async load() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    this.#systemDark = media.matches;
    media.addEventListener('change', (e) => (this.#systemDark = e.matches));
    let kept: Partial<AllSettings>;
    try {
      const loaded = await settingsLoad();
      kept = loaded.settings;
      // A damaged file was set aside, and the defaults are used: said, never in silence.
      if (loaded.setAside)
        notifyError(
          t(loaded.setAside.personKept ? 'settings-set-aside' : 'settings-set-aside-person', {
            path: loaded.setAside.path,
          }),
          loaded.setAside.reason,
        );
    } catch (error) {
      notifyError(t('settings-error-read'), error);
      this.loaded = true;
      return;
    }
    try {
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
      // The first writing, of the person made: a failed save, not a failed read.
      notifyError(t('settings-error-save'), error);
    }
    this.loaded = true;
  }

  /** Writes at once what would otherwise be written in a moment. */
  saveNow(): Promise<void> {
    clearTimeout(this.#saveTimer);
    return this.#write();
  }

  /** Writes what is not yet written, if anything; waits for the writes begun. */
  flush(): Promise<void> {
    return this.#unsaved ? this.saveNow() : this.#saving;
  }

  /** Writes the settings as they are now, after the writes asked for before. */
  #write(): Promise<void> {
    const value = $state.snapshot(this.value);
    this.#unsaved = false;
    const done = this.#saving.then(() => settingsSave(value));
    this.#saving = done.catch(() => {
      this.#unsaved = true;
    });
    return done;
  }

  /** What is done with citations that are found, changed in part. */
  setFound(change: Partial<FoundSettings>) {
    this.set('found', { ...$state.snapshot(this.value.found), ...change });
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  set<K extends keyof MoreSettings>(key: K, value: MoreSettings[K]): void;
  set(key: keyof AllSettings, value: AllSettings[keyof AllSettings]) {
    Object.assign(this.value, { [key]: value });
    this.#unsaved = true;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#write().catch((error) => notifyError(t('settings-error-save'), error));
    }, 300);
  }
}

export const settings = new SettingsState();
