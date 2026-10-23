// Every project kept as Org: a project with verse (numbered, with a
// speaker), a quotation, a list, a note, a citation of a work of the
// library and a comment, written in by pasting Org; its folder holds
// project.org and references.bib once it is saved, each line as the Org
// form has it; what is copied of the text is Org; and the folder, opened
// as an Org file from the home page, makes a new project whose Org form
// is the first's.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(whatFor, fn, ms = 15000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${whatFor}`);
    await sleep(200);
  }
}

/** The folders of the projects on disk, each with what its project.org says, if it has one. */
function projectFolders(data) {
  const root = join(data, 'projects');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = join(root, d.name);
      const org = join(dir, 'project.org');
      return { id: d.name, dir, org: existsSync(org) ? readFileSync(org, 'utf8') : null };
    });
}

/** The Org text pasted into the text: everything the script checks, in Org. */
const PASTED = [
  '#+ATTR_GLAUKOPIS: :numbering counted :every 5',
  '#+BEGIN_VERSE',
  '@ Nurse',
  'If only the Argo had never flown',
  'through the dark Clashing Rocks',
  '#+END_VERSE',
  '',
  '#+BEGIN_QUOTE',
  'Sing, goddess, the wrath of Achilles.',
  '#+END_QUOTE',
  '',
  '- The ship',
  '- The fleece',
  '',
  'As Nagy says [cite:@nagy1979 73], the gods came first.[fn::So Nagy, who is not alone.]',
  '',
  'It belongs to gods before men.',
].join('\n');

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();

  // --- A work in the library, to be cited by its key ---
  await app.go('#/library');
  await app.waitForText('h3', 'Your library is empty');
  await app.clickText('button', 'New reference');
  await app.waitFor('dialog .form');
  const field = (name) => `dialog [data-field="${name}"] :is(input, textarea)`;
  await app.type(`dialog [data-field="author"] input[aria-label="Author: family name"]`, 'Nagy');
  await app.type(`dialog [data-field="author"] input[aria-label="Author: given names"]`, 'Gregory');
  await app.type(field('title'), 'The Best of the Achaeans');
  await app.type(field('publisher'), 'Johns Hopkins University Press');
  await app.type(field('date'), '1979');
  await sleep(600);
  const key = await app.attr('dialog [data-field="key"] input', 'placeholder');
  check('the work is keyed nagy1979', key === 'nagy1979', key);
  await app.clickText('dialog footer button', 'Add reference');
  await app.waitGone('dialog');
  await app.waitFor('.list .item');

  // --- A project, an element with a kind, and its text pasted as Org ---
  await app.go('#/');
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Medea');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  const add = async (key, name) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await app.click('.diagram .node.root');
  await add('Tab', 'The prologue');
  await add('Enter', 'Nurse');
  await app.rightClick(await app.findByText('.diagram .node', 'Nurse'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'New kind…');
  await app.waitForText('dialog[open] h2', 'New kind', 3000);
  await sleep(200);
  await app.keys('Character');
  await app.clickText('dialog[open] footer button', 'Create');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);

  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('prologue'));
     return s.querySelector('.body');`,
  );
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);
  // Pasted as text, as from a plain text editor.
  await app.exec(
    `const text = arguments[0];
     const pm = document.activeElement.closest('.prose');
     const e = new Event('paste', { bubbles: true, cancelable: true });
     Object.defineProperty(e, 'clipboardData', { value: {
       getData: (t) => (t === 'text/plain' ? text : ''),
       types: ['text/plain'], files: [], items: [],
     } });
     pm.dispatchEvent(e);`,
    PASTED,
  );
  await sleep(500);
  const shape = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('prologue'));
     return Array.from(s.querySelectorAll('.body .prose > p')).map((p) => (p.dataset.kind || 'text') + ':' + p.textContent.replace(/\\s+/g, ' ').trim());`,
  );
  // The bracket of a run names it before its first paragraph: only the end of each is the text.
  const is = (kind, words) => shape.some((p) => p.startsWith(`${kind}:`) && p.endsWith(words));
  check(
    'the Org pasted is read as a speaker, verse, a quotation, a list and paragraphs',
    /^speaker:.*Nurse$/.test(shape[0]) &&
      is('line', 'If only the Argo had never flownthrough the dark Clashing Rocks') &&
      is('quote', 'Sing, goddess, the wrath of Achilles.') &&
      is('item', 'The ship') &&
      is('item', 'The fleece') &&
      shape[shape.length - 1] === 'text:It belongs to gods before men.',
    shape.join(' | '),
  );
  check(
    'the citation is of the work of the library, and the note is a note',
    (await app.exists('.text-view .section .body .citation')) &&
      (await app.exists('.text-view .section .body .footnote')),
  );
  check(
    'the verse is numbered',
    await app.exec(`return !!document.querySelector('.text-view .section .body p[data-numbering="counted"]')`),
  );
  await app.screenshot('org-1-pasted');

  // --- A comment on the last words ---
  for (let i = 0; i < 11; i++) await app.keys(['Shift', 'ArrowLeft']);
  await sleep(100);
  await app.keys(['Control', 'Alt', 'c']);
  await app.waitFor('.beginning textarea', 3000);
  await app.keys('Is this Nagy’s phrase?');
  await app.press('Enter');
  await app.waitFor('.thread', 3000);
  await sleep(300);

  // --- What is copied as text is Org ---
  const prologue = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('prologue'));
     return s.querySelector('.body .prose > p:last-child');`,
  );
  await app.click(prologue['element-6066-11e4-a52e-4f735466cecf']);
  await sleep(150);
  await app.keys(['Control', 'a']);
  await sleep(250);
  const copied = await app.exec(
    `const pm = document.activeElement.closest('.prose');
     const kept = {};
     const e = new Event('copy', { bubbles: true, cancelable: true });
     Object.defineProperty(e, 'clipboardData', { value: {
       setData: (t, v) => { kept[t] = v; }, getData: (t) => kept[t] ?? '', clearData: () => {}, types: [],
     } });
     pm.dispatchEvent(e);
     return kept['text/plain'] ?? '';`,
  );
  check(
    'what is copied as text is Org',
    copied.includes('#+BEGIN_VERSE') && copied.includes('#+BEGIN_QUOTE') && copied.includes('[cite:@nagy1979 73]'),
    copied.split('\n').slice(0, 3).join(' / '),
  );
  await app.press('ArrowRight');

  // --- Saved: the folder holds the Org form and the works ---
  // The project is closed by going home, which saves it and writes its copy at once.
  await app.go('#/');
  await app.waitFor('[data-owl-map]', 8000);
  const first = await until('project.org in the folder of the project', () =>
    projectFolders(app.dataDir).find((f) => f.org && f.org.includes(':COMMENTS:')),
  );
  const org = first.org;
  const has = (line) => org.split('\n').some((l) => l.trim() === line);
  check('project.org begins with the title', org.startsWith('#+TITLE: Medea\n'), org.split('\n')[0]);
  check('the project is the first headline, its elements under it', has('* Medea') && has('** The prologue') && has('** Nurse'));
  check('an element has its id and its kind', /:KIND:\s+Character/.test(org) && /:ID:\s+project/.test(org));
  check('the kinds of the project stand under its headline', org.includes(':ELEMENT_KINDS:\n- Character ::'));
  check('the verse is numbered, with its speaker', has('#+ATTR_GLAUKOPIS: :numbering counted :every 5') && has('#+BEGIN_VERSE') && has('@ Nurse'));
  check('the quotation', has('#+BEGIN_QUOTE') && has('Sing, goddess, the wrath of Achilles.'));
  check('the list', has('- The ship') && has('- The fleece'));
  check(
    'the citation by its key, and the note',
    org.includes('[cite:@nagy1979 73]') && org.includes('[fn::So Nagy, who is not alone.]'),
  );
  check(
    'the comment, on its words',
    /:COMMENTS:\n- \[\d{4}-\d\d-\d\d[^\]]*\] on "before men\.": Is this Nagy’s phrase\?/.test(org),
    (org.match(/:COMMENTS:\n.*\n/) ?? [''])[0].trim(),
  );
  const bib = readFileSync(join(first.dir, 'references.bib'), 'utf8');
  check('references.bib holds the work cited, by its key', /@book\{nagy1979,/.test(bib) && /Best of the Achaeans/.test(bib), bib.split('\n')[0]);

  // --- Opened as an Org file: a new project with the same Org form ---
  // As Open an Org file… does once the folder of the first is chosen: the
  // dialog that chooses a file cannot be answered from here.
  await app.click('[data-owl-new]');
  await sleep(200);
  check('the home offers to open an Org file', (await app.findByText('[role="menuitem"]', 'Open an Org file…').catch(() => null)) !== null);
  await app.press('Escape');
  await app.exec(`void window.__glaukopisOrg.open(arguments[0])`, first.dir);
  // The work is in the library already: what to do with it may be asked.
  const opened = await until('the new project, or the question about its works', async () =>
    (await app.exists('dialog[open] footer button')) || (await app.exists('.text-view .section, .diagram .node.root')),
  );
  if (opened && (await app.exists('dialog[open] footer button'))) {
    const asked = await app.exec(`return document.querySelector('dialog[open] h2')?.textContent ?? ''`);
    check('the works of the Org file are asked about as a project file’s', /works the project cites/.test(asked), asked);
    await app.clickText('dialog[open] footer button', 'Make the project');
  }
  await app.waitFor('.text-view .section, .diagram .node.root', 15000);
  await sleep(600);
  const second = await until('the folder of the new project with its Org form', () =>
    projectFolders(app.dataDir).find((f) => f.id !== first.id && f.org),
  );
  const named = (text) => text.replace(/^#\+TITLE: .*$/m, '#+TITLE: ~').replace(/^\* .*$/m, '* ~');
  const a = named(first.org);
  const b = named(second.org);
  if (a !== b) {
    const la = a.split('\n');
    const lb = b.split('\n');
    const at = la.findIndex((l, i) => l !== lb[i]);
    console.log(`      first differs at line ${at + 1}:\n      ${la[at]}\n      ${lb[at]}`);
  }
  check('the new project’s Org form is the first’s: names, kinds, texts, comments', a === b);
  check('the new project is named as the first, or beside it', /^#\+TITLE: Medea/.test(second.org), second.org.split('\n')[0]);
  const shown = await app.exec(`return document.body.textContent.includes('If only the Argo') || document.body.textContent.includes('The prologue')`);
  check('and it is open', shown);
  await app.screenshot('org-2-opened');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('org-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
