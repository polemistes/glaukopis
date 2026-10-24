import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import {
  beginRun,
  canBeginRun,
  joinRunBefore,
  languageOverRun,
  runAt,
  runFrom,
  runLanguage,
  runToText,
  selectRun,
} from './brackets';
import { runsIn } from './shape';
import { LAYOUT_NUMBERS } from './numbers';
import { editorOf, shapeOf, text } from './testing';

const views: EditorView[] = [];

function at(blocks: string[], own: { id: string; basedOn: string; name?: string }[] = []) {
  const v = editorOf(blocks, { passageKinds: () => own });
  views.push(v);
  return v;
}

/** The runs of a text: each its kind and its paragraphs' words, `*` for one of speakers and directions alone. */
function runs(...blocks: string[]): string[] {
  const { doc } = text(...blocks);
  return runsIn(doc, 0).map(
    (r) =>
      `${r.among ? '*' : ''}${r.kind}[${r.paragraphs.map((p) => p.node.textContent).join(',')}]`,
  );
}

/** The words of a paragraph as drawn, without the bracket and the numbers beside it. */
function words(p: Element): string {
  const copy = p.cloneNode(true) as Element;
  for (const widget of copy.querySelectorAll('.run-line, .line-number')) widget.remove();
  return copy.textContent ?? '';
}

/** The brackets drawn: the label of each, and the words of the paragraphs it is beside. */
function brackets(v: EditorView): string[] {
  const out: string[] = [];
  for (const p of v.dom.querySelectorAll(':scope > p')) {
    const label = p.querySelector('.run-label');
    if (label) out.push(`${label.textContent}:`);
    if (p.hasAttribute('data-run')) out[out.length - 1] += ` ${words(p)}`;
  }
  return out;
}

afterEach(() => {
  for (const v of views.splice(0)) v.destroy();
  document.body.innerHTML = '';
});

describe('runs', () => {
  it('are paragraphs of one kind standing together, speakers and directions among them not parting them', () => {
    expect(
      runs(
        'text: a',
        'text: b',
        'speaker: Nurse',
        'line: c',
        'direction: She weeps.',
        'line: d',
        'quote: e',
        'quote: f',
      ),
    ).toEqual(['text[a,b]', 'line[Nurse,c,She weeps.,d]', 'quote[e,f]']);
  });

  it('a direction after a verse is the verse`s, before text; speakers alone are a run of their own', () => {
    expect(runs('line: a', 'direction: Exit.', 'text: b')).toEqual(['line[a,Exit.]', 'text[b]']);
    expect(runs('speaker: Nurse', 'pagebreak', 'speaker: Chorus', 'text: b')).toEqual([
      '*speaker[Nurse]',
      '*speaker[Chorus]',
      'text[b]',
    ]);
  });

  it('a paragraph that begins a new run begins one, though the one before is of its kind', () => {
    expect(runs('line: a', 'line: b', 'line new: c', 'line: d')).toEqual([
      'line[a,b]',
      'line[c,d]',
    ]);
    expect(runs('line: a', 'speaker new: Nurse', 'line: c')).toEqual(['line[a]', 'line[Nurse,c]']);
    // Anything that is not a paragraph ends a run.
    expect(runs('quote: a', 'pagebreak', 'quote: b')).toEqual(['quote[a]', 'quote[b]']);
  });

  it('the cursor is in one, at one of its paragraphs', () => {
    const v = at(['speaker: Nurse', 'line: a', 'line: b|']);
    const found = runAt(v.state)!;
    expect(found.run.kind).toBe('line');
    expect(found.index).toBe(2);
  });
});

describe('the bracket of a run', () => {
  it('is drawn beside the paragraphs of a kind, named by it, and not beside text, unless it is numbered', () => {
    const v = at(
      [
        'text: a',
        'speaker: Nurse',
        'line: b',
        'line: c',
        'text #counted: d',
        'text #counted: e',
        'k1: f',
      ],
      [{ id: 'k1', basedOn: 'text', name: 'Letter' }],
    );
    expect(brackets(v)).toEqual(['Verse: Nurse b c', 'Text · numbered: d e', 'Letter: f']);
    const first = v.dom.querySelectorAll(':scope > p')[1];
    expect(first.getAttribute('data-run')).toBe('line');
    expect(first.hasAttribute('data-run-first')).toBe(true);
    expect(first.querySelector('.run-line > .run-label')).not.toBeNull();
    // A line beside each paragraph of the run.
    expect(v.dom.querySelectorAll('.run-line')).toHaveLength(6);
  });

  it('is marked current while the cursor is in its run', () => {
    const v = at(['quote: a|', 'quote: b', 'text: c', 'line: d']);
    const current = () =>
      [...v.dom.querySelectorAll('p[data-current]')].map((p) => words(p)).join(',');
    expect(current()).toBe('a,b');
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
    expect(current()).toBe('d');
  });
});

