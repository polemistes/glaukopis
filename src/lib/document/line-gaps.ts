/**
 * How far the numbers and the annotations of numbered lines stand from the
 * text (ADR 0076): the layout's lengths, else the defaults, as the core has
 * them (`Verse::numbers_gap` and `Verse::annotations_gap` in
 * `crates/core/src/formats/mod.rs`). Each is measured from the edge the
 * paragraphs share to the near edge of what stands in the margin, the same
 * on every line. Look shows them, and the text view stands by them.
 */

import type { DocumentFormat } from '$lib/api/documents';

type VerseLook = DocumentFormat['verse'];
type Side = 'left' | 'right';

/** How far the numbers stand where the layout does not say. */
export const NUMBERS_GAP = '0.25cm';
/** How far the annotations stand on the numbers' side, outside them, where the layout does not say. */
export const ANNOTATIONS_GAP_BESIDE_NUMBERS = '1.5cm';

/** The side the annotations of lines numbered on `numbers` stand on: the layout's, else across from them. */
export function annotationsSide(verse: VerseLook, numbers: Side): Side {
  return verse.annotations ?? (numbers === 'left' ? 'right' : 'left');
}

/** How far the numbers stand from the text. */
export function numbersGap(verse: VerseLook): string {
  return verse.numbersGap || NUMBERS_GAP;
}

/**
 * How far the annotations stand from the text where they stand on the
 * numbers' side (`beside`) or across from them: the layout's length, else
 * outside the numbers, or as far as the numbers.
 */
export function annotationsGapWhere(verse: VerseLook, beside: boolean): string {
  return verse.annotationsGap || (beside ? ANNOTATIONS_GAP_BESIDE_NUMBERS : numbersGap(verse));
}

/** How far the annotations of lines numbered on `numbers` stand from the text. */
export function annotationsGap(verse: VerseLook, numbers: Side): string {
  return annotationsGapWhere(verse, annotationsSide(verse, numbers) === numbers);
}
