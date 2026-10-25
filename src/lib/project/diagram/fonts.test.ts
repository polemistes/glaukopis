import { describe, expect, it } from 'vitest';
import { facesFor, familiesOf, parseRanges, type Face } from './fonts';
import { imageScale } from './picture';

const face = (family: string, italic: boolean, range: string, url: string): Face => ({
  family,
  italic,
  weight: '200 900',
  ranges: parseRanges(range),
  range,
  url,
});

// As @fontsource declares Literata: a file for each range of letters, upright and italic.
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20AC,U+2122,U+FEFF';
const GREEK = 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF';
const GREEK_EXT = 'U+1F00-1FFF';
const faces = [
  face('Literata Variable', false, LATIN, 'latin.woff2'),
  face('Literata Variable', false, GREEK, 'greek.woff2'),
  face('Literata Variable', false, GREEK_EXT, 'greek-ext.woff2'),
  face('Literata Variable', true, LATIN, 'latin-italic.woff2'),
  face('Inter Variable', false, LATIN, 'inter-latin.woff2'),
];
const literata = familiesOf("'Literata Variable', 'Literata', 'Gentium Plus', Georgia, serif");
const inter = familiesOf('"Inter Variable", Inter, system-ui, sans-serif');

describe('the fonts a picture of the diagram carries', () => {
  it('reads the ranges of a face', () => {
    expect(parseRanges('U+0000-00FF, U+0131, U+1F??')).toEqual([
      [0, 0xff],
      [0x131, 0x131],
      [0x1f00, 0x1fff],
    ]);
    expect(parseRanges('')).toBeNull();
  });

  it('reads the families without their quotes', () => {
    expect(literata.slice(0, 2)).toEqual(['Literata Variable', 'Literata']);
    expect(inter[0]).toBe('Inter Variable');
  });

  it('takes the Latin file of the family for a Latin name, and nothing else', () => {
    const got = facesFor(faces, [
      { families: literata, italic: false, text: 'Wrath and the hero' },
    ]);
    expect(got.map((f) => f.url)).toEqual(['latin.woff2']);
  });

  it('takes the Greek files where a name is in Greek, with its accents', () => {
    const got = facesFor(faces, [{ families: literata, italic: false, text: 'Μῆνιν ἄειδε θεά' }]);
    expect(got.map((f) => f.url).sort()).toEqual(['greek-ext.woff2', 'greek.woff2']);
  });

  it('takes an italic file only where a run is in italics', () => {
    const got = facesFor(faces, [
      { families: literata, italic: true, text: 'Iliad' },
      { families: inter, italic: false, text: '1,204' },
    ]);
    expect(got.map((f) => f.url).sort()).toEqual(['inter-latin.woff2', 'latin-italic.woff2']);
  });

  it('takes nothing for a family the page declares no faces of', () => {
    expect(facesFor(faces, [{ families: ['Georgia'], italic: false, text: 'x' }])).toEqual([]);
  });
});

describe('the scale of an image of the diagram', () => {
  it('is twice the size where that fits on a canvas', () => {
    expect(imageScale({ x: 0, y: 0, w: 1200, h: 800 })).toBe(2);
  });
  it('is lowered to fit a large map', () => {
    expect(imageScale({ x: 0, y: 0, w: 10000, h: 3000 })).toBe(1.6);
  });
  it('is nothing for a map too large even at half its size', () => {
    expect(imageScale({ x: 0, y: 0, w: 40000, h: 3000 })).toBeNull();
  });
});
