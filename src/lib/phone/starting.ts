/**
 * What the phone's page knows before anything of it is drawn (stage 2 of
 * `docs/plans/an-app-for-android.md`): the measures of a finger, the
 * settings and the languages, the words of the language of the interface,
 * and the notebook as a phone opens it. Then the places begin, at the notes.
 */

import './phone.css';
import { languagesInfo } from '$lib/api/system';
import { files } from '$lib/files/store.svelte';
import { languages, load } from '$lib/i18n';
import { theNotebook } from '$lib/notebook/open.svelte';
import { settings } from '$lib/state/settings.svelte';
import { places } from './places.svelte';

/** The language of the interface: the one chosen in the settings, else the system's. */
export function interfaceTag(): string {
  const chosen = settings.value.language;
  return languages.interface.some((l) => l.tag === chosen) ? chosen : languages.interfaceDefault;
}

/** The languages of the application, as the core finds them for the language the web view says the system speaks. */
async function knowLanguages() {
  try {
    const info = await languagesInfo(navigator.language || undefined);
    languages.system = info.system;
    languages.interface = info.interface;
    languages.interfaceDefault = info.interfaceDefault;
    languages.texts = info.texts;
    languages.textDefault = info.textDefault;
  } catch (error) {
    // The page goes on in English, the language it always has; the log is told.
    console.warn('The languages of the application could not be read: English is used', error);
  }
}

/** Makes the page ready to be drawn. Nothing of it fails: what cannot be had is said in the log, and the page is drawn all the same. */
export async function begin(): Promise<void> {
  document.documentElement.dataset.phone = '';
  await Promise.all([settings.load(), knowLanguages()]);
  // Spelling is off in this page's copy of the settings, and not written:
  // the phone's keyboard has its own.
  settings.value.spelling = false;
  // The words of the language, lest the page be shown in English first.
  // Those that do not come are tried again, and said, by the page's frame.
  const tag = interfaceTag();
  await load(tag).then(
    () => (languages.current = tag),
    (error) => console.warn(`The words of ${tag} could not be loaded`, error),
  );
  // Nothing lists the library's files here: the pictures are read from its store.
  files.loaded = true;
  // A phone writes no readable copy, and sweeps no file out of the store.
  theNotebook.readable = false;
  theNotebook.sweeps = false;
  places.begin();
}
