import { describe, expect, it } from 'vitest';
import { FluentResource } from '@fluent/bundle';
import { documentWord, languages, load, names, nearest, t, term } from './i18n.svelte';

/** Every Fluent file, by its path. */
const allFiles = import.meta.glob('/locales/*/*.ftl', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * The languages that must have every message: English, the source, and the
 * Norwegian of the application's author. The others may lack messages, which
 * are then said in English, but may have nothing wrong.
 */
const COMPLETE = ['en', 'nb'];
/** The languages whose words of documents must all be there. */
const COMPLETE_DOCUMENTS = ['en', 'nb', 'nn'];

/** The messages of a language, those of documents apart, each with the variables it uses. */
function catalogue(tag: string, document: boolean): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const [path, text] of Object.entries(allFiles)) {
    const m = /\/locales\/([^/]+)\/([^/]+)\.ftl$/.exec(path);
    if (!m || m[1] !== tag || (m[2] === 'document') !== document) continue;
    let current: Set<string> | null = null;
    for (const line of text.split('\n')) {
      if (/^[a-zA-Z]/.test(line) && line.includes('=')) {
        const id = line.slice(0, line.indexOf('=')).trim();
        expect(out.has(id), `${id} is given twice in ${tag}`).toBe(false);
        current = new Set();
        out.set(id, current);
      }
      // What a comment says of a variable is not a variable.
      if (current && !line.startsWith('#'))
        for (const v of line.matchAll(/\$([a-zA-Z][\w-]*)/g)) current.add(v[1]);
    }
  }
  return out;
}

function languagesOf(document: boolean): string[] {
  const tags = new Set<string>();
  for (const path of Object.keys(allFiles)) {
    const m = /\/locales\/([^/]+)\/([^/]+)\.ftl$/.exec(path);
    if (m && (m[2] === 'document') === document) tags.add(m[1]);
  }
  return [...tags];
}

/** The code of the interface, by its path. */
const sources = import.meta.glob(['/src/**/*.ts', '/src/**/*.svelte', '!/src/**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('the words of the interface', () => {
  it('are read without fault', () => {
    for (const [path, text] of Object.entries(allFiles)) {
      const resource = new FluentResource(text);
      // A fault is kept as a Junk entry; the names that were read are all that count.
      const read = resource.body.map((e) => e.id);
      expect(read.length, path).toBe(names(text).length);
    }
  });

  it('are all there in the languages that are complete, and nowhere wrong', () => {
    const english = catalogue('en', false);
    expect(english.size).toBeGreaterThan(0);
    for (const tag of languagesOf(false).filter((l) => l !== 'en')) {
      const other = catalogue(tag, false);
      if (COMPLETE.includes(tag)) {
        const lacking = [...english.keys()].filter((id) => !other.has(id));
        expect(lacking, `${tag} lacks`).toEqual([]);
      }
      const extra = [...other.keys()].filter((id) => !english.has(id));
      expect(extra, `${tag} has what English has not`).toEqual([]);
      for (const [id, vars] of other) {
        expect([...vars].sort(), `${tag}: ${id}`).toEqual([...english.get(id)!].sort());
      }
    }
    const words = [...catalogue('en', true).keys()].sort();
    for (const tag of languagesOf(true)) {
      const theirs = [...catalogue(tag, true).keys()].sort();
      if (COMPLETE_DOCUMENTS.includes(tag)) expect(theirs, tag).toEqual(words);
      else
        expect(
          theirs.filter((id) => !words.includes(id)),
          `${tag} has what English has not`,
        ).toEqual([]);
    }
  });

  it('are there for every name the code says something by', () => {
    const english = catalogue('en', false);
    const missing: string[] = [];
    let seen = 0;
    for (const [file, text] of Object.entries(sources)) {
      if (file.startsWith('/src/lib/i18n/')) continue;
      for (const m of text.matchAll(/(?<![\w.$])t\(\s*['"`]([a-z][\w.-]*)['"`]/g)) {
        seen++;
        const id = m[1].split('.')[0];
        if (!english.has(id)) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
    expect(seen).toBeGreaterThan(0);
  });
});

describe('the language of the interface', () => {
  it('is said in, once loaded, and English where a translation lacks', async () => {
    languages.current = 'en';
    const english = t('shell-projects');
    await load('nb');
    languages.current = 'nb';
    const norwegian = t('shell-projects');
    languages.current = 'en';
    expect(english).toBe('Projects');
    expect(norwegian).toBe('Prosjekter');
    expect(t('no-such-message')).toBe('no-such-message');
  });

  it('is the nearest to what the system says', () => {
    const portuguese = ['pt-PT', 'pt-BR'];
    expect(nearest('pt-BR', portuguese)).toBe('pt-BR');
    expect(nearest('pt_PT.UTF-8', portuguese)).toBe('pt-PT');
    expect(nearest('pt', portuguese)).toBe('pt-PT');
    expect(nearest('pt-AO', portuguese)).toBe('pt-PT');
    const chinese = ['zh-Hans', 'zh-Hant'];
    expect(nearest('zh-TW', chinese)).toBe('zh-Hant');
    expect(nearest('zh_CN.UTF-8', chinese)).toBe('zh-Hans');
    expect(nearest('zh-Hant-HK', chinese)).toBe('zh-Hant');
    expect(nearest('zh', chinese)).toBe('zh-Hans');
    const serbian = ['sr-Cyrl', 'sr-Latn'];
    expect(nearest('sr_RS@latin', serbian)).toBe('sr-Latn');
    expect(nearest('sr-Latn-RS', serbian)).toBe('sr-Latn');
    expect(nearest('sr', serbian)).toBe('sr-Cyrl');
    const norwegian = ['en', 'nb', 'nn', 'de'];
    expect(nearest('no', norwegian)).toBe('nb');
    expect(nearest('nn-NO', norwegian)).toBe('nn');
    expect(nearest('nb_NO.UTF-8', norwegian)).toBe('nb');
    expect(nearest('de-AT', norwegian)).toBe('de');
    expect(nearest('en-GB', norwegian)).toBe('en');
    expect(nearest('fr', norwegian)).toBe(null);
    expect(nearest('', norwegian)).toBe(null);
  });
});

describe('the words of documents', () => {
  it('are in the language of the document', () => {
    expect(term('nb-NO', 'document-figure')).toBe('Figur');
    expect(term('xx', 'document-figure')).toBe(null);
    expect(documentWord('nb', 'Figure')).toBe('Figur');
    expect(documentWord('nb', 'NOTES')).toBe('NOTER');
    expect(documentWord('nb', 'fig.')).toBe('fig.');
    expect(documentWord('nn', 'Tables')).toBe('Tabellar');
    expect(documentWord('nb', 'Abbildung')).toBe('Abbildung');
    expect(documentWord(undefined, 'Figure')).toBe('Figure');
    expect(documentWord('xx', 'Figure')).toBe('Figure');
  });
});