describe('the bracket beside numbered lines', () => {
  /** The paragraphs as drawn: the side their bracket keeps clear of the numbers on, `-` where it keeps none, and `|` where they have a segment of a bracket. */
  const sides = (v: EditorView) =>
    [...v.dom.querySelectorAll(':scope > p')]
      .map(
        (p) =>
          `${p.getAttribute('data-run-numbers') ?? '-'}${p.querySelector(':scope > .run-line') ? '|' : ''}`,
      )
      .join(' ');

  it('of text follows the numbered stretch, not all the text standing together', () => {
    const v = at([
      'text: a',
      'text: b',
      'text #counted: c',
      'text #counted: d',
      'text: e',
      'text: f',
    ]);
    expect(brackets(v)).toEqual(['Text · numbered: c d']);
    expect(sides(v)).toBe('- - left| left| - -');
    expect(v.dom.querySelectorAll(':scope > p')[2].hasAttribute('data-run-first')).toBe(true);
  });

  it('of text is one for each stretch numbered alike', () => {
    const v = at([
      'text #counted: a',
      'text #counted: b',
      'text #given: c',
      'text: d',
      'text #given: e',
    ]);
    expect(brackets(v)).toEqual([
      'Text · numbered: a b',
      'Text · numbered: c',
      'Text · numbered: e',
    ]);
  });

  it('of a kind stands outside the numbers along the whole run, beside what is not numbered too', () => {
    const v = at(['line: a', 'speaker: Chorus', 'line #counted: b', 'line #counted: c', 'text: d']);
    expect(brackets(v)).toEqual(['Verse · numbered: a Chorus b c']);
    expect(sides(v)).toBe('left| left| left| left| -');
  });

  it('keeps clear of the numbers at the left where any of the run stands there, and stays in where they stand at the right', () => {
    expect(sides(at(['line #counted right: a', 'line #counted: b']))).toBe('left| left|');
    expect(sides(at(['line #counted right: a', 'line: b']))).toBe('right| right|');
    const v = editorOf(['line: a', 'line #counted: b'], {
      numbers: () => ({ ...LAYOUT_NUMBERS, side: 'right' }),
    });
    views.push(v);
    expect(sides(v)).toBe('right| right|');
  });

  it('of numbered text has the menu of that stretch: selecting it selects those paragraphs alone', () => {
    const v = at(['text: x', 'text #counted: Arma virumque', 'text #counted: cano|', 'text: y']);
    const first = v.state.doc.child(0).nodeSize;
    expect(runFrom(v.state, first)?.paragraphs.map((p) => p.node.textContent)).toEqual([
      'Arma virumque',
      'cano',
    ]);
    expect(selectRun(first)(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.textBetween(v.state.selection.from, v.state.selection.to)).toBe(
      'Arma virumquecano',
    );
    // All the text standing together is a run still, where it begins.
    expect(runFrom(v.state, 0)?.paragraphs).toHaveLength(4);
  });
});

describe('the menu of a run', () => {
  it('makes it text: the kind and nothing else, its lines, indents and speakers as they were', () => {
    const v = at(['speaker: Nurse', 'line>1 #counted: {n=1}a / {i=2}b', 'line: c|', 'quote: q']);
    expect(runToText(0)(v.state, v.dispatch)).toBe(true);
    expect(shapeOf(v)).toEqual([
      'speaker: Nurse',
      'text>1 #counted: {n=1}a / {i=2}b',
      'text: c|',
      'quote: q',
    ]);
  });

  it('selects the run, and gives it a language', () => {
    const v = at(['text: x', 'quote: Arma virumque', 'quote: cano|']);
    expect(selectRun(3)(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.textBetween(v.state.selection.from, v.state.selection.to)).toBe(
      'Arma virumquecano',
    );
    languageOverRun(3, 'la')(v.state, v.dispatch);
    expect(runLanguage(v.state, 3)).toBe('la');
    languageOverRun(3, null)(v.state, v.dispatch);
    expect(runLanguage(v.state, 3)).toBeNull();
    // Only where a run begins.
    expect(selectRun(4)(v.state)).toBe(false);
  });

  it('begins a new run at the cursor`s paragraph, not at the first, and joins it with the one before again', () => {
    const v = at(['line: a|', 'line: b', 'line: c']);
    expect(canBeginRun(v.state)).toBe(false);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 4)));
    expect(canBeginRun(v.state)).toBe(true);
    beginRun()(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['line: a', 'line new: |b', 'line: c']);
    expect(brackets(v)).toEqual(['Verse: a', 'Verse: b c']);
    expect(joinRunBefore(3)(v.state, v.dispatch)).toBe(true);
    expect(shapeOf(v)).toEqual(['line: a', 'line: |b', 'line: c']);
    expect(joinRunBefore(0)(v.state)).toBe(false);
  });
});
