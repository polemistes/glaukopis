import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import {
  continueLine,
  continuesAt,
  giveNumber,
  lineAsked,
  lineAt,
  lineBefore,
  markLine,
  numberFrom,
  numberingAsked,
  numberStretch,
  paragraphsFromHere,
  redrawShape,
  stretchAt,
  stretchesIn,
  type LineMarks,
  type NumbersLayout,
} from './numbers';
import { editorOf, shapeOf, text } from './testing';

const views: EditorView[] = [];

/** An editor holding a text written out as `testing.ts` writes it, with the layout's numbers given. */
function at(
  blocks: string[],
  more: { own?: { id: string; basedOn: string }[]; layout?: NumbersLayout } = {},
): EditorView {
  const v = editorOf(blocks, {
    passageKinds: () => more.own ?? [],
    numbers: () => more.layout ?? { every: 5, side: 'left', annotations: null, step: 17 },
  });
  views.push(v);
  return v;
}

/** What is said of a line, all of it, from what a test says of it. */
const said = (marks: Partial<LineMarks>): LineMarks => ({
  number: null,
  counted: true,
  hidden: false,
  shown: false,
  margin: null,
  ...marks,
});

/** What the margin shows at each line, paragraph by paragraph: the label, `(n)` for one held back, `#` for a blank place; `·` in a paragraph with none. */
function margin(v: EditorView): string[] {
  return [...v.dom.querySelectorAll(':scope > p')].map((p) => {
    const numbers = [...p.querySelectorAll('.line-number')].map((el) =>
      el.classList.contains('blank')
        ? '#'
        : el.classList.contains('held')
          ? `(${(el as HTMLElement).dataset.label})`
          : `${(el as HTMLElement).dataset.label}${(el as HTMLElement).hasAttribute('data-given') ? '!' : ''}`,
    );
    return numbers.length ? numbers.join(' ') : '·';
  });
}

/** Puts the cursor at the place `|` marks in the text as written out, the text being the same. */
function cursorAt(v: EditorView, ...blocks: string[]) {
  const { cursor } = text(...blocks);
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, cursor!)));
}

afterEach(() => {
  for (const v of views.splice(0)) v.destroy();
  document.body.innerHTML = '';
});

describe('the stretches of a text', () => {
  it('are consecutive paragraphs numbered with the same settings, whatever their kinds', () => {
    const { doc } = text(
      'text: Before',
      'line #counted: a',
      'speaker #counted: Nurse',
      'text #counted: prose',
      'line #counted/2: b',
      'pagebreak',
      'line #counted/2: c',
      'text: After',
    );
    const found = stretchesIn(doc, 0).map((s) => [
      s.numbering,
      s.every,
      s.side,
      s.paragraphs.map((p) => p.node.textContent).join(','),
    ]);
    expect(found).toEqual([
      ['counted', null, null, 'a,Nurse,prose'],
      ['counted', 2, null, 'b'],
      ['counted', 2, null, 'c'],
    ]);
  });

  it('the cursor is in one, or in none', () => {
    const v = at(['text: Before', 'line #given: a|', 'text: After']);
    expect(stretchAt(v.state)?.paragraphs.map((p) => p.node.textContent)).toEqual(['a']);
    expect(stretchAt(v.state)?.numbering).toBe('given');
    cursorAt(v, 'text: Before|', 'line #given: a', 'text: After');
    expect(stretchAt(v.state)).toBeNull();
  });
});

