/**
 * The Org writer in a thread of its own: the Org form of a large project
 * takes a tenth of a second and more to write, which the window must not
 * stand still for. It answers through the client of the workers
 * (`$lib/util/worker-client`). See `folder.ts`.
 */

import { serve } from '$lib/util/worker-client';
import type { OrgProject } from './types';
import { writeProject } from './write';

serve<OrgProject, never>(self as unknown as Parameters<typeof serve>[0], {
  answer: (org) => writeProject(org),
});
