/**
 * What must be done before the window closes: above all, saving. Whoever has
 * something to finish registers it here; the application waits for all of it.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '$lib/api/backend';

type Task = () => Promise<void> | void;

const tasks = new Set<Task>();
let installed = false;

export function beforeClose(task: Task): () => void {
  tasks.add(task);
  install();
  return () => tasks.delete(task);
}

function install() {
  if (installed || !inTauri) return;
  installed = true;
  const window = getCurrentWindow();
  window.onCloseRequested(async (event) => {
    if (!tasks.size) return;
    event.preventDefault();
    const waiting = [...tasks].map(async (task) => {
      try {
        await task();
      } catch (error) {
        console.error('a task before closing failed', error);
      }
    });
    // Saving must not keep the window open for ever.
    await Promise.race([Promise.all(waiting), new Promise((r) => setTimeout(r, 4000))]);
    tasks.clear();
    await window.destroy();
  });
}
