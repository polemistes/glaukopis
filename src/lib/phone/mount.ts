/**
 * The phone's page (stage 2 of `docs/plans/an-app-for-android.md`), mounted
 * by `main.ts` in the window the shell labels `phone`, on Android and in
 * `glaukopis --phone` on a computer, instead of the application: nothing of
 * the projects, the diagram, the typesetting or the library's pane. What it
 * knows before it is drawn is in `starting.ts`; once it is drawn, and none
 * of it waited for, the notebook is opened, the references are read, the
 * status of the synchronization is followed, what the core has to tell is
 * taken, and what waits in the inbox is taken in.
 */

import { mount } from 'svelte';
import { noticesTake, onNotices } from '$lib/api/notices';
import { theNotebook } from '$lib/notebook/open.svelte';
import { library } from '$lib/state/library.svelte';
import { sync } from '$lib/sync/sync.svelte';
import { toasts } from '$lib/ui/toast.svelte';
import { setPhoneHooks } from './hooks';
import { takeInbox } from './inbox';
import PhonePage from './PhonePage.svelte';
import { begin } from './starting';

/** What the core tells without being asked, each a message that stays until it is dismissed. */
function takeNotices() {
  noticesTake()
    .then((told) => {
      for (const message of told) toasts.show({ kind: 'error', message }, 0);
    })
    .catch((error) => console.warn('What the core had to tell was not taken', error));
}

/** Mounts the phone's page in `target`, once what it knows before it is drawn is known. */
export async function mountPhone(target: HTMLElement) {
  try {
    await begin();
  } catch (error) {
    // Drawn all the same: a page that never comes is the worst there is.
    console.error('The phone’s page did not begin as it should', error);
  }
  setPhoneHooks();
  const page = mount(PhonePage, { target });
  void theNotebook.open().catch((error) => console.warn('The notebook could not be read', error));
  void library.load();
  void sync.follow();
  takeNotices();
  onNotices(takeNotices).catch((error) =>
    console.warn('What the core has to tell is not heard', error),
  );
  void takeInbox();
  return page;
}
