import { describe, expect, it } from 'vitest';
import { writeBody } from '$lib/project/model/blocks';
import { Project } from '$lib/project/model/project.svelte';
import { apply, dedent, fault, indent, readFile } from './fluent';
import { changesIn, elementText, fillWords, projectWords, wordsIn, written } from './project';

const sources = import.meta.glob('/locales/*/*.ftl', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const filesOf = (tag: string) =>
  new Map(
    Object.entries(sources)
      .filter(([path]) => path.startsWith(`/locales/${tag}/`))
      .map(([path, text]): [string, string] => [path.slice(path.lastIndexOf('/') + 1), text])
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const plural = `{ $count ->
    [one] One is found
   *[other] { $count } are found
}`;

describe('the words of a Fluent file', () => {
  it('are read by their parts, without the indentation of their lines, and written with it', () => {
    const text = `# What it is.\nsearch-found = ${plural}\nfield-a = A\n    .hint = The hint\n`;
    const read = readFile(text);
    expect([...read.parts.keys()]).toEqual(['search-found', 'field-a', 'field-a.hint']);
    expect(read.parts.get('field-a.hint')?.text).toBe('The hint');
    expect(read.messages[0].comment).toBe('What it is.');
    expect(indent(dedent(plural), 0)).toBe(plural);
  });

  it('are refused where they lose a variable, a plural form, or are no good Fluent', () => {
    expect(fault('nb', 'Fant { $count }', 'Found { $count }')).toBeNull();
    expect(fault('nb', 'Fant noen', 'Found { $count }')?.kind).toBe('variables');
    expect(fault('nb', '{ $count ->\n    [few] få\n   *[other] mange\n}', plural)?.kind).toBe(
      'plurals',
    );
    expect(fault('nb', 'Fant { $count', 'Found { $count }')?.kind).toBe('fluent');
    expect(fault('nb', 'Fant\n.dette = galt', 'Found')?.kind).toBe('fluent');
    expect(fault('ru', '{ $count ->\n    [one] один\n   *[other] много\n}', plural)?.kind).toBe(
      'plurals',
    );
  });

  it('are put back where they were changed, and nowhere else', () => {
    const english = new Map([
      ['a.ftl', `# The file.\n\nx-one = One\nx-two = Two\n    .hint = A hint\nx-three = Three\n`],
    ]);
    const own = new Map([['a.ftl', `# The file.\n\nx-one = En\nx-three = Tre\n`]]);
    const done = apply('nb', english, own, [
      { file: 'a.ftl', key: 'x-one', text: 'Én', was: 'En' },
      { file: 'a.ftl', key: 'x-two', text: 'To', was: '' },
      { file: 'a.ftl', key: 'x-two.hint', text: 'Et hint', was: '' },
      { file: 'a.ftl', key: 'x-three', text: 'Tre!', was: 'Three' },
      { file: 'a.ftl', key: 'x-nothing', text: 'Ingen', was: '' },
    ]);
    expect(done.files.get('a.ftl')).toBe(
      `# The file.\n\nx-one = Én\nx-two = To\n    .hint = Et hint\nx-three = Tre\n`,
    );
    expect(done.conflicts.map((c) => c.key)).toEqual(['x-three']);
    expect(done.refused.map((r) => r.change.key)).toEqual(['x-nothing']);
  });

  it('make a file the language lacks, beginning as the English begins', () => {
    const english = new Map([
      ['b.ftl', `# The head.\n# Of the file.\n\n## A group\n\nb-one = One\n`],
    ]);
    const done = apply('nb', english, new Map(), [
      { file: 'b.ftl', key: 'b-one', text: 'En', was: '' },
    ]);
    expect(done.files.get('b.ftl')).toBe(
      `# The head.\n# Of the file.\n\n## A group\n\nb-one = En\n`,
    );
  });
});

describe('a project of the words of a language', () => {
  it('holds a map for each file and an element for each part, with the English quoted', () => {
    const p = new Project(null);
    p.createMap('first');
    const english = new Map([
      ['a.ftl', `# Say it.\na-one = { $count } found\n    .hint = A hint\n`],
    ]);
    const own = new Map([['a.ftl', `a-one = { $count } funnet\n`]]);
    expect(fillWords(p, 'nb', english, own)).toBe(2);
    expect(projectWords(p)).toEqual({ language: 'nb' });
    expect(p.maps.map((m) => m.name)).toEqual(['a']);
    expect(p.language).toBe('nb');
    const tree = p.tree(p.maps[0].id);
    const [one, hint] = tree.children.get(tree.root!)!;
    expect(p.node(one)?.title).toBe('a-one');
    expect(p.node(hint)?.title).toBe('a-one.hint');
    const blocks = p.blocksOf(one);
    expect(blocks[0].kind).toBe('blockquote');
    expect(wordsIn(blocks)).toBe('{ $count } funnet');
    expect(wordsIn(p.blocksOf(hint))).toBe('');
    expect(changesIn(p)).toEqual([]);
  });

  it('says what was changed in it, and forgets it once written out', () => {
    const p = new Project(null);
    fillWords(
      p,
      'nb',
      new Map([['a.ftl', `a-one = One\na-two = Two\n`]]),
      new Map([['a.ftl', `a-one = En\na-two = To\n`]]),
    );
    const tree = p.tree(p.maps[0].id);
    const [one] = tree.children.get(tree.root!)!;
    const fragment = p.fragment(one, 'body')!;
    fragment.delete(0, fragment.length);
    writeBody(fragment, elementText('One', '', 'Én\nlinje', 'nb'));
    expect(changesIn(p)).toEqual([{ file: 'a.ftl', key: 'a-one', text: 'Én\nlinje', was: 'En' }]);
    written(p, changesIn(p));
    expect(changesIn(p)).toEqual([]);
    // Undoing the change to the text makes it a change again, against what
    // was written out, which itself is not undone.
    p.undo();
    expect(changesIn(p).map((c) => c.was)).toEqual(['Én\nlinje']);
  });

  it('can hold all the words of Bokmål, and gives them back unchanged', () => {
    const p = new Project(null);
    const english = filesOf('en');
    const own = filesOf('nb');
    const started = performance.now();
    const count = fillWords(p, 'nb', english, own);
    const took = performance.now() - started;
    expect(count).toBeGreaterThan(3000);
    expect(changesIn(p)).toEqual([]);
    expect(took).toBeLessThan(60000);
    console.log(`${count} parts in ${Math.round(took)} ms`);
  }, 120000);
});
