/**
 * The search through everything, in a thread of its own: the projects are
 * read and searched here, so that the window does not stand still. What is
 * read of a project is kept until it is read anew or forgotten. See
 * `everything.ts`, `reader.ts` and `engine.ts`.
 */

import { serve } from '$lib/util/worker-client';
import { reader } from './reader';

serve(self as unknown as Parameters<typeof serve>[0], reader());
