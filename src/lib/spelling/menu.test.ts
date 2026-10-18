import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { describe, expect, it, vi } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { languageName, t } from '$lib/i18n';
import type { Why } from './plugin';

// The language `zz` has a dictionary that cannot be read; `xx` has none.
// What "broken" may be cannot be looked up.
vi.mock('$lib/api/spelling', () => ({
  spellingPrepare: vi.fn(async (language: string | null) => {
    if (language === 'zz') throw new Error('the dictionary zz_ZZ.aff is not a dictionary');
    if (language === 'xx') return null;
    return {
      dictionaries: [{ tag: 'en-US', name: 'en_US', source: 'application', dir: '' }],
      script: 'Latn',
      words: 'en',
    };
  }),
  spellingCheck: vi.fn(async (_language: string | null, words: string[]) => words.map(() => true)),
  spellingSuggest: vi.fn(async (_language: string | null, word: string) => {
    if (word === 'broken') throw new Error('the suggester failed');
    return [];
  }),
  spellingAddWord: vi.fn(async () => {}),
  spellingRemoveWord: vi.fn(async () => {}),
}));

const { spelling } = await import('./spelling.svelte');
const { openWhyMenu, openWordMenu } = await import('./menu');
const { spellingPlugin } = await import('./plugin');
const { menuState } = await import('$lib/ui/menu.svelte');

const anchor = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
const labels = () => (menuState.current?.items ?? []).map((i) => ('label' in i ? i.label : '-'));

/** Why F7 finds nothing in a text of a language. */
async function whyIn(language: string): Promise<Why> {
  await spelling.prepare(language);
  let said: Why | null = null;
  const { doc, paragraph } = bodySchema.nodes;
  const view = new EditorView(document.body.appendChild(document.createElement('div')), {
    state: EditorState.create({
      doc: doc.create(null, [paragraph.create(null, [bodySchema.text('Sing')])]),
      plugins: [
        spellingPlugin({
          language: () => language,
          ignored: () => new Set(),
          none: (_view, why) => (said = why),
        }),
      ],
    }),
  });
  view.someProp('handleKeyDown', (f) => f(view, new KeyboardEvent('keydown', { key: 'F7' })));
  view.destroy();
  return said!;
}

describe('a dictionary that cannot be read', () => {
  it('is not said to be none: F7 says it could not be read, and why, and the log has it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await spelling.prepare('zz')).toBeNull();
    expect(spelling.failed.get('zz')).toBe('the dictionary zz_ZZ.aff is not a dictionary');
    expect(error).toHaveBeenCalled();
    expect(await whyIn('zz')).toBe('failed');
    expect(await whyIn('xx')).toBe('no-dictionary');

    openWhyMenu(anchor, 'failed', 'zz');
    expect(labels()).toEqual([
      t('spelling-failed', { language: languageName('zz') }),
      'the dictionary zz_ZZ.aff is not a dictionary',
    ]);
    menuState.close();
    error.mockRestore();
  });
});

describe('what a word may be', () => {
  it('that could not be looked up is said so, not that there is nothing like it, and logged', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await openWordMenu({
      language: 'en',
      word: 'broken',
      anchor,
      replace: () => {},
      project: null,
    });
    expect(labels()[0]).toBe(t('spelling-suggest-failed'));
    expect(error).toHaveBeenCalledWith(
      'spelling: what "broken" may be could not be looked up',
      expect.any(Error),
    );
    menuState.close();

    await openWordMenu({ language: 'en', word: 'whole', anchor, replace: () => {}, project: null });
    expect(labels()[0]).toBe(t('spelling-no-suggestions'));
    menuState.close();
    error.mockRestore();
  });
});
