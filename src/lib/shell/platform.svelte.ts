/**
 * Which system the application runs on, for what is shown as that system
 * shows it: the keys, Cmd on a Mac and Ctrl elsewhere. The browser says it
 * at once; the Rust side, asked once, says it for certain.
 */

import { inTauri } from '$lib/api/backend';
import { systemInfo } from '$lib/api/system';

/** Whether the browser says this is a Mac. */
function macByNavigator(): boolean {
  if (typeof navigator === 'undefined') return false;
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return /^mac/i.test(data?.platform || navigator.platform || '');
}

let mac = $state(macByNavigator());
let asked = false;

/** Whether this is a Mac. Reactive: it follows what the system says, once it has been asked. */
export function onMac(): boolean {
  if (!asked && inTauri) {
    asked = true;
    systemInfo()
      .then((info) => (mac = info.platform === 'macos'))
      .catch((error) =>
        console.warn('What system this is could not be asked; the browser is believed', error),
      );
  }
  return mac;
}
