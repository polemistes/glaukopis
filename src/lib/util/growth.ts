/**
 * How the time of some work grows with its size, for the tests that say a
 * thing is done in good time: what they mean is that it does not grow with
 * the square of the size, and a limit in milliseconds says that only on the
 * machine it was set on, and not even there while other work loads it.
 *
 * The work is done at a size and at four times that size, by turns, a few
 * times each, and the least time of each is taken: the one least disturbed
 * by whatever else ran, which disturbs both alike. Where one run is too
 * quick to be timed, it is run over and over, as often at both sizes. The
 * growth is the one time over the other: about 4 for work that grows with
 * its size, a little more with a logarithm, and 16 for work that grows
 * with the square of it. The sizes are best kept small enough that what
 * is made fits in the caches of the machine and leaves the collector of
 * garbage little to do, which would add growth of their own.
 */

/** What `run` takes, in milliseconds, done `runs` times at a size. */
function timed(run: (size: number) => void, size: number, runs: number): number {
  const started = performance.now();
  for (let i = 0; i < runs; i++) run(size);
  return performance.now() - started;
}

/** How many times longer `run` takes at four times `size` than at `size`. */
export function growth(
  run: (size: number) => void,
  size: number,
  { enough = 10, times = 5 }: { enough?: number; times?: number } = {},
): number {
  let runs = 1;
  while (timed(run, size, runs) < enough && runs < 2 ** 16) runs *= 2;
  let small = Infinity;
  let large = Infinity;
  for (let i = 0; i < times; i++) {
    small = Math.min(small, timed(run, size, runs));
    large = Math.min(large, timed(run, 4 * size, runs));
  }
  return large / small;
}
