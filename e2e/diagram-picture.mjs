// The diagram saved as a picture: as SVG and as a PNG image, from the menu of its background.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
try {
  await app.installErrorHook();
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);

  await app.click('.diagram .node.root');
  const add = async (where, name, italicLast = false) => {
    await app.keys(where === 'under' ? ['Alt', 'Shift', 'Enter'] : ['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    if (italicLast) {
      // The last word in italics, as a title is.
      await app.keys(['Control', 'Shift', 'ArrowLeft']);
      await app.keys(['Control', 'i']);
      await app.press('End');
    }
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('under', 'The word mênis');
  await add('after', 'Μῆνιν ἄειδε θεά');
  await add('after', 'Achilles and Apollo');
  await add('after', 'The economy of honour, which runs through the whole of the poem');
  await add('after', 'Reception of the Iliad', true);
  await add('under', 'Virgil');
  await add('after', 'Milton');

  // A status, from the menu of an element.
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles and Apollo'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Status');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Draft');
  await sleep(200);

  // A kind of its own.
  await app.rightClick(await app.findByText('.diagram .node', 'The word mênis'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'New kind…');
  await app.waitForText('dialog[open] h2', 'New kind', 3000);
  await sleep(200);
  await app.keys('Theme');
  await app.click('dialog[open] .swatch[aria-label="Rose"]');
  await app.clickText('dialog[open] footer button', 'Create');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);

  // An association with a few words: from the menu, ended on another element, then named.
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles and Apollo'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('[role="menuitem"]', 'Associate with');
  await sleep(150);
  await app.click(await app.findByText('.diagram .node', 'Virgil'));
  await sleep(300);
  check('an association is drawn', (await app.count('.diagram .association')) === 1);
  await app.exec(
    `const g = document.querySelector('.diagram .association');
     const box = g.querySelector('.curve').getBoundingClientRect();
     g.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));`,
  );
  await app.waitFor('.diagram .link-label.editing', 3000);
  await app.keys('answers');
  await app.press('Enter');
  await sleep(200);

  // One folded, with what is under it hidden.
  await app.click(await app.findByText('.diagram .node', 'Reception of the Iliad'));
  await app.press('Tab');
  await sleep(300);
  check('an element is folded', await app.exists('.diagram .fold.folded'));

  // Selected, and zoomed out: the picture shows neither.
  await app.click(await app.findByText('.diagram .node', 'Milton').catch(() => '.diagram .node.root'));
  await app.click('.diagram .controls button[aria-label="Zoom out"]');
  await sleep(400);
  await app.screenshot('diagram-picture-0-screen');

  const out = join(app.dataDir, 'pictures-out');

  /** The menu of the background: opened where nothing else is under the pointer. */
  const backgroundMenu = async (item) => {
    const opened = await app.exec(
      `const d = document.querySelector('.diagram');
       const r = d.getBoundingClientRect();
       for (const [fx, fy] of [[0.03, 0.5], [0.97, 0.5], [0.5, 0.08], [0.03, 0.15], [0.97, 0.15], [0.5, 0.6]]) {
         const x = r.left + r.width * fx, y = r.top + r.height * fy;
         const under = document.elementFromPoint(x, y);
         if (under !== d && !under?.classList.contains('world')) continue;
         under.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));
         return true;
       }
       return false;`,
    );
    if (!opened) throw new Error('no free place on the background');
    await app.waitFor('.menu [role="menuitem"]', 3000);
    await sleep(150);
    const offered = await app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((m) => m.textContent.includes(arguments[0]) && !m.disabled && m.getAttribute('aria-disabled') !== 'true') ? true : false`,
      item,
    );
    await app.screenshot('diagram-picture-menu');
    await app.press('Escape');
    await sleep(150);
    return offered;
  };
  /** What the item does, with the path the save dialog would give: the dialog cannot be answered off-screen. */
  const save = async (item, kind, path) => {
    check(`the menu of the background offers “${item}”`, await backgroundMenu(item));
    await app.execAsync(`await window.__glaukopisPicture.save(arguments[0], arguments[1]);`, kind, path);
  };

  const toast = async (pattern) => {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      const found = await app.exec(
        `return Array.from(document.querySelectorAll('.toast, [role="status"]')).map((t) => t.textContent).find((t) => ${pattern}.test(t)) ?? null`,
      );
      if (found) return found;
      await sleep(100);
    }
    return null;
  };

  // --- SVG ---
  await save('Save the diagram as SVG…', 'svg', join(out, 'Wrath and the hero.svg'));
  const said = await toast('/saved as/');
  if (!said)
    console.log('      shown:', await app.exec(`return Array.from(document.querySelectorAll('[class*="toast"], [role="status"], [role="alert"]')).map((t) => t.className + ': ' + t.textContent.trim()).join(' | ')`), await app.exec('return JSON.stringify(window.__glaukopisErrors ?? [])'));
  check('saving says so', /Wrath and the hero\.svg/.test(said ?? ''), said);
  const svgPath = join(out, 'Wrath and the hero.svg');
  check('the SVG is written', existsSync(svgPath));
  const svg = existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : '';
  check('it is an SVG', svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
  check('with no foreign objects in it', !svg.includes('foreignObject'));
  for (const name of ['The word mênis', 'Achilles and Apollo', 'Wrath and the hero', 'Μῆνιν ἄειδε θεά', 'answers'])
    check(`it holds “${name}”`, svg.includes(name));
  check('a long name is broken into lines as on the screen', /economy of honour, which runs[^<]*<\/tspan><\/text>\n<text/.test(svg) || (svg.match(/economy|poem/g) ?? []).length >= 2);
  check('the italics are italics', /font-style="italic"[^>]*>Iliad</.test(svg));
  check('the association is dashed', svg.includes('stroke-dasharray'));
  check('the kind stands at the edge', svg.includes('clipPath'));
  check('the fonts are in the file', /@font-face[^}]*data:font\/woff2;base64,/.test(svg));
  check('the Greek letters have their font', (svg.match(/@font-face/g) ?? []).length >= 3, `${(svg.match(/@font-face/g) ?? []).length} faces`);
  check('the selection is not in the picture', !svg.includes('focus-ring'));
  check('the hidden elements are not in it', !svg.includes('Milton'));
  const size = svg.match(/width="(\d+)" height="(\d+)"/);
  check('it has a size', !!size, size?.slice(1).join(' × '));
  console.log(`      the SVG is ${Math.round(svg.length / 1024)} KB`);
  // Kept beside the screenshots, to be opened in other programs.
  if (existsSync(svgPath)) {
    mkdirSync(join(root, 'e2e', 'output'), { recursive: true });
    copyFileSync(svgPath, join(root, 'e2e', 'output', 'diagram-picture.svg'));
  }

  // Shown, at its own size, over the diagram.
  const shown = await app.execAsync(
    `return await (async () => {
       document.querySelector('#shown')?.remove();
       const img = document.createElement('img');
       img.id = 'shown';
       img.src = 'data:image/svg+xml;base64,' + arguments[0];
       img.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;max-width:100vw;max-height:100vh;border:1px solid red';
       document.body.append(img);
       await new Promise((done) => { img.onload = done; img.onerror = done; });
       return [img.naturalWidth, img.naturalHeight];
     })()`,
    Buffer.from(svg).toString('base64'),
  );
  check('the SVG is drawn by the browser', shown && shown[0] > 0, JSON.stringify(shown));
  await app.screenshot('diagram-picture-1-svg');
  await app.exec(`document.querySelector('#shown')?.remove();`);

  // --- In the dark ---
  await app.setTheme('dark');
  await sleep(400);
  const darkPath = join(app.dataDir, 'pictures-dark', 'Wrath and the hero.svg');
  await save('Save the diagram as SVG…', 'svg', darkPath);
  const dark = existsSync(darkPath) ? readFileSync(darkPath, 'utf8') : '';
  const ground = (s) => s.match(/<rect x="[-\d.]+" y="[-\d.]+" width="\d+" height="\d+" fill="(#[0-9a-f]{6})"/)?.[1];
  check('the dark theme gives a dark picture', !!ground(dark) && ground(dark) !== ground(svg), `${ground(svg)} → ${ground(dark)}`);
  await app.setTheme('light');
  await sleep(300);

  // --- PNG ---
  await save('Save the diagram as an image…', 'png', join(out, 'Wrath and the hero.png'));
  const saidPng = await toast(/pixels/);
  check('saving the image says its size', /× \d+ pixels/.test(saidPng ?? ''), saidPng);
  const pngPath = join(out, 'Wrath and the hero.png');
  check('the image is written', existsSync(pngPath));
  if (existsSync(pngPath)) {
    const png = readFileSync(pngPath);
    check('it is a PNG', png.subarray(1, 4).toString() === 'PNG');
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    check('at twice the size of the SVG', size && w === 2 * Number(size[1]) && h === 2 * Number(size[2]), `${w} × ${h}`);
    await app.execAsync(
      `return await (async () => {
         const img = document.createElement('img');
         img.id = 'shown';
         img.src = 'data:image/png;base64,' + arguments[0];
         img.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:' + (arguments[1] / 2) + 'px;max-width:100vw;border:1px solid red';
         document.body.append(img);
         await new Promise((done) => { img.onload = done; img.onerror = done; });
         return true;
       })()`,
      png.toString('base64'),
      w,
    );
    await app.screenshot('diagram-picture-2-png');
    await app.exec(`document.querySelector('#shown')?.remove();`);
  }

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  if (errors?.length) console.log('errors in the page:', JSON.stringify(errors).slice(0, 2000));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('diagram-picture-stopped').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
