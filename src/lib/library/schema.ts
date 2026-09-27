/** The publication types and fields, from the file the Rust side reads as well. */

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

export function typeDef(id: string): TypeDef | undefined {
  return typesById.get(id);
}

export function typeLabel(id: string): string {
  return typesById.get(id)?.label ?? id;
}

export function fieldDef(name: string): FieldDef {
  return (
    schema.fields[name] ?? {
      label: name,
      kind: 'text',
      group: 'Other',
    }
  );
}

export function fieldLabel(name: string): string {
  return schema.fields[name]?.label ?? name;
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

export const typeOptions = schema.types.map((t) => ({
  value: t.id,
  label: t.label,
  group: t.group,
}));
