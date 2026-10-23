import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/literata/wght-italic.css';
import './app.css';
import './placing.css';
import './settings.css';
import { mount } from 'svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';
import App from './App.svelte';
import { showCatalogueKinds } from '$lib/editor/kinds';
import { nameLanguagesBy } from '$lib/editor/schema';
import { languageName } from '$lib/i18n';
import { inTauri } from '$lib/api/backend';
import { logPage } from '$lib/api/system';
import { guardPaste, pastesThroughGtk } from '$lib/util/paste';
import { forwardToLog } from '$lib/shell/page-log';

nameLanguagesBy(languageName);

// The kinds of paragraph and of words are seen by the cues of editor/kinds.ts,
// made into a style sheet after app.css, before anything is drawn.
showCatalogueKinds();

// What the page says of its faults reaches the log of the run, where it can
// be read after the window is gone: the console's warnings and errors, and
// what no one caught; a few lines a second, the rest counted (record 0052).
if (inTauri) forwardToLog(logPage);

// WebKitGTK does not paste safely; the Rust side reads the clipboard instead (record 0048).
if (inTauri && pastesThroughGtk) guardPaste();

// The window is made hidden, and shown by the page once it is drawn where it
// was left (App.svelte). Should the page never get so far, it is shown all
// the same after a few seconds, rather than staying hidden; before the page
// is mounted, so that a fault in mounting it does not keep this from coming.
if (inTauri)
  setTimeout(() => {
    const window = getCurrentWindow();
    window
      .isVisible()
      .then((visible) => {
        if (visible) return;
        console.warn('The window was not shown by the page: it is shown now');
        return window.show();
      })
      .catch((error) => console.error('The window could not be shown', error));
  }, 5000);

const app = mount(App, { target: document.getElementById('app')! });

export default app;
