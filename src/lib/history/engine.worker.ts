/**
 * The engine of the history in a worker of its own: see `engine.ts`. It is
 * told the history as it is on disk, and the changes of the project as they
 * are made, and answers what it is asked, through the client of the workers
 * (`$lib/util/worker-client`).
 */

import { serve } from '$lib/util/worker-client';
import { Engine } from './engine';
import { Host } from './protocol';

serve(self as unknown as Parameters<typeof serve>[0], new Host(() => new Engine()));
