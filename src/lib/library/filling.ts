/**
 * A form filled from what a lookup found, where the writer has written in
 * it while the lookup was out: only what is still empty is filled, so that
 * nothing the writer typed is lost to an answer that came late.
 */

import type { Draft, Person } from '$lib/api/library';

const named = (people: Person[] | undefined) =>
  !!people?.some((p) => p.family?.trim() || p.given?.trim());

/**
 * The draft with what was found put into its empty fields and its empty
 * lists of names. The type is the one found where the writer has not
 * chosen another than the form began with (`began`); the key is the
 * draft's. Also says whether anything was left out because the writer had
 * written something there.
 */
export function fillEmpty(
  draft: Draft,
  found: Draft,
  began: string,
): { draft: Draft; kept: boolean } {
  let kept = false;
  const fields = { ...draft.fields };
  for (const [name, value] of Object.entries(found.fields)) {
    if (!value.trim()) continue;
    if (fields[name]?.trim()) kept ||= fields[name].trim() !== value.trim();
    else fields[name] = value;
  }
  const names = { ...draft.names };
  for (const [role, people] of Object.entries(found.names)) {
    if (!named(people)) continue;
    if (named(names[role])) kept = true;
    else names[role] = people.map((p) => ({ ...p }));
  }
  const type = draft.type === began ? found.type : draft.type;
  if (type !== found.type) kept = true;
  return { draft: { key: draft.key, type, fields, names }, kept };
}
