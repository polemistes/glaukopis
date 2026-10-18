/**
 * What the page says of its faults, written into the log of the run as
 * well (record 0052): `console.warn` and `console.error`, errors that no
 * one caught and promises that failed with no one to hear. In a window the
 * console is seen by no one, and is gone with the window; the log stays.
 *
 * A fault repeated in a loop must not fill the log, nor keep the core
 * busy: a few lines a second are written, and those left out are counted
 * and said in a line of their own when there is room again.
 */

export type Level = 'error' | 'warn';
export type Send = (level: Level, message: string) => void;

/** How many lines may be written at once, and again each second. */
export const LINES_A_SECOND = 5;
/** The most of a line that is written; the core cuts it there too. */
const LONGEST = 4000;

/**
 * `send`, at no more than `perSecond` lines a second (a bucket that fills
 * again at that rate); what is left out is counted, and said a second later.
 */
export function bounded(
  send: Send,
  perSecond = LINES_A_SECOND,
  now: () => number = Date.now,
  later: (run: () => void, ms: number) => unknown = setTimeout,
): Send {
  let room = perSecond;
  let at = now();
  let left = 0;
  let waiting = false;
  const fill = () => {
    const t = now();
    room = Math.min(perSecond, room + ((t - at) / 1000) * perSecond);
    at = t;
  };
  const sayLeft = () => {
    const n = left;
    left = 0;
    send('warn', `${n} more line${n === 1 ? '' : 's'} of the page left out of the log`);
  };
  const tellLeft = () => {
    waiting = false;
    if (!left) return;
    fill();
    if (room < 1) {
      waiting = true;
      later(tellLeft, 1000);
      return;
    }
    room -= 1;
    sayLeft();
  };
  return (level, message) => {
    fill();
    if (room < 1) {
      left++;
      if (!waiting) {
        waiting = true;
        later(tellLeft, 1000);
      }
      return;
    }
    room -= 1;
    // What was left out is said before what comes after it.
    if (left) sayLeft();
    send(level, message.length > LONGEST ? message.slice(0, LONGEST) : message);
  };
}

/** Where in the code an error came about, on lines of its own; WebKit's stack does not repeat the message. */
export function stackOf(error: unknown): string {
  const stack = (error as { stack?: unknown } | null)?.stack;
  return typeof stack === 'string' && stack.trim() ? `\n${stack.trim()}` : '';
}

/** One thing given to the console, as a line of the log says it. */
function said(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}${stackOf(value)}`;
  if (value === undefined || value === null || typeof value !== 'object') return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    // Cyclic, or with something that cannot be written.
    return String(value);
  }
}

/** What was given to the console, as one line. */
export function line(args: unknown[]): string {
  return args.map(said).join(' ');
}

/**
 * Has `console.warn` and `console.error` send what they are given, as well
 * as show it; and errors no one caught, and promises no one heard fail.
 * A failure to send is not said on the console, lest it be sent again.
 */
export function forwardToLog(
  write: (level: Level, message: string) => Promise<unknown>,
  target: Window = window,
  into: Console = console,
) {
  const send = bounded((level, message) => {
    write(level, message).catch(() => {});
  });
  for (const level of ['warn', 'error'] as const) {
    const original = into[level].bind(into);
    into[level] = (...args: unknown[]) => {
      original(...args);
      try {
        send(level, line(args));
      } catch {
        // The console must work whatever the log does.
      }
    };
  }
  target.addEventListener('error', (event) => {
    const where = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : '';
    send('error', `${event.message}${where}${stackOf(event.error)}`);
  });
  target.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    send(
      'error',
      `a promise failed unheard: ${reason?.message ?? String(reason)}${stackOf(reason)}`,
    );
  });
}
