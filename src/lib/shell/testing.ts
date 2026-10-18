/**
 * Whether the application is run by the e2e harness, which asked for the
 * hooks its scripts reach the page by: the harness sets `GLAUKOPIS_E2E`,
 * and the Rust side then sets `window.__glaukopisTesting` before any script
 * of the page runs. Never so in a window someone works in, where a hook that
 * opens any file by its path would be a door no dialog guards.
 */
export const testing =
  typeof window !== 'undefined' &&
  (window as { __glaukopisTesting?: unknown }).__glaukopisTesting === true;

/** Sets a hook of the e2e scripts on `window`, where they asked for hooks. */
export function testHook(name: `__glaukopis${string}`, value: unknown) {
  if (testing) (window as unknown as Record<string, unknown>)[name] = value;
}
