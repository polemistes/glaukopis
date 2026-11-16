/**
 * The event page of the plugin for Firefox (`extension/firefox/background.js`),
 * with a Firefox made of mocks: what the button, the key and the menu ask of
 * the page, what is handed to the helper, and the sign on the button.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import english from '../../../extension/firefox/_locales/en/messages.json';

type Listener = (...args: never[]) => unknown;

function event() {
  const listeners: Listener[] = [];
  return {
    listeners,
    addListener: (f: Listener) => listeners.push(f),
    fire: (...args: unknown[]) =>
      Promise.all(listeners.map((f) => (f as (...a: unknown[]) => unknown)(...args))),
  };
}

/** What the page gives each function put into it, by the function's name. */
let inPage: Record<string, unknown> = {};
/** What the helper answers: an answer, or the port closed with what Firefox says. */
let helper: { answer: unknown } | { closed: string } = { answer: { ok: true } };
const posted: Record<string, unknown>[] = [];

function port() {
  const p = {
    onMessage: event(),
    onDisconnect: event(),
    disconnect: vi.fn(),
    postMessage: vi.fn((message: Record<string, unknown>) => {
      posted.push(message);
      queueMicrotask(() => {
        if ('answer' in helper) void p.onMessage.fire(helper.answer);
        else void p.onDisconnect.fire({ error: { message: helper.closed } });
      });
    }),
  };
  return p;
}

const browser = {
  menus: { removeAll: vi.fn(async () => {}), create: vi.fn(), onClicked: event() },
  i18n: {
    getMessage: (name: string) => (english as Record<string, { message: string }>)[name]?.message,
  },
  action: {
    setBadgeText: vi.fn(async () => {}),
    setBadgeBackgroundColor: vi.fn(async () => {}),
    setTitle: vi.fn(async () => {}),
    onClicked: event(),
  },
  runtime: {
    onInstalled: event(),
    onStartup: event(),
    connectNative: vi.fn(() => port()),
  },
  commands: { onCommand: event() },
  tabs: { query: vi.fn(), captureVisibleTab: vi.fn() },
  scripting: {
    executeScript: vi.fn(async (call: { func?: { name: string }; files?: string[] }) =>
      call.files ? [] : [{ result: inPage[call.func!.name] ?? null }],
    ),
  },
};
vi.stubGlobal('browser', browser);
await import('../../../extension/firefox/background.js');

const tab = { id: 7, windowId: 1, url: 'https://example.org/owl', title: 'The owl' };

/** Until what was set off has been done. */
const settled = () => new Promise((r) => setTimeout(r, 0));

/** The last sign set on the button of the tab, and its title. */
function lastSign() {
  const text = browser.action.setBadgeText.mock.calls.at(-1) as unknown as [{ text: string }];
  const title = browser.action.setTitle.mock.calls.at(-1) as unknown as [{ title: string | null }];
  return { text: text?.[0].text, title: title?.[0].title };
}

beforeEach(() => {
  vi.clearAllMocks();
  posted.length = 0;
  inPage = {};
  helper = { answer: { ok: true } };
});

