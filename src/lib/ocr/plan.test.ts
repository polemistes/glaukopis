import { describe, expect, it } from 'vitest';
import type { Verdict } from '$lib/api/ocr';
import {
  askedOf,
  counted,
  decided,
  firstPlan,
  runsOf,
  sameAcross,
  sameSettings,
  settingsAt,
  withSettings,
  withSource,
  withWhole,
  wholeOf,
  type PageSettings,
} from './plan';

const eng: PageSettings = { languages: ['eng'], dpi: 0, layout: '', contrast: false };
const grc: PageSettings = { languages: ['grc', 'eng'], dpi: 400, layout: 'column', contrast: true };
/** Five pages: two with sound text, one poor, two with none. */
const verdicts: Verdict[] = ['sound', 'poor', 'none', 'sound', 'none'];

const sources = (plan: { source: string }[]) => plan.map((p) => p.source);

describe('the plan of the pages at first', () => {
  it('gives every page that has text the source asked, and reads the rest', () => {
    expect(sources(firstPlan(verdicts, eng, 'pdf'))).toEqual(['pdf', 'pdf', 'read', 'pdf', 'read']);
    expect(sources(firstPlan(verdicts, eng, 'read'))).toEqual([
      'read',
      'read',
      'read',
      'read',
      'read',
    ]);
  });

  it('gives every page the settings, each its own list of languages', () => {
    const plan = firstPlan(verdicts, eng, 'pdf');
    expect(plan[0]).toEqual({ ...eng, source: 'pdf' });
    plan[0].languages.push('deu');
    expect(plan[1].languages).toEqual(['eng']);
    expect(eng.languages).toEqual(['eng']);
  });

  it('is empty for a picture, which has no verdicts', () => {
    expect(firstPlan([], eng, 'pdf')).toEqual([]);
  });
});

describe('settings laid on pages', () => {
  it('hold for the pages given and no others', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [2, 3], { languages: ['nor'] });
    expect(plan.map((p) => p.languages)).toEqual([['eng'], ['nor'], ['nor'], ['eng'], ['eng']]);
    // The source and the other settings stay.
    expect(plan[1]).toEqual({ ...eng, languages: ['nor'], source: 'pdf' });
  });

  it('hold for every page where none are given', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [], { dpi: 600, contrast: true });
    expect(plan.every((p) => p.dpi === 600 && p.contrast && p.layout === '')).toBe(true);
  });

  it('change only what is given, and leave out pages that are not there', () => {
    const before = firstPlan(verdicts, grc, 'pdf');
    const plan = withSettings(before, [0, 1, 9, 2.5], { layout: 'sparse', dpi: undefined });
    expect(plan[0]).toEqual({ ...grc, layout: 'sparse', source: 'pdf' });
    expect(plan.slice(1)).toEqual(before.slice(1));
  });
});

describe('the source laid on pages', () => {
  it('is set on the pages given, but the PDF’s text is not laid where there is none', () => {
    const plan = firstPlan(verdicts, eng, 'read');
    expect(sources(withSource(plan, [1, 3], 'pdf', verdicts))).toEqual([
      'pdf',
      'read',
      'read',
      'read',
      'read',
    ]);
    expect(sources(withSource(plan, [], 'pdf', verdicts))).toEqual([
      'pdf',
      'pdf',
      'read',
      'pdf',
      'read',
    ]);
  });

  it('reads any page asked', () => {
    const plan = firstPlan(verdicts, eng, 'pdf');
    expect(sources(withSource(plan, [4], 'read', verdicts))).toEqual([
      'pdf',
      'pdf',
      'read',
      'read',
      'read',
    ]);
    expect(sources(withSource(plan, [], 'read', verdicts))).toEqual(Array(5).fill('read'));
  });

  it('keeps the settings of the pages', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [1], grc);
    expect(withSource(plan, [1], 'read', verdicts)[0]).toEqual({ ...grc, source: 'read' });
  });
});

describe('pages decided by their verdicts', () => {
  it('take the PDF’s text where it is sound, and are read where it is poor or none', () => {
    const plan = firstPlan(verdicts, eng, 'read');
    expect(sources(decided(plan, [], verdicts))).toEqual(['pdf', 'read', 'read', 'pdf', 'read']);
    const all = firstPlan(verdicts, eng, 'pdf');
    expect(sources(decided(all, [], verdicts))).toEqual(['pdf', 'read', 'read', 'pdf', 'read']);
  });

  it('only where given', () => {
    const plan = firstPlan(verdicts, eng, 'read');
    expect(sources(decided(plan, [4, 5], verdicts))).toEqual([
      'read',
      'read',
      'read',
      'pdf',
      'read',
    ]);
  });
});

describe('settings compared', () => {
  it('are the same where every setting is, 0 and 300 dots alike', () => {
    expect(sameSettings(eng, { ...eng, languages: ['eng'] })).toBe(true);
    expect(sameSettings(eng, { ...eng, dpi: 300 })).toBe(true);
    expect(sameSettings(eng, { ...eng, dpi: 400 })).toBe(false);
    expect(sameSettings(eng, { ...eng, layout: 'block' })).toBe(false);
    expect(sameSettings(eng, { ...eng, contrast: true })).toBe(false);
    expect(sameSettings(eng, { ...eng, languages: [] })).toBe(false);
  });

  it('see the order of the languages, the likeliest first', () => {
    expect(sameSettings(grc, { ...grc, languages: ['eng', 'grc'] })).toBe(false);
  });
});

