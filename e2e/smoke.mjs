import { App } from './harness.mjs';

const app = await App.launch();
try {
  await app.installErrorHook();
  console.log('title:', await app.exec('return document.title'));
  console.log('rail links:', await app.count('nav.rail a'));
  const info = await app.execAsync(`return await window.__TAURI_INTERNALS__.invoke('system_info');`);
  console.log('system_info:', JSON.stringify(info));
  console.log('screenshot:', await app.screenshot('smoke'));
  console.log('errors:', JSON.stringify(await app.pageErrors()));
} finally {
  await app.close();
}
