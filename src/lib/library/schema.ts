/**
 * The publication types and fields, from the file the Rust side reads as well.
 * What the form calls them is in `locales/<language>/fields.ftl`, by their
 * names: `field-journaltitle`, `field-type-article`.
 */

import { t } from '$lib/i18n';
import raw from '../../../resources/biblatex/schema.json';

export type FieldKind =
  | 'names'
  | 'title'
  | 'text'
  | 'longtext'
  | 'date'
  | 'range'
  | 'list'
  | 'verbatim'
  | 'select'
  | 'key';

export interface FieldDef {
  label: string;
  kind: FieldKind;
  group: string;
  hint?: string;
  options?: [string, string][];
}

export interface TypeDef {
  id: string;
  label: string;
  group: string;
  primary: string[];
  secondary: string[];
  hint?: string;
}

interface Schema {
  fields: Record<string, FieldDef>;
  types: TypeDef[];
  groups: string[];
  fieldGroups: string[];
}

export const schema = raw as unknown as Schema;

const typesById = new Map(schema.types.map((t) => [t.id, t]));

/**
 * What the interface says by a name, in its language; the schema's own
 * English where there are no words by that name.
 */
function word(id: string, english: string): string {
  const said = t(id);
  return said === id ? english : said;
}

/** A group as its words are named: "Notes" is `field-group-notes`. */
export function groupName(group: string): string {
  return group.toLowerCase().replace(/\s+/g, '-');
}

export function typeDef(id: string): TypeDef | undefined {
  return typesById.get(id);
}

export function typeLabel(id: string): string {
  const def = typesById.get(id);
  return def ? word(`field-type-${id}`, def.label) : id;
}

/** What a type is for, where that is not plain from its name. */
export function typeHint(id: string): string | undefined {
  const def = typesById.get(id);
  return def?.hint ? word(`field-type-${id}.hint`, def.hint) : undefined;
}

/** What a group of types is called: "Books". */
export function typeGroupLabel(group: string): string {
  return word(`field-type-group-${groupName(group)}`, group);
}

/** What a group of fields is called: "People". */
export function fieldGroupLabel(group: string): string {
  return word(`field-group-${groupName(group)}`, group);
}

/** A field, with its label, hint and choices in the language of the interface. */
export function fieldDef(name: string): FieldDef {
  const def = schema.fields[name];
  if (!def) {
    return {
      label: name,
      kind: 'text',
      group: 'Other',
    };
  }
  return {
    ...def,
    label: word(`field-${name}`, def.label),
    hint: def.hint && word(`field-${name}.hint`, def.hint),
    options: def.options?.map(([value, label]) => [
      value,
      word(`field-${name}-${value || 'empty'}`, label),
    ]),
  };
}

export function fieldLabel(name: string): string {
  const def = schema.fields[name];
  return def ? word(`field-${name}`, def.label) : name;
}

export function isNameField(name: string): boolean {
  return schema.fields[name]?.kind === 'names';
}

/** The fields the form shows for a type before any are added. */
export function primaryFields(type: string): string[] {
  return typesById.get(type)?.primary ?? ['author', 'title', 'date', 'note'];
}

/** Who stands first for a type: authors, or editors for edited works. */
export function leadingNameField(type: string): string {
  const primary = primaryFields(type);
  return primary.find((f) => isNameField(f)) ?? 'author';
}

/** The types to choose from, in the language of the interface. */
export function typeOptions() {
  return schema.types.map((type) => ({
    value: type.id,
    label: typeLabel(type.id),
    group: typeGroupLabel(type.group),
  }));
}
