// Timelines: elements say when they are, with dates or relative to one
// another; the map is seen as a timeline, with a lane for each city, the
// relative placement solved into its window, and a contradiction told.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Cities');
  await app.clickText('dialog footer button', 'Create');
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
  // Athens with two events, Sparta with one.
  await app.click('.diagram .node.root');
  await add('Tab', 'Athens');
  await add('Tab', 'The plague');
  await add('Enter', 'The Sicilian expedition');
  await app.click(await app.findByText('.diagram .node', 'Athens'));
  await add('Enter', 'Sparta');
  await add('Tab', 'The peace of Nicias');
  // And a branch that says nothing of its time.
  await app.click(await app.findByText('.diagram .node', 'Sparta'));
  await add('Enter', 'Sources');
  await add('Tab', 'Thucydides');

  /** Says when an element is, through its dialog. */
  const say = async (name, fill) => {
    await app.rightClick(await app.findByText('.diagram .node', name));
    await app.waitFor('.menu');
    await sleep(150);
    await app.exec(
      `Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((m) => /when it is…/i.test(m.textContent)).click()`,
    );
    await app.waitForText('dialog[open] h2', 'When it is', 3000);
    await sleep(200);
    await fill();
    await app.clickText('dialog[open] footer button', 'Save');
    await app.waitGone('dialog[open]', 3000);
    await sleep(200);
  };
  const timeField = () =>
    app.exec(`return document.querySelector('dialog[open] .end input:not([type="checkbox"])')`);
  const marginField = () =>
    app.exec(
      `return document.querySelectorAll('dialog[open] .end input:not([type="checkbox"])')[1]`,
    );
  /** Chooses in the nth select of the dialog the option with this label. */
  const choose = (index, label) =>
    app.exec(
      `const s = document.querySelectorAll('dialog[open] .end select')[arguments[0]];
       const o = Array.from(s.options).find((o) => o.textContent.trim() === arguments[1]);
       s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));`,
      index,
      label,
    );

  await say('The plague', async () => {
    const field = await timeField();
    await app.click(field['element-6066-11e4-a52e-4f735466cecf']);
    await app.keys('430 BC');
  });
  await say('The peace of Nicias', async () => {
    const field = await timeField();
    await app.click(field['element-6066-11e4-a52e-4f735466cecf']);
    await app.keys('421 BC');
    // Give or take two years, drawn fading away both ways.
    const margin = await marginField();
    await app.click(margin['element-6066-11e4-a52e-4f735466cecf']);
    await app.keys('2 years');
  });
  // The expedition: after the peace, as a relative placement.
  await say('The Sicilian expedition', async () => {
    await choose(0, 'After an element');
    await sleep(150);
    await choose(1, 'The peace of Nicias');
  });
  check(
    'the Timeline view appears once something says when it is',
    await app.exec(
      `return Array.from(document.querySelectorAll('.segmented button')).some((b) => b.textContent.trim() === 'Timeline')`,
    ),
  );

  // --- The map as a timeline ---
  await app.clickText('.segmented button', 'Timeline');
  await app.waitFor('.timeline .lane', 5000);
  await sleep(500);
  const laneNames = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane-name')).map((l) => l.textContent.trim())`,
  );
  check('each city is a lane', laneNames.join('|') === 'Athens|Sparta', laneNames.join('|'));
  check('a branch in which nothing says when it is, is no lane', !laneNames.includes('Sources'));
  const fades = await app.exec(`return document.querySelectorAll('.timeline .fade').length`);
  check(
    'a margin either side of a time is drawn fading away both ways',
    fades === 2,
    String(fades),
  );
  const events = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane')).map((l) => Array.from(l.querySelectorAll('.label')).map((e) => e.textContent.trim()).join(', '))`,
  );
  check(
    'the events stand in the lanes of their cities',
    events[0] === 'The plague, The Sicilian expedition' && events[1] === 'The peace of Nicias',
    events.join(' / '),
  );
  const floating = await app.exec(
    `return document.querySelectorAll('.timeline .event.floating').length + ':' + document.querySelectorAll('.timeline .window').length`,
  );
  check('the relative placement is drawn floating, with its window', floating === '1:1', floating);
  const order = await app.exec(
    `const left = (name) => { const l = Array.from(document.querySelectorAll('.timeline .label')).find((e) => e.textContent.trim() === name); return parseFloat(l.style.left); };
     return [left('The plague'), left('The peace of Nicias'), left('The Sicilian expedition')]`,
  );
  check(
    'and after the peace, which is after the plague',
    order[0] < order[1] && order[1] < order[2],
    order.join(' < '),
  );
  const ticks = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .tick span')).map((t) => t.textContent)`,
  );
  check(
    'the axis counts years BC',
    ticks.some((t) => /\d+ BC/.test(t)),
    ticks.join(' '),
  );
  await app.screenshot('timeline-1-cities');

  // --- A contradiction is told ---
  await app.clickText('.segmented button', 'Diagram');
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(300);
  // The plague after the expedition, which is after the peace, and before the peace: nowhere.
  await say('The plague', async () => {
    await choose(0, 'Between two elements');
    await sleep(150);
    await choose(1, 'The Sicilian expedition');
    await choose(2, 'The peace of Nicias');
  });
  await app.clickText('.segmented button', 'Timeline');
  await app.waitFor('.timeline .lane', 5000);
  await sleep(400);
  check('what cannot be where it says is marked', await app.exists('.timeline .event.trouble'));
  await app.screenshot('timeline-2-contradiction');

  // --- The lanes can be chosen, and the axis made one of units ---
  await app.click('.timeline button[aria-label="Lanes"]');
  await app.waitForText('dialog[open] h2', 'The timeline', 3000);
  await sleep(200);
  await app.exec(
    `Array.from(document.querySelectorAll('dialog[open] .choices button')).find((b) => b.textContent.trim() === 'One lane').click()`,
  );
  await sleep(200);
  await app.clickText('dialog[open] footer button', 'Done');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const chosen = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane-name')).map((l) => l.textContent.trim())`,
  );
  check(
    'a lane chosen stands alone, the rest elsewhere',
    chosen[0] === 'Athens' && chosen[1] === 'Elsewhere in the map',
    chosen.join('|'),
  );

  // --- A chronology is added to the map ---
  await app.click('.timeline button[aria-label="Add a chronology to the map"]');
  await app.waitFor('.text-view .section', 5000);
  await sleep(600);
  const chronology = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Chronology'));
     return s ? Array.from(s.querySelectorAll('table tr')).map((r) => Array.from(r.querySelectorAll('th, td')).map((c) => c.textContent.trim()).join(' | ')).join(' / ') : ''`,
  );
  check(
    'a chronology is an element with a table of what is placed, in order',
    /^When \| What \/ /.test(chronology) &&
      chronology.indexOf('peace') < chronology.indexOf('expedition'),
    chronology,
  );

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('timeline-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
