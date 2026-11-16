import { describe, expect, it } from 'vitest';
import source from '/docs/guide.md?raw';
import type { FileSide, MapSide } from '$lib/project/sides.svelte';
import { partByTitle, readGuide } from './guide';
import { HEADINGS, headingFor } from './where';

const map = (mode: MapSide['mode']): MapSide => ({
  kind: 'map',
  key: 'k',
  project: 'p',
  at: null,
  mode,
  outline: false,
});
const file: FileSide = { kind: 'file', key: 'f', project: 'p', own: null };

describe('where Help opens', () => {
  it('opens at the part about the view the router names', () => {
    expect(headingFor({ view: 'home' }, undefined)).toBe('A first project');
    expect(headingFor({ view: 'library' }, undefined)).toBe('The library');
    expect(headingFor({ view: 'files' }, undefined)).toBe('The files of the library');
    expect(headingFor({ view: 'notebook' }, map('text'))).toBe('The notebook');
  });

  it('opens in a project at the part about what the side that has the focus shows', () => {
    const project = { view: 'project', project: 'p' } as const;
    expect(headingFor(project, map('diagram'))).toBe('The diagram');
    expect(headingFor(project, map('text'))).toBe('The text');
    expect(headingFor(project, map('timeline'))).toBe('Timelines');
    expect(headingFor(project, file)).toBe('A file in a view');
    expect(headingFor({ view: 'file', file: 'x' }, file)).toBe('A file in a view');
    expect(headingFor({ view: 'file', file: 'x' }, undefined)).toBe('A file in a view');
  });

  it('guesses nothing where the place does not say', () => {
    expect(headingFor({ view: 'project', project: 'p' }, undefined)).toBeNull();
    expect(headingFor({ view: 'project', project: 'p', mode: 'text' }, undefined)).toBe('The text');
  });

  it('names only headings that are in the guide', () => {
    const guide = readGuide(source);
    for (const heading of Object.values(HEADINGS))
      expect(partByTitle(guide, heading), heading).not.toBeNull();
  });
});
