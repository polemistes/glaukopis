/**
 * Making a project of the words of a language, and writing its words back
 * as Fluent files into a folder (ADR 0034), or into the own words of the
 * data directory, to be used at once (ADR 0035).
 */

import { projectCreate } from '$lib/api/projects';
import { wordsRead, wordsWrite } from '$lib/api/words';
import { languageName, localeSources, t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { openProject, projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';
import { apply, overOwn, type Applied } from './fluent';
import { ownWordsOf, writeOwnWords } from './own';
import { changesIn, fillWords, projectWords, written } from './project';

/** Makes a project of the words of a language, and opens it. */
export async function makeWordsProject(tag: string): Promise<void> {
  const [english, own] = await Promise.all([localeSources('en'), localeSources(tag)]);
  const info = await projectCreate(t('words-project-name', { language: languageName(tag) }));
  const { project } = await openProject(info.id);
  try {
    fillWords(project, tag, english, own);
    await project.flush();
    if (project.status === 'error') throw new Error(project.saveError ?? '');
  } finally {
    await project.close();
  }
  await projects.load();
  router.go({ view: 'project', project: info.id });
}

/** What came of writing out the words: what was written, and what was not, and why. */
export interface WrittenOut extends Applied {
  /** How many parts were changed in the project, all told. */
  changed: number;
}

/**
 * Writes what was changed in a project of words into the Fluent files of a
 * folder: the folder of the language in a copy of Glaukopis's code
 * (`locales/nb`), or any other. Only what was changed is written, and
 * nothing that was changed in the files since the project was made.
 */
export async function writeWords(project: Project, dir: string): Promise<WrittenOut> {
  const words = projectWords(project);
  if (!words) throw new Error(t('words-not-a-project'));
  const changes = changesIn(project);
  const [english, there] = await Promise.all([localeSources('en'), wordsRead(dir)]);
  const own = new Map(there.map((f) => [f.name, f.text]));
  const applied = apply(words.language, english, own, changes);
  if (applied.files.size) {
    await wordsWrite(
      dir,
      [...applied.files].map(([name, text]) => ({ name, text })),
    );
    written(project, applied.done);
  }
  return { ...applied, changed: changes.length };
}

/**
 * Writes what was changed in a project of words into the own words of its
 * language, over what they hold, and has the interface and the core read
 * their words again, so that the change is seen at once. What the elements
 * were is left as it was: the Fluent files of the code are not yet written.
 */
export async function useWords(project: Project): Promise<WrittenOut> {
  const words = projectWords(project);
  if (!words) throw new Error(t('words-not-a-project'));
  const tag = words.language;
  const changed = changesIn(project);
  const [english, builtIn, there] = await Promise.all([
    localeSources('en'),
    localeSources(tag),
    ownWordsOf(tag),
  ]);
  const { own, changes } = overOwn(builtIn, there, changed);
  const applied = apply(tag, english, own, changes);
  await writeOwnWords(
    tag,
    [...applied.files].map(([name, text]) => ({ name, text })),
  );
  return { ...applied, changed: changed.length };
}
