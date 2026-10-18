import { describe, expect, it } from 'vitest';
import { bounded, forwardToLog, line, type Level } from './page-log';

/** A clock and a timer that the test moves. */
function clock() {
  let t = 0;
  const timers: { at: number; run: () => void }[] = [];
  return {
    now: () => t,
    later: (run: () => void, ms: number) => timers.push({ at: t + ms, run }),
    pass(ms: number) {
      t += ms;
      for (const timer of timers.splice(0).sort((a, b) => a.at - b.at)) {
        if (timer.at <= t) timer.run();
        else timers.push(timer);
      }
    },
  };
}

describe('the lines of the page written into the log', () => {
  it('are a few a second, and those left out are counted and said', () => {
    const c = clock();
    const sent: [Level, string][] = [];
    const send = bounded((l, m) => sent.push([l, m]), 5, c.now, c.later);
    for (let i = 0; i < 100; i++) send('error', `fault ${i}`);
    expect(sent.map(([, m]) => m)).toEqual(['fault 0', 'fault 1', 'fault 2', 'fault 3', 'fault 4']);
    // A second later, the count of those left out, though nothing more came.
    c.pass(1000);
    expect(sent).toHaveLength(6);
    expect(sent[5]).toEqual(['warn', '95 more lines of the page left out of the log']);
    // And then lines are written again.
    send('warn', 'later');
    expect(sent.at(-1)).toEqual(['warn', 'later']);
  });

  it('say the count before the line that comes when there is room again', () => {
    const c = clock();
    const sent: string[] = [];
    const send = bounded((_, m) => sent.push(m), 2, c.now, c.later);
    send('error', 'a');
    send('error', 'b');
    send('error', 'c');
    c.pass(600);
    send('error', 'd');
    expect(sent).toEqual(['a', 'b', '1 more line of the page left out of the log', 'd']);
    // Said once: the timer finds nothing more to say.
    c.pass(1000);
    expect(sent).toHaveLength(4);
  });

  it('are long at the most four thousand characters', () => {
    const sent: string[] = [];
    bounded((_, m) => sent.push(m))('error', 'x'.repeat(10_000));
    expect(sent[0]).toHaveLength(4000);
  });

  it('say what the console was given, errors with their stack', () => {
    const error = new Error('broken');
    error.stack = 'Error: broken\n    at here';
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(line(['The trash could not be listed', error])).toBe(
      'The trash could not be listed Error: broken\nError: broken\n    at here',
    );
    expect(line(['a', { kind: 'io', message: 'gone' }, 3, null, undefined])).toBe(
      'a {"kind":"io","message":"gone"} 3 null undefined',
    );
    expect(line([cyclic])).toBe('[object Object]');
  });
});

describe('the console sent to the log', () => {
  it('shows what it is given as before, and sends warnings and errors', () => {
    const shown: unknown[][] = [];
    const into = {
      warn: (...a: unknown[]) => shown.push(a),
      error: (...a: unknown[]) => shown.push(a),
    } as unknown as Console;
    const written: [Level, string][] = [];
    forwardToLog(
      async (l, m) => {
        written.push([l, m]);
      },
      new EventTarget() as unknown as Window,
      into,
    );
    into.warn('Own words not read', 'no file');
    into.error('fails');
    expect(shown).toEqual([['Own words not read', 'no file'], ['fails']]);
    expect(written).toEqual([
      ['warn', 'Own words not read no file'],
      ['error', 'fails'],
    ]);
  });

  it('sends errors that no one caught', () => {
    const written: string[] = [];
    const target = new EventTarget();
    forwardToLog(
      async (_, m) => {
        written.push(m);
      },
      target as unknown as Window,
      { warn: () => {}, error: () => {} } as unknown as Console,
    );
    const event = Object.assign(new Event('error'), {
      message: 'boom',
      filename: 'app.js',
      lineno: 3,
      colno: 7,
      error: null,
    });
    target.dispatchEvent(event);
    expect(written).toEqual(['boom (app.js:3:7)']);
  });

  it('goes on when the log cannot be written to', async () => {
    const shown: unknown[][] = [];
    const into = {
      warn: () => {},
      error: (...a: unknown[]) => shown.push(a),
    } as unknown as Console;
    forwardToLog(
      () => Promise.reject(new Error('no log')),
      new EventTarget() as unknown as Window,
      into,
    );
    into.error('one');
    await new Promise((r) => setTimeout(r, 0));
    // The failure to write is not said on the console, which would send it again.
    expect(shown).toEqual([['one']]);
  });
});
