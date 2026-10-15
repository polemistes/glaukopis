import { describe, expect, it } from 'vitest';
import { CREDIT_GROUPS, isKey } from './credits';

import english from '/locales/en/credits.ftl?raw';

/** The names of the messages of the English credits.ftl. */
const messages = new Set(
  english
    .split('\n')
    .filter((line) => /^[a-z]/.test(line) && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim()),
);

describe('the credits', () => {
  it('come in the order the brief gives, each group with a heading', () => {
    expect(CREDIT_GROUPS.map((g) => g.id)).toEqual([
      'built-on',
      'copied',
      'fonts',
      'data',
      'programs',
      'icons',
      'owl',
    ]);
    for (const group of CREDIT_GROUPS) {
      expect(messages, group.id).toContain(`credits-group-${group.id}`);
      expect(group.credits.length, group.id).toBeGreaterThan(0);
    }
  });

  it('say what each is in words that are there, with a licence and a link', () => {
    for (const credit of CREDIT_GROUPS.flatMap((g) => g.credits)) {
      for (const words of [credit.name, credit.what])
        if (isKey(words)) expect(messages, credit.name).toContain(words);
      expect(credit.licence.trim(), credit.name).not.toBe('');
      expect(credit.url, credit.name).toMatch(/^https?:\/\/\S+$/);
    }
  });

  it('name each project once', () => {
    const names = CREDIT_GROUPS.flatMap((g) => g.credits.map((c) => c.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('use every word of what a credit is that credits.ftl has', () => {
    const used = new Set(CREDIT_GROUPS.flatMap((g) => g.credits.flatMap((c) => [c.name, c.what])));
    const unused = [...messages].filter((m) => /^credits-(what|name)-/.test(m) && !used.has(m));
    expect(unused).toEqual([]);
  });
});
