/**
 * What is copied to the clipboard of references and citations: a citation
 * key, references as BibLaTeX; references as the writer's usual reference
 * style writes them, and a citation as the style of its document does
 * (record 0090). What is copied may have to be asked of the core first, and
 * the clipboard may refuse; either way the writer is told, and "Copied" is
 * said only when it was.
 */

import { styleWritten, type Cited, type ExportReference } from '$lib/api/documents';
import { defaultSettings } from '$lib/api/system';
import { newTextLanguage, t } from '$lib/i18n';
import { documents } from '$lib/preview/documents.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import { settings } from '$lib/state/settings.svelte';
import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
import { citationWritten, entriesWritten, type Written } from './written';

export async function copyOut(
  text: () => string | Promise<string>,
  done: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(await text());
  } catch (error) {
    notifyError(t('library-copy-failed'), error);
    return false;
  }
  notifyOk(done);
  return true;
}

/**
 * Puts on the clipboard what is being written, as words and as HTML. The
 * clipboard is asked at once, while the press or the key that asked for the
 * copy is still being answered, and waits for what was promised: a web view
 * lets the clipboard be written only then. Where it will not take the two
 * so, it is given the words when they have come.
 */
export async function putWritten(written: Promise<Written>) {
  const part = (type: 'text/plain' | 'text/html') => {
    const made = written.then((w) => new Blob([type === 'text/html' ? w.html : w.text], { type }));
    // Where nothing could be written, that is said once, below: not once more for each part.
    made.catch(() => {});
    return made;
  };
  try {
    if (typeof ClipboardItem === 'undefined') throw new Error('no ClipboardItem');
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': part('text/plain'), 'text/html': part('text/html') }),
    ]);
  } catch {
    // What could not be written is said as itself; what the clipboard would not take so, it is given as words.
    await navigator.clipboard.writeText((await written).text);
  }
}

/** Copies what is written, as words and as HTML; says `done` when it was copied, where there is anything to say. */
export async function copyWritten(
  written: () => Promise<Written>,
  done: string | null,
): Promise<boolean> {
  try {
    await putWritten(written());
  } catch (error) {
    notifyError(t('library-copy-failed'), error);
    return false;
  }
  if (done) notifyOk(done);
  return true;
}

/** A work by its id alone, which the core reads from the library. */
const byId = (id: string): ExportReference => ({ id, key: '', type: '', fields: {}, names: {} });

/**
 * References as the writer's usual reference style writes them in a
 * bibliography, in the language new texts are given: each a line, in the
 * order the style puts them in.
 */
export function referencesWritten(ids: string[]): Promise<Written> {
  const style = settings.value.defaultStyle || defaultSettings.defaultStyle;
  return styleWritten(style, [...new Set(ids)].map(byId), null, newTextLanguage()).then((html) => {
    const written = entriesWritten(html);
    if (!written) throw new Error(t('library-copy-nothing-written'));
    return written;
  });
}

/** Copies references as the writer's usual reference style writes them. */
export function copyReferences(ids: string[]): Promise<boolean> {
  return copyWritten(() => referencesWritten(ids), t('library-copied'));
}

/**
 * A citation as the reference style of its document writes it, in the
 * document's language, alone: as the first citation of a document is
 * written, a note where the style makes one. The document is that of the
 * element the citation stands in; the works are the library's, or what the
 * project carries of them.
 */
export async function citationWrittenIn(
  project: Project,
  element: string | null | undefined,
  said: Cited,
): Promise<Written> {
  const document = element && project.node(element) ? project.documentOf(element).settings : {};
  const { style } = await documents.choiceRead(document, project);
  const carried = [...new Set(said.items.map((i) => i.id))].flatMap((id): ExportReference[] => {
    const r = project.refs.get(id);
    return r ? [{ id: r.id, key: r.key, type: r.type, fields: r.fields, names: r.names }] : [];
  });
  const html = await styleWritten(style, carried, said, document.language);
  const written = citationWritten(html, said);
  if (!written) throw new Error(t('library-copy-nothing-written'));
  return written;
}

/** Copies a citation as the reference style of its document writes it. */
export function copyCitation(
  project: Project,
  element: string | null | undefined,
  said: Cited,
  done: string | null = t('library-copied'),
): Promise<boolean> {
  return copyWritten(() => citationWrittenIn(project, element, said), done);
}
