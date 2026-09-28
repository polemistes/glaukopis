import { call } from './backend';

export interface SystemInfo {
  version: string;
  dataDir: string;
  platform: string;
}

export const systemInfo = () => call<SystemInfo>('system_info');

/** The languages of the application, and what the system says: see `i18n`. */
export interface LanguagesInfo {
  /** What the system says its language is: `nb-NO`. */
  system: string;
  /** The languages the interface is in, each with its name in itself. */
  interface: { tag: string; name: string }[];
  /** The language the interface has when none is chosen. */
  interfaceDefault: string;
  /** The languages documents have words of their own in. */
  texts: string[];
  /** The language new texts are given when none is chosen. */
  textDefault: string;
}

export const languagesInfo = () => call<LanguagesInfo>('languages');
/** Sets the language the core speaks in, which is that of the interface. */
export const languageSet = (tag: string) => call<void>('language_set', { tag });

export type Theme = 'system' | 'light' | 'dark';

/** What is done with citations that are found in texts written elsewhere: see `api/found.ts`. */
export interface FoundSettings {
  /** Parentheses with a year in them are taken for citations. */
  years: boolean;
  /** Notes that name a work of the library are taken for citations. */
  named: boolean;
  /** Every note is taken for one. */
  notes: boolean;
  /** When a text is brought in, citations made by Zotero of works the library has are made citations at once. */
  atOnce: boolean;
  /** The citations are gone through when a map has been made of a text. */
  goThrough: boolean;
  /**
   * What becomes of a citation in a note, for all that follow: the note
   * becomes a citation, or the citation stands within the note. Nothing,
   * for what is given for each.
   */
  inNotes: '' | 'citation' | 'within';
}

/** Settings kept in `settings.json` in the data directory. */
export interface Settings {
  theme: Theme;
  /** The language of the interface: a tag, or "system" for that of the system. */
  language: string;
  /** The language new texts are given: a tag, or "system" for that of the system. */
  textLanguage: string;
  /** Size of the researcher's text in the editor, in pixels. */
  textSize: number;
  /** Paths to external programs, when not found automatically. */
  pandocPath: string | null;
  typstPath: string | null;
  /** Identifies the user to bibliographic services that ask for a contact address. */
  contactEmail: string | null;
  /** Name shown to collaborators. */
  displayName: string | null;
  /** The server that was last used for sharing a project, or joining one. */
  server: string | null;
  /** The style and format that new maps start with. */
  defaultStyle: string;
  defaultFormat: string;
  found: FoundSettings;
  /** Whether spelling is checked as one writes. */
  spelling: boolean;
}

export const defaultSettings: Settings = {
  theme: 'system',
  language: 'system',
  textLanguage: 'system',
  textSize: 17,
  pandocPath: null,
  typstPath: null,
  contactEmail: null,
  displayName: null,
  server: null,
  defaultStyle: 'chicago-notes-bibliography',
  defaultFormat: 'manuscript',
  found: { years: false, named: false, notes: false, atOnce: true, goThrough: true, inNotes: '' },
  spelling: true,
};

export const settingsLoad = () => call<Partial<Settings>>('settings_load');
export const settingsSave = (settings: Settings) => call<void>('settings_save', { settings });
