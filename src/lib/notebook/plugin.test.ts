/**
 * The plugin for Firefox (`extension/firefox/`), in what can be reckoned
 * and done without Firefox: the cut out of a picture of the tab, the name
 * of an image, the message to the helper and what its answer means, and
 * the functions put into the page, each run again from its source alone,
 * as Firefox runs it.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import readabilitySource from '../../../extension/firefox/vendor/readability/Readability.js?raw';
import * as page from '../../../extension/firefox/page.js';
import {
  base64OfBytes,
  bytesOfDataUrl,
  cropOf,
  messageOf,
  nameOfImage,
  outcomeOf,
  partsOfDataUrl,
  rectBetween,
} from '../../../extension/firefox/reckon.js';
import manifest from '../../../extension/firefox/manifest.json';
import english from '../../../extension/firefox/_locales/en/messages.json';
import bokmal from '../../../extension/firefox/_locales/nb/messages.json';

/** A function of `page.js` as Firefox runs it: made again from its source, with nothing of the module around it. */
function alone<F extends (...args: never[]) => unknown>(f: F): F {
  return new Function(`return (${f.toString()})`)() as F;
}

afterEach(() => {
  document.body.innerHTML = '';
  window.getSelection()?.removeAllRanges();
  delete (globalThis as { browser?: unknown }).browser;
  delete (globalThis as { Readability?: unknown }).Readability;
});

describe('the cut out of a picture of the tab', () => {
  it('is reckoned by the picture’s width against the view’s, for the zoom and the density of the screen', () => {
    const view = { width: 1000, height: 600 };
    const picture = { width: 2000, height: 1200 };
    expect(cropOf({ x: 10, y: 20, width: 100, height: 50 }, view, picture)).toEqual({
      x: 20,
      y: 40,
      width: 200,
      height: 100,
    });
    // At a zoom of 150 % on a plain screen, the view is narrower in the page's pixels.
    expect(
      cropOf(
        { x: 100, y: 100, width: 200, height: 100 },
        { width: 800, height: 400 },
        { width: 1200, height: 600 },
      ),
    ).toEqual({ x: 150, y: 150, width: 300, height: 150 });
  });

  it('is cut to what the picture holds, and is nothing where nothing of it is shown', () => {
    const view = { width: 100, height: 100 };
    const picture = { width: 100, height: 100 };
    expect(cropOf({ x: -20, y: 90, width: 50, height: 50 }, view, picture)).toEqual({
      x: 0,
      y: 90,
      width: 30,
      height: 10,
    });
    expect(cropOf({ x: 0, y: 200, width: 50, height: 50 }, view, picture)).toBeNull();
    expect(cropOf({ x: 0, y: 0, width: 0, height: 50 }, view, picture)).toBeNull();
    expect(
      cropOf({ x: 0, y: 0, width: 5, height: 5 }, { width: 0, height: 0 }, picture),
    ).toBeNull();
  });

  it('is marked whichever way the pointer went', () => {
    expect(rectBetween(50, 60, 10, 20)).toEqual({ x: 10, y: 20, width: 40, height: 40 });
  });
});

describe('the name of an image', () => {
  it('is the name of its file in its address, as a PNG', () => {
    expect(nameOfImage('https://example.org/pictures/owl%20at%20night.jpg?w=300#top')).toBe(
      'owl at night.png',
    );
    expect(nameOfImage('https://example.org/a/b/plate')).toBe('plate.png');
    expect(nameOfImage('https://example.org/a/b/plate.webp')).toBe('plate.png');
  });

  it('is nothing where the address names no file', () => {
    expect(nameOfImage('https://example.org/')).toBe('');
    expect(nameOfImage('data:image/png;base64,AAAA')).toBe('');
    expect(nameOfImage('blob:https://example.org/1234')).toBe('');
    expect(nameOfImage('not an address')).toBe('');
    expect(nameOfImage('https://example.org/.png')).toBe('');
  });
});

describe('what a message to the helper holds', () => {
  const when = new Date('2026-11-15T12:00:00Z');

  it('holds the kind, the page, when, and every field of words', () => {
    expect(
      messageOf('selection', { url: 'https://a.org/x', title: 'X' }, { text: 'words' }, when),
    ).toEqual({
      kind: 'selection',
      url: 'https://a.org/x',
      title: 'X',
      when: '2026-11-15T12:00:00.000Z',
      text: 'words',
      html: '',
      alt: '',
      name: '',
    });
  });

  it('holds a picture only where there is one', () => {
    const m = messageOf('region', { url: 'u', title: 't' }, { image: 'iVBO' }, when);
    expect(m.image).toBe('iVBO');
    expect('image' in messageOf('page', { url: 'u', title: 't' }, {}, when)).toBe(false);
  });

  it('knows only the four kinds', () => {
    expect(() => messageOf('hello', {}, {})).toThrow();
  });
});

