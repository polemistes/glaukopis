import { call } from './backend';
import type { Layout } from './ocr';
import type { Arrangement } from '$lib/project/sides.svelte';

export interface SystemInfo {
  version: string;
  dataDir: string;
  /** The folder of the logs of the last runs. */
  logs: string;
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
/**
 * Shows a file or a folder anywhere on this computer in the file manager,
 * by its full path: what was exported, say. A file of the library is shown
 * by `attachmentReveal`, with its stored path.
 */
export const revealPath = (path: string) => call<void>('reveal_path', { path });

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

/** How the text shows how deep each element stands: see `Settings.textDepth`. */
export type TextDepth = 'numbers' | 'dots' | 'indent';

/**
 * The window's size and place on the screen as it was closed, in logical
 * pixels, and whether it was maximised: given back before it is shown
 * (ADR 0063). The size is that of what is inside the frame, as it is set;
 * the place that of the frame's corner.
 */
export interface WindowPlace {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
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
  /**
   * How the text of a map shows how deep each element stands, on the screen
   * only: numbers as in an outline, dots, or the names set in, with lines.
   */
  textDepth: TextDepth;
  /** The view a new project opens in: its diagram, or its text. */
  newProjectView: 'diagram' | 'text';
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
  /**
   * The user's email address, among their details. Like every detail, it is
   * never sent anywhere by Glaukopis itself.
   */
  contactEmail: string | null;
  /** Name shown to collaborators: the first and the last name, where they are given. */
  displayName: string | null;
  /**
   * The user's details. The name, the organisation, the email and the ORCID
   * make the author of a new project (`authorOf` in state/settings); the
   * position, the address and the phone are kept for documents that will
   * ask for them, and used by nothing yet.
   */
  firstName: string | null;
  lastName: string | null;
  organization: string | null;
  position: string | null;
  address: string | null;
  phone: string | null;
  orcid: string | null;
  /** The font the text editor sets the user's text in; none for that of the interface's text. */
  editorFont: string | null;
  /**
   * Who this installation is, in the history of projects (ADR 0021): made
   * once, when the settings are first read.
   */
  person: string | null;
  /** The server that was last used for sharing a project, or joining one. */
  server: string | null;
  /** The style, the format and the template a document has where its element says nothing (ADR 0038). */
  defaultStyle: string;
  defaultFormat: string;
  defaultTemplate: string;
  found: FoundSettings;
  /** Whether spelling is checked as one writes. */
  spelling: boolean;
  /** Whether a break within a paragraph is shown by its sign, ↵ (ADR 0033). */
  breakSigns: boolean;
  /**
   * Where languages of spelling and of OCR are imported from: the address
   * of a server, or a folder; none for the project's own (ADR 0032).
   */
  languagesServer: string | null;
  /** The kinds of elements made in any project, by name, with the colour each had last: offered when a kind is named. */
  kinds: { name: string; colour: string }[];
  /**
   * Whether the list of projects stands at the left (ADR 0033, 0063). Called
   * `projectsPane` while it was hidden unless asked for; the new name shows it
   * once to everyone, as the one tree it now is.
   */
  projectsList: boolean;
  /** The projects last opened, by id, the latest first: the start screen shows them (ADR 0063). */
  recentProjects: string[];
  /**
   * The place the window was at, as the address writes it (`formatRoute`):
   * gone to at start where the address names none (ADR 0063).
   */
  lastPlace: string | null;
  /** The window's size and place as it was closed; none until it has been closed once. */
  window: WindowPlace | null;
  /** The sides of the window and its panes, as they were left (ADR 0064): see `project/sides.svelte.ts`. */
  arrangement: Partial<Arrangement> | null;
  /** How wide it is, in pixels. */
  projectsPaneWidth: number;
  /** How wide the collections or folders of the library are, in pixels; the same for references and files. */
  librarySideWidth: number;
  /** How wide the pane of what is selected in the library is, in pixels. */
  libraryDetailWidth: number;
}

export const defaultSettings: Settings = {
  theme: 'system',
  ownTheme: { paper: '#f3ebe1', ink: '#3a3744', accent: '#4b8c88', gold: '#bf7340' },
  language: 'system',
  textLanguage: 'system',
  textSize: 17,
  interfaceSize: 1,
  textDepth: 'numbers',
  newProjectView: 'diagram',
  pandocPath: null,
  tesseractPath: null,
  ocrLanguages: [],
  ocrDpi: 0,
  ocrLayout: '',
  ocrContrast: false,
  contactEmail: null,
  displayName: null,
  firstName: null,
  lastName: null,
  organization: null,
  position: null,
  address: null,
  phone: null,
  orcid: null,
  editorFont: null,
  person: null,
  server: null,
  defaultStyle: 'chicago-notes-bibliography',
  defaultFormat: 'manuscript',
  defaultTemplate: 'plain',
  found: { years: false, named: false, notes: false, atOnce: true, goThrough: true, inNotes: '' },
  spelling: true,
  breakSigns: true,
  languagesServer: null,
  kinds: [],
  projectsList: true,
  recentProjects: [],
  lastPlace: null,
  window: null,
  arrangement: null,
  projectsPaneWidth: 240,
  librarySideWidth: 224,
  libraryDetailWidth: 400,
};

/** A damaged file of settings, set aside at the start under its name with `.broken-<time>` added. */
export interface SettingsSetAside {
  /** Where it is now. */
  path: string;
  /** Why it could not be read. */
  reason: string;
  /** Whether the id of the person could be read from it, and is kept. */
  personKept: boolean;
}

/**
 * The settings as they are kept, and the file that was set aside if it was
 * damaged: the settings are then the defaults, with the person kept where
 * it could be read.
 */
export interface SettingsLoaded {
  settings: Partial<Settings>;
  setAside: SettingsSetAside | null;
}

export const settingsLoad = () => call<SettingsLoaded>('settings_load');
export const settingsSave = (settings: Settings) => call<void>('settings_save', { settings });

/** Writes into the log of the run what went wrong in the page: see `shell/page-log.ts`. */
export const logPage = (level: 'error' | 'warn', message: string) =>
  call<void>('log_page', { level, message });
