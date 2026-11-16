/**
 * The plugin's event page: the button in the bar, the menu of the right
 * button, the keys; what each asks of the page; and the handing over to the
 * helper Firefox starts, which writes the thing into the inbox of the
 * notebook of Glaukopis. The plugin says nothing but a sign on its button
 * for a few seconds: a tick when the thing was handed over, an exclamation
 * mark when not, with the reason as the button's title.
 */

import { markRegion, readImage, readPage, readSelection } from './page.js';
import {
  HELPER,
  base64OfBytes,
  bytesOfDataUrl,
  cropOf,
  messageOf,
  nameOfImage,
  outcomeOf,
  partsOfDataUrl,
} from './reckon.js';

const menus = browser.menus || browser.contextMenus;
const words = (name) => browser.i18n.getMessage(name) || name;

/** How long the sign stays on the button, in milliseconds. */
const SIGN_OK = 3000;
const SIGN_NOT = 8000;

// ---- the sign on the button ----

const signTimers = new Map();

async function sign(tabId, what, title) {
  clearTimeout(signTimers.get(tabId));
  const text = what === 'ok' ? '✓' : what === 'not' ? '!' : '…';
  const colour = what === 'ok' ? '#2e7d32' : what === 'not' ? '#b3261e' : '#666666';
  try {
    await browser.action.setBadgeBackgroundColor({ tabId, color: colour });
    await browser.action.setBadgeText({ tabId, text });
    await browser.action.setTitle({ tabId, title: title ?? null });
  } catch {
    // The tab is gone.
    return;
  }
  if (what === 'busy') return;
  signTimers.set(
    tabId,
    setTimeout(
      () => {
        signTimers.delete(tabId);
        browser.action.setBadgeText({ tabId, text: '' }).catch(() => {});
        browser.action.setTitle({ tabId, title: null }).catch(() => {});
      },
      what === 'ok' ? SIGN_OK : SIGN_NOT,
    ),
  );
}

const done = (tabId) => sign(tabId, 'ok', words('signDone'));
const notDone = (tabId, reason) => sign(tabId, 'not', words(reason));

// ---- the helper ----

/**
 * Hands one message to the helper and waits for its answer: one port for
 * each thing, closed when it is answered. Where the helper cannot be
 * started, Firefox closes the port without an answer, saying why.
 */
function handOver(message) {
  return new Promise((resolve) => {
    let answered = false;
    let port;
    try {
      port = browser.runtime.connectNative(HELPER);
    } catch (error) {
      resolve(outcomeOf(null, String(error?.message ?? error)));
      return;
    }
    port.onMessage.addListener((answer) => {
      if (answered) return;
      answered = true;
      resolve(outcomeOf(answer));
      port.disconnect();
    });
    port.onDisconnect.addListener((closed) => {
      if (answered) return;
      answered = true;
      resolve(outcomeOf(null, closed?.error?.message ?? ''));
    });
    try {
      port.postMessage(message);
    } catch (error) {
      if (answered) return;
      answered = true;
      resolve(outcomeOf(null, String(error?.message ?? error)));
      port.disconnect();
    }
  });
}

/** Hands a thing over, with the sign on the button saying how it went. */
async function give(tabId, kind, page, parts) {
  const outcome = await handOver(messageOf(kind, page, parts));
  if (outcome.ok) await done(tabId);
  else await notDone(tabId, outcome.reason);
}

// ---- the page ----

/** Runs a function of `page.js` in the tab, with the files it needs first; gives what it gave, or throws where the page does not let itself be read. */
async function inPage(tabId, frameId, func, args = [], files = []) {
  const target = frameId ? { tabId, frameIds: [frameId] } : { tabId };
  if (files.length) await browser.scripting.executeScript({ target, files });
  const [first] = await browser.scripting.executeScript({ target, func, args });
  if (first?.error) throw first.error;
  return first?.result ?? null;
}

/** The address and the title of the tab, as Firefox says them; where it does not, as the page does. */
const pageOf = (tab, got) => ({
  url: tab?.url || got?.url || '',
  title: tab?.title || got?.title || '',
});

/** Cuts a rectangle of the window's view out of a picture of the tab, as PNG in base64. */
async function cutOut(tab, rect, view) {
  const shot = await browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const parts = partsOfDataUrl(shot);
  const bytes = bytesOfDataUrl(shot);
  if (!parts || !bytes) return null;
  const bitmap = await createImageBitmap(new Blob([bytes], { type: parts.type }));
  const crop = cropOf(rect, view, { width: bitmap.width, height: bitmap.height });
  if (!crop) return null;
  const canvas = new OffscreenCanvas(crop.width, crop.height);
  canvas
    .getContext('2d')
    .drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return base64OfBytes(new Uint8Array(await blob.arrayBuffer()));
}

