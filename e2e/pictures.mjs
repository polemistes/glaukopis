// The store of pictures: what is known and said of each, and how they come into the texts of a project.

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, sleep } from './harness.mjs';

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
function png(width, height, shade = 0) {
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
      raw[row + 1 + x * 3] = (150 + 90 * Math.cos(d / 14) + shade) & 0xff;
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

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(join(desk, 'The shield.png'), png(480, 300));
writeFileSync(join(desk, 'Rings.png'), png(200, 120, 40));
writeFileSync(join(desk, 'A wide frieze.png'), png(640, 120, 90));
writeFileSync(
  join(desk, 'forms.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><circle cx="90" cy="80" r="50" fill="none" stroke="#7a2e2e" stroke-width="4"/><path d="M170 130 L215 30 L260 130 Z" fill="#2e4a7a"/></svg>',
);
writeFileSync(join(desk, 'not a picture.png'), 'This only says that it is one.');

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
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
  const store = join(app.dataDir, 'pictures');
  const files = () => (existsSync(join(store, 'files')) ? readdirSync(join(store, 'files')).sort() : []);
  const known = () => JSON.parse(readFileSync(join(store, 'pictures.json'), 'utf8'));
  const called = (name) => known().find((p) => p.name === name);
  const tiles = () => app.exec(`return Array.from(document.querySelectorAll('.pictures .tile .name')).map((n) => n.textContent.trim())`);
  const rows = () => app.exec(`return Array.from(document.querySelectorAll('.panel .list .row .name')).map((n) => n.textContent.trim())`);
  const tile = (name) => app.findByText('.pictures .tile', name);
  const row = (name) => app.findByText('.panel .list .row', name);
  const selectAll = () => app.keys(['Control', 'a']);
  const picturesKey = () => app.keys(['Control', 'Shift', 'p']);
  const both = async (name) => {
    await sleep(250);
    await app.screenshot(name);
    await app.setTheme('dark');
    await sleep(250);
    await app.screenshot(`${name}-dark`);
    await app.setTheme('light');
    await sleep(150);
  };

  // ---- the place ----
  await app.click('nav.rail a[aria-label="Pictures"]');
  await app.waitFor('.pictures', 5000);
  check('the store of pictures has a place in the rail', (await app.exec(`return location.hash`)) === '#/pictures');
  await app.keys(['Control', '1']);
  await app.waitGone('.pictures');
  await app.keys(['Control', '3']);
  await app.waitFor('.pictures', 5000);
  check('and a key', await app.exists('nav.rail a[aria-label="Pictures"].current'));
  await app.waitForText('.pictures .empty h3', 'The store is empty');
  check('empty, it says so', await app.exists('.pictures .empty .button.primary'));
  await both('pictures-1-empty');

  // ---- pictures dropped from the desktop ----
  const onto = await middleOf('.pictures .middle');
  await drop([join(desk, 'The shield.png'), join(desk, 'forms.svg'), join(desk, 'Rings.png')], onto.x, onto.y);
  await until('the pictures to be taken in', async () => (await app.count('.pictures .tile')) === 3, 10000);
  check('pictures dropped on the view are taken into the store', files().length === 3, files().join(', '));
  check('each with what it is called beneath', (await tiles()).sort().join('|') === 'Rings.png|The shield.png|forms.svg', (await tiles()).join('|'));
  await until('the small pictures to be drawn', () =>
    app.exec(`return Array.from(document.querySelectorAll('.pictures .tile img')).filter((i) => i.complete && i.naturalWidth > 0).length === 3`),
  );
  check('and shown small', true);
  check('the number of them is said', /^3 pictures$/.test((await app.text('.pictures header .count')).trim()), await app.text('.pictures header .count'));
  const again = await middleOf('.pictures .middle');
  await drop([join(desk, 'The shield.png')], again.x, again.y);
  await sleep(700);
  check('a picture that is there already is not there twice', (await app.count('.pictures .tile')) === 3 && files().length === 3);
  await drop([join(desk, 'not a picture.png')], again.x, again.y);
  await app.waitForText('.toaster', 'could not be added', 5000);
  check('what is no picture is not taken for one', files().length === 3);

  // ---- one is selected ----
  await app.click(await tile('The shield.png'));
  await app.waitFor('.detail .picture-pane', 3000);
  await until('the picture to be shown large', () =>
    app.exec(`const i = document.querySelector('.detail .shown img'); return !!i && i.complete && i.naturalWidth === 480`),
  );
  check('pressing a picture selects it, and shows what is known of it', true);
  const order = await tiles();
  const at = order.indexOf('The shield.png');
  await app.press(at === 0 ? 'ArrowRight' : 'ArrowLeft');
  await sleep(200);
  const moved = await app.exec(`return document.querySelector('.pictures .tile[aria-selected="true"] .name').textContent.trim()`);
  check('the arrow keys move the selection', moved === order[at === 0 ? 1 : at - 1], moved);
  await app.press(at === 0 ? 'ArrowLeft' : 'ArrowRight');
  await sleep(200);

  // ---- what it is called ----
  await app.click('.detail [data-field="name"] input');
  await selectAll();
  await app.keys('The shield of Achilles');
  await app.press('Enter');
  await until('the name to be kept', () => !!called('The shield of Achilles'));
  check('what a picture is called is kept on Enter', true);
  check('and said under it', (await tiles()).includes('The shield of Achilles'));

  // ---- what is said of it ----
  await app.click('.detail .caption-field .ProseMirror');
  await app.keys('The shield, as the ');
  await app.keys(['Control', 'i']);
  await app.keys('Iliad');
  await app.keys(['Control', 'i']);
  await app.keys(' has it');
  const typed = await app.exec(`return document.querySelector('.detail .caption-field .ProseMirror').innerHTML`);
  check('a word of the caption is set in italics', /as the <em>Iliad<\/em> has it/.test(typed), typed);
  await until('the caption to be kept', () => (called('The shield of Achilles').caption ?? []).length === 3);
  const caption = called('The shield of Achilles').caption;
  check(
    'the caption is kept a moment after the typing stops, with its marks',
    caption.map((c) => c.text).join('') === 'The shield, as the Iliad has it' &&
      caption[1].text === 'Iliad' &&
      caption[1].marks.em === true &&
      !caption[0].marks.em &&
      !caption[2].marks.em,
    JSON.stringify(caption),
  );
  // Small capitals by the button beside the field. What is typed after a pause is undone by itself.
  await sleep(1000);
  await app.keys(', ');
  await app.click('.detail .caption-field button[aria-label="Small capitals"]');
  await app.keys('xviii');
  await until('the small capitals to be kept', () => (called('The shield of Achilles').caption ?? []).some((c) => c.marks.smallcaps && c.text === 'xviii'));
  check('small capitals are set by the button beside the field', true);
  await app.keys(['Control', 'z']);
  await sleep(200);
  const undone = await app.exec(`return document.querySelector('.detail .caption-field .ProseMirror').textContent`);
  check('what was typed last can be undone', undone === 'The shield, as the Iliad has it', undone);
  await until('that to be kept as well', () => (called('The shield of Achilles').caption ?? []).length === 3);
  // The keys of the field are its own: Ctrl and the comma lowers what is written, and leads nowhere.
  await app.keys(['Control', ',']);
  await sleep(150);
  const lowered = await app.exec(`return document.querySelector('.detail .caption-field').matches(':focus-within') && location.hash`);
  check('the keys of the field mean nothing outside it', lowered === '#/pictures', String(lowered));
  await app.keys(['Control', ',']);

  // ---- what it shows ----
  await app.click('.detail [data-field="alt"] textarea');
  await app.keys('A round shield with rings');
  await app.click('.detail .notes textarea');
  await until('what it shows to be kept', () => called('The shield of Achilles').alt === 'A round shield with rings');
  check('what it shows is kept when the field is left', true);

  // ---- a note ----
  check('in the store there is one note, for all projects', (await app.count('.detail .notes textarea')) === 1);
  await app.keys('From the vase in Berlin. Ask for leave to print it.');
  await until('the note to be kept', () => /leave to print/.test(called('The shield of Achilles').note));
  check('a note is kept with the picture', true);
  check('and the picture is marked', (await app.count('.pictures .tile .noted')) === 1);
  const facts = (await app.text('.detail .facts')).replace(/\s+/g, ' ');
  check('what is known of the file is said', /PNG/.test(facts) && /480 × 300 points/.test(facts) && /kB|B/.test(facts), facts);
  check('and that no project uses it', /No project uses the picture/.test(await app.text('.detail .used')));
  await both('pictures-2-pane');

  // ---- the search ----
  await app.click('.pictures header input[type="search"]');
  await app.keys('berlin');
  await sleep(400);
  check('a picture is found by its notes', (await tiles()).join('|') === 'The shield of Achilles', (await tiles()).join('|'));
  await selectAll();
  await app.keys('iliad');
  await sleep(400);
  check('by what is said of it', (await tiles()).join('|') === 'The shield of Achilles');
  await selectAll();
  await app.keys('round');
  await sleep(400);
  check('by what it shows', (await tiles()).join('|') === 'The shield of Achilles');
  await selectAll();
  await app.keys('forms');
  await sleep(400);
  check('and by what it is called', (await tiles()).join('|') === 'forms.svg', (await tiles()).join('|'));
  await selectAll();
  await app.keys('nothing of the kind');
  await sleep(400);
  check('what is not there is said not to be', /Nothing found/.test(await app.text('.pictures .empty')));
  await app.press('Escape');
  await sleep(300);
  check('the search is cleared', (await app.count('.pictures .tile')) === 3);

  // ---- a project ----
  await app.keys(['Control', '1']);
  await app.waitForText('button', 'Begin a project', 8000);
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  // ---- the panel ----
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.panel[aria-label="References"]', 5000);
  await picturesKey();
  await app.waitFor('.panel[aria-label="Pictures"]', 5000);
  check('the panel of pictures takes the place of that of the references', !(await app.exists('.panel[aria-label="References"]')));
  check('its tab is the one chosen', await app.exists('.side-tabs [role="tab"][aria-label="Pictures"][aria-selected="true"]'));
  check('the project has no pictures yet', /No pictures yet/.test(await app.text('.panel .body')));
  await app.clickText('.panel [role="radio"]', 'This map');
  await sleep(200);
  check('nor has the map', /No pictures yet/.test(await app.text('.panel .body')));
  await app.clickText('.panel [role="radio"]', 'Store');
  await app.waitFor('.panel .list .row', 5000);
  check('the store has all of them', (await rows()).length === 3, (await rows()).join('|'));
  const line = await app.exec(
    `const r = Array.from(document.querySelectorAll('.panel .list .row')).find((e) => e.textContent.includes('The shield of Achilles'));
     return { said: r.querySelector('.said').innerHTML, noted: !!r.querySelector('.noted'), drawn: !!r.querySelector('img') };`,
  );
  check('a row has the beginning of the caption, in its type', /as the <em>Iliad<\/em> has it/.test(line.said), line.said);
  check('a mark for the notes, and the picture small', line.noted && line.drawn);
  await both('pictures-3-panel');

  // ---- dragged into a text ----
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);
  await app.keys('Hephaestus makes the arms.');
  await sleep(500);
  await app.drag(await row('The shield of Achilles'), '.box .text .prose p');
  await until('the figure', () => app.exists('.box .text figure.figure img[src^="blob:"]'), 10000);
  const said = await app.exec(`return document.querySelector('.box .text figure figcaption').innerHTML`);
  check('a picture dragged into a text is a figure there', true);
  check('which begins with the caption of the picture, italics and all', /^The shield, as the <em>Iliad<\/em> has it$/.test(said), said);
  const shows = await app.exec(`return document.querySelector('.box .text figure img').alt`);
  check('and with what it shows', shows === 'A round shield with rings', shows);
  await sleep(300);
  await app.screenshot('pictures-4-figure');

  // What is said of the figure is changed there, and not in the store.
  await app.click('.box .text figure figcaption');
  await app.keys(['Control', 'End']);
  await sleep(100);
  await app.exec(
    `const c = document.querySelector('.box .text figure figcaption'); const s = getSelection(); s.selectAllChildren(c); s.collapseToEnd();`,
  );
  await sleep(150);
  await app.keys(', in book 18');
  await sleep(900);
  const here = await app.text('.box .text figure figcaption');
  check('what is said of the figure is changed there', /has it, in book 18$/.test(here), here);
  check(
    'without changing what is said of the picture',
    called('The shield of Achilles').caption.map((c) => c.text).join('') === 'The shield, as the Iliad has it',
  );

  // ---- dragged onto an element ----
  await app.press('Escape');
  await sleep(200);
  await app.press('Escape');
  await app.waitGone('.box');
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Forms');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(200);
  await app.drag(await row('forms.svg'), await app.findByText('.diagram .node', 'Forms'));
  await sleep(500);
  await app.clickText('.panel [role="radio"]', 'Project');
  await until('the project to have two pictures', async () => (await rows()).length === 2);
  check('a picture dragged onto an element is a figure in its text', (await rows()).join('|') === 'forms.svg|The shield of Achilles', (await rows()).join('|'));
  await app.clickText('.panel [role="radio"]', 'This map');
  await sleep(300);
  check('the pictures of the map are those of its figures', (await rows()).length === 2, (await rows()).join('|'));
  await both('pictures-5-project');

  // ---- onto a section of the text ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await until('the figures in the text of the map', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 2, 10000);
  await app.clickText('.panel [role="radio"]', 'Store');
  await app.waitFor('.panel .list .row', 5000);
  const section = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.includes('Forms')).querySelector('.heading')`,
  );
  await app.drag(await row('Rings.png'), Object.values(section)[0]);
  await until('the third figure', async () => (await app.count('.text-view figure')) === 3, 8000);
  const under = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.includes('Forms'));
     return Array.from(s.querySelectorAll('figure img')).map((i) => i.dataset.picture.split('.')[1]).join('|');`,
  );
  check('a picture dragged onto a section is a figure at the end of its text', under === 'svg|png', under);

  // ---- from the tools for writing ----
  await app.click('.panel button[aria-label="Close"]');
  await app.waitGone('.panel');
  await app.click('.text-view .section .body .prose');
  await app.waitFor('.text-view .section .body .ProseMirror', 5000);
  await sleep(300);
  await app.clickText('.text-view .tools button', 'Insert');
  await app.waitFor('.menu');
  const insert = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim().replace(/\\s+/g, ' ')).join('|')`);
  check('the tools have a picture from a file, and one from the store', /Picture from a file…/.test(insert) && /Picture from the store…/.test(insert), insert);
  await app.clickText('.menu [role="menuitem"]', 'Picture from the store…');
  await app.waitFor('.panel[aria-label="Pictures"] .list .row', 5000);
  const chosen = await app.exec(`return document.querySelector('.panel [role="radio"][aria-checked="true"]').textContent.trim()`);
  check('which opens the panel on the store', chosen === 'Store' && (await rows()).length === 3, chosen);
  check('and leaves the cursor in the text', await app.exec(`return !!document.activeElement && !!document.activeElement.closest('.text-view .ProseMirror')`));

  // Files dropped on the panel are taken into the store.
  const panel = await middleOf('.panel .body');
  await drop([join(desk, 'A wide frieze.png')], panel.x, panel.y);
  await until('the picture to be taken in', async () => (await rows()).length === 4 && files().length === 4, 10000);
  check('pictures dropped on the panel are taken into the store', (await rows())[0] === 'A wide frieze.png', (await rows()).join('|'));

  // ---- the two kinds of notes ----
  await app.doubleClick(await row('The shield of Achilles'));
  await app.waitFor('dialog .picture-pane', 5000);
  await sleep(400);
  const scopes = await app.exec(`return Array.from(document.querySelectorAll('dialog .notes textarea')).map((t) => t.dataset.scope + ':' + t.value.slice(0, 13))`);
  check('in a project there is a note for the project, and the one for all', scopes.join('|') === 'project:|all:From the vase', scopes.join('|'));
  await app.exec(`document.querySelector('dialog .used').scrollIntoView({ block: 'center' })`);
  await sleep(200);
  await app.screenshot('pictures-7a-used');
  const uses = await app.exec(`return document.querySelector('dialog .used').textContent.replace(/\\s+/g, ' ').trim()`);
  check('the pane says in which map of the project the picture stands', /This project/.test(uses) && /Wrath and the hero/.test(uses), uses);
  await app.click('dialog .notes textarea[data-scope="project"]');
  await app.keys('For the chapter on the arms.');
  await sleep(300);
  const inProject = await app.exec(
    `return Array.from(document.querySelectorAll('dialog .notes textarea')).map((t) => t.dataset.scope + ':' + t.value).join('|')`,
  );
  check('what is written for the project is not with the picture', /^project:For the chapter on the arms\.\|all:From the vase/.test(inProject) && !/chapter on the arms/.test(called('The shield of Achilles').note), inProject);
  await both('pictures-7-dialog');
  await app.clickText('dialog .notes button', 'Keep it for all projects');
  await until('the note to be with the picture', () => /Ask for leave to print it\.\nFor the chapter on the arms\.$/.test(called('The shield of Achilles').note));
  const kept = await app.exec(`return Array.from(document.querySelectorAll('dialog .notes textarea')).map((t) => t.dataset.scope + ':' + t.value)`);
  check('a note of the project can be made one for all projects', kept[0] === 'project:' && /For the chapter on the arms\.$/.test(kept[1]), JSON.stringify(kept));
  await app.click('dialog .notes textarea[data-scope="project"]');
  await app.keys('Only for this book.');
  await sleep(300);
  await app.press('Escape');
  await app.waitGone('dialog');
  await sleep(300);
  // Notes on pictures are no notes on references.
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.panel[aria-label="References"]', 5000);
  check('a note on a picture marks no reference', (await app.count('.panel .note-button.has')) === 0);
  await app.click('.side-tabs [role="tab"][aria-label="Pictures"]');
  await app.waitFor('.panel[aria-label="Pictures"] .list .row', 5000);
  await app.doubleClick(await row('The shield of Achilles'));
  await app.waitFor('dialog .picture-pane', 5000);
  await sleep(400);
  const read = await app.exec(`return document.querySelector('dialog .notes textarea[data-scope="project"]').value`);
  check('the note of the project is read again', read === 'Only for this book.', read);
  check('and is not with the picture', !/Only for this book/.test(readFileSync(join(store, 'pictures.json'), 'utf8')));

  // ---- put into the text from the menu ----
  // After the notes: once the other button of the pointer has been pressed, what drives the
  // window here types capitals as small letters.
  await app.press('Escape');
  await app.waitGone('dialog');
  await app.click('.text-view .section .body .ProseMirror p');
  await sleep(300);
  await app.rightClick(await row('Rings.png'));
  await app.waitFor('.menu');
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"] .label')).map((m) => m.textContent.trim()).join('|')`);
  check('the menu of a row opens it, and puts it where the cursor is', offered === 'Open…|Put it into the text', offered);
  await app.clickText('.menu [role="menuitem"]', 'Put it into the text');
  await until('the fourth figure', async () => (await app.count('.text-view figure')) === 4, 8000);
  check('which makes a figure there', true);
  await sleep(300);
  await app.screenshot('pictures-8-text');
  await app.doubleClick(await row('The shield of Achilles'));
  await app.waitFor('dialog .picture-pane', 5000);
  await sleep(400);

  // ---- removal, from the project ----
  await app.clickText('dialog .picture-pane button', 'Remove from the store');
  await app.waitForText('dialog h2', 'Remove “The shield of Achilles” from the store?', 5000);
  const question = await app.exec(`return Array.from(document.querySelectorAll('dialog .message')).pop().textContent`);
  check('before a picture is removed it is asked, and said who uses it', /^1 project uses the picture\. Its figures will be left without the picture\./.test(question), question);
  await sleep(300);
  await app.screenshot('pictures-9-question');
  await app.clickText('dialog footer button', 'Cancel');
  await sleep(400);
  check('left as it was, it is still there', files().length === 4 && !!called('The shield of Achilles'));
  await app.clickText('dialog .picture-pane button', 'Remove from the store');
  await app.waitForText('dialog h2', 'Remove “The shield of Achilles” from the store?', 5000);
  await app.clickText('dialog footer button', 'Remove');
  await until('the picture to be gone', () => files().length === 3 && !called('The shield of Achilles'));
  check('removed, it is no longer in the store', true);
  await app.waitGone('dialog', 5000);
  await app.clickText('.panel [role="radio"]', 'Project');
  await sleep(400);
  const left = await app.exec(
    `return Array.from(document.querySelectorAll('.panel .list .row')).map((r) => r.querySelector('.name').textContent.trim() + (r.classList.contains('absent') ? ' (absent)' : '')).join('|')`,
  );
  check('the project names it still, and shows an empty frame', /The shield/.test(left) && /\(absent\)/.test(left), left);
  const without = await until('the figure to be without its picture', () =>
    app.exec(`const p = document.querySelector('.text-view figure .picture[data-state="absent"]'); return p ? p.dataset.name : null`),
  );
  check('its figure is left without the picture', /shield/i.test(without), without);
  await sleep(300);
  await app.screenshot('pictures-10-removed');

  // ---- removal, from the store ----
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(1200);
  const forms = known().find((p) => p.name === 'forms.svg').hash;
  await app.go(`#/pictures?picture=${forms}`);
  await app.waitFor('.pictures .tile', 5000);
  await app.waitFor('.detail .picture-pane', 3000);
  const named = await app.exec(`return document.querySelector('.pictures .tile[aria-selected="true"] .name').textContent.trim()`);
  check('a picture can be opened by its place in the application', named === 'forms.svg', named);
  const user = await until('the project that uses it', async () => {
    const words = await app.exec(`return document.querySelector('.detail .used').textContent.replace(/\\s+/g, ' ').trim()`);
    return /Wrath and the hero/.test(words) ? words : null;
  });
  check('in the store a picture says which projects use it', await app.exists('.detail .used a[href^="#/project/"]'), user);
  await both('pictures-11-used');
  await app.rightClick(await tile('A wide frieze.png'));
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Remove');
  await app.waitForText('dialog h2', 'Remove “A wide frieze.png” from the store?', 5000);
  const unused = await app.exec(`return Array.from(document.querySelectorAll('dialog .message')).pop().textContent`);
  check('of a picture that no project uses, that is said', /^No project uses the picture\./.test(unused), unused);
  await app.clickText('dialog footer button', 'Remove');
  await until('it to be gone', async () => files().length === 2 && (await app.count('.pictures .tile')) === 2);
  check('a picture is removed from its menu, when that has been confirmed', (await tiles()).join('|') === 'forms.svg|Rings.png', (await tiles()).join('|'));
  await app.waitFor('.detail .used a[href^="#/project/"]', 5000);
  check('the one that stood beside it is selected in its place', (await app.attr('.detail .picture-pane', 'data-picture')) === forms);
  await app.click('.detail .used a[href^="#/project/"]');
  await app.waitFor('.project', 8000);
  check('the name of a project leads to it', /^#\/project\//.test(await app.exec(`return location.hash`)));

  const errors = (await app.pageErrors()).filter((e) => !/not a picture of a kind/.test(e));
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('pictures-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
