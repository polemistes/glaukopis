import { describe, expect, it } from 'vitest';
import { CARD_GAP } from '../model/places';
import {
  bandOf,
  boundsOf,
  cardAt,
  cardBox,
  cardsInView,
  letGoAt,
  LET_GO,
  nearest,
  nearestTo,
  stacked,
  touching,
  USUAL_HEIGHT,
} from './geometry';

describe('the box of a card', () => {
  it('is reckoned from its top left corner to its middle, at its width and its measured height', () => {
    expect(cardBox('a', { x: 100, y: 40 }, 280, 90)).toEqual({
      id: 'a',
      x: 240,
      y: 85,
      w: 280,
      h: 90,
    });
  });

  it('is of the usual height before it is measured', () => {
    const b = cardBox('a', { x: 0, y: 0 }, 200);
    expect(b.h).toBe(USUAL_HEIGHT);
    expect(b.y).toBe(USUAL_HEIGHT / 2);
    expect(cardBox('a', { x: 0, y: 0 }, 200, 0).h).toBe(USUAL_HEIGHT);
  });
});

describe('the cards a view shows', () => {
  const boxes = [
    cardBox('near', { x: 10, y: 10 }, 280, 100),
    cardBox('right', { x: 1200, y: 10 }, 280, 100),
    cardBox('far', { x: 5000, y: 5000 }, 280, 100),
    cardBox('above', { x: 10, y: -330 }, 280, 100),
  ];

  it('are those within it and a little round it', () => {
    // A viewport of 1000 by 800, the origin at its top left corner, at the actual size.
    expect(cardsInView(boxes, { x: 0, y: 0, k: 1 }, 1000, 800, 240)).toEqual([
      'near',
      'right',
      'above',
    ]);
    expect(cardsInView(boxes, { x: 0, y: 0, k: 1 }, 1000, 800, 0)).toEqual(['near']);
  });

  it('follow the view as it is moved and zoomed', () => {
    // The world moved so that its point (5000, 5000) is at the top left corner.
    expect(cardsInView(boxes, { x: -5000, y: -5000, k: 1 }, 1000, 800, 0)).toEqual(['far']);
    // Zoomed out to a quarter: four thousand pixels of the world across.
    expect(cardsInView(boxes, { x: 0, y: 0, k: 0.25 }, 1000, 800, 0)).toEqual(['near', 'right']);
  });
});

describe('a band', () => {
  it('is the same whichever way it was drawn', () => {
    expect(bandOf({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual({
      left: 10,
      top: 20,
      right: 50,
      bottom: 80,
    });
  });

  it('selects what it touches', () => {
    const boxes = [
      cardBox('a', { x: 0, y: 0 }, 100, 50),
      cardBox('b', { x: 200, y: 0 }, 100, 50),
      cardBox('c', { x: 0, y: 200 }, 100, 50),
    ];
    expect(touching(bandOf({ x: 90, y: 40 }, { x: 210, y: 45 }), boxes)).toEqual(['a', 'b']);
    expect(touching(bandOf({ x: 120, y: 100 }, { x: 180, y: 150 }), boxes)).toEqual([]);
  });
});

describe('the edges of all the cards', () => {
  it('hold every card, and are none where there is none', () => {
    expect(boundsOf([])).toBeNull();
    expect(
      boundsOf([
        cardBox('a', { x: -20, y: 10 }, 100, 50),
        cardBox('b', { x: 300, y: 400 }, 200, 80),
      ]),
    ).toEqual({ left: -20, top: 10, right: 500, bottom: 480 });
  });
});

describe('the card at a point', () => {
  const boxes = [
    cardBox('under', { x: 0, y: 0 }, 200, 100),
    cardBox('over', { x: 100, y: 50 }, 200, 100),
  ];

  it('is the one drawn last where they lie over one another', () => {
    expect(cardAt({ x: 150, y: 70 }, boxes)).toBe('over');
    expect(cardAt({ x: 20, y: 20 }, boxes)).toBe('under');
    expect(cardAt({ x: 500, y: 500 }, boxes)).toBeNull();
  });

  it('is never the one left out, as the card a link is drawn from', () => {
    expect(cardAt({ x: 150, y: 70 }, boxes, 'over')).toBe('under');
  });
});

describe('the nearest card in a direction', () => {
  // A cross: a middle card, one on each side, one far off to the lower right.
  const middle = cardBox('m', { x: 400, y: 400 }, 200, 100);
  const boxes = [
    middle,
    cardBox('r', { x: 700, y: 420 }, 200, 100),
    cardBox('l', { x: 100, y: 380 }, 200, 100),
    cardBox('u', { x: 410, y: 200 }, 200, 100),
    cardBox('d', { x: 390, y: 600 }, 200, 100),
    cardBox('far', { x: 720, y: 900 }, 200, 100),
  ];

  it('is the one straight ahead', () => {
    expect(nearest(boxes, middle, 'right')).toBe('r');
    expect(nearest(boxes, middle, 'left')).toBe('l');
    expect(nearest(boxes, middle, 'up')).toBe('u');
    expect(nearest(boxes, middle, 'down')).toBe('d');
  });

  it('is none where nothing lies that way', () => {
    expect(nearest(boxes, boxes[5], 'right')).toBeNull();
    expect(nearest([middle], middle, 'down')).toBeNull();
  });

  it('where nothing is selected, the card nearest the middle of the view', () => {
    expect(nearestTo({ x: 690, y: 880 }, boxes)).toBe('far');
    expect(nearestTo({ x: 0, y: 0 }, [])).toBeNull();
  });
});

describe('where notes lie', () => {
  it('made of files dropped: one under the other from where they were dropped', () => {
    expect(stacked({ x: 10.4, y: 20 }, 3)).toEqual([
      { x: 10, y: 20 },
      { x: 10, y: 20 + USUAL_HEIGHT + CARD_GAP },
      { x: 10, y: 20 + 2 * (USUAL_HEIGHT + CARD_GAP) },
    ]);
    expect(stacked({ x: 0, y: 0 }, 0)).toEqual([]);
  });

  it('let go on the ground: with the pointer over its head', () => {
    expect(letGoAt({ x: 100, y: 100 })).toEqual({ x: 100 - LET_GO.x, y: 100 - LET_GO.y });
  });
});