describe('the event page', () => {
  it('makes the four menus when installed, and again when Firefox starts', async () => {
    await browser.runtime.onInstalled.fire({ reason: 'install' });
    await settled();
    expect(browser.menus.removeAll).toHaveBeenCalled();
    expect(
      browser.menus.create.mock.calls.map((c) => (c as unknown as [{ id: string }])[0].id),
    ).toEqual(['page', 'selection', 'image', 'region']);
    expect((browser.menus.create.mock.calls[0] as unknown as [{ title: string }])[0].title).toBe(
      'Add the page to the notebook',
    );
    await browser.runtime.onStartup.fire();
    await settled();
    expect(browser.menus.create).toHaveBeenCalledTimes(8);
  });

  it('the button adds the page where nothing is selected, read with Readability, and shows a tick', async () => {
    inPage = { readPage: { url: 'x', title: 'y', text: 'Words', html: '<p>Words</p>' } };
    await browser.action.onClicked.fire(tab);
    await settled();
    const files = browser.scripting.executeScript.mock.calls.find(
      (c) => (c as unknown as [{ files?: string[] }])[0].files,
    ) as unknown as [{ files: string[] }];
    expect(files[0].files).toEqual(['vendor/readability/Readability.js']);
    expect(browser.runtime.connectNative).toHaveBeenCalledWith('org.glaukopis.notebook');
    expect(posted).toEqual([
      expect.objectContaining({
        kind: 'page',
        url: 'https://example.org/owl',
        title: 'The owl',
        text: 'Words',
        html: '<p>Words</p>',
      }),
    ]);
    expect(lastSign()).toEqual({ text: '✓', title: 'Added to the notebook' });
  });

  it('the key adds what is selected where something is', async () => {
    inPage = { readSelection: { url: 'x', title: 'y', text: 'Wise', html: '<b>Wise</b>' } };
    await browser.commands.onCommand.fire('add-to-notebook', tab);
    await settled();
    expect(posted).toEqual([expect.objectContaining({ kind: 'selection', html: '<b>Wise</b>' })]);
  });

  it('a key of its own adds the page whole, though something is selected', async () => {
    inPage = {
      readSelection: { url: 'x', title: 'y', text: 'Wise', html: '<b>Wise</b>' },
      readPage: { url: 'x', title: 'y', text: 'Words', html: '<p>Words</p>' },
    };
    await browser.commands.onCommand.fire('add-page', tab);
    await settled();
    expect(posted).toEqual([expect.objectContaining({ kind: 'page', html: '<p>Words</p>' })]);
  });

  it('a key of its own marks a part of the page, in the tab in view where Firefox names none', async () => {
    inPage = { markRegion: null };
    browser.tabs.query.mockResolvedValueOnce([tab]);
    await browser.commands.onCommand.fire('add-region');
    await settled();
    const call = browser.scripting.executeScript.mock.calls[0] as unknown as [
      { target: { tabId: number }; func: { name: string } },
    ];
    expect(call[0].func.name).toBe('markRegion');
    expect(call[0].target.tabId).toBe(7);
    expect(posted).toEqual([]);
  });

  it('a key the plugin does not know does nothing', async () => {
    await browser.commands.onCommand.fire('something-else', tab);
    await settled();
    expect(browser.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('says Glaukopis is not set up where Firefox finds no helper', async () => {
    helper = { closed: 'No such native application org.glaukopis.notebook' };
    inPage = { readSelection: { url: 'x', title: 'y', text: 'Wise', html: '' } };
    await browser.action.onClicked.fire(tab);
    await settled();
    expect(lastSign()).toEqual({
      text: '!',
      title: english.reasonNotSetUp.message,
    });
  });

  it('says why where the helper could not keep it', async () => {
    helper = { answer: { ok: false, error: 'too-large' } };
    inPage = { readSelection: { url: 'x', title: 'y', text: 'Wise', html: '' } };
    await browser.action.onClicked.fire(tab);
    await settled();
    expect(lastSign()).toEqual({ text: '!', title: 'It is too large.' });
  });

  it('says a page that does not let itself be read', async () => {
    browser.scripting.executeScript.mockRejectedValueOnce(new Error('Missing host permission'));
    await browser.action.onClicked.fire(tab);
    await settled();
    expect(posted).toEqual([]);
    expect(lastSign()).toEqual({ text: '!', title: english.reasonPageClosed.message });
  });

  it('from the menu, the words Firefox says were selected go where the page cannot be read', async () => {
    browser.scripting.executeScript.mockRejectedValueOnce(new Error('Missing host permission'));
    await browser.menus.onClicked.fire(
      { menuItemId: 'selection', frameId: 0, selectionText: 'Said by Firefox' },
      tab,
    );
    await settled();
    expect(posted).toEqual([
      expect.objectContaining({ kind: 'selection', text: 'Said by Firefox', html: '' }),
    ]);
  });

  it('an image read from the page is handed over as PNG, with what it shows and its name', async () => {
    inPage = {
      readImage: {
        url: 'x',
        title: 'y',
        png: 'data:image/png;base64,iVBORw0KGgo=',
        alt: 'An owl',
        src: 'https://example.org/i/owl.jpg',
        rect: { x: 0, y: 0, width: 10, height: 10 },
        view: { width: 100, height: 100 },
      },
    };
    await browser.menus.onClicked.fire(
      { menuItemId: 'image', frameId: 0, targetElementId: 12 },
      tab,
    );
    await settled();
    const call = browser.scripting.executeScript.mock.calls[0] as unknown as [
      { func: { name: string }; args: unknown[] },
    ];
    expect(call[0].func.name).toBe('readImage');
    expect(call[0].args).toEqual([12]);
    expect(browser.tabs.captureVisibleTab).not.toHaveBeenCalled();
    expect(posted).toEqual([
      expect.objectContaining({
        kind: 'image',
        image: 'iVBORw0KGgo=',
        alt: 'An owl',
        name: 'owl.png',
      }),
    ]);
  });

  it('a part of the page given up with Esc hands over nothing and says nothing', async () => {
    inPage = { markRegion: null };
    await browser.menus.onClicked.fire({ menuItemId: 'region', frameId: 0 }, tab);
    await settled();
    expect(posted).toEqual([]);
    expect(browser.action.setBadgeText).not.toHaveBeenCalled();
  });
});
