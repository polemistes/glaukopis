import { call } from './backend';

export interface SystemInfo {
  version: string;
  dataDir: string;
  platform: string;
}

export const systemInfo = () => call<SystemInfo>('system_info');

export type Theme = 'system' | 'light' | 'dark';

/** Settings kept in `settings.json` in the data directory. */
export interface Settings {
  theme: Theme;
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
}

export const defaultSettings: Settings = {
  theme: 'system',
  textSize: 17,
  pandocPath: null,
  typstPath: null,
  contactEmail: null,
  displayName: null,
  server: null,
  defaultStyle: 'chicago-notes-bibliography',
  defaultFormat: 'manuscript',
};

export const settingsLoad = () => call<Partial<Settings>>('settings_load');
export const settingsSave = (settings: Settings) => call<void>('settings_save', { settings });
