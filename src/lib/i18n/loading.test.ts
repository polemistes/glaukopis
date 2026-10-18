import { describe, expect, it, vi } from 'vitest';

// The words of Danish cannot be fetched, as in a damaged installation.
let gone = true;
vi.mock('/locales/da/common.ftl?raw', async (original) => {
  if (gone) throw new Error('not there');
  return original();
});

const { load, t, languages } = await import('./i18n.svelte');

describe('the words of a language that cannot be loaded', () => {
  it('are told once, not at every word, and tried again when asked for', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(load('da')).rejects.toThrow();
    expect(warn.mock.calls.filter(([m]) => String(m).includes('da'))).toHaveLength(1);
    languages.current = 'da';
    // English stands in, and no word asks for Danish again.
    for (let i = 0; i < 20; i++) expect(t('settings-title')).toBe('Settings');
    await new Promise((r) => setTimeout(r, 0));
    expect(warn.mock.calls.filter(([m]) => String(m).includes('da'))).toHaveLength(1);
    // Asked again, as when the language is chosen again, it is tried again.
    gone = false;
    await load('da');
    expect(t('settings-title')).toBe('Indstillinger');
    languages.current = 'en';
    warn.mockRestore();
  });
});