describe('what the helper’s answer means', () => {
  it('is handed over where it says so', () => {
    expect(outcomeOf({ ok: true })).toEqual({ ok: true });
  });

  it('gives the plugin’s words for each word of the helper', () => {
    expect(outcomeOf({ ok: false, error: 'too-large' })).toEqual({
      ok: false,
      reason: 'reasonTooLarge',
    });
    expect(outcomeOf({ ok: false, error: 'no-data-folder' })).toEqual({
      ok: false,
      reason: 'reasonNoDataFolder',
    });
    expect(outcomeOf({ ok: false, error: 'something new' })).toEqual({
      ok: false,
      reason: 'reasonNotWritten',
    });
  });

  it('is Glaukopis not set up where Firefox finds no helper, or it ends without answering', () => {
    const notSetUp = { ok: false, reason: 'reasonNotSetUp' };
    expect(outcomeOf(null, 'No such native application org.glaukopis.notebook')).toEqual(notSetUp);
    expect(outcomeOf(null, '')).toEqual(notSetUp);
    expect(outcomeOf(undefined)).toEqual(notSetUp);
  });

  it('every reason has words in both languages', () => {
    for (const word of [
      'too-large',
      'not-understood',
      'not-a-picture',
      'no-data-folder',
      'not-written',
    ]) {
      const outcome = outcomeOf({ ok: false, error: word });
      if (outcome.ok) throw new Error('handed over');
      expect(english).toHaveProperty(outcome.reason);
      expect(bokmal).toHaveProperty(outcome.reason);
    }
  });
});

describe('the bytes of a picture', () => {
  it('go to base64 and back through a data: address', () => {
    const bytes = new Uint8Array(70_000).map((_, i) => (i * 7) % 256);
    const base64 = base64OfBytes(bytes);
    const address = `data:image/png;base64,${base64}`;
    expect(partsOfDataUrl(address)).toEqual({ type: 'image/png', base64 });
    expect(bytesOfDataUrl(address)).toEqual(bytes);
    expect(partsOfDataUrl('https://example.org/owl.png')).toBeNull();
  });
});

describe('the plugin as Firefox reads it', () => {
  it('asks for the tab in view and no site, and is the plugin Glaukopis tells Firefox of', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions.sort()).toEqual(
      ['activeTab', 'contextMenus', 'nativeMessaging', 'scripting'].sort(),
    );
    expect(manifest).not.toHaveProperty('host_permissions');
    expect(manifest).not.toHaveProperty('optional_permissions');
    expect(manifest.background).not.toHaveProperty('service_worker');
    expect(manifest.browser_specific_settings.gecko.id).toBe('notebook@glaukopis');
  });

  it('has every word in English and in Bokmål', () => {
    const named = new Set(
      [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]),
    );
    for (const name of named) expect(english).toHaveProperty(name);
    expect(Object.keys(bokmal).sort()).toEqual(Object.keys(english).sort());
  });
});

describe('what is selected in the page', () => {
  it('is its words and its HTML, with every link a whole address and nothing run', () => {
    document.body.innerHTML =
      '<p id="p">See <a href="/notes/owl">the owl</a> and <em>more</em>.<script>evil()</script></p>';
    const p = document.getElementById('p')!;
    const range = document.createRange();
    range.selectNodeContents(p);
    window.getSelection()!.addRange(range);
    const got = alone(page.readSelection)()!;
    expect(got.text).toContain('See the owl and more.');
    expect(got.url).toBe(document.location.href);
    const held = new DOMParser().parseFromString(got.html, 'text/html');
    expect(held.querySelector('a')!.getAttribute('href')).toBe(
      new URL('/notes/owl', document.baseURI).href,
    );
    expect(held.querySelector('em')!.textContent).toBe('more');
    expect(held.querySelector('script')).toBeNull();
  });

  it('keeps the link that words selected within it stand in', () => {
    document.body.innerHTML = '<p><a id="a" href="https://example.org/owl">the wise owl</a></p>';
    const text = document.getElementById('a')!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 4);
    range.setEnd(text, 8);
    window.getSelection()!.addRange(range);
    const got = alone(page.readSelection)()!;
    expect(got.text).toBe('wise');
    expect(got.html).toBe('<a id="a" href="https://example.org/owl">wise</a>');
  });

  it('is the words selected in a field of text', () => {
    document.body.innerHTML = '<textarea id="t">one two three</textarea>';
    const field = document.getElementById('t') as HTMLTextAreaElement;
    field.focus();
    field.setSelectionRange(4, 7);
    expect(alone(page.readSelection)()).toMatchObject({ text: 'two', html: '' });
  });

  it('is nothing where nothing is selected', () => {
    document.body.innerHTML = '<p>Words</p>';
    expect(alone(page.readSelection)()).toBeNull();
  });
});

