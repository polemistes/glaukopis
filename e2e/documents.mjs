// Documents brought in from files, each to become a map of its own.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

/** A picture of rings, as PNG. */
function png(width, height) {
  const crcTable = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
  });
  const crc = (buffer) => {
    let c = -1;
    for (const b of buffer) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - width / 2, y - height / 2);
      raw[row + 1 + x * 3] = (150 + 90 * Math.cos(d / 14)) & 0xff;
      raw[row + 2 + x * 3] = (110 + x / 5) & 0xff;
      raw[row + 3 + x * 3] = (90 + y / 3) & 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const WRITTEN = `---
title: The wrath of *Achilles*
subtitle: A study of a word
author: A. Scholar
date: 2026-01-02
lang: en-GB
---

What stands before the first heading, with a note.[^first]

# The word

A wrath that is more than anger [@nagy1979, 73], as [@nokey, 12] does not say.
It holds where $x_i \\leq \\alpha$.

$$a^2 + b^2 = c^2$$

> Sing, goddess, the wrath.

- of gods
- of heroes

## Its forms

| Form  | Lines |
|:------|------:|
| mênis |    12 |
| kotos |     7 |

: Forms of the word

### In the Iliad

![The shield of Achilles](shield.png){width=50%}

## Its kin

Other words for anger.

# The hero

He withdraws.

# References

Nagy, G. 1979. The Best of the Achaeans.

[^first]: The note, as it was written.
`;

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(join(desk, 'shield.png'), png(480, 300));
writeFileSync(join(desk, 'wrath.md'), WRITTEN);
writeFileSync(join(desk, 'broken.docx'), 'This only says that it is one.');
writeFileSync(
  join(desk, 'lines.txt'),
  'A line of plain text.\n\nAnd another, after an empty line.\n',
);
let pandoc = true;
try {
  execFileSync('pandoc', ['wrath.md', '-o', 'wrath.docx'], { cwd: desk });
} catch {
  pandoc = false;
}
// A long document: 2000 paragraphs under 60 headings.
{
  const words =
    'Sing, goddess, the wrath of Achilles son of Peleus, the accursed wrath which brought countless sorrows upon the Achaeans, and sent down to Hades many valiant souls of warriors. ';
  let long = '---\ntitle: A long book\n---\n\n';
  let n = 0;
  for (let h = 0; h < 60; h++) {
    long += `${h % 6 === 0 ? '#' : h % 3 === 0 ? '###' : '##'} Part ${h + 1}\n\n`;
    for (let i = 0; i < (h < 20 ? 34 : 33); i++) {
      long += `${words.repeat(3)}*Emphasised.*${n % 10 === 0 ? ` [@nagy1979, ${i + 1}]^[${words.trim()}]` : ''}\n\n`;
      n++;
    }
  }
  writeFileSync(join(desk, 'long.md'), long);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(
      `return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`,
      command,
      args,
    );
  const drop = (paths, x, y) =>
    app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      paths,
      x,
      y,
    );
  const middleOf = (selector) =>
    app.exec(
      `const r = document.querySelector(arguments[0]).getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
      selector,
    );
  const dropOnProject = async (file) => {
    const at = await middleOf('.project .work .panes');
    await drop([join(desk, file)], at.x, at.y);
  };
  const tabs = () => app.mapNames();
  const facts = () =>
    app.exec(
      `const out = {};
       for (const e of document.querySelectorAll('dialog [data-fact]'))
         out[e.dataset.fact] = (e.querySelector('dd') || e).textContent.trim();
       return out;`,
    );
  const remarks = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog .remarks li')).map((e) => e.textContent.trim())`,
    );
  /** The parts of the text of the map: the level of each with its name. */
  const parts = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => {
         const level = (s.className.match(/level-(\\d)/) || [])[1];
         const name = s.querySelector('.heading .prose.title');
         return level + ' ' + (name ? name.textContent.trim() : '');
       })`,
    );
  const section = (name) =>
    `Array.from(document.querySelectorAll('.text-view .section')).find((s) => {
       const n = s.querySelector('.heading .prose.title');
       return n && n.textContent.trim() === ${JSON.stringify(name)};
     })`;
  const store = join(app.dataDir, 'pictures', 'files');
  const files = () => (existsSync(store) ? readdirSync(store).sort() : []);

  // References to cite: the one the document names by its key is among them.
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke('import_apply', { plan: await invoke('import_bib_text', { text: bib }) });

  // ---- among the projects ----
  await app.waitForText('h2', 'Welcome to Glaukopis');
  check(
    'where a project is begun, one can be made from a document',
    /from a document/.test(await app.exec(`return document.querySelector('.welcome').textContent`)),
  );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.openThisMap();
  check(
    'among the maps, a map can be made from a document',
    await app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).some((m) => m.textContent.includes('A map from a document'))`,
    ),
  );
  await app.press('Escape');
  await app.waitGone('.menu', 3000);

  // ---- a file that cannot be read ----
  if (pandoc) {
    await dropOnProject('broken.docx');
    const said = await until('the failure to be said', async () =>
      (await app.exists('dialog .failure')) ? app.text('dialog .failure') : null,
    );
    check(
      'a file that cannot be read is said to be so, in words',
      /could not be read as Word \(DOCX\)/.test(said),
      said,
    );
    await app.screenshot('documents-1-failure');
    await app.clickText('dialog footer button', 'Close');
    await app.waitGone('dialog[open]');
    check('and nothing is made of it', (await tabs()).length === 1);
  }

  // ---- a document dropped on the project, and let be ----
  await dropOnProject('wrath.md');
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await sleep(200);
  check(
    'a document dropped on the project is read',
    (await app.text('dialog h2, dialog .title, dialog header')).includes('A map from a document'),
  );
  const title = await app.exec(`return document.querySelector('dialog input').value`);
  check('its title is shown, to be changed', title === 'The wrath of Achilles', title);
  const found = await facts();
  check(
    'what it holds is counted',
    found.parts === '6' &&
      found.notes === '1' &&
      found.figures === '1' &&
      found.tables === '1' &&
      found.equations === '1' &&
      Number(found.words) > 50,
    JSON.stringify(found),
  );
  check(
    'with the works it cites, those of the library and those that are not',
    found.cited === 'Works of your library are cited once, works that are not in it once.',
    found.cited,
  );
  const told = await remarks();
  check(
    'the citation by a key that the library has not is said to be found, and that it can be gone through',
    told.some((r) =>
      /^1 citation was found that is not yet tied to a reference of your library\. .* can be gone through/.test(
        r,
      ),
    ),
    told.join(' ‖ '),
  );
  check(
    'the list of references of the document is said to be there',
    told.some((r) => /under “References”/.test(r)),
  );
  check(
    'nothing is said in the words of programs',
    told.every((r) => !/pandoc|json|ast\b/i.test(r)),
    told.join(' ‖ '),
  );
  await app.screenshot('documents-2-read');
  check('its picture is in the store meanwhile', files().length === 1, files().join(', '));
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]');
  await sleep(300);
  check('let be, no map is made', (await tabs()).length === 1, (await tabs()).join(', '));
  check('and its picture is not kept', files().length === 0, files().join(', '));

  // ---- the map is made ----
  await dropOnProject('wrath.md');
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await sleep(200);
  check('dropped again, it is read again', (await facts()).parts === '6');
  await app.clickText('dialog footer button', 'Make the map');
  // The document has a citation that was found: the window in which such are gone through opens.
  await app.waitFor('dialog .found-window', 15000);
  await sleep(300);
  const through = await app.exec(
    `return Array.from(document.querySelectorAll('dialog .found-window .list [role="option"], dialog .found-window .list button, dialog .found-window .list li')).map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)`,
  );
  check(
    'the citations that were found are there to be gone through',
    through.some((t) => t.includes('[@nokey, 12]')),
    JSON.stringify(through),
  );
  await app.screenshot('documents-2-found');
  await app.press('Escape');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  check(
    'the map is made, beside the one that was there',
    JSON.stringify(await tabs()) === '["Homer","The wrath of Achilles"]',
    JSON.stringify(await tabs()),
  );
  check(
    'and shown',
    (await app.exec(`return document.querySelector('.maps .map .name').textContent.trim()`)) ===
      'The wrath of Achilles',
  );
  const order = await parts();
  check(
    'as text, with its parts in their order and depth',
    JSON.stringify(order) ===
      JSON.stringify([
        '0 The wrath of Achilles',
        '1 The word',
        '2 Its forms',
        '3 In the Iliad',
        '2 Its kin',
        '1 The hero',
        '1 References',
      ]),
    JSON.stringify(order),
  );
  check(
    'the title has the marks it had',
    (await app.exec(
      `const e = document.querySelector('.text-view .section.level-0 .heading .prose.title em'); return e ? e.textContent : null`,
    )) === 'Achilles',
  );
  const centre = await app.exec(
    `return ${section('The wrath of Achilles')}.querySelector('.prose.body').textContent`,
  );
  check(
    'what stood before the first heading is the text of the centre',
    /^What stands before the first heading, with a note\./.test(centre),
    centre,
  );
  check(
    'with its note',
    (await app.exec(
      `return ${section('The wrath of Achilles')}.querySelectorAll('.prose.body .footnote').length`,
    )) === 1,
  );

  const word = await app.exec(
    `const s = ${section('The word')}.querySelector('.prose.body');
     const c = s.querySelectorAll('.citation');
     return {
       text: s.textContent.replace(/\\s+/g, ' '),
       citations: c.length,
       citation: c[0] ? c[0].textContent : '',
       missing: c[0] ? c[0].classList.contains('missing') : null,
       math: s.querySelectorAll('p .math math').length,
       equation: s.querySelectorAll('.equation math').length,
       quote: (s.querySelector('blockquote') || {}).textContent,
       items: Array.from(s.querySelectorAll('ul li')).map((e) => e.textContent.trim()),
       found: Array.from(s.querySelectorAll('.found')).map((e) => [e.dataset.by, e.textContent]),
     };`,
  );
  check(
    'the citation whose key is in the library is a citation of that work',
    word.citations === 1 &&
      /Nagy/.test(word.citation) &&
      /73/.test(word.citation) &&
      word.missing === false,
    JSON.stringify(word),
  );
  check(
    'the one whose key is not stays the text it was written as',
    word.text.includes('as [@nokey, 12] does not say'),
    word.text,
  );
  check(
    'and is marked as a citation that was found, by its tag',
    JSON.stringify(word.found) === '[["key","[@nokey, 12]"]]',
    JSON.stringify(word.found),
  );
  check(
    'the formula is a formula, in the line and by itself',
    word.math === 1 && word.equation === 1,
    JSON.stringify(word),
  );
  check(
    'the quotation is a quotation',
    word.quote === 'Sing, goddess, the wrath.',
    String(word.quote),
  );
  check(
    'the list is a list',
    JSON.stringify(word.items) === '["of gods","of heroes"]',
    JSON.stringify(word.items),
  );

  const table = await app.exec(
    `const s = ${section('Its forms')}.querySelector('.prose.body');
     return {
       said: (s.querySelector('figure.tabular figcaption') || {}).textContent,
       heads: Array.from(s.querySelectorAll('figure.tabular th')).map((e) => e.textContent.trim()),
       cells: Array.from(s.querySelectorAll('figure.tabular td')).map((e) => e.textContent.trim()),
     };`,
  );
  check(
    'the table is a table, with its headings and what is said of it',
    table.said === 'Forms of the word' &&
      JSON.stringify(table.heads) === '["Form","Lines"]' &&
      JSON.stringify(table.cells) === '["mênis","12","kotos","7"]',
    JSON.stringify(table),
  );
  await until('the picture of the figure', () =>
    app.exec(
      `const i = ${section('In the Iliad')}.querySelector('figure.figure img[src^="blob:"]');
       return !!i && i.complete && i.naturalWidth === 480;`,
    ),
  );
  const figure = await app.exec(
    `const f = ${section('In the Iliad')}.querySelector('figure.figure');
     return { said: f.querySelector('figcaption').textContent, width: f.querySelector('.picture').style.width };`,
  );
  check(
    'the figure is there with its picture, as wide as the document says',
    figure.said === 'The shield of Achilles' && figure.width === '50%',
    JSON.stringify(figure),
  );
  check(
    'the picture is in the store, once',
    files().length === 1 && /^[0-9a-f]{64}\.png$/.test(files()[0]),
    files().join(', '),
  );
  await app.screenshot('documents-3-text');
  await app.exec(`${section('Its forms')}.scrollIntoView({ block: 'start' })`);
  await sleep(500);
  await app.screenshot('documents-4-table-and-figure');

  // The project keeps the work that is cited, and the map what the document says of itself.
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.side', 5000);
  await sleep(500);
  const references = await app.exec(`return document.querySelector('.side').textContent`);
  check(
    'the work that is cited is among the references of the map',
    /Nagy/.test(references) && /Best of the/.test(references),
    references.slice(0, 200),
  );

  // Where a work is cited is shown when it is chosen, and gone to with a click.
  const citedIn = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.side .cited .map')).map((m) =>
         m.querySelector('.map-name').textContent.trim() + ': ' +
         Array.from(m.querySelectorAll('.element')).map((e) => e.textContent.trim()).join(', '))`,
    );
  await app.click(await app.findByText('.side [role="option"]', 'Nagy'));
  await app.waitFor('.side .cited .element', 5000);
  check(
    'where a chosen work is cited is shown, by map and element',
    JSON.stringify(await citedIn()) === '["The wrath of Achilles: The word"]',
    JSON.stringify(await citedIn()),
  );
  await app.exec(
    `const s = document.querySelector('.text-view .scroller'); s.scrollTop = s.scrollHeight;`,
  );
  await sleep(300);
  await app.click(await app.findByText('.side .cited .element', 'The word'));
  await sleep(600);
  const offset = await app.exec(
    `const s = document.querySelector('.text-view .scroller');
     const section = ${section('The word')};
     return Math.round(section.getBoundingClientRect().top - s.getBoundingClientRect().top);`,
  );
  // The text keeps some room above what it goes to (scroll-padding).
  check(
    'and a click goes to the element',
    offset >= 0 && offset <= 120,
    `${offset} px from the top`,
  );
  await app.screenshot('documents-4b-cited-in');
  await app.keys(['Control', 'Shift', 'r']);
  await sleep(200);

  // ---- the diagram ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(600);
  const nodes = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).map((n) =>
       (n.className.match(/depth-(\\d)/) || [])[1] + ' ' + n.querySelector('.caption').textContent.trim()).sort()`,
  );
  check(
    'the diagram has the elements, each as deep as its heading',
    JSON.stringify(nodes) ===
      JSON.stringify([
        '0 The wrath of Achilles',
        '1 References',
        '1 The hero',
        '1 The word',
        '2 In the Iliad',
        '2 Its forms',
        '2 Its kin',
      ]),
    JSON.stringify(nodes),
  );
  await app.screenshot('documents-5-diagram');

  // ---- undo takes the whole map back ----
  await app.click('header button[aria-label^="Undo"]');
  await sleep(500);
  check(
    'undo takes the whole map back, in one step',
    JSON.stringify(await tabs()) === '["Homer"]',
    JSON.stringify(await tabs()),
  );
  check('and what is shown is the map that is left', await app.exists('.diagram .node.root'));
  await app.click('header button[aria-label^="Redo"]');
  await sleep(500);
  check(
    'redo makes it again',
    JSON.stringify(await tabs()) === '["Homer","The wrath of Achilles"]',
    JSON.stringify(await tabs()),
  );
  await app.screenshot('documents-6-again');

  // ---- the same from Word ----
  if (pandoc) {
    await dropOnProject('wrath.docx');
    await app.waitFor('dialog [data-fact="words"]', 20000);
    await sleep(200);
    const subtitle = await app.exec(`return document.querySelector('dialog').textContent`);
    check('a document from Word is read', /wrath\.docx · Word \(DOCX\)/.test(subtitle));
    const counted = await facts();
    check(
      'and holds the same',
      counted.parts === '6' &&
        counted.notes === '1' &&
        counted.figures === '1' &&
        counted.tables === '1' &&
        counted.cited === undefined,
      JSON.stringify(counted),
    );
    await app.exec(
      `const i = document.querySelector('dialog input');
       const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
       set.call(i, 'The wrath, from Word');
       i.dispatchEvent(new Event('input', { bubbles: true }));`,
    );
    await app.screenshot('documents-7-word');
    await app.clickText('dialog footer button', 'Make the map');
    await app.waitGone('dialog[open]', 15000);
    await app.waitFor('.text-view .section', 8000);
    await sleep(600);
    check(
      'the map has the title it was given',
      JSON.stringify(await tabs()) === '["Homer","The wrath of Achilles","The wrath, from Word"]',
      JSON.stringify(await tabs()),
    );
    const again = await parts();
    check(
      'and the same parts',
      JSON.stringify(again) ===
        JSON.stringify([
          '0 The wrath, from Word',
          '1 The word',
          '2 Its forms',
          '3 In the Iliad',
          '2 Its kin',
          '1 The hero',
          '1 References',
        ]),
      JSON.stringify(again),
    );
    const held = await app.exec(
      `const v = document.querySelector('.text-view');
       return {
         notes: v.querySelectorAll('.footnote').length,
         tables: v.querySelectorAll('figure.tabular').length,
         cells: Array.from(v.querySelectorAll('figure.tabular td')).map((e) => e.textContent.trim()),
         figures: v.querySelectorAll('figure.figure').length,
         citations: v.querySelectorAll('.citation').length,
         text: ${section('The word')}.querySelector('.prose.body').textContent.replace(/\\s+/g, ' '),
       };`,
    );
    check(
      'with the note, the table and the figure',
      held.notes === 1 &&
        held.tables === 1 &&
        held.figures === 1 &&
        JSON.stringify(held.cells) === '["mênis","12","kotos","7"]',
      JSON.stringify(held),
    );
    check(
      'citations that are text in the file stay text',
      held.citations === 0 && held.text.includes('[@nagy1979, 73]'),
      held.text,
    );
    await until('the picture of the figure from Word', () =>
      app.exec(
        `const i = document.querySelector('.text-view figure.figure img[src^="blob:"]'); return !!i && i.complete && i.naturalWidth > 0;`,
      ),
    );
    check(
      'the picture that was in the file is in the store',
      files().length >= 1,
      files().join(', '),
    );
    await app.screenshot('documents-8-word-text');
  } else {
    console.log('Pandoc is not installed: the document from Word is passed over');
  }

  // ---- text without marks ----
  await dropOnProject('lines.txt');
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await sleep(200);
  check(
    'text without marks is a document, called what the file is called',
    (await app.exec(`return document.querySelector('dialog input').value`)) === 'lines',
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]');

  // ---- a long document ----
  const began = Date.now();
  await dropOnProject('long.md');
  await app.waitFor('dialog .reading, dialog [data-fact="words"]', 5000);
  const reading = await app.exists('dialog .reading');
  if (reading) await app.screenshot('documents-9-reading');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  const read = Date.now() - began;
  const long = await facts();
  check(
    'a long document is read',
    long.parts === '60' && long.notes === '200' && /cited 200 times/.test(long.cited),
    JSON.stringify(long),
  );
  // How long the window stands still is how long nothing else gets its turn.
  await app.exec(
    `window.__still = 0; window.__last = performance.now();
     window.__probe = setInterval(() => {
       const now = performance.now();
       window.__still = Math.max(window.__still, now - window.__last);
       window.__last = now;
     }, 10);`,
  );
  const clicked = Date.now();
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 60000);
  const made = Date.now() - clicked;
  await until(
    'the long document to be shown',
    () =>
      app.exec(
        `const n = document.querySelector('.text-view .section.level-0 .heading .prose.title'); return !!n && n.textContent.trim() === 'A long book'`,
      ),
    30000,
  );
  const shown = Date.now() - clicked;
  // To its end, so that all of it has been drawn.
  await sleep(500);
  await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).pop(); s.scrollIntoView({ block: 'end' });`,
  );
  await sleep(1500);
  const drawn = await app.exec(
    `return { parts: document.querySelectorAll('.text-view .section').length, paragraphs: document.querySelectorAll('.text-view .prose.body p').length }`,
  );
  const still = Math.round(await app.exec(`clearInterval(window.__probe); return window.__still;`));
  console.log(
    `      a document of 2000 paragraphs under 60 headings: read in ${read} ms, the map made in ${made} ms, shown after ${shown} ms (${drawn.parts} parts and ${drawn.paragraphs} paragraphs drawn); the window stood still for ${still} ms at the most`,
  );
  await app.exec(
    `document.querySelector('.text-view .section').scrollIntoView({ block: 'start' });`,
  );
  await sleep(300);
  check(
    'the map of it is made without the window standing still for long',
    still < 4000,
    `${still} ms`,
  );
  const elements = await app.execAsync(
    `const list = await window.__TAURI_INTERNALS__.invoke('project_list');
     return list[0].maps;`,
  );
  await app.screenshot('documents-10-long');
  await app.click('header button[aria-label^="Undo"]');
  await sleep(800);
  check(
    'and taken back as one',
    !(await tabs()).includes('A long book'),
    JSON.stringify(await tabs()),
  );
  console.log(
    `      the maps of the project, as they were last written: ${JSON.stringify(elements)}`,
  );

  // ---- while a file is read, the reading can be stopped ----
  await dropOnProject('long.md');
  await app.waitFor('dialog footer button', 5000);
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]');
  await sleep(1500);
  check(
    'stopped while it is read, nothing comes of it',
    !(await app.exists('dialog[open]')) && !(await tabs()).includes('A long book'),
  );

  // ---- a project from a document ----
  await app.click('header button[aria-label="All projects"]');
  await app.waitForText('h1', 'Projects');
  await sleep(400);
  check(
    'where projects are made, one can be made from a document',
    await app.exec(
      `return Array.from(document.querySelectorAll('.home .welcome button')).some((b) => b.textContent.includes('A project from a document…'))`,
    ),
  );
  // The dialog that asks for a file cannot be driven: the file is dropped among the projects.
  const among = await middleOf('.home');
  await drop([join(desk, 'wrath.md')], among.x, among.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await sleep(200);
  check(
    'among the projects, a document is read likewise',
    (await app.exec(`return document.querySelector('dialog').textContent`)).includes(
      'A project from a document',
    ),
  );
  await app.screenshot('documents-11-project');
  await app.clickText('dialog footer button', 'Make the project');
  await app.waitFor('.text-view .section', 15000);
  await sleep(600);
  const named = await app.exec(
    `return document.title.replace(/^Glaukopis – /, '')`,
  );
  check('the project is named after the document', named === 'The wrath of Achilles', named);
  check(
    'and has the document as its map, and no other',
    JSON.stringify(await tabs()) === '["The wrath of Achilles"]',
    JSON.stringify(await tabs()),
  );
  check('with its parts', (await parts()).length === 7, JSON.stringify(await parts()));
  check(
    'there is nothing to take back: the project begins with it',
    (await app.exec(
      `return document.querySelector('header button[aria-label^="Undo"]').disabled`,
    )) === true,
  );
  await app.screenshot('documents-12-project-made');
  const listed = await invoke('project_list');
  check(
    'it is among the projects',
    listed.some(
      (p) => p.name === 'The wrath of Achilles' && p.maps.length === 1 && p.maps[0].elements === 7,
    ),
    JSON.stringify(listed.map((p) => [p.name, p.maps])),
  );

  // ---- from the library, where a work is cited ----
  // The citations of the new project that were found are left to be gone through later.
  if (await app.exists('dialog[open]')) {
    await app.press('Escape');
    await app.waitGone('dialog[open]', 15000);
  }
  await app.click('nav.rail a[aria-label="Library"]');
  await app.waitFor('[role="option"]', 8000);
  await app.click(await app.findByText('[role="option"]', 'Nagy'));
  await app.waitFor('.pane .cited .citer', 8000);
  const citers = await app.exec(
    `return Array.from(document.querySelectorAll('.pane .cited .citer')).map((b) => b.textContent.trim()).sort()`,
  );
  check(
    'the library says which projects cite a work',
    JSON.stringify(citers) === '["Homer","The wrath of Achilles"]',
    JSON.stringify(citers),
  );
  await app.screenshot('documents-13-library-cited-in');
  await app.click(await app.findByText('.pane .cited .citer', 'Homer'));
  await app.waitFor('.side .cited .element', 10000);
  check(
    'and a click opens the project at the work, with where it is cited',
    JSON.stringify(await citedIn()) === '["The wrath of Achilles: The word"]',
    JSON.stringify(await citedIn()),
  );
  check(
    'the work is the one chosen there',
    /Nagy/.test(
      await app.exec(
        `return document.querySelector('.side [role="option"][aria-selected="true"]')?.textContent ?? ''`,
      ),
    ),
  );

  const errors = (await app.pageErrors()).filter(
    (e) => !/could not be read as Word|The reading was stopped/.test(e),
  );
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('documents-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
