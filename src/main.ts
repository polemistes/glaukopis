import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/literata/wght-italic.css';
import './app.css';
import './placing.css';
import './settings.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { nameLanguagesBy } from '$lib/editor/schema';
import { languageName } from '$lib/i18n';
import { inTauri } from '$lib/api/backend';
import { logPage } from '$lib/api/system';
import { guardPaste, pastesThroughGtk } from '$lib/util/paste';
import { forwardToLog } from '$lib/shell/page-log';

nameLanguagesBy(languageName);

// What the page says of its faults reaches the log of the run, where it can
// be read after the window is gone: the console's warnings and errors, and
// what no one caught; a few lines a second, the rest counted (record 0052).
if (inTauri) forwardToLog(logPage);

// WebKitGTK does not paste safely; the Rust side reads the clipboard instead (record 0048).
if (inTauri && pastesThroughGtk) guardPaste();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
