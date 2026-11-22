// A first look at the app on the emulator: what the web view is, whether
// the page is the note's, and what the page knows of the system's bars.
import { page, screenshot, ownFiles } from './device.mjs';
const p = await page();
console.log(await p.evaluate(`JSON.stringify({
  agent: navigator.userAgent,
  url: location.href,
  editor: !!document.querySelector('.ProseMirror'),
  inner: [innerWidth, innerHeight], ratio: devicePixelRatio,
  top: getComputedStyle(document.documentElement).getPropertyValue('--x') ,
  insets: (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.append(d); const s = getComputedStyle(d); const r = [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]; d.remove(); return r; })(),
  viewport: document.querySelector('meta[name=viewport]')?.content,
  lang: document.documentElement.lang, theme: document.documentElement.dataset.theme,
}, null, 1)`));
console.log(await ownFiles('.'));
p.close();
