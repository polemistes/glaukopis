/**
 * What the page needs of the system's web view, which the build does not
 * make for an older one: the least that has it all is Safari 16.4, which
 * macOS 11 Big Sur and later get through Software Update. An older web view
 * runs the page part of the way and fails here and there, as in opening a
 * shared project; it is looked at before the page starts, and the page says
 * so in place of starting (`sayTooOld`).
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '$lib/api/backend';
import { ENGLISH, languages, load, localeTags, nearest, t } from '$lib/i18n';

/** What a web view has, as the page reaches it: `globalThis`, or a stand-in in a test. */
export interface WebView {
  structuredClone?: unknown;
  crypto?: { randomUUID?: unknown };
  Array: { prototype: object };
  HTMLDialogElement?: { prototype: object };
  CSS?: { supports?: (property: string, value: string) => boolean };
  RegExp: new (source: string) => unknown;
}

/** What the web view lacks of what the page needs, by name; nothing where it has it all. */
export function missingFromWebView(view: WebView = globalThis as unknown as WebView): string[] {
  const needs: [string, () => unknown][] = [
    ['structuredClone', () => typeof view.structuredClone === 'function'],
    ['crypto.randomUUID', () => typeof view.crypto?.randomUUID === 'function'],
    ['Array.prototype.at', () => 'at' in view.Array.prototype],
    ['dialog', () => !!view.HTMLDialogElement && 'showModal' in view.HTMLDialogElement.prototype],
    ['color-mix', () => view.CSS?.supports?.('color', 'color-mix(in srgb, red, blue)')],
    // Built at run time, as search builds them: an older web view throws.
    ['lookbehind', () => new view.RegExp('(?<!a)b')],
  ];
  return needs
    .filter(([, has]) => {
      try {
        return !has();
      } catch {
        return true;
      }
    })
    .map(([name]) => name);
}

/** Says, in place of the page, that the web view is too old for it: in the system's language. */
export async function sayTooOld(target: HTMLElement, missing: string[]): Promise<void> {
  console.error(
    `The system's web view is older than the page needs: it lacks ${missing.join(', ')}`,
  );
  const tag = nearest(navigator.language, localeTags()) ?? ENGLISH;
  try {
    await load(tag);
    languages.current = tag;
  } catch {
    // In English, then.
  }
  const said = document.createElement('div');
  said.setAttribute('role', 'alert');
  said.style.cssText =
    'max-width: 34em; margin: 4em auto; padding: 0 1.5em; font: 15px/1.5 system-ui, sans-serif';
  const heading = document.createElement('h1');
  heading.style.cssText = 'font-size: 1.3em; font-weight: 600';
  heading.textContent = t('shell-web-view-too-old-title');
  const text = document.createElement('p');
  text.textContent = t('shell-web-view-too-old');
  said.append(heading, text);
  target.replaceChildren(said);
  if (inTauri) await getCurrentWindow().show();
}
