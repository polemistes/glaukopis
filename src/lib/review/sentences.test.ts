import { describe, expect, it } from 'vitest';
import { core, OBJECT, sentences } from './sentences';

/** The sentences of a text, as the text of each. */
function split(text: string, language = 'en'): string[] {
  return sentences(text, language).map((s) => text.slice(s.start, s.end));
}

describe('sentences', () => {
  it('are found by the language, and cover the text', () => {
    const text = 'The wrath is divine. It was sung! Was it? Yes.';
    expect(split(text)).toEqual(['The wrath is divine. ', 'It was sung! ', 'Was it? ', 'Yes.']);
    const found = sentences(text, 'en');
    expect(found[0].start).toBe(0);
    expect(found[found.length - 1].end).toBe(text.length);
    for (let i = 1; i < found.length; i++) expect(found[i].start).toBe(found[i - 1].end);
  });

  it('a text without a stop is one, and an empty text none', () => {
    expect(split('A title without a stop')).toEqual(['A title without a stop']);
    expect(split('')).toEqual([]);
  });

  it('go on past the abbreviations of scholarly writing in English', () => {
    expect(split('The wrath (cf. Nagy 1979, p. 73) is divine. It was sung.')).toEqual([
      'The wrath (cf. Nagy 1979, p. 73) is divine. ',
      'It was sung.',
    ]);
    expect(split('See pp. 12–14 and vol. 2, ch. 3, fig. 4. Then more.')).toEqual([
      'See pp. 12–14 and vol. 2, ch. 3, fig. 4. ',
      'Then more.',
    ]);
    expect(split('Some e.g. Homer, i.e. the poet, etc. are here. Next one.')).toEqual([
      'Some e.g. Homer, i.e. the poet, etc. are here. ',
      'Next one.',
    ]);
    expect(split('It is in ed. Smith and eds. Jones and Nagy. Also Dr. Lord.')).toEqual([
      'It is in ed. Smith and eds. Jones and Nagy. ',
      'Also Dr. Lord.',
    ]);
  });

  it('go on past the initials of a name', () => {
    expect(split('Written by A. B. Lord in 1960. He knew.')).toEqual([
      'Written by A. B. Lord in 1960. ',
      'He knew.',
    ]);
    expect(split('Skrevet av A.B. Lord i 1960. Han visste.', 'nb')).toEqual([
      'Skrevet av A.B. Lord i 1960. ',
      'Han visste.',
    ]);
  });

  it('go on past a short abbreviation before a number', () => {
    expect(split('He wrote of it (Il. 9.410). Then no. 3 came.')).toEqual([
      'He wrote of it (Il. 9.410). ',
      'Then no. 3 came.',
    ]);
    expect(split('Han kom kl. 3. Så gikk han.', 'nb')).toEqual(['Han kom kl. 3. ', 'Så gikk han.']);
  });

  it('go on past the abbreviations of Norwegian', () => {
    expect(split('Vreden (jf. Nagy 1979, s. 73) er guddommelig. Den ble sunget.', 'nb')).toEqual([
      'Vreden (jf. Nagy 1979, s. 73) er guddommelig. ',
      'Den ble sunget.',
    ]);
    expect(split('Se bl.a. kap. 3 og f.eks. nr. 4. Deretter mer.', 'nb')).toEqual([
      'Se bl.a. kap. 3 og f.eks. nr. 4. ',
      'Deretter mer.',
    ]);
    expect(split('Dette er ca. 30 år osv. Neste setning.', 'nb')).toEqual([
      'Dette er ca. 30 år osv. ',
      'Neste setning.',
    ]);
    expect(split('Boka kom i red. Nagy. Mange leste den.', 'nn')).toEqual([
      'Boka kom i red. Nagy. ',
      'Mange leste den.',
    ]);
  });

  it('end at "red." in English, which is a word there', () => {
    expect(split('The wine was red. Nagy drank it.')).toEqual([
      'The wine was red. ',
      'Nagy drank it.',
    ]);
  });

  it('keep the number of a note with the sentence it follows', () => {
    const text = `It is divine.${OBJECT} It was sung.${OBJECT}${OBJECT} And more.`;
    expect(split(text)).toEqual([
      `It is divine.${OBJECT} `,
      `It was sung.${OBJECT}${OBJECT} `,
      'And more.',
    ]);
    // A citation before the stop is within the sentence, as it always was.
    expect(split(`It is divine ${OBJECT}. It was sung.`)).toEqual([
      `It is divine ${OBJECT}. `,
      'It was sung.',
    ]);
  });

  it('are found in a language the segmenter does not know by the rules of English', () => {
    expect(split('Μῆνιν ἄειδε θεά. Πηληϊάδεω Ἀχιλῆος.', 'grc')).toEqual([
      'Μῆνιν ἄειδε θεά. ',
      'Πηληϊάδεω Ἀχιλῆος.',
    ]);
    expect(split('One. Two.', 'not a tag!')).toEqual(['One. ', 'Two.']);
  });
});

describe('the core of a sentence', () => {
  it('is the sentence without the space around it', () => {
    const text = '  One.  Two.';
    const [first, second] = sentences(text, 'en');
    expect(core(text, first)).toEqual({ start: 2, end: 6 });
    expect(core(text, second)).toEqual({ start: 8, end: 12 });
    expect(core('   ', { start: 0, end: 3 })).toBeNull();
  });
});
