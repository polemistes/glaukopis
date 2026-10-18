import { describe, expect, it, vi } from 'vitest';

const render = vi.fn();
vi.mock('$lib/api/pictures', () => ({ mathRender: render }));

const { mathematics } = await import('./math.svelte');

describe('formulas that cannot be made at all', () => {
  it('say why, rather than standing as their TeX without a word', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render.mockRejectedValueOnce('Pandoc is not installed or could not be found');
    expect(mathematics.of('x^2', false)).toBeUndefined();
    await vi.waitFor(() => expect(mathematics.of('x^2', false)).toBeDefined());
    const shown = mathematics.of('x^2', false);
    expect(shown?.mathml).toBeNull();
    expect(shown?.problem).toContain('Pandoc is not installed');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
