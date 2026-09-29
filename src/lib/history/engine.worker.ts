/**
 * The engine of the history in a worker of its own: see `engine.ts`. It is
 * told the history as it is on disk, and the changes of the project as they
 * are made, and answers what it is asked.
 */

import { Engine } from './engine';
import { Host, type Message } from './protocol';

const host = new Host(
  () => new Engine(),
  (reply) => postMessage(reply),
);

onmessage = (event: MessageEvent<Message>) => host.take(event.data);
