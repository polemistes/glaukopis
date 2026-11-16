import { describe, expect, it } from 'vitest';
import guide from '/docs/guide.md?raw';
import { blockHtml, blockText, readMarkdown } from './markdown';

const html = (source: string) =>
  readMarkdown(source)
    .blocks.map((b) => blockHtml(b))
    .join('\n');

describe('the reader of the guide', () => {
  it('reads headings of four levels, and paragraphs with their lines joined', () => {
    expect(html('# A guide\n\nOne line\nand the next.\n\n## The idea\n### A part\n#### Less')).toBe(
      '<h1>A guide</h1>\n<p>One line and the next.</p>\n<h2>The idea</h2>\n<h3>A part</h3>\n<h4>Less</h4>',
    );
  });

  it('reads bold, italics and code, within one another', () => {
    expect(html('Press **Ctrl+D**, *the* **bold *and* italic**, and `x_i *y*`.')).toBe(
      '<p>Press <strong>Ctrl+D</strong>, <em>the</em> <strong>bold <em>and</em> italic</strong>, and <code>x_i *y*</code>.</p>',
    );
  });

  it('takes a sign after a backslash as itself', () => {
    expect(html('A label such as *\\**, and **.\\***.')).toBe(
      '<p>A label such as <em>*</em>, and <strong>.*</strong>.</p>',
    );
  });

  it('takes a star with room after it as a star', () => {
    const read = readMarkdown('A break is * * * where nothing is said.');
    expect(read.problems).toEqual([]);
    expect(blockHtml(read.blocks[0])).toBe('<p>A break is * * * where nothing is said.</p>');
  });

  it('reads points whose lines go on set in, and paragraphs more of a point', () => {
    const read = readMarkdown('- One\n  goes on.\n- Two\n\n  more of two.\n\n- Three\n\nAfter.');
    expect(read.problems).toEqual([]);
    expect(read.blocks.map((b) => blockHtml(b)).join('\n')).toBe(
      '<ul><li>One goes on.</li><li><p>Two</p><p>more of two.</p></li><li>Three</li></ul>\n<p>After.</p>',
    );
  });

  it('reads numbered points, and a number in the middle of a sentence as words', () => {
    expect(html('1. First\n   goes on.\n2. Second')).toBe(
      '<ol><li>First goes on.</li><li>Second</li></ol>',
    );
    expect(html('Out of\n100. A page')).toBe('<p>Out of 100. A page</p>');
  });

  it('reads a table with its row of headings, and leaves out a row of headings with nothing in it', () => {
    expect(html('| To | Do |\n| --- | --- |\n| Add | **Alt+Enter** |\n| A \\| bar | `x` |')).toBe(
      '<div class="table"><table><thead><tr><th>To</th><th>Do</th></tr></thead><tbody>' +
        '<tr><td>Add</td><td><strong>Alt+Enter</strong></td></tr>' +
        '<tr><td>A | bar</td><td><code>x</code></td></tr></tbody></table></div>',
    );
    expect(html('| | |\n| --- | --- |\n| a | b |')).toBe(
      '<div class="table"><table><tbody><tr><td>a</td><td>b</td></tr></tbody></table></div>',
    );
  });

  it('escapes everything, so that no HTML of the guide passes as HTML', () => {
    expect(html('<b>bold</b> & <script>x</script> `<i>`')).toBe(
      '<p>&lt;b&gt;bold&lt;/b&gt; &amp; &lt;script&gt;x&lt;/script&gt; <code>&lt;i&gt;</code></p>',
    );
    expect(html('| <a> |\n| --- |\n| "b" |')).toContain('<th>&lt;a&gt;</th>');
  });

  it('says what it did not understand, and shows it as it is written', () => {
    const read = readMarkdown(
      'A **bold that ends never.\n\nA [link](https://example.org).\n\n```\ncode\n```\n\n> said\n\nWords\n| a | b |',
    );
    expect(read.problems.map((p) => p.what)).toEqual([
      'a ** that is not closed',
      'a link',
      'a fence of code',
      'a fence of code',
      'a quotation',
      'a row of a table outside a table',
    ]);
    expect(blockHtml(read.blocks[0])).toBe('<p>A **bold that ends never.</p>');
  });

  it('gives the words of a block as they are read, for finding in', () => {
    const [table] = readMarkdown('| To | Do |\n| --- | --- |\n| Add | **Alt+Enter** |').blocks;
    expect(blockText(table)).toBe('To Do Add Alt+Enter');
  });

  // The guide and the reader are kept in step: where the guide uses what the
  // reader does not know, the reader must be taught it.
  it('understands the whole of the guide', () => {
    const { problems } = readMarkdown(guide);
    const told = problems.map(
      (p) => `docs/guide.md, line ${p.line}: ${p.what}; the reader of Help must be taught it`,
    );
    expect(told).toEqual([]);
  });
});
