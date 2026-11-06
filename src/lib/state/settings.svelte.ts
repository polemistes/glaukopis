import {
  defaultSettings,
  settingsLoad,
  settingsSet,
  type FoundSettings,
  type Settings,
} from '$lib/api/system';
import type { KindFamily, Look } from '$lib/api/documents';
import type { Person } from '$lib/project/model/types';
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

/** How the files of the library are shown (ADR 0070): kept for every folder, not one by one. */
export interface FilesViewSettings {
  /** One line each, or their thumbnails. */
  mode: 'list' | 'grid';
  /** How large the thumbnails are. */
  size: 'small' | 'medium' | 'large';
  sort: 'name' | 'kind' | 'added' | 'size' | 'reference' | 'year' | 'title' | 'publisher';
  descending: boolean;
  /** Whether a folder shows the files of the folders under it as well. */
  below: boolean;
}

const FILES_VIEW: FilesViewSettings = {
  mode: 'list',
  size: 'medium',
  sort: 'name',
  descending: false,
  below: false,
};

/** The way the files are shown, as it was kept, read with care: what is not one of the choices is the default. */
export function filesViewOf(kept: unknown): FilesViewSettings {
  const k = (kept && typeof kept === 'object' ? kept : {}) as Partial<
    Record<keyof FilesViewSettings, unknown>
  >;
  const one = <T extends string>(value: unknown, choices: readonly T[], otherwise: T): T =>
    choices.includes(value as T) ? (value as T) : otherwise;
  return {
    mode: one(k.mode, ['list', 'grid'], FILES_VIEW.mode),
    size: one(k.size, ['small', 'medium', 'large'], FILES_VIEW.size),
    sort: one(
      k.sort,
      ['name', 'kind', 'added', 'size', 'reference', 'year', 'title', 'publisher'],
      FILES_VIEW.sort,
    ),
    descending: typeof k.descending === 'boolean' ? k.descending : FILES_VIEW.descending,
    below: typeof k.below === 'boolean' ? k.below : FILES_VIEW.below,
  };
}

/** How the diagram numbers its boxes (record 0083): as the document prints the headings, every element from the element in view, or not at all. */
export type DiagramNumbers = 'printed' | 'tree' | 'hidden';

/** What is kept in the settings beyond what `api/system.ts` declares. */
export interface MoreSettings {
  /** The kinds of paragraph and of words made in any project, the latest first. */
  passageKinds: RememberedPassageKind[];
  /**
   * Whether a chip at the edge of a page of the preview says what the line
   * the pointer rests on is, and opens Look at it. On, unless turned off.
   */
  pageChips: boolean;
  /**
   * Whether the number a heading will print stands before its name in the
   * text view (records 0079, 0081). Shown, unless turned off; the outline
   * has it always.
   */
  headingNumbersText: boolean;
  /**
   * The numbers before the names in the diagram (records 0079, 0081, 0083):
   * as the document prints them, of every element from the element in
   * view, or hidden. As printed, unless chosen otherwise.
   */
  headingNumbersDiagram: DiagramNumbers;
  /** How the files of the library are shown. */
  filesView: FilesViewSettings;
}

export type AllSettings = Settings & MoreSettings;

/**
 * A setting of the numbers of the headings in one view, where it is kept;
 * else the one setting of both views that came before it, where that is
 * kept; else shown.
 */
function shownOr(own: unknown, kept: object): boolean {
  if (typeof own === 'boolean') return own;
  const before = (kept as { headingNumbers?: unknown }).headingNumbers;
  return typeof before === 'boolean' ? before : true;
}

/**
 * The numbers of the diagram as they were kept: one of the three words;
 * else the on-or-off of 0081, or the one setting before it, read as printed
 * or hidden.
 */
function diagramNumbersOf(own: unknown, kept: object): DiagramNumbers {
  if (own === 'printed' || own === 'tree' || own === 'hidden') return own;
  return shownOr(own, kept) ? 'printed' : 'hidden';
}

const more = (kept: Partial<AllSettings> = {}): MoreSettings => ({
  passageKinds: Array.isArray(kept.passageKinds)
    ? kept.passageKinds.filter((k) => k && typeof k.name === 'string')
    : [],
  pageChips: typeof kept.pageChips === 'boolean' ? kept.pageChips : true,
  headingNumbersText: shownOr(kept.headingNumbersText, kept),
  headingNumbersDiagram: diagramNumbersOf(kept.headingNumbersDiagram, kept),
  filesView: filesViewOf(kept.filesView),
});

/**
 * The writer as an author of a document, from their details in the
 * settings: the name, the organisation, the email and the ORCID, as the
 * settings of a document take an author. Nothing where no name is given.
 * The position, the address and the phone have no place there yet.
 */
export function authorOf(value: Settings): Person | null {
  const name = [value.firstName, value.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  if (!name) return null;
  const author: Person = { name };
  const organisation = value.organization?.trim();
  const email = value.contactEmail?.trim();
  const orcid = value.orcid?.trim();
  if (organisation) author.affiliation = organisation;
  if (email) author.email = email;
  if (orcid) author.orcid = orcid;
  return author;
}

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
  /**
   * The keys changed and not yet written: only they are written, merged
   * into the file by the core, so that what another window changed is not
   * written over (ADR 0085).
   */
  #changed = new Set<keyof AllSettings>();

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
        this.#changed.add('person');
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

  /**
   * Reads the settings again, as another window wrote them: what this
   * window changed and has not yet written is kept over what is read.
   */
  async reload() {
    let kept: Partial<AllSettings>;
    try {
      kept = (await settingsLoad()).settings;
    } catch (error) {
      console.warn('The settings could not be read again', error);
      return;
    }
    const mine = Object.fromEntries(
      [...this.#changed].map((key) => [key, $state.snapshot(this.value[key])]),
    ) as Partial<AllSettings>;
    const merged = { ...kept, ...mine };
    this.value = {
      ...defaultSettings,
      ...merged,
      ...more(merged),
      found: { ...defaultSettings.found, ...(merged.found ?? {}) },
    };
  }

  /** Writes what was changed, after the writes asked for before. */
  #write(): Promise<void> {
    const keys = [...this.#changed];
    this.#changed.clear();
    this.#unsaved = false;
    if (!keys.length) return this.#saving;
    // A key whose value is gone is written as null, which takes it out.
    const changed = Object.fromEntries(
      keys.map((key) => [key, $state.snapshot(this.value[key]) ?? null]),
    ) as Partial<AllSettings>;
    const done = this.#saving.then(() => settingsSet(changed));
    this.#saving = done.catch(() => {
      // What could not be written is written with the next.
      for (const key of keys) this.#changed.add(key);
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
    this.#changed.add(key);
    this.#unsaved = true;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#write().catch((error) => notifyError(t('settings-error-save'), error));
    }, 300);
  }
}

export const settings = new SettingsState();
