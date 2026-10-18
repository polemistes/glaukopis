import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '$lib/project/model/project.svelte';

vi.mock('$lib/api/library', async (original) => ({
  ...(await original<typeof import('$lib/api/library')>()),
  libraryGet: vi.fn(),
}));

const { libraryGet } = await import('$lib/api/library');
const { keepReference } = await import('./references.svelte');
const { toasts } = await import('$lib/ui/toast.svelte');

const project = () =>
  ({ putReference: vi.fn() }) as unknown as Project & { putReference: ReturnType<typeof vi.fn> };

describe('a reference kept with the project that cites it', () => {
  beforeEach(() => {
    for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
  });

  it('that the library has not is the project’s own already, and nothing is said', async () => {
    vi.mocked(libraryGet).mockRejectedValueOnce({ kind: 'not-found', message: 'not found' });
    const p = project();
    await keepReference(p, 'r1');
    expect(p.putReference).not.toHaveBeenCalled();
    expect(toasts.list).toHaveLength(0);
  });

  it('that could not be read from the library is said', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(libraryGet).mockRejectedValueOnce({ kind: 'io', message: 'database is locked' });
    await keepReference(project(), 'r1');
    expect(toasts.list).toHaveLength(1);
    expect(toasts.list[0].kind).toBe('error');
    expect(toasts.list[0].detail).toBe('database is locked');
    error.mockRestore();
  });
});
