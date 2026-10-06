import { call } from './backend';
import type { Layout } from './ocr';

export interface SystemInfo {
  version: string;
  dataDir: string;
  platform: string;
  /** The name the system gives the user: their full name where it is known, or their login. */
  user: string;
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

export type Theme = 'system' | 'light' | 'dark' | 'mellow' | 'own';

/** The four colours a colouring of one's own is made from: see `theme/own.ts`. */
export interface OwnTheme {
  paper: string;
  ink: string;
  accent: string;
  gold: string;
}

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
  /** The colours of the theme "own". */
  ownTheme: OwnTheme;
  /** The language of the interface: a tag, or "system" for that of the system. */
  language: string;
  /** The language new texts are given: a tag, or "system" for that of the system. */
  textLanguage: string;
  /** Size of the researcher's text in the editor, in pixels. */
  textSize: number;
  /** Size of the whole interface, as a zoom of the window: 1 as it is made. */
  interfaceSize: number;
  /** Paths to external programs, when not found automatically. */
  pandocPath: string | null;
  tesseractPath: string | null;
  /**
   * Tesseract's names of the languages text is read in at first (`nor`,
   * `eng`); none, for the language of the text and that of the interface.
   */
  ocrLanguages: string[];
  /** How text is read at first: the resolution (0 for 300), the layout of the page, and whether it is made black and white. See `api/ocr.ts`. */
  ocrDpi: number;
  ocrLayout: Layout;
  ocrContrast: boolean;
  /** Identifies the user to bibliographic services that ask for a contact address. */
  contactEmail: string | null;
  /** Name shown to collaborators. */
  displayName: string | null;
  /**
   * Who this installation is, in the history of projects (ADR 0021): made
   * once, when the settings are first read.
   */
  person: string | null;
  /** The server that was last used for sharing a project, or joining one. */
  server: string | null;
  /** The style and format that new maps start with. */
  defaultStyle: string;
  defaultFormat: string;
  found: FoundSettings;
  /** Whether spelling is checked as one writes. */
  spelling: boolean;
  /**
   * Where languages of spelling and of OCR are imported from: the address
   * of a server, or a folder; none for the project's own (ADR 0032).
   */
  languagesServer: string | null;
  /** The kinds of elements made in any project, by name, with the colour each had last: offered when a kind is named. */
  kinds: { name: string; colour: string }[];
}

export const defaultSettings: Settings = {
  theme: 'system',
  ownTheme: { paper: '#f3ebe1', ink: '#3a3744', accent: '#4b8c88', gold: '#bf7340' },
  language: 'system',
  textLanguage: 'system',
  textSize: 17,
  interfaceSize: 1,
  pandocPath: null,
  tesseractPath: null,
  ocrLanguages: [],
  ocrDpi: 0,
  ocrLayout: '',
  ocrContrast: false,
  contactEmail: null,
  displayName: null,
  person: null,
  server: null,
  defaultStyle: 'chicago-notes-bibliography',
  defaultFormat: 'manuscript',
  found: { years: false, named: false, notes: false, atOnce: true, goThrough: true, inNotes: '' },
  spelling: true,
  languagesServer: null,
  kinds: [],
};

export const settingsLoad = () => call<Partial<Settings>>('settings_load');
export const settingsSave = (settings: Settings) => call<void>('settings_save', { settings });
