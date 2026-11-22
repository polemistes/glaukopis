/**
 * What the window knows of the synchronization between the writer's
 * computers (record 0119; the plan is `docs/plans/the-same-on-every-device.md`):
 * the status, asked once and then kept as the event `sync` tells it; the
 * computers, asked of the server when the settings show them; and what is
 * done from the settings. One for the window.
 *
 * The engine runs in the shell, whether the settings are open or not: this
 * only tells what it says, and passes on what is asked of it.
 */

import {
  onSync,
  syncCode,
  syncHome,
  syncJoin,
  syncNow,
  syncRemove,
  syncRename,
  syncStart,
  syncStatus,
  syncStop,
  type SyncCode,
  type SyncHome,
  type SyncStatus,
} from '$lib/api/sync';
import { settings } from '$lib/state/settings.svelte';
import { describeError } from '$lib/ui/toast.svelte';

class Synchronization {
  /** What the engine says of itself; nothing until it has been asked. */
  status = $state.raw<SyncStatus | null>(null);
  /** The computers and the open codes, as the server last told them; nothing until asked. */
  home = $state.raw<SyncHome | null>(null);
  /** Why the server could not be asked for the computers, in words; nothing where it was. */
  homeProblem = $state<string | null>(null);
  /** Whether the computers are being asked for. */
  asking = $state(false);
  /** The code made last, while it is to be shown. */
  code = $state.raw<SyncCode | null>(null);

  #following: Promise<void> | null = null;
  /** Whether the event has told the status: an answer asked for before it is older. */
  #heard = false;

  /** Whether this computer is synchronized. */
  get on(): boolean {
    return !!this.status?.on;
  }

  /** Asks the status once, and keeps it from then on as the event tells it. */
  follow(): Promise<void> {
    this.#following ??= (async () => {
      await onSync((status) => {
        this.#heard = true;
        this.#told(status);
      });
      try {
        const status = await syncStatus();
        if (!this.#heard) this.#told(status);
      } catch (error) {
        console.warn('The status of the synchronization could not be asked', error);
      }
    })();
    return this.#following;
  }

  #told(status: SyncStatus) {
    this.status = status;
    // What was told of the computers belongs to the home this computer has left.
    if (!status.on) {
      this.home = null;
      this.homeProblem = null;
      this.code = null;
    }
  }

  /** Asks the server which computers there are. What it cannot be asked is said in `homeProblem`. */
  async askHome() {
    if (!this.on || this.asking) return;
    this.asking = true;
    try {
      this.home = await syncHome();
      this.homeProblem = null;
    } catch (error) {
      this.homeProblem = describeError(error) ?? '';
    } finally {
      this.asking = false;
    }
  }

  /** Makes this computer the first of a home on a server. Fails as the core refuses. */
  async start(server: string, name: string, password: string | null) {
    this.#entered(await syncStart(server.trim(), name.trim(), password || null));
  }

  /** Lets this computer into a home by a code made on another. Fails as the core refuses. */
  async join(server: string, code: string, name: string) {
    this.#entered(await syncJoin(server.trim(), code.trim(), name.trim()));
  }

  #entered(status: SyncStatus) {
    this.#told(status);
    // The server is offered again, as sharing offers the one it used last.
    if (status.server) settings.set('server', status.server);
    void this.askHome();
  }

  /** Makes a code by which one more computer may come in. */
  async makeCode() {
    this.code = await syncCode();
    void this.askHome();
  }

  async rename(device: string, name: string) {
    this.home = await syncRename(device, name.trim());
  }

  /** Removes another computer. */
  async remove(device: string) {
    this.home = await syncRemove(device);
  }

  /** This computer is synchronized no more; what it holds stays. */
  async stop() {
    this.#told(await syncStop());
  }

  /** A round is made at once. */
  now() {
    void syncNow().catch((error) =>
      console.warn('The synchronization was not asked to go at once', error),
    );
  }
}

export const sync = new Synchronization();
