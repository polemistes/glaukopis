/**
 * What must be done before the window closes: above all, saving. Whoever has
 * something to finish registers it here; the application waits for all of it.
 *
 * There are two stages. What is cheap and must not be lost is done first:
 * the changes not yet written are appended to the log of each project, and
 * the settings are written. Only then is the costly rest begun: the whole
 * state of a project written anew, the readable copy, the view. A failure
 * of the first stage keeps the window open and is told, since what is not
 * written then is lost; one of the second is only logged, since what it
 * would have written is in the log already.
 *
 * Nothing here waits with a limit of time: a slow disk is waited for, and
 * the window says so after a moment. Asked to close again while it waits,
 * or after a failure was told, the window closes all the same.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '$lib/api/backend';
import { t } from '$lib/i18n';
import { notifyError, toasts } from '$lib/ui/toast.svelte';

type Task = () => Promise<void> | void;

/** `first`: cheap, and what must be written; `then`: the rest, begun when the first are done. */
export type Stage = 'first' | 'then';

const tasks: Record<Stage, Set<Task>> = { first: new Set(), then: new Set() };
let installed = false;

/** How long closing is waited for before the window says that it is still saving. */
const SAY_AFTER_MS = 3000;

export function beforeClose(task: Task, stage: Stage = 'then'): () => void {
  tasks[stage].add(task);
  install();
  return () => tasks[stage].delete(task);
}

/** What failed in a stage, each with the error it failed with. */
async function run(stage: Stage): Promise<unknown[]> {
  const failures: unknown[] = [];
  await Promise.all(
    [...tasks[stage]].map(async (task) => {
      try {
        await task();
      } catch (error) {
        failures.push(error);
      }
    }),
  );
  return failures;
}

/**
 * Does what was registered, the first stage before the rest. Returns what
 * failed in the first stage; when anything did, the rest is not begun, so
 * that the projects stay open and what could not be written can be written
 * when the window is closed again; with `anyway`, it is begun all the same.
 * A failure of the rest is logged.
 */
export async function finishBeforeClose(anyway = false): Promise<unknown[]> {
  const failures = await run('first');
  for (const error of failures) console.error('saving before closing failed', error);
  if (failures.length && !anyway) return failures;
  for (const error of await run('then')) console.error('a task before closing failed', error);
  return failures;
}

function install() {
  if (installed || !inTauri) return;
  installed = true;
  const window = getCurrentWindow();
  /** Whether the window is waiting for its tasks. */
  let waiting = false;
  /** Whether a failure to save was told, and the window left open. */
  let toldFailure = false;
  window.onCloseRequested(async (event) => {
    if (!tasks.first.size && !tasks.then.size) return;
    if (waiting) {
      // Asked again while it waits: the window goes now, without waiting any longer.
      waiting = false;
      console.warn('the window was closed before saving was finished');
      return;
    }
    event.preventDefault();
    waiting = true;
    let still: number | null = null;
    const say = setTimeout(() => {
      still = toasts.show({ kind: 'info', message: t('closing-still-saving') }, 0);
    }, SAY_AFTER_MS);
    // Once a failure was told, saving is tried again, and the window closes whatever comes.
    const failures = await finishBeforeClose(toldFailure);
    clearTimeout(say);
    if (still !== null) toasts.dismiss(still);
    if (!waiting) return;
    waiting = false;
    if (failures.length && !toldFailure) {
      toldFailure = true;
      notifyError(t('closing-not-saved'), failures[0]);
      return;
    }
    tasks.first.clear();
    tasks.then.clear();
    await window.destroy();
  });
}
