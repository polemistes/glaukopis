// The phone's role on a computer (stage 2 of docs/plans/an-app-for-android.md):
// `glaukopis --phone` with the phone's own page. Before it starts, a note
// is put into its notebook's inbox as the page of a note left one in stage
// 1 (the kind `note`, its words and no document). The role starts with one
// window, labelled `phone`, no wider than 420, showing the notes; the note
// from the inbox is in the list, not looked at, and the inbox is empty.
// The commands of the projects, of the window of a note, the sweep and the
// readable copy are refused; the synchronization's status says off, and
// the device's name is given. No errors in the page.
// Screenshots in e2e/output/phone-role-<n>-<what>.png.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const tryInvoke = (app, command, args = {}) =>
  app.execAsync(
    `try { return { ok: await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]) }; } catch (e) { return { refused: String(e?.message ?? e) }; }`,
    command,
    args,
  );

// ---- a note left in the inbox, as crates/core/src/notebook/inbox.rs lays one out ----
const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-'));
const inbox = join(dataDir, 'notebook', 'inbox');
const id = `${Date.now()}-a1b2c3d4`;
mkdirSync(join(inbox, id), { recursive: true });
writeFileSync(
  join(inbox, id, 'item.json'),
  JSON.stringify({ kind: 'note', url: '', title: '', when: new Date().toISOString(), text: 'Left in the inbox\nA second line', html: '' }),
);

let phone;
try {
  phone = await App.launch({ args: ['--phone'], dataDir, keepData: true, width: 412, height: 915 });
  await phone.installErrorHook();

  // ---- the role starts, at the notes ----
  await phone.waitFor('[data-phone-notes]', 15000);
  const shown = await phone.execAsync(
    `return { label: window.__TAURI_INTERNALS__.metadata.currentWindow.label, width: window.innerWidth };`,
  );
  check('one window, labelled phone', shown.label === 'phone', shown.label);
  check('no wider than 420', shown.width <= 420, String(shown.width));
  check('it shows the notes', await phone.exists('[data-phone-notes]'));

  // ---- the inbox taken in ----
  const row = await phone
    .waitFor('[data-phone-row]', 8000)
    .then(() => phone.exec(`return Array.from(document.querySelectorAll('[data-phone-row]')).map((r) => ({ text: r.textContent.replace(/\\s+/g, ' ').trim(), unseen: r.hasAttribute('data-unseen') }))`))
    .catch(() => []);
  check('the note from the inbox is in the list', row.some((r) => r.text.includes('Left in the inbox')), JSON.stringify(row));
  const left = existsSync(inbox) ? readdirSync(inbox).filter((n) => !n.startsWith('.')) : [];
  check('it is not looked at', row.some((r) => r.text.includes('Left in the inbox') && r.unseen));
  check('the inbox is empty', left.length === 0, left.join(', '));
  await phone.screenshot('phone-role-1-notes');

  // ---- its commands ----
  for (const command of ['project_list', 'fonts_list', 'note_window_send', 'notebook_sweep', 'notebook_readable_write']) {
    const got = await tryInvoke(phone, command, {});
    check(`${command} is not the phone's`, !!got.refused && /not found/i.test(got.refused), got.refused ?? 'answered');
  }
  const status = await tryInvoke(phone, 'sync_status');
  check('the synchronization says off', status.ok?.state === 'off', JSON.stringify(status));
  const device = await tryInvoke(phone, 'sync_device');
  check('the device has a name to offer', typeof device.ok === 'string' && device.ok.length > 0, JSON.stringify(device));

  const errors = await phone.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
} finally {
  await phone?.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
