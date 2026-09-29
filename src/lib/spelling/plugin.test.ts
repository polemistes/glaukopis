import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bodySchema } from '$lib/editor/schema';

// The dictionary of the test: these words are wrong, all others right.
const WRONG = new Set(['recieved', 'teh', 'Wroth', 'Nagy']);

vi.mock('$lib/api/spelling', () => ({
  spellingPrepare: vi.fn(async () => ({
    dictionaries: [{ tag: 'en-US', name: 'en_US', source: 'application', dir: '' }],
    script: 'Latn',
    words: 'en',
  })),
  spellingCheck: vi.fn(async (_language: string | null, words: string[]) =>
    words.map((w) => !WRONG.has(w.replace(/\.$/, ''))),
  ),
  spellingSuggest: vi.fn(async () => []),
  spellingAddWord: vi.fn(async () => {}),
  spellingRemoveWord: vi.fn(async () => {}),
}));

const { spellingCheck } = await import('$lib/api/spelling');
const { misspeltIn, spellingPlugin } = await import('./plugin');
const { spelling } = await import('./spelling.svelte');

const views: EditorView[] = [];
afterEach(() => {
  for (const v of views.splice(0)) v.destroy();
  vi.mocked(spellingCheck).mockClear();
});

const { doc, paragraph } = bodySchema.nodes;
const p = (...content: (string | ReturnType<typeof bodySchema.text>)[]) =>
  paragraph.create(
    null,
    content.map((c) => (typeof c === 'string' ? bodySchema.text(c) : c)),
  );

function editor(paragraphs: ReturnType<typeof p>[], ignored: Set<string> = new Set()): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({
      doc: doc.create(null, paragraphs),
      plugins: [spellingPlugin({ language: () => 'en-US', ignored: () => ignored })],
    }),
  });
  views.push(view);
  return view;
}

/** Lets the editor look, the words be asked about, and the answers come. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

describe('spelling in an editor', () => {
  it('underlines the misspelt words, and not those that are right', async () => {
    const view = editor([
      p('The wrath of Achilles is recieved by teh gods.'),
      p('All is right here.'),
    ]);
    await settle();
    expect(misspeltIn(view.state)).toEqual(['recieved', 'teh']);
  });

  it('leaves alone the words that are ignored, and citations that were found', async () => {
    const found = bodySchema.marks.found.create({
      id: 'f1',
      by: 'form',
      items: [],
      mode: 'normal',
    });
    const view = editor(
      [p('The wrath is recieved by teh gods ', bodySchema.text('(Nagy 1979)', [found]), '.')],
      new Set(['teh']),
    );
    await settle();
    expect(misspeltIn(view.state)).toEqual(['recieved']);
  });

  it('looks again only at what a change touched', async () => {
    const view = editor([
      p('The wrath of Achilles is recieved by teh gods.'),
      p('The second is right.'),
      p('And so is the third.'),
    ]);
    await settle();
    vi.mocked(spellingCheck).mockClear();
    const judged = vi.spyOn(spelling, 'judge');
    const end = view.state.doc.child(0).nodeSize + view.state.doc.child(1).nodeSize - 1;
    view.dispatch(view.state.tr.insertText(' Wroth', end));
    await settle();
    const looked = judged.mock.calls.map(([, asked]) => asked);
    judged.mockRestore();
    // The words of the second paragraph, when it changed and again when its
    // new word was answered, and none of the others.
    const second = ['The', 'second', 'is', 'right.', 'Wroth'];
    expect(looked).toEqual([...second, ...second]);
    expect(misspeltIn(view.state)).toEqual(['recieved', 'teh', 'Wroth']);
    // And only the new word was asked about: the others were known.
    expect(vi.mocked(spellingCheck).mock.calls.map(([, words]) => words)).toEqual([['Wroth']]);
  });
});