describe('what a numbering is set on from here', () => {
  it('is the rest of the run of the cursor`s kind, with the speakers and directions among them', () => {
    const v = at([
      'text: Prose',
      'speaker: Nurse',
      'line: a',
      'direction: She weeps.|',
      'line: b',
      'quote: Elsewhere',
    ]);
    expect(paragraphsFromHere(v.state).map((p) => p.node.textContent)).toEqual(['She weeps.', 'b']);
  });

  it('is the paragraphs of text standing together from the cursor`s, in text', () => {
    const v = at(['line: a', 'text: One', 'text: Two|', 'text: Three', 'quote: Q']);
    expect(paragraphsFromHere(v.state).map((p) => p.node.textContent)).toEqual(['Two', 'Three']);
  });

  it('is the rest of the stretch, where the cursor is in one: the paragraphs before keep theirs', () => {
    const v = at(['text #counted/1: One', 'text #counted/1: Two|', 'text #counted/1: Three']);
    expect(paragraphsFromHere(v.state).map((p) => p.node.textContent)).toEqual(['Two', 'Three']);
  });

  it('is the paragraphs selected, where the selection runs over more than one', () => {
    const v = at(['text: One', 'line: a', 'quote: Q', 'text: Two']);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 6, 10)));
    expect(paragraphsFromHere(v.state).map((p) => p.node.textContent)).toEqual(['a', 'Q']);
  });

  it('is numbered by setting the settings on every paragraph, and numbered no more by none', () => {
    const v = at(['speaker: Nurse|', 'line: a', 'line: b']);
    const paragraphs = paragraphsFromHere(v.state);
    numberStretch(paragraphs, { numbering: 'counted', every: 2, side: 'right', only: 'line' })(
      v.state,
      v.dispatch,
    );
    expect(shapeOf(v)).toEqual([
      'speaker #counted/2 right only=line: Nurse|',
      'line #counted/2 right only=line: a',
      'line #counted/2 right only=line: b',
    ]);
    numberFrom(paragraphs, '10')(v.state, v.dispatch);
    // The first line that is counted: not the speaker's.
    expect(shapeOf(v)[1]).toBe('line #counted/2 right only=line: {n=10}a');
    numberStretch(stretchAt(v.state)!.paragraphs, {
      numbering: 'none',
      every: 2,
      side: 'right',
      only: 'line',
    })(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['speaker: Nurse|', 'line: {n=10}a', 'line: b']);
  });

  it('parts a stretch where it is set from the middle, the second part going on from the number it had', () => {
    const v = at(['text #counted/1: {n=1}One', 'text #counted/1: Two|', 'text #counted/1: Three']);
    const asked = numberingAsked(v.state)!;
    expect(asked.from).toBe('2');
    const paragraphs = paragraphsFromHere(v.state);
    numberStretch(paragraphs, { ...asked.stretch, every: 5 })(v.state, v.dispatch);
    numberFrom(paragraphs, asked.from)(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual([
      'text #counted/1: {n=1}One',
      'text #counted/5: {n=2}Two|',
      'text #counted/5: Three',
    ]);
  });

  it('gives the first counted line from here no number of its own where it has that number already', () => {
    const v = at(['text #counted/1: {n=1}One', 'text #counted/1: Two|', 'text #counted/1: Three']);
    const paragraphs = paragraphsFromHere(v.state);
    numberStretch(paragraphs, numberingAsked(v.state)!.stretch)(v.state, v.dispatch);
    numberFrom(paragraphs, '2')(v.state, v.dispatch);
    expect(shapeOf(v)[1]).toBe('text #counted/1: Two|');
  });
});