describe('the page as it reads', () => {
  const article = `
    <h1>The owl of Athena</h1>
    <article>
      ${'<p>The little owl was the bird of Athena, and its picture stood on the coins of the city for centuries, as anyone who has held a tetradrachm knows. </p>'.repeat(8)}
      <p>Read <a href="/more">more</a>.</p>
    </article>
    <script>evil()</script>`;

  it('is Readability’s article, as HTML and as words a line to each paragraph', () => {
    (globalThis as { Readability?: unknown }).Readability = new Function(
      `${readabilitySource}; return Readability;`,
    )();
    document.title = 'Owls';
    document.body.innerHTML = article;
    const got = alone(page.readPage)();
    expect(got.title).toBe('Owls');
    expect(got.html).toContain('the bird of Athena');
    expect(got.html).not.toContain('evil');
    expect(got.text.split('\n').length).toBeGreaterThanOrEqual(8);
    expect(got.text).toContain('Read more.');
  });

  it('is the words of the whole body where there is no Readability, or no article', () => {
    document.body.innerHTML = '<div>Menu</div><div>Short <b>words</b></div><script>evil()</script>';
    const got = alone(page.readPage)();
    expect(got.html).toBe('');
    expect(got.text).toBe('Menu\nShort words');
  });
});

describe('the image the right button was pressed on', () => {
  it('is where it is shown, with what it says it shows, where it cannot be drawn', () => {
    document.body.innerHTML = '<img id="i" src="https://example.org/owl.jpg" alt=" An owl ">';
    const img = document.getElementById('i')!;
    const getTargetElement = vi.fn(() => img);
    (globalThis as { browser?: unknown }).browser = { menus: { getTargetElement } };
    const got = alone(page.readImage)(7)!;
    expect(getTargetElement).toHaveBeenCalledWith(7);
    // jsdom loads no image: there is nothing to draw.
    expect(got.png).toBeNull();
    expect(got.alt).toBe('An owl');
    expect(got.src).toBe('https://example.org/owl.jpg');
    expect(got.view).toEqual({ width: window.innerWidth, height: window.innerHeight });
    expect(got.rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('is nothing where the menu’s element is gone', () => {
    (globalThis as { browser?: unknown }).browser = {
      contextMenus: { getTargetElement: () => null },
    };
    expect(alone(page.readImage)(1)).toBeNull();
  });
});

describe('a part of the page marked with the pointer', () => {
  const press = (type: string, x: number, y: number) => {
    const cover = document.body.lastElementChild!;
    cover.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }));
  };

  it('is the rectangle drawn, given once the marking is gone', async () => {
    document.title = 'Plates';
    const marking = alone(page.markRegion)();
    press('pointerdown', 50, 60);
    press('pointermove', 30, 20);
    press('pointerup', 10, 20);
    const got = await marking;
    expect(got).toMatchObject({
      title: 'Plates',
      rect: { x: 10, y: 20, width: 40, height: 40 },
      view: { width: window.innerWidth, height: window.innerHeight },
    });
    expect(document.body.children.length).toBe(0);
    expect(document.documentElement.hasAttribute('data-glaukopis-marking')).toBe(false);
  });

  it('is nothing where Esc is pressed, or the pointer only clicked', async () => {
    const given = alone(page.markRegion)();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await given).toBeNull();
    expect(document.body.children.length).toBe(0);

    const clicked = alone(page.markRegion)();
    press('pointerdown', 50, 60);
    press('pointerup', 51, 61);
    expect(await clicked).toBeNull();
  });

  it('is marked once at a time', async () => {
    const first = alone(page.markRegion)();
    expect(await alone(page.markRegion)()).toBeNull();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await first).toBeNull();
  });
});
