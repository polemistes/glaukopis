/**
 * The Org writer in a thread of its own: the Org form of a large project
 * takes a tenth of a second and more to write, which the window must not
 * stand still for. See `folder.ts`.
 */

import type { OrgProject } from './types';
import { writeProject } from './write';

export type Asked = { ask: number; org: OrgProject };
export type Answer = { ask: number; text: string } | { ask: number; error: string };

self.onmessage = (event: MessageEvent<Asked>) => {
  const { ask, org } = event.data;
  let answer: Answer;
  try {
    answer = { ask, text: writeProject(org) };
  } catch (error) {
    answer = { ask, error: String(error) };
  }
  (self as unknown as { postMessage(m: Answer): void }).postMessage(answer);
};
