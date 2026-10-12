/**
 * An element's text as Org, then and now, for the history and the review
 * to show as a difference of two Org texts (ADR 0041, section 7).
 */

import { Project } from '$lib/project/model/project.svelte';
import { branchText } from './of-project';

/**
 * The Org form of an element's text as a state of the project holds it;
 * with `under`, and of every element under it. Nothing, of an element
 * that was not there then.
 */
export async function branchTextOf(state: Uint8Array, at: string, under = true): Promise<string> {
  const project = new Project(null);
  try {
    project.load(state, []);
    return branchText(project, at, under);
  } finally {
    await project.close();
  }
}
