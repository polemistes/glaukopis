import { describe, expect, it } from 'vitest';
import type { Template } from '$lib/api/templates';
import { asOwn, idFromName } from './templates';

const journal: Template = {
  id: 'journal-article',
  name: 'Journal article',
  group: 'article',
  description: '',
  source: { name: 'A journal', url: '', checked: '2026-10-11', confidence: 'high', notes: '' },
  basedOn: 'plain',
  layout: 'manuscript',
  contents: [{ part: 'title-page' }, { kind: 'abstract' }, { part: 'body' }],
  kinds: ['abstract'],
  passageKinds: [],
  requirements: { words: 8000, abstractWords: 250, keywords: 6, anonymous: true, note: '' },
  outputs: [{ id: 'document', targets: ['pdf', 'docx'] }],
};

describe('the id of a template of one’s own', () => {
  it('is made of the letters and digits of the name', () => {
    expect(idFromName('My Journal, 2nd try')).toBe('my-journal-2nd-try');
    expect(idFromName('  Épître à Søren  ')).toBe('epitre-a-soren');
    expect(idFromName('!!!')).toBe('template');
  });

  it('is not one that is taken', () => {
    expect(idFromName('Plain', ['plain'])).toBe('plain-2');
    expect(idFromName('Plain', ['plain', 'plain-2'])).toBe('plain-3');
  });
});

describe('a template made one’s own', () => {
  it('takes a new id, the group of one’s own, and says what it was made from', () => {
    const own = asOwn(journal, 'Journal article, changed', ['journal-article']);
    expect(own.id).toBe('journal-article-changed');
    expect(own.group).toBe('own');
    expect(own.basedOn).toBe('journal-article');
    expect(own.name).toBe('Journal article, changed');
    // What it was made from is left as it was.
    expect(journal.group).toBe('article');
    expect(own.contents).toEqual(journal.contents);
  });

  it('keeps the id of one that is one’s own already', () => {
    const own = asOwn({ ...journal, id: 'mine', group: 'own', basedOn: 'journal-article' }, 'Mine');
    expect(own.id).toBe('mine');
    expect(own.basedOn).toBe('journal-article');
    expect(own.name).toBe('Mine');
  });

  it('makes a fresh one of one’s own when asked, with a new id', () => {
    const mine = { ...journal, id: 'mine', group: 'own' as const, basedOn: 'journal-article' };
    const fresh = asOwn(mine, 'Mine too', ['mine'], true);
    expect(fresh.id).toBe('mine-too');
    expect(fresh.basedOn).toBe('mine');
  });

  it('keeps the name where none is given', () => {
    expect(asOwn(journal, '   ').name).toBe('Journal article');
  });
});
