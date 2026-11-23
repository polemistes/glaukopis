// The web view looked at before the page (stage 1 of
// docs/plans/an-app-for-android.md, part C): StartActivity starts the page
// where the device's web view will do, and says why not where it will not.
//
// On the old device (`e2e/android/emulator.sh start old`, then run with
// ANDROID_SERIAL=emulator-5586), whose web view is older than the page can
// use: the app started stays running, and the screen holds the title and
// one of the two messages, not Android's words that the app has stopped.
// Then the web view is taken away for the device's user and the app started
// again: the words for none. It is put back, and the first words are there
// again. A web view is taken away on emulator-5586 and on no other device.
// Last, words are shared to the app: the screen says why it cannot start,
// and the thing lies in the inbox of the app's folder.
//
// On the new device (the default, emulator-5584): the app started, the page
// of the phone is there, at the notes.
//
// Screenshots in e2e/output/android-web-view-<n>-<what>.png.

import { PACKAGE, page, screenText, screenshot, share, shell, sleep, start } from './device.mjs';

const serial = process.env.ANDROID_SERIAL || 'emulator-5584';
const checks = [];
function check(name, ok, detail = '') {
  checks.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const running = async () => (await shell(`pidof ${PACKAGE} || true`)).trim() !== '';
const stopped = (text) => text.some((t) => /has stopped|keeps stopping|isn't responding/i.test(t));
const TITLE = /cannot start on this device yet|kan ikke starte på denne enheten/;
const OLD = /This device has version (\d+) of it|Denne enheten har versjon (\d+)/;
const NONE = /has none that can be used|har ingen som kan brukes/;

if (serial === 'emulator-5586') {
  await start();
  await sleep(5000);
  let text = await screenText();
  await screenshot('web-view-1-old');
  check('the app still runs', await running());
  check('the screen does not say the app stopped', !stopped(text), text.join(' | '));
  check('the screen holds the title', text.some((t) => TITLE.test(t)));
  const old = text.map((t) => OLD.exec(t)).find(Boolean);
  const none = text.some((t) => NONE.test(t));
  check('the screen holds one of the two messages', !!old || none);
  console.log(old ? `      said: too old, version ${old[1] ?? old[2]}` : none ? '      said: none' : '      said: neither');

  const provider = /Current WebView package \(name, version\): \(([^,]+),/.exec(await shell('dumpsys webviewupdate'))?.[1];
  console.log(`      the device's web view: ${provider ?? 'none named'}`);
  if (provider) {
    await shell(`pm uninstall --user 0 ${provider}`);
    await sleep(1500);
    await start();
    await sleep(4000);
    text = await screenText();
    await screenshot('web-view-2-none');
    check('with no web view the app still runs', await running());
    check('with no web view the screen says none', text.some((t) => NONE.test(t)), text.join(' | '));
    await shell(`cmd package install-existing ${provider}`);
    await sleep(2000);
    await start();
    await sleep(4000);
    text = await screenText();
    await screenshot('web-view-3-back');
    check('with the web view back the first words are there again', old ? text.some((t) => OLD.test(t)) : text.some((t) => NONE.test(t)));
  }

  // A share where the web view will not do (stage 3): what was shared is
  // put into the inbox before the web view is looked at, and becomes a note
  // when the app first runs where it can.
  await shell(`am force-stop ${PACKAGE}`);
  await share({ text: 'Shared on a device too old for the page' });
  await sleep(5000);
  text = await screenText();
  await screenshot('web-view-4-shared');
  check('a share on such a device: the screen says why the app cannot start', text.some((t) => TITLE.test(t)), text.join(' | '));
  const inbox = (await shell(`run-as ${PACKAGE} sh -c "ls files/data/notebook/inbox 2>/dev/null"`)).trim();
  check('and the inbox in the app\'s folder holds the thing shared', inbox.split(/\s+/).filter((n) => /^\d{13}-/.test(n)).length >= 1, inbox);
} else if (serial === 'emulator-5584') {
  await start();
  const p = await page();
  await sleep(3000);
  check('the page of the phone is there, at the notes', await p.evaluate(`!!document.querySelector('[data-phone-notes]')`));
  await screenshot('web-view-1-new');
  p.close();
} else {
  console.log(`This script takes a web view away only on emulator-5586, and tries the page only on emulator-5584; not on ${serial}.`);
  process.exit(2);
}
const failed = checks.filter((ok) => !ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