describe('the runs of the plan', () => {
  it('are one where every page is read alike', () => {
    expect(runsOf(firstPlan(verdicts, eng, 'pdf'))).toEqual([{ from: 1, to: 5, settings: eng }]);
  });

  it('follow the settings, whatever the source of the pages', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [2, 3], grc);
    expect(runsOf(plan)).toEqual([
      { from: 1, to: 1, settings: eng },
      { from: 2, to: 3, settings: grc },
      { from: 4, to: 5, settings: eng },
    ]);
    // 300 dots where 0 was: the same run.
    expect(runsOf(withSettings(plan, [4], { dpi: 300 })).length).toBe(3);
  });

  it('are none of no pages', () => {
    expect(runsOf([])).toEqual([]);
  });
});

describe('what is asked of a reading', () => {
  it('reads the pages marked so, with the whole’s settings', () => {
    const asked = askedOf(firstPlan(verdicts, eng, 'pdf'), 'keep', true);
    expect(asked).toEqual({ ...eng, text: 'keep', shape: true, stretches: [], read: [3, 5] });
  });

  it('gives the pages read where none are, so that no page falls back on the text', () => {
    const plan = withSource(firstPlan(['sound', 'sound'], eng, 'pdf'), [], 'pdf', [
      'sound',
      'sound',
    ]);
    expect(askedOf(plan, 'translate', false).read).toEqual([]);
  });

  it('gives the runs after the first as stretches', () => {
    let plan = withSettings(firstPlan(verdicts, eng, 'read'), [2, 3], grc);
    plan = withSettings(plan, [5], { languages: ['nor'] });
    const asked = askedOf(plan, 'translate', false);
    expect(asked.languages).toEqual(['eng']);
    expect(asked.dpi).toBe(0);
    expect(asked.text).toBe('translate');
    expect(asked.read).toEqual([1, 2, 3, 4, 5]);
    expect(asked.stretches).toEqual([
      { from: 2, ...grc },
      { from: 4, ...eng },
      { from: 5, ...eng, languages: ['nor'] },
    ]);
  });

  it('of a picture, gives the settings given and no pages', () => {
    expect(askedOf([], 'keep', false, grc)).toEqual({
      ...grc,
      text: 'keep',
      shape: false,
      read: null,
    });
    expect(askedOf([], 'keep', false)).toEqual({
      languages: [],
      dpi: 0,
      layout: '',
      contrast: false,
      text: 'keep',
      shape: false,
      read: null,
    });
  });
});

describe('the pages counted', () => {
  it('by their source', () => {
    expect(counted(firstPlan(verdicts, eng, 'pdf'))).toEqual({ pdf: 3, read: 2 });
    expect(counted(firstPlan(verdicts, eng, 'read'))).toEqual({ pdf: 0, read: 5 });
    expect(counted([])).toEqual({ pdf: 0, read: 0 });
  });
});

describe('the settings of a page', () => {
  it('are its own, and of the nearest page where it is not one', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [5], grc);
    expect(settingsAt(plan, 1)).toEqual(eng);
    expect(settingsAt(plan, 5)).toEqual(grc);
    expect(settingsAt(plan, 9)).toEqual(grc);
    expect(settingsAt(plan, 0)).toEqual(eng);
    expect(settingsAt(plan, 5)).not.toHaveProperty('source');
    expect(settingsAt([], 1)).toEqual({ languages: [], dpi: 0, layout: '', contrast: false });
  });

  it('are the same across pages where every one has them', () => {
    const plan = withSettings(firstPlan(verdicts, eng, 'pdf'), [3, 4], grc);
    expect(sameAcross(plan, [3, 4])).toBe(true);
    expect(sameAcross(plan, [2, 3])).toBe(false);
    expect(sameAcross(plan, [])).toBe(false);
    expect(sameAcross(plan, [1])).toBe(true);
    expect(sameAcross(firstPlan(verdicts, eng, 'pdf'), [])).toBe(true);
    expect(sameAcross([], [])).toBe(true);
  });
});

describe('the choice for the whole PDF', () => {
  it('is laid on every page', () => {
    const plan = firstPlan(verdicts, eng, 'pdf');
    expect(withWhole(plan, 'read', verdicts).map((p) => p.source)).toEqual(Array(5).fill('read'));
    expect(withWhole(plan, 'decide', verdicts).map((p) => p.source)).toEqual([
      'pdf',
      'read',
      'read',
      'pdf',
      'read',
    ]);
  });
  it('is said as the pages are marked, the one chosen last first, and none where they were marked one by one', () => {
    const plan = firstPlan(verdicts, eng, 'pdf');
    expect(wholeOf(plan, verdicts, null)).toBe('pdf');
    expect(wholeOf(withWhole(plan, 'decide', verdicts), verdicts, 'decide')).toBe('decide');
    expect(wholeOf(withSource(plan, [4], 'read', verdicts), verdicts, 'pdf')).toBeNull();
    const sound: Verdict[] = ['sound', 'sound'];
    const both = firstPlan(sound, eng, 'pdf');
    expect(wholeOf(both, sound, 'decide')).toBe('decide');
    expect(wholeOf(both, sound, 'pdf')).toBe('pdf');
  });
});
