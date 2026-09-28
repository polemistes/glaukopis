import { describe as group, expect, it } from 'vitest';
import { FluentResource } from '@fluent/bundle';
import { languages } from '$lib/i18n';
import {
  add,
  describe,
  formWords,
  initials,
  kind,
  layout,
  macrosUsedBy,
  move,
  nameOption,
  namesIn,
  parse,
  partsOf,
  remove,
  serialise,
  setInitials,
  setNameOption,
  title,
  usesOf,
  variableName,
  variableWords,
} from './csl';

const STYLE = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" page-range-format="chicago">
  <info>
    <title>Test &amp; Trial</title>
    <id>http://www.zotero.org/styles/test</id>
    <category citation-format="author-date"/>
  </info>
  <macro name="author">
    <names variable="author">
      <name name-as-sort-order="first" and="text" sort-separator=", " delimiter=", "/>
      <label form="short" prefix=", "/>
      <substitute>
        <names variable="editor"/>
        <text macro="title"/>
      </substitute>
    </names>
  </macro>
  <macro name="author-short">
    <names variable="author">
      <name form="short" and="symbol" delimiter=", "/>
    </names>
  </macro>
  <macro name="title">
    <choose>
      <if type="book thesis" match="any">
        <text variable="title" font-style="italic"/>
      </if>
      <else-if variable="container-title">
        <text variable="title" quotes="true"/>
      </else-if>
      <else>
        <text variable="title"/>
      </else>
    </choose>
  </macro>
  <macro name="unused"><text value="never"/></macro>
  <citation et-al-min="4" et-al-use-first="1" disambiguate-add-year-suffix="true">
    <layout prefix="(" suffix=")" delimiter="; ">
      <group delimiter=", ">
        <group delimiter=" ">
          <text macro="author-short"/>
          <date variable="issued"><date-part name="year"/></date>
        </group>
        <text variable="locator"/>
      </group>
    </layout>
  </citation>
  <bibliography hanging-indent="true" et-al-min="11" et-al-use-first="7">
    <sort><key macro="author"/><key variable="issued"/></sort>
    <layout suffix=".">
      <group delimiter=". ">
        <text macro="author"/>
        <date variable="issued"><date-part name="year"/></date>
        <text macro="title"/>
        <text variable="publisher"/>
      </group>
    </layout>
  </bibliography>
