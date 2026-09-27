/** How the project that is open is shared, and its connection to the server. */

import type { ProjectInfo, Sharing } from '$lib/api/projects';
import { sharingEnd, sharingForget, sharingPublish, sharingTicket } from '$lib/api/sharing';
import type { Project } from '$lib/project/model/project.svelte';
import { projects } from '$lib/state/projects.svelte';
import { settings } from '$lib/state/settings.svelte';
import { colourOf, Connection, type Ending } from './connection.svelte';

export class ProjectSharing {
  sharing = $state.raw<Sharing | null>(null);
  connection = $state.raw<Connection | null>(null);
  /** Why the sharing ended while the project was open, until the user has been told. */
  ended = $state<Ending | null>(null);

  readonly #id: string;
  readonly #project: Project;

  constructor(id: string, project: Project, info: ProjectInfo) {
    this.#id = id;
    this.#project = project;
    if (info.sharing) this.#begin(info.sharing);
  }

  get shared(): boolean {
    return this.sharing !== null;
  }

  /** The others who have the project open. */
  get others() {
    return this.#project.others;
  }

  /** The name this user goes by among the others. */
  get name(): string {
    return (
      settings.value.displayName?.trim() || (this.sharing?.owner ? 'The owner' : 'A collaborator')
    );
  }

  #begin(sharing: Sharing) {
    this.sharing = sharing;
    this.ended = null;
    this.introduce();
    this.connection = new Connection(this.#project.doc, this.#project.awareness, {
      ticket: async () => (await sharingTicket(this.#id)).url,
      onended: (why) => void this.#onEnded(why),
    });
  }

  /** Tells the others who this is: again when the name has been changed. */
  introduce() {
    const sharing = this.sharing;
    if (!sharing) return;
    this.#project.present({
      name: this.name,
      color: colourOf(sharing.member ?? `owner:${sharing.room}`),
      member: sharing.member ?? null,
    });
  }

  #leave() {
    this.connection?.stop();
    this.connection = null;
    this.sharing = null;
    this.#project.present(null);
  }

  async #onEnded(why: Ending) {
    this.#leave();
    this.ended = why;
    try {
      projects.put(await sharingForget(this.#id));
    } catch (error) {
      console.error('the end of the sharing could not be noted', error);
    }
  }

  /** Puts the project on a server. */
  async publish(server: string, password: string | null) {
    // What is on the server is what is on disk here, in case another joins at once.
    await this.#project.snapshot();
    const info = await sharingPublish(this.#id, server, password);
    projects.put(info);
    settings.set('server', info.sharing?.server ?? server);
    if (info.sharing) this.#begin(info.sharing);
  }

  /**
   * Ends the sharing: the owner takes the project off the server, a
   * collaborator leaves. With `anyway`, also when the server cannot be told.
   */
  async end(anyway = false) {
    const info = await sharingEnd(this.#id, anyway);
    projects.put(info);
    this.#leave();
  }

  /** When the project is closed. */
  close() {
    this.connection?.stop();
    this.connection = null;
  }
}