async function addPage(tab) {
  await sign(tab.id, 'busy');
  let got;
  try {
    got = await inPage(tab.id, 0, readPage, [], ['vendor/readability/Readability.js']);
  } catch {
    return notDone(tab.id, 'reasonPageClosed');
  }
  if (!got) return notDone(tab.id, 'reasonPageClosed');
  await give(tab.id, 'page', pageOf(tab, got), { text: got.text, html: got.html });
}

/**
 * Adds what is selected; gives false where nothing is, so that the page can
 * be added instead. From the menu, Firefox says the words selected itself:
 * where the page cannot be read, or the selection is where it cannot be
 * reached, those words are handed over alone.
 */
async function addSelection(tab, frameId = 0, said = '') {
  let got;
  try {
    got = await inPage(tab.id, frameId, readSelection);
  } catch {
    got = null;
    if (!said.trim()) {
      await notDone(tab.id, 'reasonPageClosed');
      return true;
    }
  }
  if (!got && said.trim()) got = { text: said, html: '' };
  if (!got) return false;
  await sign(tab.id, 'busy');
  await give(tab.id, 'selection', pageOf(tab, got), { text: got.text, html: got.html });
  return true;
}

/** The button and the key: what is selected where something is, else the page. */
async function addFromTab(tab) {
  if (!tab?.id) return;
  if (!(await addSelection(tab))) await addPage(tab);
}

async function addImage(tab, info) {
  await sign(tab.id, 'busy');
  let got;
  try {
    got = await inPage(tab.id, info.frameId, readImage, [info.targetElementId]);
  } catch {
    return notDone(tab.id, 'reasonPageClosed');
  }
  if (!got) return notDone(tab.id, 'reasonNoImage');
  const page = pageOf(tab, got);
  let image = got.png ? partsOfDataUrl(got.png)?.base64 : null;
  // Where the page does not let the image be read, it is cut out of the tab where
  // it is shown; in a frame, where it is shown in the tab is not known.
  if (!image && !info.frameId) {
    try {
      image = await cutOut(tab, got.rect, got.view);
    } catch {
      image = null;
    }
  }
  if (!image) return notDone(tab.id, 'reasonNoImage');
  await give(tab.id, 'image', page, { image, alt: got.alt, name: nameOfImage(got.src) });
}

async function addRegion(tab) {
  let got;
  try {
    got = await inPage(tab.id, 0, markRegion);
  } catch {
    return notDone(tab.id, 'reasonPageClosed');
  }
  // Given up with Esc.
  if (!got) return;
  await sign(tab.id, 'busy');
  let image = null;
  try {
    image = await cutOut(tab, got.rect, got.view);
  } catch {
    image = null;
  }
  if (!image) return notDone(tab.id, 'reasonNoImage');
  await give(tab.id, 'region', pageOf(tab, got), { image });
}

// ---- the menus, the button, the keys ----

const MENUS = [
  { id: 'page', contexts: ['page'], title: 'menuPage' },
  { id: 'selection', contexts: ['selection'], title: 'menuSelection' },
  { id: 'image', contexts: ['image'], title: 'menuImage' },
  { id: 'region', contexts: ['page', 'selection', 'image', 'link'], title: 'menuRegion' },
];

async function makeMenus() {
  await menus.removeAll();
  for (const m of MENUS) menus.create({ id: m.id, contexts: m.contexts, title: words(m.title) });
}

// Made when the plugin is installed or brought up to date, and again when
// Firefox starts, where it has not kept them.
for (const event of [browser.runtime.onInstalled, browser.runtime.onStartup])
  event.addListener(() => {
    makeMenus().catch((error) => console.error('the menus could not be made', error));
  });

menus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  const run = {
    page: () => addPage(tab),
    selection: () =>
      addSelection(tab, info.frameId, info.selectionText ?? '').then(
        (added) => added || notDone(tab.id, 'reasonNothing'),
      ),
    image: () => addImage(tab, info),
    region: () => addRegion(tab),
  }[info.menuItemId];
  run?.().catch((error) => {
    console.error(error);
    notDone(tab.id, 'reasonNotWritten');
  });
});

browser.action.onClicked.addListener((tab) => {
  addFromTab(tab).catch((error) => {
    console.error(error);
    notDone(tab.id, 'reasonNotWritten');
  });
});

/** What each key does, by the name the manifest gives it. */
const KEYS = {
  'add-to-notebook': addFromTab,
  'add-region': addRegion,
  'add-page': addPage,
};

browser.commands.onCommand.addListener(async (command, given) => {
  const run = KEYS[command];
  if (!run) return;
  const tab = given ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0];
  if (!tab?.id) return;
  run(tab).catch((error) => {
    console.error(error);
    notDone(tab.id, 'reasonNotWritten');
  });
});