</style>`;

group('reading a style', () => {
  it('knows what it is', () => {
    const s = parse(STYLE);
    expect(title(s)).toBe('Test & Trial');
    expect(kind(s)).toBe('author-date');
  });

  it('refuses what is not a style', () => {
    expect(() => parse('<style')).toThrow();
    expect(() => parse('<html/>')).toThrow(/not a style/);
    expect(() =>
      parse('<style xmlns="http://purl.org/net/xbiblio/csl"><info><title>X</title></info></style>'),
    ).toThrow(/only names another/);
  });

  it('follows the macros a citation and a bibliography use', () => {
    const s = parse(STYLE);
    const cite = macrosUsedBy(s, s.root.querySelector('citation')!).map((m) =>
      m.getAttribute('name'),
    );
    expect(cite).toEqual(['author-short']);
    const bib = macrosUsedBy(s, s.root.querySelector('bibliography')!).map((m) =>
      m.getAttribute('name'),
    );
    expect(bib).toEqual(['author', 'title']);
    expect(usesOf(s, 'title')).toBe(2);
    expect(usesOf(s, 'unused')).toBe(0);
  });

  it('survives being written and read again', () => {
    const s = parse(STYLE);
    const again = parse(serialise(s));
    expect(title(again)).toBe('Test & Trial');
    expect(serialise(again)).toBe(serialise(s));
    expect(serialise(s)).toContain('xmlns="http://purl.org/net/xbiblio/csl"');
  });
});

group('the options of names', () => {
  it('are read from the names that say so, or from what is handed down', () => {
    const s = parse(STYLE);
    expect(namesIn(s, 'citation')).toHaveLength(1);
    expect(namesIn(s, 'bibliography')).toHaveLength(1);
    expect(nameOption(s, 'citation', 'and')).toBe('symbol');
    expect(nameOption(s, 'bibliography', 'and')).toBe('text');
    expect(nameOption(s, 'citation', 'et-al-min')).toBe('4');
    expect(nameOption(s, 'bibliography', 'et-al-min')).toBe('11');
    expect(nameOption(s, 'citation', 'initialize-with')).toBeNull();
  });

  it('are set where they take effect, and only there', () => {
    const s = parse(STYLE);
    setNameOption(s, 'bibliography', 'and', 'symbol');
    setNameOption(s, 'bibliography', 'initialize-with', '. ');
    setNameOption(s, 'citation', 'et-al-min', '3');
    expect(nameOption(s, 'bibliography', 'and')).toBe('symbol');
    expect(s.root.querySelector('macro[name="author"] name')!.getAttribute('and')).toBe('symbol');
    expect(s.root.querySelector('bibliography')!.getAttribute('initialize-with')).toBe('. ');
    // The citation is as it was, but for what was asked.
    expect(s.root.querySelector('macro[name="author-short"] name')!.getAttribute('and')).toBe(
      'symbol',
    );
    expect(nameOption(s, 'citation', 'initialize-with')).toBeNull();
    expect(nameOption(s, 'citation', 'et-al-min')).toBe('3');

    setNameOption(s, 'bibliography', 'and', null);
    expect(nameOption(s, 'bibliography', 'and')).toBeNull();
    expect(nameOption(s, 'citation', 'and')).toBe('symbol');
  });

  it('leave the citations alone when a name serves them and the bibliography both', () => {
    // One macro for both, whose name says that names are never shortened.
    const shared = STYLE.replace('<text macro="author-short"/>', '<text macro="author"/>')
      .replace(
        '<name name-as-sort-order="first"',
        '<name initialize="false" name-as-sort-order="first"',
      )
      .replace(
        'version="1.0" page-range-format',
        'version="1.0" initialize-with=". " page-range-format',
      );
    const s = parse(shared);
    expect(initials(s, 'citation')).toBe('full');
    expect(initials(s, 'bibliography')).toBe('full');

    setInitials(s, 'bibliography', 'spaced');
    expect(initials(s, 'bibliography')).toBe('spaced');
    expect(initials(s, 'citation')).toBe('full');
    expect(s.root.querySelector('macro[name="author"] name')!.hasAttribute('initialize')).toBe(
      false,
    );
    expect(s.root.querySelector('citation')!.getAttribute('initialize')).toBe('false');
    expect(s.root.querySelector('bibliography')!.getAttribute('initialize')).toBe('true');

    setInitials(s, 'bibliography', 'full');
    expect(initials(s, 'bibliography')).toBe('full');
    setInitials(s, 'citation', 'bare');
    expect(initials(s, 'citation')).toBe('bare');
    expect(initials(s, 'bibliography')).toBe('full');
  });
});

group('the parts of a style', () => {
  it('are told in words', () => {
    const s = parse(STYLE);
    const l = layout(s, 'bibliography')!;
    expect(describe(l)).toBe('The whole');
    const group = partsOf(s, l)[0];
    const parts = partsOf(s, group);
    expect(parts.map(describe)).toEqual(['“author”', 'The date', '“title”', 'The publisher']);

    const choose = partsOf(s, parts[2])[0];
    expect(partsOf(s, choose).map(describe)).toEqual([
      'If the work is a book or a thesis',
      'Or else, if it has title of the journal or book',
      'Otherwise',
    ]);
    const italic = partsOf(s, partsOf(s, choose)[0])[0];
    expect(describe(italic)).toBe('The title');
    expect(formWords(italic)).toBe('italic');
    expect(formWords(l)).toBe('before “.”');
    expect(formWords(group)).toBe('with “. ” between');
  });

  it('describe conditions of position', () => {
    const s = parse(
      STYLE.replace(
        '<text variable="locator"/>',
        '<choose><if position="ibid-with-locator"><text term="ibid"/></if><else-if position="subsequent" variable="volume"><text value="again"/></else-if></choose>',
      ),
    );
    const found = Array.from(s.root.querySelectorAll('citation if, citation else-if')).map(
      describe,
    );
    expect(found).toEqual([
      'If it is the same as the citation before, at another place',
      'Or else, if it has volume and it has been cited before',
    ]);
    expect(describe(s.root.querySelector('citation text[term]')!)).toBe('The word for “ibid”');
    expect(describe(s.root.querySelector('citation text[value]')!)).toBe('The words “again”');
  });

  it('can be moved, removed and added to', () => {
    const s = parse(STYLE);
    const group = partsOf(s, layout(s, 'bibliography')!)[0];
    const [author, date, titleCall, publisher] = partsOf(s, group);

    expect(move(date, -1)).toBe(true);
    expect(move(date, -1)).toBe(false);
    expect(partsOf(s, group).map(describe)).toEqual([
      'The date',
      '“author”',
      '“title”',
      'The publisher',
    ]);
    expect(move(publisher, 1)).toBe(false);

    expect(remove(publisher)).toBe(true);
    const place = add(s, titleCall, { kind: 'variable', name: 'publisher-place' }, false);
    place.setAttribute('suffix', ':');
    add(s, group, { kind: 'value', text: 'Print' }, true);
    expect(partsOf(s, group).map(describe)).toEqual([
      'The date',
      '“author”',
      '“title”',
      'The place of publication',
      'The words “Print”',
    ]);
    expect(remove(layout(s, 'bibliography')!)).toBe(false);

    // Within a choice, the first and the last stay where they are.
    const choose = partsOf(s, titleCall)[0];
    const [first, second, last] = partsOf(s, choose);
    expect(move(second, -1)).toBe(false);
    expect(move(second, 1)).toBe(false);
    expect(remove(first)).toBe(false);
    expect(remove(second)).toBe(true);
    expect(remove(last)).toBe(true);
    void author;

    const out = serialise(s);
    expect(() => parse(out)).not.toThrow();
    expect(out).toContain('<text variable="publisher-place" suffix=":"/>');
  });
});

group('the words for a style', () => {
  const CONDITIONS = STYLE.replace(
    '<text variable="locator"/>',
    '<choose><if type="book chapter thesis" match="any"><text variable="title"/></if>' +
      '<else-if variable="title editor" match="none"><text value="x"/></else-if>' +
      '<else-if locator="page chapter" is-numeric="volume"><text value="y"/></else-if></choose>',
  );
  const conditions = (s: ReturnType<typeof parse>) =>
    Array.from(s.root.querySelectorAll('citation if, citation else-if')).map(describe);

  /** What is said while the interface is in a language. */
  function saidIn<T>(tag: string, say: () => T): T {
    languages.current = tag;
    try {
      return say();
    } finally {
      languages.current = 'en';
    }
  }

  it('join what is said of a condition as the language does', () => {
    const s = parse(CONDITIONS);
    expect(conditions(s)).toEqual([
      'If the work is a book, a chapter or a thesis',
      'Or else, if it has no title and editor',
      'Or else, if the volume is a number and the place cited is a page or a chapter',
    ]);
    expect(saidIn('nb', () => conditions(s))).toEqual([
      'Hvis verket er en bok, et kapittel eller en avhandling',
      'Ellers, hvis det mangler tittel og redaktør',
      'Ellers, hvis bindet er et tall og det vises til en side eller et kapittel',
    ]);
  });

  it('are in the language of the interface', () => {
    const s = parse(STYLE);
    const l = layout(s, 'bibliography')!;
    const parts = partsOf(s, partsOf(s, l)[0]);
    expect(saidIn('nb', () => parts.map(describe))).toEqual([
      '«author»',
      'Datoen',
      '«title»',
      'Forlaget',
    ]);
    expect(saidIn('nb', () => formWords(l))).toBe('foran «.»');
    expect(variableWords('author editor')).toBe('the author, or else the editor');
    expect(saidIn('nb', () => variableWords('author editor'))).toBe(
      'forfatteren, ellers redaktøren',
    );
    expect(variableName('container-title')).toBe('title of the journal or book');
    expect(saidIn('nb', () => variableName('container-title'))).toBe(
      'tittel på tidsskrift eller bok',
    );
    // What has no words is shown by its name.
    expect(variableWords('no-such')).toBe('“no-such”');
    expect(variableName('no-such')).toBe('no-such');
  });

  it('name every variable with its article and without it, in every language', () => {
    const files = import.meta.glob('/locales/*/style.ftl', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(1);
    for (const [path, text] of Object.entries(files)) {
      const variables = new FluentResource(text).body.filter((m) =>
        m.id.startsWith('style-variable-'),
      );
      expect(variables.length, path).toBeGreaterThan(50);
      const lacking = variables.filter((m) => !m.attributes.bare).map((m) => m.id);
      expect(lacking, path).toEqual([]);
    }
  });
});
