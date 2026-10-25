/** The maps of other programs the tests read, written by hand after their formats. */

const files = import.meta.glob('./fixtures/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** A fixture's text, by its file's name. */
export function fixture(name: string): string {
  const text = files[`./fixtures/${name}`];
  if (text === undefined) throw new Error(`no fixture ${name}`);
  return text;
}
