/**
 * The search through everything, in a thread of its own: the projects are
 * read and searched here, so that the window does not stand still. What is
 * read of a project is kept until it is read anew. See `everything.ts`.
 */

import { fromBase64 } from '$lib/util/base64';
import { readProject, searchProject, type ProjectRead } from './everything';
import type { Asked, Answer } from './engine';

const read = new Map<string, ProjectRead>();

function answer(message: Answer) {
  (self as unknown as { postMessage(m: Answer): void }).postMessage(message);
}

self.onmessage = (event: MessageEvent<Asked>) => {
  const asked = event.data;
  try {
    if (asked.kind === 'read') {
      read.set(
        asked.id,
        readProject(
          asked.id,
          asked.name,
          asked.state ? fromBase64(asked.state) : null,
          asked.updates.map(fromBase64),
        ),
      );
      answer({ kind: 'read', ask: asked.ask });
    } else if (asked.kind === 'search') {
      const project = read.get(asked.id);
      const result = project ? searchProject(project, asked.words, asked.options) : null;
      answer({ kind: 'found', ask: asked.ask, result });
    } else if (asked.kind === 'forget') {
      read.delete(asked.id);
      answer({ kind: 'read', ask: asked.ask });
    }
  } catch (error) {
    answer({
      kind: 'failed',
      ask: asked.ask,
      error: String(error instanceof Error ? error.message : error),
    });
  }
};
