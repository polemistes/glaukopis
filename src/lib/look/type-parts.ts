/**
 * The parts a document type suggests, changed while it is edited: a part
 * taken out of what it suggests, or one put in. What a type suggests is
 * its contents (the parts in their usual order, the text among them) and
 * the kinds it offers (`suggestedParts` reads both). Nothing is placed in a
 * document by this: a part is printed where an element of its kind stands.
 */

import type { ContentsItem, Template } from '$lib/api/templates';
import { partSpec, type PartSpec } from '$lib/project/parts';

type Parts = Pick<Template, 'contents' | 'kinds'>;

/** The kind or the part an item of the contents names. */
const named = (item: ContentsItem) => ('kind' in item ? item.kind : item.part);

/** The type without a part: neither in its contents nor among the kinds it offers. Pure. */
export function withoutPart(type: Parts, id: string): Parts {
  return {
    contents: type.contents.filter((item) => named(item) !== id).map((item) => ({ ...item })),
    kinds: type.kinds.filter((kind) => kind !== id),
  };
}

/**
 * The type with a part put in, where it stands by custom: a part of the
 * front before the text, a part of the back after it, before the notes and
 * the bibliography (the bibliography itself last). What is on no page, a
 * cover, is offered among the kinds and has no place in the order. A part
 * already there leaves the type as it is. Pure.
 */
export function withPart(
  type: Parts,
  id: string,
  specOf: (id: string) => PartSpec | undefined = partSpec,
): Parts {
  const out: Parts = {
    contents: type.contents.map((item) => ({ ...item })),
    kinds: [...type.kinds],
  };
  if (out.contents.some((item) => named(item) === id) || out.kinds.includes(id)) return out;
  const spec = specOf(id);
  if (!spec || spec.place === 'cover' || spec.place === 'none') {
    out.kinds.push(id);
    return out;
  }
  const item: ContentsItem = spec.made ? ({ part: id } as ContentsItem) : { kind: id };
  const body = out.contents.findIndex((c) => named(c) === 'body');
  let at: number;
  if (spec.group !== 'back') at = body < 0 ? out.contents.length : body;
  else if (id === 'bibliography') at = out.contents.length;
  else {
    const after = out.contents.findIndex(
      (c, i) => i > body && (named(c) === 'notes' || named(c) === 'bibliography'),
    );
    at = after < 0 ? out.contents.length : after;
  }
  out.contents.splice(at, 0, item);
  return out;
}
