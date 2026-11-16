import { describe, expect, it } from 'vitest';
import { markWords, unmark } from './marks';

const drawn = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};

describe('the words found, marked in the chapter', () => {
  it('marks each word at the beginning of a word, through the marks of the text', () => {
    const root = drawn('<p>The <strong>plugin</strong> for Firefox, and plugins; unplugged.</p>');
    const marks = markWords(root, ['plugin', 'firefox']);
    expect(marks.map((m) => m.textContent)).toEqual(['plugin', 'Firefox', 'plugin']);
    expect(root.innerHTML).toBe(
      '<p>The <strong><mark data-help-mark="">plugin</mark></strong> for <mark data-help-mark="">Firefox</mark>, and <mark data-help-mark="">plugin</mark>s; unplugged.</p>',
    );
  });

  it('takes the marks out again, leaving the text as it was drawn', () => {
    const html = '<p>Pelée and <em>Pelee</em>.</p>';
    const root = drawn(html);
    markWords(root, ['pelee']);
    expect(root.querySelectorAll('mark')).toHaveLength(2);
    unmark(root);
    expect(root.innerHTML).toBe(html);
    expect(root.querySelector('p')!.childNodes).toHaveLength(3);
  });

  it('marks nothing where there are no words', () => {
    const root = drawn('<p>Words</p>');
    expect(markWords(root, [])).toEqual([]);
    expect(root.innerHTML).toBe('<p>Words</p>');
  });
});
