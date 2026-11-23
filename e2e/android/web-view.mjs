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
//
// On the new device (the default, emulator-5584): the app started, the page
// of the phone is there, at the notes.
//
// Screenshots in e2e/output/android-web-view-<n>-<what>.png.

import { PACKAGE, page, screenText, screenshot, shell, sleep, start } from './device.mjs';

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
