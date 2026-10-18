import { describe, expect, it, vi } from 'vitest';
import type { Draft, Reference } from '$lib/api/library';

const get = vi.fn();
vi.mock('$lib/api/library', () => ({ libraryGet: get }));

const { withNoteAsItIs } = await import('./notes.svelte');

const draft = (annotation?: string): Draft => ({
  key: 'homer',
  type: 'book',
  fields: annotation === undefined ? { title: 'Iliad' } : { title: 'Iliad', annotation },
  names: {},
});
const loaded = (annotation?: string) =>
  ({ ...draft(annotation), id: 'r1' }) as unknown as Reference;
const asNow = (annotation: string) => ({ fields: { annotation } });

describe('the note kept when a form is saved', () => {
  it('is the note as it is now, where the form did not change it', async () => {
    get.mockResolvedValueOnce(asNow('written meanwhile'));
    const kept = await withNoteAsItIs('r1', draft('old'), loaded('old'));
    expect(kept.fields.annotation).toBe('written meanwhile');
  });

  it('is asked for again once when the first asking fails', async () => {
    get.mockRejectedValueOnce({ kind: 'io', message: 'busy' });
    get.mockResolvedValueOnce(asNow('written meanwhile'));
    const kept = await withNoteAsItIs('r1', draft('old'), loaded('old'));
    expect(kept.fields.annotation).toBe('written meanwhile');
  });

  it('refuses the save when it cannot be read, rather than write the old note over a newer', async () => {
    get.mockRejectedValue({ kind: 'io', message: 'busy' });
    await expect(withNoteAsItIs('r1', draft('old'), loaded('old'))).rejects.toMatchObject({
      message: 'busy',
    });
    get.mockReset();
  });

  it('is the form’s where the form changed it, without asking', async () => {
    const kept = await withNoteAsItIs('r1', draft('new'), loaded('old'));
    expect(kept.fields.annotation).toBe('new');
    expect(get).not.toHaveBeenCalled();
  });
});
