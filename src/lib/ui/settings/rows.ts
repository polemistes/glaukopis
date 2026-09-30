/**
 * A form of settings as data: each row says what it is called, what it
 * sets, and how; `Settings.svelte` shows the rows of an object. A row reads
 * and writes its value by a path in the object ("page.marginTop"), which
 * the type checker holds to the kind of the row, or by functions of its
 * own where the value is not simply there.
 */

/** The paths in an object that lead to a value of the given kind, as `page.size`; not into lists. */
export type PathTo<T, V> = {
  [K in keyof T & string]-?: NonNullable<T[K]> extends readonly unknown[]
    ? never
    : [T[K]] extends [V]
      ? K
      : NonNullable<T[K]> extends object
        ? `${K}.${PathTo<NonNullable<T[K]>, V>}`
        : never;
}[keyof T & string];

/** Paths are for plain data: an element of a document, or nothing, has none. */
type Paths<T, V> = [T] extends [Node | null | undefined] ? never : PathTo<T, V>;

/** Where a row finds its value: by a path, or by functions of its own. */
type Reach<T, V> =
  | { at: Paths<T, V>; get?: undefined; set?: undefined }
  | { at?: undefined; get: (target: T) => V; set: (target: T, value: V) => void };

interface Named<T> {
  label: string;
  hint?: string;
  /** The row is shown only while this holds. */
  when?: (target: T) => boolean;
}

export type Choices = readonly (readonly [string | number, string])[];

export type Row<T> =
  | { heading: string; when?: (target: T) => boolean }
  | { subheading: string; when?: (target: T) => boolean }
  | { note: string; when?: (target: T) => boolean }
  | (Named<T> & { kind: 'toggle' } & Reach<T, boolean>)
  | (Named<T> & {
      kind: 'text';
      placeholder?: string;
      /** Written as it stands, in letters of equal width: punctuation, affixes. */
      literal?: boolean;
    } & Reach<T, string>)
  /** A length with its unit: `2.5cm`, `12pt`. */
  | (Named<T> & { kind: 'length' } & Reach<T, string>)
  | (Named<T> & {
      kind: 'number';
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
      /** What is said beside nought: "as the text". */
      zero?: string;
      /** Nought is kept as nothing, and nothing shown as nought. */
      nullable?: boolean;
      /** Nothing is shown as an empty field with these words in it. */
      blank?: string;
    } & Reach<T, number | null>)
  | (Named<T> & { kind: 'choice'; options: Choices } & Reach<T, string | number>);

/** A row that sets something, and not a heading or a note. */
export type Setting<T> = Extract<Row<T>, { kind: string }>;

/** Where a row written short finds its value: a path, or functions of its own. */
type Where<T, V> = Paths<T, V> | { get: (target: T) => V; set: (target: T, value: V) => void };

interface More<T> {
  hint?: string;
  when?: (target: T) => boolean;
}

interface NumberMore<T> extends More<T> {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  zero?: string;
  nullable?: boolean;
  blank?: string;
}

/**
 * Rows for an object of the given kind, written short, one to a line:
 * `toggle(t('format-bold'), 'title.bold')`.
 */
export function rowsOf<T>() {
  const reach = <V>(where: Where<T, V>) => (typeof where === 'string' ? { at: where } : where);
  return {
    toggle: (label: string, where: Where<T, boolean>, more: More<T> = {}) =>
      ({ kind: 'toggle', label, ...reach(where), ...more }) as Row<T>,
    text: (
      label: string,
      where: Where<T, string>,
      more: More<T> & { placeholder?: string; literal?: boolean } = {},
    ) => ({ kind: 'text', label, ...reach(where), ...more }) as Row<T>,
    length: (label: string, where: Where<T, string>, more: More<T> = {}) =>
      ({ kind: 'length', label, ...reach(where), ...more }) as Row<T>,
    number: (label: string, where: Where<T, number | null>, more: NumberMore<T> = {}) =>
      ({ kind: 'number', label, ...reach(where), ...more }) as Row<T>,
    choice: (
      label: string,
      where: Where<T, string | number>,
      options: Choices,
      more: More<T> = {},
    ) => ({ kind: 'choice', label, ...reach(where), options, ...more }) as Row<T>,
  };
}

/** Whether a length is written with a unit Typst and LaTeX both know. */
export function lengthOk(value: string): boolean {
  return /^\s*-?\d+([.,]\d+)?\s*(pt|mm|cm|in)\s*$/i.test(value);
}

export function read(target: unknown, path: string): unknown {
  let at = target as Record<string, unknown> | undefined;
  for (const key of path.split('.')) at = at?.[key] as Record<string, unknown> | undefined;
  return at;
}

export function write(target: unknown, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  let at = target as Record<string, unknown>;
  for (const key of keys) at = at[key] as Record<string, unknown>;
  at[last] = value;
}

/** The value of a row in the object it belongs to. */
export function valueOf<T>(row: Setting<T>, target: T): unknown {
  if (row.at !== undefined) return read(target, row.at);
  return (row.get as (target: T) => unknown)(target);
}

/** Sets the value of a row in the object it belongs to. */
export function setValue<T>(row: Setting<T>, target: T, value: unknown) {
  if (row.at !== undefined) write(target, row.at, value);
  else (row.set as (target: T, value: unknown) => void)(target, value);
}
