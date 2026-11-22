/**
 * What the writer is told when a project was written in on two of their
 * computers while they were apart (record 0120). The engine has then kept
 * the project as it stood here before the other computer's changes came
 * in, and the moment before them; a toast says so, with Show the changes,
 * which opens the project and the review of its changes from that moment.
 * A project that is opened while it has such a note, as one that came while
 * it was closed or whose toast was passed over, is told of once more.
 *
 * The review is worked out from the project's full history (`review/source`):
 * where the history is not kept, or began after that moment, the changes
 * cannot be shown, and the toast offers the earlier versions of the project
 * instead, among which the version from before is kept.
 */

import { historyRoom } from '$lib/api/history';
import type { ProjectInfo } from '$lib/api/projects';
import { onProjectApart, projectApart, projectApartSeen, type Apart } from '$lib/api/sync';
import { historyOf } from '$lib/history/history.svelte';
import { t } from '$lib/i18n';
import { openProjects, type OpenProject } from '$lib/project/open-projects.svelte';
import { viewing } from '$lib/project/ProjectView.svelte';
import { PROJECT } from '$lib/project/model/types';
import { reviewAsk } from '$lib/review/asked.svelte';
import { settingsUi } from '$lib/settings/settings-ui.svelte';
import { projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';
import { toasts } from '$lib/ui/toast.svelte';
import { fromBase64 } from '$lib/util/base64';

/** How long a project that is to show its changes is waited for to open. */
const OPENING = 30_000;

class WrittenApart {
  /** The project whose earlier versions are shown, where its changes cannot be. */
  earlier = $state.raw<ProjectInfo | null>(null);

  /** The toast that tells of each project, while it may still stand. */
  #toasts = new Map<string, number>();
  /** The projects looked at as they were opened in this window: each is told of once so. */
  #opened = new Set<string>();
  /** The projects being told of now: told of once, however often it is asked meanwhile. */
  #telling = new Set<string>();

  /** Listens, for this window, for projects written in apart. Gives what ends the listening. */
  follow(): Promise<() => void> {
    return onProjectApart(({ id, name }) => void this.tell(id, name));
  }

  /** A project was opened in the window: told of once, where it has a note that has not been seen. */
  opened(id: string) {
    if (this.#opened.has(id)) return;
    this.#opened.add(id);
    void this.tell(id);
  }

  /** Whether the toast of a project stands at the foot of the window. */
  #standing(id: string): boolean {
    const toast = this.#toasts.get(id);
    return toast !== undefined && toasts.list.some((t) => t.id === toast);
  }

  /**
   * Tells of a project written in apart, unless it has been seen, or its
   * toast stands already: that toast tells of a second note as well.
   */
  async tell(id: string, name?: string) {
    if (this.#standing(id) || this.#telling.has(id)) return;
    this.#telling.add(id);
    try {
      await this.#tell(id, name);
    } finally {
      this.#telling.delete(id);
    }
  }

  async #tell(id: string, name?: string) {
    const apart = await projectApart(id).catch((error) => {
      console.warn('What was kept of a project written in apart could not be read', error);
      return null;
    });
    if (!apart) return;
    const called = name ?? projects.list.find((p) => p.id === id)?.name ?? '';
    const message = t('sync-apart', { name: called });
    // Whether the project keeps its history here, without opening it: the review needs it.
    const history = await historyRoom(id).then(
      (room) => room > 0,
      () => false,
    );
    let toast: number;
    if (history)
      toast = toasts.show(
        {
          kind: 'info',
          message,
          action: { label: t('sync-apart-show'), run: () => void this.show(id) },
        },
        0,
      );
    else if (apart.kept)
      toast = toasts.show(
        {
          kind: 'info',
          message,
          detail: t('sync-apart-no-history'),
          action: { label: t('sync-apart-earlier'), run: () => void this.showEarlier(id) },
        },
        0,
      );
    else {
      // Neither the changes nor the version from before can be shown: it is told, and that is all.
      toast = toasts.show({ kind: 'info', message }, 0);
      void this.#seen(id);
    }
    this.#toasts.set(id, toast);
  }

  /**
   * Opens the project at its top and the review of its changes from the
   * moment kept, with one's own shown, since what one's other computer
   * wrote is one's own; the earlier versions where the changes cannot be
   * shown. Then the note is seen.
   */
  async show(id: string) {
    const apart = await projectApart(id).catch(() => null);
    // Opened from here, it is not told of again as it opens.
    this.#opened.add(id);
    settingsUi.hide();
    if (viewing.sides.some((s) => s.id === id)) viewing.enter?.(id, PROJECT);
    else router.go({ view: 'project', project: id, at: PROJECT });
    if (!apart) return;
    const open = await opening(id);
    if (!open?.project) return;
    if (!(await covers(open, apart))) {
      if (apart.kept) await this.showEarlier(id);
      return;
    }
    reviewAsk.ask({
      project: id,
      choice: {
        moment: { snapshot: fromBase64(apart.moment), time: apart.time },
        kind: 'named',
        name: t('sync-apart-moment'),
      },
      own: true,
    });
    await this.#seen(id);
  }

  /** Shows the earlier versions of a project, among which is the one from before. Then the note is seen. */
  async showEarlier(id: string) {
    if (!projects.loaded) await projects.load().catch(() => {});
    const info = projects.list.find((p) => p.id === id);
    if (!info) return;
    this.earlier = info;
    await this.#seen(id);
  }

  async #seen(id: string) {
    await projectApartSeen(id).catch((error) =>
      console.warn('That a project written in apart was seen could not be kept', error),
    );
  }
}

/** The project once it is open in the window; nothing where it does not open in time. */
async function opening(id: string): Promise<OpenProject | null> {
  const until = Date.now() + OPENING;
  while (Date.now() < until) {
    const open = openProjects.get(id);
    if (open?.state === 'failed') return null;
    if (open?.state === 'open' && open.project) return open;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

/**
 * Whether the project's history reaches back to the moment kept, so that the
 * review can show what came since: it is kept, and began before then.
 */
async function covers(open: OpenProject, apart: Apart): Promise<boolean> {
  const project = open.project;
  if (!project?.history.on) return false;
  const begins = await historyOf(project, open.id)
    .begins()
    .catch(() => null);
  return !!begins && begins.time <= apart.time;
}

export const writtenApart = new WrittenApart();
