import { describe, expect, it, vi } from 'vitest';
import { beforeClose, finishBeforeClose } from './closing';

/** A promise and the means to settle it from outside. */
function later() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('what is done before the window closes', () => {
  it('does what is cheap and must be written first, and the rest only after it', async () => {
    const done: string[] = [];
    const append = later();
    const releases = [
      beforeClose(async () => {
        done.push('snapshot begun');
      }),
      beforeClose(async () => {
        await append.promise;
        done.push('appended');
      }, 'first'),
    ];
    const finishing = finishBeforeClose();
    await Promise.resolve();
    expect(done).toEqual([]);
    append.resolve();
    expect(await finishing).toEqual([]);
    expect(done).toEqual(['appended', 'snapshot begun']);
    for (const release of releases) release();
  });

  it('does not begin the rest when what must be written could not be, and says what failed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rest = vi.fn();
    const releases = [
      beforeClose(rest),
      beforeClose(() => Promise.reject(new Error('disk full')), 'first'),
    ];
    const failures = await finishBeforeClose();
    expect(failures).toEqual([new Error('disk full')]);
    expect(rest).not.toHaveBeenCalled();
    // Asked again after the failure was told: the rest is done all the same.
    expect(await finishBeforeClose(true)).toHaveLength(1);
    expect(rest).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
    for (const release of releases) release();
    error.mockRestore();
  });

  it('logs a failure of the rest, and does not count it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const release = beforeClose(() => {
      throw new Error('the readable copy');
    });
    expect(await finishBeforeClose()).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      'a task before closing failed',
      new Error('the readable copy'),
    );
    release();
    error.mockRestore();
  });
});
