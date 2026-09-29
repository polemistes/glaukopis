import { afterEach, describe, expect, it } from 'vitest';
import { has, languages, t } from '$lib/i18n';
import {
  fieldDef,
  fieldGroupLabel,
  fieldLabel,
  groupName,
  schema,
  typeHint,
  typeLabel,
  typeOptions,
} from './schema';

afterEach(() => {
  languages.current = 'en';
});

describe('the words of the form', () => {
  it('are there for every field, type, group and choice, and are the English of the schema', () => {
    languages.current = 'en';
    const lacking: string[] = [];
    const unlike: string[] = [];
    const alike = (id: string, english: string) => {
      if (!has(id)) lacking.push(id);
      else if (t(id) !== english) unlike.push(`${id}: “${t(id)}”, not “${english}”`);
    };
    for (const group of schema.fieldGroups) alike(`field-group-${groupName(group)}`, group);
    for (const group of schema.groups) alike(`field-type-group-${groupName(group)}`, group);
    for (const [name, field] of Object.entries(schema.fields)) {
      alike(`field-${name}`, field.label);
      if (field.hint) alike(`field-${name}.hint`, field.hint);
      for (const [value, label] of field.options ?? [])
        alike(`field-${name}-${value || 'empty'}`, label);
    }
    for (const type of schema.types) {
      alike(`field-type-${type.id}`, type.label);
      if (type.hint) alike(`field-type-${type.id}.hint`, type.hint);
    }
    expect(lacking).toEqual([]);
    expect(unlike).toEqual([]);
  });

  it('are said in the language of the interface', () => {
    languages.current = 'nb';
    expect(fieldLabel('journaltitle')).toBe('Tidsskrift');
    expect(fieldDef('publisher').hint).toBe('Skill flere med «and»');
    expect(fieldDef('pagination').options?.[1]).toEqual(['column', 'Spalter']);
    expect(fieldDef('bookpagination').options?.[1]).toEqual(['column', 'Spalter']);
    expect(fieldGroupLabel('People')).toBe('Personer');
    expect(typeLabel('collection')).toBe('Antologi');
    expect(typeHint('collection')).toBe('En bok med bidrag av ulike forfattere');
    expect(typeOptions()[0]).toEqual({ value: 'book', label: 'Bok', group: 'Bøker' });
  });

  it('are the names themselves of what the schema does not know', () => {
    expect(fieldLabel('glaukopis-zotero')).toBe('glaukopis-zotero');
    expect(fieldDef('mystery').label).toBe('mystery');
    expect(typeLabel('mystery')).toBe('mystery');
    expect(typeHint('mvbook')).toBeUndefined();
  });
});
