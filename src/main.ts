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

nameLanguagesBy(languageName);

// What goes wrong in the page and is caught by no one is written into the log
// of the run, where it can be read after the window is gone. No more than a
// hundred a run, lest one fault repeated fill it.
/** Where in the code an error came about, on lines of its own; WebKit's stack does not repeat the message. */
function stackOf(error: unknown): string {
  const stack = (error as { stack?: unknown } | null)?.stack;
  return typeof stack === 'string' && stack.trim() ? `\n${stack.trim()}` : '';
}

if (inTauri) {
  let told = 0;
  const tell = (message: string) => {
    if (told++ < 100) logPage('error', message).catch(() => {});
  };
  window.addEventListener('error', (event) => {
    const where = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : '';
    tell(`${event.message}${where}${stackOf(event.error)}`);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    tell(`a promise failed unheard: ${reason?.message ?? String(reason)}${stackOf(reason)}`);
  });
}

// WebKitGTK does not paste safely; the Rust side reads the clipboard instead (record 0048).
if (inTauri && pastesThroughGtk) guardPaste();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
