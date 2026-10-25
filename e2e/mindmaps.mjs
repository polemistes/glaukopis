// Mind maps of other programs: a map of Freeplane opened from the plus at
// the head of the list becomes a project, the names of the map in its
// diagram, the folded one folded, the association with its words, and a
// message of what had no place; the project saved as a mind map is a map
// of Freeplane again, which opens as a project with the same names. A file
// of XMind, made here from the fixture by the core's own zip command, is
// opened, saved and opened again; and a project saved as OPML is brought
// in as a document, its names as elements and its notes as their text.
//
// The dialogs that choose a file cannot be answered off-screen: the items
// are found in their menus, and what they do with a path is done through
// the page's own hook.

import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(150);
  }
}

const fixtures = join(root, 'src', 'lib', 'mindmaps', 'fixtures');
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-maps-'));
copyFileSync(join(fixtures, 'odyssey.mm'), join(desk, 'odyssey.mm'));

const LIST = '[data-projects-pane] .list';

const app = await App.launch({ newProjectView: 'diagram' });
try {
  await app.installErrorHook();
  await app.waitFor('[data-start]', 15000);

  // The dialogs that choose a file cannot be answered off-screen: what the
  // items do once a path is chosen is done through the page's own hook.
  const openAt = (path) => app.exec(`void window.__glaukopisMindMaps.open(arguments[0])`, path);
  const saveAt = (name, path) =>
    app.execAsync(`await window.__glaukopisMindMaps.save(arguments[0], arguments[1])`, name, path);
  const plusMenu = async (item) => {
    if (!(await app.exists('[data-projects-pane]'))) {
      await app.click('[data-projects-button]');
      await app.waitFor('[data-projects-pane]', 5000);
    }
    await app.click('[data-projects-new]');
    await app.waitFor('.menu');
    await sleep(150);
    const offered = await app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).some((m) => m.textContent.includes(arguments[0]))`,
      item,
    );
    await app.press('Escape');
    await sleep(150);
    return offered;
  };
  const toasts = () =>
    app.exec(`return Array.from(document.querySelectorAll('.toast')).map((t) => t.innerText.replace(/\\s+/g, ' ').trim())`);
  /** The names in the diagram of the side shown, as the boxes show them. */
  const diagramNames = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node[data-node] .caption .name')).map((n) => n.textContent.replace(/\\s+/g, ' ').trim())`,
    );
  const projectRow = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('${LIST} .row.project')).find((r) => r.querySelector('.name')?.textContent.trim() === arguments[0]) ?? null`,
      name,
    );
  /** Whether the menu of the project of that name, in the list, offers the item. */
  const projectMenu = async (name, item) => {
    if (!(await app.exists('[data-projects-pane]'))) {
      await app.click('[data-projects-button]');
      await app.waitFor('[data-projects-pane]', 5000);
    }
    const row = await until(`the row of ${name}`, () => projectRow(name));
    await app.rightClick(row);
    await app.waitFor('.menu');
    await sleep(150);
    const offered = await app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).some((m) => m.textContent.includes(arguments[0]))`,
      item,
    );
    await app.press('Escape');
    await sleep(150);
    return offered;
  };
  /** Waits for a project of that name to be open in the diagram, and for its boxes. */
  const opened = async (name) => {
    await until(`${name} open`, async () => (await app.inView()) === name, 15000);
    await app.view('diagram');
    await app.waitFor('.diagram .node[data-node]', 8000);
    await sleep(600);
  };

  // --- A map of Freeplane opened ---
  check('the plus at the head of the list offers to open a mind map', await plusMenu('Open a mind map…'));
  await openAt(join(desk, 'odyssey.mm'));
  await opened('The Odyssey');
  const names = await diagramNames();
  check(
    'the map opens as a project, its names in the diagram',
    ['The Odyssey', 'Telemachy', 'The wanderings of Odysseus', 'Summary', 'Athena in disguise', 'Sparta'].every((n) =>
      names.includes(n),
    ),
    names.join(' | '),
  );
  check('the folded one is folded', !names.includes('Odysseus') && (await app.exists('.diagram .fold.folded')));
  const italic = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node .caption .name em')).map((e) => e.textContent)`,
  );
  check('a name keeps its italics', italic.includes('wanderings'), italic.join(','));
  // The association goes to one that is folded away: it is shown where the two are.
  const links = await app.exec(`return Array.from(document.querySelectorAll('.diagram .link-label')).map((l) => l.textContent.trim())`);
  const told = (await toasts()).join(' / ');
  check('what had no place is told', /no place in a project/.test(told) && /One cloud/.test(told) && /One image/.test(told), told);
  await app.screenshot('mindmaps-1-opened');
  // Unfolded, the association with its words is drawn.
  await app.click(await app.exec(`return document.querySelector('.diagram .fold.folded')`));
  await sleep(700);
  const shownLinks = await app.exec(`return Array.from(document.querySelectorAll('.diagram .link-label')).map((l) => l.textContent.trim())`);
  check('the association is drawn with its words', [...links, ...shownLinks].includes('helps'), shownLinks.join(','));
  await app.screenshot('mindmaps-1b-unfolded');

  // --- Saved as a map of Freeplane, and opened again ---
  const written = join(desk, 'again.mm');
  check('the project’s menu offers to save it as a mind map', await projectMenu('The Odyssey', 'Save as a mind map…'));
  await saveAt('The Odyssey', written);
  await until('the map written', () => existsSync(written));
  await sleep(300);
  const xml = readFileSync(written, 'utf8');
  check('the file is a map of Freeplane', /^<map version="freeplane [\d.]+">\n/.test(xml) && /<\/map>\n$/.test(xml));
  check('it holds every element as a node', (xml.match(/<node /g) ?? []).length === 8, `${(xml.match(/<node /g) ?? []).length} nodes`);
  check(
    'with the names, the association and its words',
    ['TEXT="The Odyssey"', 'TEXT="Telemachy"', 'TEXT="Athena in disguise"'].every((s) => xml.includes(s)) &&
      /<arrowlink DESTINATION="ID_\d+"[^>]*MIDDLE_LABEL="helps"/.test(xml),
  );
  check('with the kind, the status and the note', xml.includes('NAME="Kind" VALUE="Part"') && xml.includes('BUILTIN="button_ok"') && xml.includes('TYPE="NOTE"'));
  const before = await diagramNames();
  await openAt(written);
  await opened('The Odyssey (2)');
  const after = await diagramNames();
  const plain = (list) => list.filter((n) => !/^The Odyssey/.test(n)).sort().join('|');
  check('opened again, the diagram has the same names', plain(before) === plain(after), `${plain(before)} / ${plain(after)}`);
  await app.screenshot('mindmaps-2-reopened');

  // --- A file of XMind ---
  const xmindFile = join(desk, 'iliad.xmind');
  await app.execAsync(
    `await window.__TAURI_INTERNALS__.invoke('zip_write', { path: arguments[0], entries: [{ name: 'content.json', text: arguments[1] }, { name: 'metadata.json', text: '{}' }] });`,
    xmindFile,
    readFileSync(join(fixtures, 'content.json'), 'utf8'),
  );
  await openAt(xmindFile);
  await opened('iliad');
  const xnames = await diagramNames();
  check('the file of XMind opens, a sheet an element each', ['iliad', 'Iliad', 'Notes'].every((n) => xnames.includes(n)), xnames.join(' | '));
  check(
    'under a sheet, its topics and the floating one',
    ['The quarrel', 'The battles', 'The gods'].every((n) => xnames.includes(n)),
    xnames.join(' | '),
  );
  await app.screenshot('mindmaps-3-xmind');
  const xmindAgain = join(desk, 'iliad-again.xmind');
  await saveAt('iliad', xmindAgain);
  await until('the file of XMind written', () => existsSync(xmindAgain));
  await sleep(300);
  const entries = await app.execAsync(`return await window.__TAURI_INTERNALS__.invoke('zip_read', { path: arguments[0] })`, xmindAgain);
  const entryNames = entries.map((e) => e.name).sort();
  check(
    'it is written with both forms of XMind and their manifests',
    ['META-INF/manifest.xml', 'content.json', 'content.xml', 'manifest.json', 'meta.xml', 'metadata.json'].every((n) => entryNames.includes(n)),
    entryNames.join(','),
  );
  const content = JSON.parse(entries.find((e) => e.name === 'content.json').text);
  check('its sheet has the topics and the relationship with its words', content[0].rootTopic.children.attached.length === 2 && content[0].relationships?.[0]?.title === 'kills');
  await openAt(xmindAgain);
  await opened('iliad (2)');
  const xagain = await diagramNames();
  check(
    'opened again, the same names',
    plain(xnames.filter((n) => n !== 'iliad')) === plain(xagain.filter((n) => n !== 'iliad (2)')),
    xagain.join(' | '),
  );

  // --- Saved as OPML, and brought in as a document ---
  const opml = join(desk, 'odyssey.opml');
  await saveAt('The Odyssey', opml);
  await until('the OPML written', () => existsSync(opml));
  await sleep(300);
  const outline = readFileSync(opml, 'utf8');
  check('the OPML has an outline to each element, the notes in _note', (outline.match(/<outline /g) ?? []).length === 8 && /_note="Telemachus goes/.test(outline));
  await app.exec(`void window.__glaukopisMindMaps.fromDocument(arguments[0])`, opml);
  // What is to be made of the document is asked first, as for any document.
  await app.waitForText('dialog[open] footer button', 'Make the project', 20000);
  await sleep(300);
  await app.clickText('dialog[open] footer button', 'Make the project');
  await until(
    'the project of the document',
    async () => !(await app.exists('dialog[open]')) && /^The Odyssey/.test((await app.inView()) ?? ''),
    30000,
  );
  await sleep(1500);
  const body = await app.exec(`return document.body.innerText`);
  check('brought in, the names are there, and a note as text', ['Telemachy', 'Athena in disguise'].every((n) => body.includes(n)) && body.includes('Telemachus goes in search'), body.slice(0, 200).replace(/\s+/g, ' '));
  await app.screenshot('mindmaps-4-opml');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log(`FAIL  the script stopped: ${error.stack ?? error}`);
  checks.push({ name: 'the script ran to the end', ok: false });
  const said = await app
    .exec(`return Array.from(document.querySelectorAll('.toast')).map((t) => t.innerText.replace(/\\s+/g, ' ').trim())`)
    .catch(() => []);
  console.log(`      the messages shown: ${said.join(' / ') || 'none'}`);
  console.log(`      the errors of the page: ${(await app.pageErrors().catch(() => [])).join(' | ') || 'none'}`);
  await app.screenshot('mindmaps-failed').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed} ok, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
