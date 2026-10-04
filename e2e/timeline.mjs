// Timelines: elements say when they are, with dates or relative to one
// another; the map is seen as a timeline, with a lane for each city, the
// relative placement solved into its window, and a contradiction told. An
// element that says nothing of its time, under one that does, is implied
// within that one's span.

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
  // And one under Sparta that says nothing of its time: implied within Sparta's span.
  await add('Enter', 'The ephors');
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
  // Sparta over a span: the span of its lane.
  await say('Sparta', async () => {
    await app.clickText('dialog[open] .segmented button', 'Over a span');
    await sleep(150);
    const field = await timeField();
    await app.click(field['element-6066-11e4-a52e-4f735466cecf']);
    await app.keys('431 BC');
    const to = await app.exec(
      `return document.querySelectorAll('dialog[open] .end')[1].querySelector('input:not([type="checkbox"])')`,
    );
    await app.click(to['element-6066-11e4-a52e-4f735466cecf']);
    await app.keys('404 BC');
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
    `return Array.from(document.querySelectorAll('.timeline .lane')).map((l) => Array.from(l.querySelectorAll('.label:not(.implied)')).map((e) => e.textContent.trim()).join(', '))`,
  );
  check(
    'the events stand in the lanes of their cities',
    events[0] === 'The plague, The Sicilian expedition' && events[1] === 'The peace of Nicias',
    events.join(' / '),
  );
  const floating = await app.exec(
    `return document.querySelectorAll('.timeline .event.floating').length + ':' + document.querySelectorAll('.timeline .window:not(.implied)').length`,
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
  // The ephors say nothing of their time, but stand under Sparta: implied within its span, faint and dashed.
  const implied = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane .label.implied')).map((e) => e.textContent.trim())`,
  );
  check(
    'an element without a time under one with a span is implied within it',
    implied.join('|') === 'The ephors',
    implied.join('|'),
  );
  const within = await app.exec(
    `const m = document.querySelector('.timeline .event.implied');
     const own = m && m.closest('.lane').querySelector('.own');
     if (!m || !own) return 'none';
     const a = m.getBoundingClientRect(); const b = own.getBoundingClientRect();
     return (a.left + a.width / 2 >= b.left && a.left + a.width / 2 <= b.right) + ':' + m.closest('.lane').querySelector('.lane-name').textContent.trim()`,
  );
  check("and stands within its parent's span, in its lane", within === 'true:Sparta', within);
  await app.screenshot('timeline-1-cities');

  // --- A double click opens "When it is"; the text is reached from the menu ---
  // The first point drawn is the plague, the earliest of Athens.
  await app.doubleClick('.timeline .event.point:not(.implied)');
  await app.waitForText('dialog[open] h2', 'When it is', 3000);
  check('a double click on an element opens When it is', await app.exists('dialog[open]'));
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);

  // --- With moving allowed, a written time is dragged along the axis ---
  const leftOf = (name) =>
    app.exec(
      `const l = Array.from(document.querySelectorAll('.timeline .label')).find((e) => e.textContent.trim() === arguments[0]); return l ? parseFloat(l.style.left) : null`,
      name,
    );
  const before = await leftOf('The plague');
  await app.drag('.timeline .event.point:not(.implied)', { dx: 140, dy: 0 });
  await sleep(300);
  check(
    'an element is not moved while moving is off',
    (await leftOf('The plague')) === before,
    `${before} -> ${await leftOf('The plague')}`,
  );
  await app.click('.timeline button[aria-label="Move by dragging"]');
  await sleep(150);
  await app.drag('.timeline .event.point:not(.implied)', { dx: 140, dy: 0 });
  await sleep(400);
  const after = await leftOf('The plague');
  check(
    'with moving on, a dragged element is written at a later year',
    after > before + 100,
    `${before} -> ${after}`,
  );
  await app.screenshot('timeline-1b-moved');

  // --- Elements without a time stand in their lanes, and one is dragged along its lane ---
  await app.click('.timeline button[aria-label="Elements without a time"]');
  await app.waitFor('.timeline .waiting', 3000);
  const listed = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .waiting')).map((b) => b.textContent.trim())`,
  );
  const lanesWaiting = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane-name')).map((l) => l.textContent.trim())`,
  );
  check(
    'the elements without a time stand in their lanes, the lane of the sources among them',
    listed.includes('Thucydides') && lanesWaiting.includes('Sources'),
    `${lanesWaiting.join('|')} :: ${listed.join('|')}`,
  );
  check(
    'what is implied within another is not among what waits',
    !listed.includes('The ephors') && (await app.exists('.timeline .event.implied')),
    listed.join('|'),
  );
  // Pressed, an implied element says when it is in words, as one that waits does.
  await app.click('.timeline .event.implied');
  await app.waitForText('dialog[open] h2', 'When it is', 3000);
  check('pressing an implied element opens When it is', await app.exists('dialog[open]'));
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);
  const thucydides = await app.findByText('.timeline .waiting', 'Thucydides');
  const target = await app.exec(
    `const b = Array.from(document.querySelectorAll('.timeline .waiting')).find((x) => x.textContent.trim() === 'Thucydides').getBoundingClientRect();
     const l = document.querySelector('.timeline .lanes').getBoundingClientRect();
     return { dx: Math.round(l.left + 700 - (b.left + b.width / 2)), dy: 0 }`,
  );
  await app.drag(thucydides, target);
  await sleep(500);
  const lanesNow = await app.exec(
    `return Array.from(document.querySelectorAll('.timeline .lane-name')).map((l) => l.textContent.trim())`,
  );
  check(
    'an element dragged along its lane is placed there',
    lanesNow.includes('Sources') && (await leftOf('Thucydides')) !== null,
    lanesNow.join('|'),
  );
  await app.screenshot('timeline-1c-placed');

  // --- Pressed rather than dragged, an element without a time says when it is in words ---
  await app.click(await app.findByText('.timeline .waiting', 'Sources'));
  await app.waitForText('dialog[open] h2', 'When it is', 3000);
  check('pressing an element without a time opens When it is', await app.exists('dialog[open]'));
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);
  check(
    'and nothing is placed by the press',
    !(await app.exec(
      `return Array.from(document.querySelectorAll('.timeline .label')).some((l) => l.textContent.trim() === 'Sources')`,
    )),
  );

  // --- The outline beside the timeline, with folding ---
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitFor('.outline', 3000);
  const outlined = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => b.textContent.trim())`,
  );
  check(
    'the outline stands beside the timeline too',
    outlined.includes('Thucydides') && (await app.exists('.timeline')),
    outlined.join('|'),
  );
  await app.exec(
    `Array.from(document.querySelectorAll('.outline [data-outline]')).find((b) => b.textContent.trim() === 'Sources').querySelector('.chevron').click()`,
  );
  await sleep(200);
  const foldedOutline = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => b.textContent.trim())`,
  );
  check(
    'an entry of the outline folds what is under it',
    foldedOutline.includes('Sources') && !foldedOutline.includes('Thucydides'),
    foldedOutline.join('|'),
  );
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitGone('.outline', 3000);

  // --- The margin of a time is dragged wider ---
  const fadeBefore = await app.exec(
    `return document.querySelector('.timeline .fade.after').getBoundingClientRect().width`,
  );
  await app.drag('.timeline .fade.after .handle.margin.end', { dx: 160, dy: 0 });
  await sleep(400);
  const fadeAfter = await app.exec(
    `return document.querySelector('.timeline .fade.after').getBoundingClientRect().width`,
  );
  check(
    'the margin of a time is dragged wider',
    fadeAfter > fadeBefore + 100,
    `${fadeBefore} -> ${fadeAfter}`,
  );

  // --- The name of a lane folds its elements away ---
  const rowsBefore = await app.exec(
    `return document.querySelectorAll('.timeline .lane .label').length`,
  );
  await app.clickText('.timeline .lane-name', 'Athens');
  await sleep(300);
  const rowsAfter = await app.exec(
    `return document.querySelectorAll('.timeline .lane .label').length`,
  );
  check(
    'pressing the name of a lane folds its elements away',
    rowsAfter < rowsBefore && (await app.exists('.text-view')) === false,
    `${rowsBefore} -> ${rowsAfter}`,
  );
  await app.clickText('.timeline .lane-name', 'Athens');
  await sleep(300);
  check(
    'and opens them again',
    (await app.exec(`return document.querySelectorAll('.timeline .lane .label').length`)) ===
      rowsBefore,
  );
  await app.click('.timeline button[aria-label="Elements without a time"]');
  await app.click('.timeline button[aria-label="Move by dragging"]');
  await sleep(150);

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
