// What comes from outside: databases of books and articles, PDF files, and
// the library of Zotero.
//
// The lookups ask the real services, a handful of questions in all. Without
// a connection to the network those checks are passed over, and said to be.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
function passOver(name, why) {
  console.log(`--    ${name}  (passed over: ${why})`);
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

// ---- a home with a Zotero in it, and a PDF on its desk ----
const home = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-home-'));
const zotero = join(home, 'Zotero');
mkdirSync(join(zotero, 'storage', 'ATTACH01'), { recursive: true });
{
  // The tables as Zotero defines them, from the tests of the importer.
  const tests = readFileSync(join(root, 'crates/core/src/import/zotero/tests.rs'), 'utf8');
  const schema = /const SCHEMA: &str = "([\s\S]*?)";/.exec(tests)[1];
  const db = new DatabaseSync(join(zotero, 'zotero.sqlite'));
  db.exec(schema);
  const number = (table, id, column, name) => {
    const found = db.prepare(`SELECT ${id} AS n FROM ${table} WHERE ${column} = ?`).get(name);
    if (found) return found.n;
    return Number(db.prepare(`INSERT INTO ${table} (${column}) VALUES (?)`).run(name).lastInsertRowid);
  };
  const item = (kind, key, fields) => {
    const type = number('itemTypes', 'itemTypeID', 'typeName', kind);
    const id = Number(
      db.prepare('INSERT INTO items (itemTypeID, libraryID, key) VALUES (?, 1, ?)').run(type, key).lastInsertRowid,
    );
    for (const [name, value] of Object.entries(fields)) {
      db.prepare('INSERT INTO itemData VALUES (?, ?, ?)').run(
        id,
        number('fields', 'fieldID', 'fieldName', name),
        number('itemDataValues', 'valueID', 'value', value),
      );
    }
    return id;
  };
  const creator = (of, role, first, last) => {
    db.prepare('INSERT OR IGNORE INTO creators (firstName, lastName, fieldMode) VALUES (?, ?, 0)').run(first, last);
    const id = db.prepare('SELECT creatorID AS n FROM creators WHERE firstName = ? AND lastName = ?').get(first, last).n;
    const order = db.prepare('SELECT COUNT(*) AS n FROM itemCreators WHERE itemID = ?').get(of).n;
    db.prepare('INSERT INTO itemCreators VALUES (?, ?, ?, ?)').run(
      of,
      id,
      number('creatorTypes', 'creatorTypeID', 'creatorType', role),
      order,
    );
  };

  const article = item('journalArticle', 'ARTICLE1', {
    title: 'The Rise of the Greek Epic',
    publicationTitle: 'The Journal of Hellenic Studies',
    volume: '108',
    pages: '151-172',
    date: '1988-00-00 1988',
    DOI: '10.2307/632637',
  });
  creator(article, 'author', 'M. L.', 'West');
  const book = item('book', 'BOOK0001', {
    title: 'The Singer of Tales',
    publisher: 'Harvard University Press',
    place: 'Cambridge, MA',
    date: '1960-00-00 1960',
  });
  creator(book, 'author', 'Albert B.', 'Lord');
  const chapter = item('bookSection', 'CHAPTER1', {
    title: 'Homeric Questions',
    bookTitle: 'A New Companion to Homer',
    publisher: 'Brill',
    place: 'Leiden',
    date: '1997-00-00 1997',
    pages: '101-122',
  });
  creator(chapter, 'author', 'Frank', 'Turner');
  creator(chapter, 'editor', 'Ian', 'Morris');

  db.prepare("INSERT INTO collections (collectionName, libraryID, key) VALUES ('Homer', 1, 'COLLHOME')").run();
  db.prepare('INSERT INTO collectionItems (collectionID, itemID) VALUES (1, ?)').run(article);
  db.prepare('INSERT INTO collectionItems (collectionID, itemID) VALUES (1, ?)').run(chapter);

  const file = item('attachment', 'ATTACH01', { title: 'West 1988.pdf' });
  db.prepare(
    "INSERT INTO itemAttachments (itemID, parentItemID, linkMode, contentType, path) VALUES (?, ?, 0, 'application/pdf', 'storage:West 1988.pdf')",
  ).run(file, article);
  writeFileSync(join(zotero, 'storage', 'ATTACH01', 'West 1988.pdf'), '%PDF-1.4 the article of West');
  db.close();
}

const desk = join(home, 'desk');
mkdirSync(desk);
writeFileSync(
  join(desk, 'article.typ'),
  `#set document(title: "Origins of Homophily in an Evolving Social Network")
#set page(paper: "a5")
= Origins of Homophily in an Evolving Social Network
Gueorgi Kossinets and Duncan J. Watts

American Journal of Sociology 115 (2009). DOI: 10.1086/599247

#lorem(120)
`,
);
writeFileSync(
  join(desk, 'notes.typ'),
  `#set page(paper: "a5")
= Notes from the seminar
#lorem(60)
`,
);
let pdfs = true;
try {
  for (const name of ['article', 'notes']) {
    execFileSync('typst', ['compile', join(desk, `${name}.typ`), join(desk, `${name}.pdf`)], { stdio: 'pipe' });
  }
} catch {
  pdfs = false;
}

let online = true;
try {
  const r = await fetch('https://doi.org/', { method: 'HEAD', signal: AbortSignal.timeout(8000) });
  online = r.status < 500;
} catch {
  online = false;
}

const app = await App.launch({ width: 1280, height: 900, env: { HOME: home } });
try {
  await app.installErrorHook();
  const entries = () =>
    app.execAsync(`return (await window.__TAURI_INTERNALS__.invoke('library_list')).entries`);

  await app.keys(['Control', '2']);
  await app.waitForText('button', 'New reference', 8000);
  await sleep(300);

  // ---- looking up ----
  if (!online) {
    passOver('looking up by DOI, by ISBN and by words', 'the network cannot be reached');
  } else {
    await app.clickText('button', 'New reference');
    await app.waitFor('dialog .lookup input');
    await sleep(250);
    await app.keys('https://doi.org/10.1086/599247');
    await app.press('Enter');
    await app.waitFor('dialog .lookup .from', 40000);
    await sleep(400);
    await app.screenshot('sources-1-doi');
    const filled = await app.exec(
      `return Array.from(document.querySelectorAll('dialog .body input, dialog .body textarea')).map((i) => i.value).join(' | ')`,
    );
    check('a DOI fills in the form', /Origins of Homophily/i.test(filled) && /Kossinets/.test(filled), filled.slice(0, 160));
    check('and says where the details are from', /Crossref/.test(await app.text('dialog .lookup .from')));
    await app.clickText('dialog footer button', 'Add reference');
    await app.waitGone('dialog[open]', 8000);
    const one = (await entries()).find((e) => /Homophily/.test(e.title));
    check('the reference is in the library, as an article', one?.type === 'article' && one.year === '2009', JSON.stringify(one ?? null).slice(0, 200));

    // Words, for a book.
    await app.clickText('button', 'New reference');
    await app.waitFor('dialog .lookup input');
    await sleep(250);
    await app.keys('nagy best of the achaeans');
    await app.press('Enter');
    await app.waitFor('dialog .lookup .hits .hit, dialog .lookup .none', 60000);
    await sleep(300);
    await app.screenshot('sources-2-words');
    const hits = await app.exec(
      `return Array.from(document.querySelectorAll('dialog .lookup .hit')).map((h) => h.querySelector('.title').textContent.trim() + ' — ' + h.querySelector('.source').textContent.trim())`,
    );
    check('words find the book among the first', hits.some((h) => /best of the Achaeans/i.test(h)), hits.slice(0, 3).join(' ‖ '));
    await app.click(await app.findByText('dialog .lookup .hit', 'chaeans'));
    await app.waitFor('dialog .lookup .from', 5000);
    await sleep(300);
    const book = await app.exec(
      `return Array.from(document.querySelectorAll('dialog .body input, dialog .body textarea')).map((i) => i.value).join(' | ')`,
    );
    check('choosing one fills in the form', /Nagy/.test(book) && /Achaeans/i.test(book), book.slice(0, 160));
    await app.screenshot('sources-3-chosen');
    await app.clickText('dialog footer button', 'Add reference');
    await app.waitGone('dialog[open]', 8000);

    // The same again is known.
    await app.clickText('button', 'New reference');
    await app.waitFor('dialog .lookup input');
    await sleep(250);
    await app.keys('10.1086/599247');
    await app.press('Enter');
    await app.waitFor('dialog .lookup .from', 40000);
    await app.waitForText('dialog', 'already', 8000);
    await sleep(300);
    await app.screenshot('sources-4-known');
    check('what is looked up a second time is said to be there already', true);
    await app.clickText('dialog footer button', 'Cancel');
    await app.waitGone('dialog[open]', 5000);
  }

  // ---- a PDF dropped on the window ----
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
  if (!pdfs) {
    passOver('PDF files', 'Typst is not installed, so none could be made');
  } else {
    const before = (await entries()).length;
    if (online) {
      // How far it has come is shown, and it can be stopped: then nothing is added.
      await drop([join(desk, 'article.pdf'), join(desk, 'notes.pdf')], 500, 400);
      await app.waitFor('.working button', 5000);
      await app.waitForText('.working .doing', 'of 2', 5000).catch(() => {});
      const told = await app.exec(`return document.querySelector('.working .doing')?.textContent.trim() ?? ''`);
      await app.screenshot('sources-5a-finding-out');
      await app.clickText('.working button', 'Stop');
      await app.waitGone('.working', 60000);
      await sleep(500);
      // Both are at hand at once: either may be the one named, and one may be done already.
      check('while files are found out about, how far it has come is shown', /[12] of 2: (article|notes)\.pdf/.test(told), told.trim());
      check('and it can be stopped, adding nothing', !(await app.exists('dialog .what')) && (await entries()).length === before);
    }
    await drop([join(desk, 'article.pdf'), join(desk, 'notes.pdf')], 500, 400);
    await app.waitFor('dialog .what', 90000);
    await sleep(400);
    await app.screenshot('sources-5-pdf');
    const shown = await app.text('dialog[open]');
    check('files that are dropped are told apart', /1 new reference/.test(shown) && /\bnotes\b/.test(shown) && /2 files/.test(shown), shown.replace(/\s+/g, ' ').slice(0, 200));
    if (online) check('the one with a DOI is known by it', /already in your library/i.test(shown));
    const button = await app.exec(
      `return Array.from(document.querySelectorAll('dialog[open] footer button')).map((b) => b.textContent.trim()).join(' | ')`,
    );
    await app.exec(
      `Array.from(document.querySelectorAll('dialog[open] footer button')).filter((b) => !/Cancel/.test(b.textContent)).pop().click()`,
    );
    await app.waitGone('dialog[open]', 15000);
    await sleep(500);
    const after = await entries();
    const article = after.find((e) => /Homophily/.test(e.title));
    check(
      'the files are kept with their references',
      !!article && article.attachments === 1 && after.some((e) => e.attachments === 1 && e !== article),
      `${button} · ${before} → ${after.length} · ${JSON.stringify(after.filter((e) => e.attachments).map((e) => e.title))}`,
    );
    check('and no reference is there twice', after.filter((e) => /Homophily/.test(e.title)).length === 1);
  }

  // ---- Zotero ----
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Import from Zotero');
  await app.waitFor('dialog .where', 8000);
  await sleep(300);
  await app.screenshot('sources-6-zotero');
  const facts = await app.text('dialog .where .facts');
  check('the Zotero of this computer is found', /3 references/.test(facts) && /1 file/.test(facts), facts);
  const count = (await entries()).length;
  await app.clickText('dialog footer button', 'Read 3 references');
  await app.waitFor('dialog .what', 15000);
  await sleep(400);
  await app.screenshot('sources-7-zotero-plan');
  await app.exec(
    `Array.from(document.querySelectorAll('dialog[open] footer button')).filter((b) => !/Cancel/.test(b.textContent)).pop().click()`,
  );
  await app.waitGone('dialog[open]', 15000);
  await sleep(500);
  const all = await entries();
  const west = all.find((e) => /Rise of the Greek Epic/.test(e.title));
  const chapter = all.find((e) => /Homeric Questions/.test(e.title));
  check('what Zotero held is in the library', all.length === count + 3 && !!west && !!chapter, `${count} → ${all.length}`);
  check('with its files', west?.attachments === 1);
  check('in the kinds that BibLaTeX has for them', west?.type === 'article' && chapter?.type === 'incollection', `${west?.type}, ${chapter?.type}`);
  const collections = await app.execAsync(`return (await window.__TAURI_INTERNALS__.invoke('library_list')).collections`);
  const homer = collections.find((c) => c.name === 'Homer');
  check('and in its collections', homer?.entries.length === 2, JSON.stringify(collections.map((c) => [c.name, c.entries.length])));
  const zoteroFile = readFileSync(join(zotero, 'storage', 'ATTACH01', 'West 1988.pdf'), 'utf8');
  check('Zotero is left as it was', zoteroFile === '%PDF-1.4 the article of West');

  // A second time, nothing is new.
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Import from Zotero');
  await app.waitFor('dialog .where', 8000);
  await sleep(300);
  await app.clickText('dialog footer button', 'Read 3 references');
  await app.waitForText('dialog[open]', 'already in your library', 15000);
  await sleep(300);
  const again = await app.text('dialog[open]');
  check('a second import finds everything there already', /3 references already in your library/.test(again), again.replace(/\s+/g, ' ').slice(0, 160));
  await app.screenshot('sources-8-zotero-again');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]');

  // ---- a PDF dropped on an element of a map ----
  if (pdfs) {
    await app.keys(['Control', '1']);
    await app.waitForText('button', 'Begin a project', 8000);
    await app.clickText('button', 'Begin a project');
    await app.waitFor('dialog input');
    await app.type('dialog input', 'Networks');
    await app.clickText('dialog footer button', 'Create');
    await app.waitFor('.diagram .node.root', 8000);
    await sleep(400);
    const place = await app.exec(
      `const r = document.querySelector('.diagram .node.root').getBoundingClientRect();
       return { x: r.left + r.width / 2, y: r.top + r.height / 2 }`,
    );
    await drop([join(desk, 'article.pdf')], place.x, place.y);
    // It is in the library already: there is nothing to ask. The element then has text, which it shows.
    await until(
      'the reference to be cited',
      () => app.exec(`return document.querySelector('.diagram .node.root .marks') ? true : null`),
      60000,
    );
    check('without a question where there is nothing to decide', !(await app.exists('dialog[open]')));
    await app.doubleClick('.diagram .node.root');
    await app.waitFor('.box .text .prose');
    await sleep(300);
    const cited = await app.text('.box .text .prose');
    check('a file dropped on an element is cited in its text', /Kossinets and Watts 2009/.test(cited), cited);
    check('and nothing is attached to the element besides', !(await app.exists('.box .attach, .box .chip')));
    await app.screenshot('sources-9-cited');
    await app.press('Escape');
    await app.waitGone('.box');
    await app.keys(['Control', 'Shift', 'r']);
    await app.waitFor('.panel .reference-row, .panel [role="row"], .panel .row', 5000);
    await sleep(300);
    await app.screenshot('sources-10-panel');
    const listed = await app.exec(`return document.querySelector('.panel .body').textContent`);
    check('what is cited is among the references of the project', /Kossinets/.test(listed) && /Homophily/.test(listed), listed.replace(/\s+/g, ' ').slice(0, 120));
  }

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('sources-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(home, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
