/**
 * The page of the window of a note (record 0109), mounted by `main.ts` in
 * the window the shell labels `note` instead of the application: nothing
 * of the projects, the library or the notebook is loaded. The settings are
 * read, never written, for the window's language and its look (the theme,
 * the colours of one's own, the size of the interface and of the text);
 * then the note not sent before is shown in the field.
 */

import { mount } from 'svelte';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { inTauri } from '$lib/api/backend';
import { fileRead, languagesInfo, type Settings } from '$lib/api/system';
import { noteWindowFilePath, noteWindowStart, type NoteWindowStart } from '$lib/api/notewindow';
import { pictures } from '$lib/figures/pictures.svelte';
import { files } from '$lib/files/store.svelte';
import { languages, load, t } from '$lib/i18n';
import { settings } from '$lib/state/settings.svelte';
import { applyOwn } from '$lib/theme/own';
import NoteWindow from './NoteWindow.svelte';

/** The theme in effect, with "system" resolved as the system has it now. */
function themeOf(theme: Settings['theme']): string {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Speaks the language of the settings, or that of the system; the
 * language new texts are given, as the settings say.
 */
async function speak(chosen: Settings) {
  try {
    const info = await languagesInfo();
    languages.system = info.system;
    languages.interface = info.interface;
    languages.interfaceDefault = info.interfaceDefault;
    languages.texts = info.texts;
    languages.textDefault = info.textDefault;
  } catch (error) {
    console.warn('The languages of the application could not be read: English is used', error);
  }
  const tag = languages.interface.some((l) => l.tag === chosen.language)
    ? chosen.language
    : languages.interfaceDefault;
  try {
    await load(tag);
    languages.current = tag;
    document.documentElement.lang = tag;
  } catch (error) {
    console.warn(`The words of ${tag} could not be loaded`, error);
  }
  const text = chosen.textLanguage;
  languages.newTexts = text && text !== 'system' ? text : languages.textDefault;
}

/** Has the look of the settings: the theme, its colours, the sizes, the font of the text. */
function look(chosen: Settings) {
  const root = document.documentElement;
  const theme = themeOf(chosen.theme);
  root.dataset.theme = theme;
  if (theme === 'own') applyOwn(chosen.ownTheme);
  if (chosen.theme === 'system')
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => (root.dataset.theme = e.matches ? 'dark' : 'light'));
  root.style.setProperty('--text-size', `${chosen.textSize}px`);
  if (chosen.editorFont)
    root.style.setProperty('--font-editor', `"${chosen.editorFont}", var(--font-text)`);
  // Words the stylesheet shows where a figure has no element for them, as the application has them.
  root.style.setProperty('--words-picture-absent', JSON.stringify(t('figures-picture-absent')));
  root.style.setProperty(
    '--words-picture-caption',
    JSON.stringify(t('figures-caption-placeholder')),
  );
  const size = chosen.interfaceSize;
  if (inTauri)
    void getCurrentWebview()
      .setZoom(size > 0 ? size : 1)
      .catch(() => {});
}

/** Mounts the window of a note in `target`, once its settings are read and its words loaded. */
export async function mountNoteWindow(target: HTMLElement) {
  let start: NoteWindowStart = { settings: {}, unsent: null };
  try {
    start = await noteWindowStart();
  } catch (error) {
    console.warn('The window of a note could not be begun', error);
  }
  // The settings as the window reads them, in this page alone and never
  // written: spelling, which this window has no part in, is off.
  settings.value = {
    ...settings.value,
    ...(start.settings as Partial<typeof settings.value>),
    spelling: false,
  };
  const chosen = settings.value;
  await speak(chosen);
  look(chosen);
  // The window has no library: its figures show the files of the note, and
  // what would list the library's files has nothing to list.
  pictures.readFrom = async (hash) => fileRead(await noteWindowFilePath(hash));
  files.loaded = true;
  return mount(NoteWindow, { target, props: { unsent: start.unsent } });
}