describe('what is said of a line', () => {
  it('is found where the cursor is, and said by its mark, which goes when it says nothing', () => {
    const v = at(['line: Sing / god|dess']);
    const line = lineAt(v.state)!;
    expect(line.line).toBe(1);
    expect(line.mark).toBeNull();
    expect(line.markPos).toBe(6);
    markLine(said({ number: '12a', margin: ' ia. ' }))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: Sing / {n=12a,m=ia.}god|dess']);
    markLine(said({ counted: false, hidden: true, shown: true }))(v.state, v.dispatch);
    // Not counted, and so neither held back nor always shown.
    expect(shapeOf(v)).toEqual(['line: Sing / {-}god|dess']);
    markLine(said({ hidden: true }))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: Sing / {~}god|dess']);
    markLine(said({ shown: true }))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: Sing / {+}god|dess']);
    // Never and always are not both said: never wins.
    markLine(said({ hidden: true, shown: true }))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: Sing / {~}god|dess']);
    markLine(said({}))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: Sing / god|dess']);
  });

  it('keeps the line`s indent where nothing is said of it', () => {
    const v = at(['line: {i=2}Sing|']);
    markLine(said({ number: '5' }))(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: {n=5,i=2}Sing|']);
  });

  it('gives the line at a place a number from the margin, and takes it away with nothing', () => {
    const v = at(['line #counted: Sing / goddess|']);
    expect(giveNumber(6, '100')(v.state, v.dispatch)).toBe(true);
    expect(shapeOf(v)).toEqual(['line #counted: Sing / {n=100}goddess|']);
    giveNumber(6, '')(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line #counted: Sing / goddess|']);
    // Not where no line begins.
    expect(giveNumber(3, '1')(v.state)).toBe(false);
  });
});

describe('the numbers in the margin', () => {
  it('are drawn at the start of every line of a stretch, counted through a speaker and across stanzas', () => {
    const v = at(
      [
        'speaker #counted/1: Nurse',
        'line #counted/1: {n=1}If only / the Argo / {-}had never',
        'direction #counted/1: She weeps.',
        'line #counted/1: flown / through|',
        'text: After',
      ],
      {},
    );
    expect(margin(v)).toEqual(['#', '1! 2 #', '#', '3 4', '·']);
    // On each paragraph of the stretch, the side; on one whose first line shows a number, the number.
    const ps = v.dom.querySelectorAll(':scope > p');
    expect(ps[1].getAttribute('data-numbers')).toBe('left');
    expect(ps[1].getAttribute('data-n')).toBe('1');
    expect(ps[1].hasAttribute('data-n-set')).toBe(true);
    expect(ps[3].getAttribute('data-n')).toBe('3');
    expect(ps[3].hasAttribute('data-n-set')).toBe(false);
    expect(ps[0].hasAttribute('data-n')).toBe(false);
    expect(ps[4].hasAttribute('data-numbers')).toBe(false);
  });

  it('show every so many as the stretch or the layout says, on its side, a number given that the page does not show in parentheses', () => {
    const v = at(
      ['line #counted: {n=1}a / b / c / d / e / f', 'line #counted/2 right: {n=1}g / h'],
      {
        layout: { every: 3, side: 'left', annotations: null, step: 17 },
      },
    );
    expect(margin(v)).toEqual(['(1) # 3 # # 6', '(1) 2']);
    const given = v.dom.querySelector('.line-number') as HTMLElement;
    expect([given.dataset.given, given.dataset.held]).toEqual(['', '']);
    expect(v.dom.querySelectorAll('p')[1].getAttribute('data-numbers')).toBe('right');
    // The layout changed: drawn anew.
    const w = at(['line #counted: {n=1}a / b / c / d'], {
      layout: { every: 2, side: 'right', annotations: null, step: 17 },
    });
    expect(margin(w)).toEqual(['(1) 2 # 4']);
    redrawShape(w);
    expect(w.dom.querySelector('p')!.getAttribute('data-numbers')).toBe('right');
  });

  it('show a label with letters, and the number of a line said to be always shown', () => {
    const v = at(['line #counted/5: {n=10}a / {n=11b}b / c / {+}d / e / f / g']);
    expect(margin(v)).toEqual(['10! 11b! # 13 # 15 #']);
  });

  it('count only the lines of the kind a stretch says, a quotation among them passed over', () => {
    const v = at([
      'line #counted/1 only=line: {n=1}a / b',
      'quote #counted/1 only=line: Quoted',
      'line #counted/1 only=line: c',
    ]);
    expect(margin(v)).toEqual(['1! 2', '#', '3']);
  });

  it('a line held back is counted, and shows its number in parentheses where one writes', () => {
    const v = at(['line #counted/1: {n=1}a / {~}b / c']);
    expect(margin(v)).toEqual(['1! (2) 3']);
    const held = v.dom.querySelector('.line-number.held') as HTMLElement;
    expect(held.dataset.held).toBe('');
  });

  it('a stretch numbered only by the numbers given shows those, and an empty line is never counted', () => {
    const v = at(['line #given: a / {n=327a}b / c', 'line #counted/1: {n=5}d /  / e']);
    expect(margin(v)).toEqual(['# 327a! #', '5! # 6']);
  });

  it('a kind of the writer`s own is counted as its base is', () => {
    const own = [{ id: 'name', basedOn: 'speaker' }];
    const v = at(['line #counted/1: {n=1}a', 'name #counted/1: Nurse', 'line #counted/1: b'], {
      own,
    });
    expect(margin(v)).toEqual(['1!', '#', '2']);
  });

  it('words in the margin are drawn beside their line, numbered or not', () => {
    const v = at(['line: a / {m=ia. trim.}b']);
    const words = v.dom.querySelector('.line-margin')!;
    expect(words.textContent).toBe('ia. trim.');
    expect(v.dom.querySelector('p')!.hasAttribute('data-margins')).toBe(true);
  });

  it('annotations stand across from the numbers, or where the layout says', () => {
    const sides = (layout: NumbersLayout) =>
      [
        ...at(
          ['line #counted/1: {n=1,m=x}a', 'line #counted/1 right: {n=1}b / {m=y}c', 'text: {m=z}d'],
          {
            layout,
          },
        ).dom.querySelectorAll(':scope > p'),
      ].map((p) => p.getAttribute('data-annotations'));
    expect(sides({ every: 5, side: 'left', annotations: null, step: 17 })).toEqual([
      'right',
      'left',
      'right',
    ]);
    expect(sides({ every: 5, side: 'left', annotations: 'left', step: 17 })).toEqual([
      'left',
      'left',
      'left',
    ]);
    expect(sides({ every: 5, side: 'right', annotations: null, step: 17 })).toEqual([
      'left',
      'left',
      'left',
    ]);
  });
});

describe('the field of a line`s number', () => {
  /** Opens the field by pressing the first number in the margin. */
  function open(v: EditorView): HTMLInputElement {
    (v.dom.querySelector('.line-number') as HTMLElement).click();
    const field = v.dom.querySelector('.line-number-field') as HTMLInputElement;
    expect(document.activeElement).toBe(field);
    return field;
  }

  it('gives the text the cursor again when it is closed by a key', () => {
    const v = at(['line #counted/1: {n=1}a / b']);
    const field = open(v);
    field.value = '4';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(margin(v)).toEqual(['4! 5']);
    expect(document.activeElement).toBe(v.dom);
  });

  it('leaves the focus with what was pressed when it is left for it', () => {
    const v = at(['line #counted/1: {n=1}a / b']);
    const search = document.body.appendChild(document.createElement('input'));
    const field = open(v);
    field.value = '4';
    search.focus();
    expect(document.activeElement).toBe(search);
    // Left so, nothing is given.
    expect(margin(v)).toEqual(['1! 2']);
    expect(v.dom.querySelector('.line-number-field')).toBeNull();
  });
});

describe('where a line begins', () => {
  it('the line before is the nearest above with words, blank lines, speakers and directions passed over', () => {
    const v = at([
      'line: Is it you, / ',
      'speaker: Ismene',
      'direction: Aside.',
      'line: my sister?|',
    ]);
    // "Is it you," ends at 11, before the line break.
    expect(lineBefore(v.state.doc, lineAt(v.state)!.markPos)).toBe(11);
    const w = at(['line: Sing / goddess|']);
    expect(lineBefore(w.state.doc, lineAt(w.state)!.markPos)).toBe(5);
    const alone = at(['line: Alone|']);
    expect(lineBefore(alone.state.doc, lineAt(alone.state)!.markPos)).toBeNull();
  });

  it('a line is said to begin where the line before ended, and no more, and the first line of a text cannot', () => {
    const v = at(['line: Is it you,', 'speaker: Ismene', 'line: my sister?|']);
    expect(continuesAt(v.state)).toEqual({ on: false, can: true });
    expect(continueLine(true)(v.state, v.dispatch)).toBe(true);
    expect(shapeOf(v)[2]).toBe('line: {^}my sister?|');
    expect(continuesAt(v.state)).toEqual({ on: true, can: true });
    // What the line's window says leaves it so.
    markLine(said({ number: '5' }))(v.state, v.dispatch);
    expect(shapeOf(v)[2]).toBe('line: {n=5,^}my sister?|');
    markLine(said({}))(v.state, v.dispatch);
    continueLine(false)(v.state, v.dispatch);
    expect(shapeOf(v)[2]).toBe('line: my sister?|');
    const alone = at(['line: Alone|']);
    expect(continuesAt(alone.state)).toEqual({ on: false, can: false });
    expect(continueLine(true)(alone.state)).toBe(false);
  });

  it('the line keeps its count: it is counted as before, unless its window says otherwise', () => {
    const v = at(['line #counted/1: {n=1}Is it you, / {^}my sister?']);
    expect(margin(v)).toEqual(['1! 2']);
  });
});

describe('what Line numbering from here asks', () => {
  it('in text not yet numbered: counted from 1, every paragraph', () => {
    const v = at(['text: One|', 'text: Two']);
    const asked = numberingAsked(v.state)!;
    expect(asked.numbered).toBe(false);
    expect(asked.stretch).toEqual({ numbering: 'counted', every: 1, side: null, only: null });
    expect(asked.from).toBe('1');
    expect(asked.kinds).toEqual(['text']);
  });

  it('in verse not yet numbered: as the layout says, the kinds that are counted offered', () => {
    const v = at(['speaker: Nurse|', 'line: a / b', 'quote: Q']);
    const asked = numberingAsked(v.state)!;
    expect(asked.stretch.every).toBeNull();
    expect(asked.from).toBe('1');
    expect(asked.kinds).toEqual(['line']);
  });

  it('in a stretch: its settings, and the number the first counted line from here has', () => {
    const v = at([
      'line #counted/5 right only=line: {n=100}a / b',
      'line #counted/5 right only=line: c|',
    ]);
    const asked = numberingAsked(v.state)!;
    expect(asked.numbered).toBe(true);
    expect(asked.stretch).toEqual({ numbering: 'counted', every: 5, side: 'right', only: 'line' });
    expect(asked.from).toBe('102');
  });

  it('from a label: the number the count gives the line after it', () => {
    const v = at(['text #counted/1: {n=11b}One', 'text #counted/1: Two|']);
    expect(numberingAsked(v.state)!.from).toBe('12');
  });
});

describe('what Numbering of this line asks', () => {
  it('what is said of the line, its words, and the side its annotation goes to', () => {
    const v = at(['line #counted/5 right: {n=100}a / {-,m=x}b|']);
    const asked = lineAsked(v.state)!;
    expect(asked.marks).toMatchObject({ number: null, counted: false, hidden: false, margin: 'x' });
    expect(asked).toMatchObject({ words: 'b', kind: 'line', countable: true, annotations: 'left' });
    expect(
      lineAsked(v.state, [], { every: 5, side: 'left', annotations: 'right', step: 17 })!
        .annotations,
    ).toBe('right');
  });

  it('a speaker`s line, or one of a kind the stretch does not count, is not counted', () => {
    const v = at(['speaker #counted: Nurse|', 'line #counted: a']);
    expect(lineAsked(v.state)!.countable).toBe(false);
    const w = at(['quote #counted only=line: Q|', 'line #counted only=line: a']);
    expect(lineAsked(w.state)!.countable).toBe(false);
  });
});
