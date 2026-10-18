import { afterEach, describe, expect, it } from 'vitest';
import type { FormatSummary, StyleSummary } from '$lib/api/documents';
import { documents } from '$lib/preview/documents.svelte';
import { formatGroups, layoutName, styleGroups, styleName } from './choosing.svelte';

const style = (id: string, kind: string): StyleSummary => ({
  id,
  title: id.toUpperCase(),
  kind,
  own: false,
  bibliography: true,
});
const layout = (id: string, kind: FormatSummary['kind']): FormatSummary => ({
  id,
  name: `Layout ${id}`,
  kind,
  description: '',
  own: false,
  confidence: '',
  checked: '',
});

afterEach(() => {
  documents.styles = [];
  documents.formats = [];
});

describe('the layouts and styles offered', () => {
  it('group the styles by how they cite, in one order whatever order they came in', () => {
    documents.styles = [
      style('odd', ''),
      style('ieee', 'numeric'),
      style('apa', 'author-date'),
      style('chicago', 'note'),
      style('mla', 'author'),
    ];
    const kinds = styleGroups().map(([, styles]) => styles.map((s) => s.id));
    expect(kinds).toEqual([['chicago'], ['apa'], ['ieee'], ['mla'], ['odd']]);
  });

  it('group the layouts by what they are for, the own first, leaving out empty groups', () => {
    documents.formats = [
      layout('novel', 'fiction'),
      layout('mine', 'own'),
      layout('a4', 'general'),
    ];
    expect(formatGroups().map((g) => g.formats.map((f) => f.id))).toEqual([
      ['mine'],
      ['a4'],
      ['novel'],
    ]);
  });

  it('name a layout and a style, or give the id of one not known', () => {
    documents.formats = [layout('a4', 'general')];
    documents.styles = [style('apa', 'author-date')];
    expect(layoutName('a4')).toBe('Layout a4');
    expect(layoutName('gone')).toBe('gone');
    expect(layoutName(undefined)).toBe('');
    expect(styleName('apa')).toBe('APA');
    expect(styleName('gone')).toBe('gone');
  });
});
