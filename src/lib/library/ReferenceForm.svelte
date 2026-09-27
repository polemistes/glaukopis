<script lang="ts">
  import { tick } from 'svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import type { Draft } from '$lib/api/library';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Select from '$lib/ui/Select.svelte';
  import NamesField from './NamesField.svelte';
  import { fieldDef, isNameField, primaryFields, schema, typeDef, typeOptions } from './schema';

  interface Props {
    draft: Draft;
    /** Called after every change the user makes. */
    onchange: () => void;
    /** The key the entry will be given when the field is left empty. */
    suggestedKey?: string;
    /** Message for the citation key field. */
    keyError?: string | null;
    /** Put the cursor in the first field when the form appears. */
    autofocus?: boolean;
  }

  let {
    draft = $bindable(),
    onchange,
    suggestedKey = '',
    keyError = null,
    autofocus = false,
  }: Props = $props();

  const uid = $props.id();
  let root = $state<HTMLDivElement>();
  /** Fields the user asked for, shown although still empty. */
  let added = $state<string[]>([]);

  // A type the schema does not know is offered under its own name.
  const types = $derived(
    typeDef(draft.type) || !draft.type
      ? typeOptions
      : [...typeOptions, { value: draft.type, label: `@${draft.type}`, group: 'Other' }],
  );

  const schemaOrder = Object.keys(schema.fields);

  const shown = $derived.by(() => {
    const primary = primaryFields(draft.type);
    const rest = new Set<string>();
    for (const [name, value] of Object.entries(draft.fields)) if (value.trim()) rest.add(name);
    for (const [name, people] of Object.entries(draft.names)) {
      if (people.some((p) => p.family?.trim() || p.given?.trim())) rest.add(name);
    }
    for (const name of added) rest.add(name);
    for (const name of primary) rest.delete(name);
    rest.delete('file');
    // What the user writes about the work has a place of its own (see notes.svelte.ts).
    rest.delete('annotation');
    const others = [...rest].sort((a, b) => {
      const ia = schemaOrder.indexOf(a);
      const ib = schemaOrder.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
    });
    return { primary, others };
  });

  function setField(name: string, value: string) {
    draft.fields[name] = value;
    onchange();
  }

  function removeField(name: string) {
    delete draft.fields[name];
    delete draft.names[name];
    added = added.filter((f) => f !== name);
    onchange();
  }

  async function addField(name: string) {
    if (!added.includes(name)) added = [...added, name];
    if (isNameField(name) && !draft.names[name]) draft.names[name] = [{ family: '', given: '' }];
    await tick();
    root
      ?.querySelector<HTMLElement>(`[data-field="${name}"] :is(input, textarea, select)`)
      ?.focus();
  }

  function addMenu(event: MouseEvent) {
    const visible = new Set([...shown.primary, ...shown.others]);
    const item = (name: string): MenuItem => ({
      label: fieldDef(name).label,
      hint: fieldDef(name).hint,
      action: () => addField(name),
    });
    const suggested = (typeDef(draft.type)?.secondary ?? []).filter(
      (f) => !visible.has(f) && f !== 'annotation',
    );
    const items: MenuItem[] = [];
    if (suggested.length) {
      items.push({ kind: 'heading', label: 'Often used' });
      items.push(...suggested.map(item));
      items.push({ kind: 'separator' });
    }
    for (const group of schema.fieldGroups) {
      const fields = schemaOrder.filter(
        (f) =>
          schema.fields[f].group === group &&
          f !== 'annotation' &&
          !visible.has(f) &&
          !suggested.includes(f),
      );
      if (fields.length) items.push({ kind: 'submenu', label: group, items: fields.map(item) });
    }
    openMenu(event.currentTarget as HTMLElement, items, {
      side: 'top',
      align: 'start',
      minWidth: 240,
    });
  }

  function grow(node: HTMLTextAreaElement, _value: string) {
    const fit = () => {
      node.style.height = '0';
      node.style.height = `${Math.min(node.scrollHeight + 2, 260)}px`;
    };
    fit();
    return { update: fit };
  }

  function dateProblem(value: string): string | null {
    const v = value.trim();
    if (!v) return null;
    const point = String.raw`-?[0-9X]{4}(-(0[1-9]|1[0-2]|2[1-4])(-(0[1-9]|[12][0-9]|3[01]))?)?[~?%]?`;
    return new RegExp(`^${point}(/(${point}|\\.\\.)?)?$`).test(v)
      ? null
      : 'Write a date as 1979, 1979-05 or 1979-05-12; a range as 1979/1985.';
  }

  $effect(() => {
    if (autofocus && root) {
      root.querySelector<HTMLElement>('.fields :is(input, textarea)')?.focus();
    }
  });
</script>

{#snippet row(name: string, removable: boolean)}
  {@const def = fieldDef(name)}
  {@const id = `${uid}-${name}`}
  <div class="field" data-field={name} class:long={def.kind === 'longtext'}>
    <label for={id} title={def.hint}>{def.label}</label>
    <div class="control">
      {#if def.kind === 'names'}
        <NamesField
          {id}
          label={def.label}
          bind:people={
            () => draft.names[name] ?? [],
            (v) => {
              draft.names[name] = v;
            }
          }
          {onchange}
        />
      {:else if def.kind === 'longtext'}
        <textarea
          {id}
          rows="2"
          value={draft.fields[name] ?? ''}
          placeholder={def.hint}
          use:grow={draft.fields[name] ?? ''}
          oninput={(e) => setField(name, e.currentTarget.value)}></textarea>
      {:else if def.kind === 'select' && def.options}
        <select
          {id}
          value={draft.fields[name] ?? ''}
          onchange={(e) => setField(name, e.currentTarget.value)}
        >
          {#each def.options as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
          {#if draft.fields[name] && !def.options.some(([v]) => v === draft.fields[name])}
            <option value={draft.fields[name]}>{draft.fields[name]}</option>
          {/if}
        </select>
      {:else if def.kind === 'title' || def.kind === 'text' || def.kind === 'list'}
        <!-- One line that grows: titles in the humanities are long. -->
        <textarea
          {id}
          class="line"
          class:serif={def.kind === 'title'}
          rows="1"
          value={draft.fields[name] ?? ''}
          placeholder={def.hint}
          spellcheck={def.kind !== 'list'}
          use:grow={draft.fields[name] ?? ''}
          oninput={(e) => setField(name, e.currentTarget.value.replace(/\s*\n\s*/g, ' '))}
          onkeydown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}></textarea>
      {:else}
        {@const problem = def.kind === 'date' ? dateProblem(draft.fields[name] ?? '') : null}
        <input
          {id}
          class:mono={def.kind === 'verbatim' || def.kind === 'key'}
          class:invalid={!!problem}
          value={draft.fields[name] ?? ''}
          placeholder={def.hint}
          spellcheck="false"
          autocomplete="off"
          oninput={(e) => setField(name, e.currentTarget.value)}
        />
        {#if problem}<p class="problem">{problem}</p>{/if}
      {/if}
    </div>
    {#if removable}
      <button
        type="button"
        class="remove"
        aria-label="Remove {def.label}"
        tabindex="-1"
        onclick={() => removeField(name)}
      >
        <X size={13} />
      </button>
    {/if}
  </div>
{/snippet}

<div class="form" bind:this={root}>
  <div class="type">
    <Select
      bind:value={draft.type}
      options={types}
      onchange={() => {
        added = [];
        onchange();
      }}
    />
    {#if typeDef(draft.type)?.hint}<p class="type-hint">{typeDef(draft.type)?.hint}</p>{/if}
  </div>

  <div class="fields">
    {#each shown.primary as name (name)}
      {@render row(name, false)}
    {/each}
    {#each shown.others as name (name)}
      {@render row(name, true)}
    {/each}
  </div>

  <button type="button" class="add-field" onclick={addMenu}>
    <Plus size={13} />
    <span>Add field</span>
  </button>

  <div class="field key" data-field="key">
    <label for="{uid}-key">Citation key</label>
    <div class="control">
      <input
        id="{uid}-key"
        class="mono"
        class:invalid={!!keyError}
        value={draft.key}
        placeholder={suggestedKey || 'made from author and year'}
        spellcheck="false"
        autocomplete="off"
        oninput={(e) => {
          draft.key = e.currentTarget.value;
          onchange();
        }}
      />
      {#if keyError}<p class="problem">{keyError}</p>{/if}
    </div>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .type {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .type-hint {
    font-size: var(--text-xs);
    color: var(--ink-3);
    padding-left: 2px;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .field {
    position: relative;
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding-right: 18px;
  }
  label {
    padding-top: 6px;
    font-size: var(--text-sm);
    color: var(--ink-3);
    text-align: right;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .control {
    min-width: 0;
  }
  input,
  textarea,
  select {
    width: 100%;
    min-height: 28px;
    padding: 0 7px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    outline: none;
    transition:
      border-color var(--fast) var(--ease),
      background var(--fast) var(--ease);
  }
  textarea {
    display: block;
    padding: 5px 7px;
    resize: none;
    line-height: 1.45;
    font-family: var(--font-text);
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
  :is(input, textarea, select):hover {
    border-color: var(--line-strong);
  }
  :is(input, textarea, select):focus {
    border-color: var(--accent);
    background: var(--paper-raised);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input::placeholder,
  textarea::placeholder {
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  textarea.line {
    font-family: var(--font-ui);
    padding: 4px 7px;
    min-height: 28px;
    overflow: hidden;
  }
  textarea.serif {
    font-family: var(--font-text);
    font-size: 14.5px;
    padding-top: 3px;
  }
  input.mono {
    font-family: var(--font-mono);
    font-size: 12.5px;
  }
  input.invalid {
    border-color: var(--danger);
  }
  .problem {
    padding: 2px 7px 4px;
    font-size: var(--text-xs);
    color: var(--danger);
  }
  .remove {
    position: absolute;
    right: 0;
    top: 5px;
    display: inline-flex;
    padding: 2px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
  }
  .field:hover .remove,
  .field:focus-within .remove {
    opacity: 1;
  }
  .remove:hover {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .add-field {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    align-self: flex-start;
    margin-left: 116px;
    padding: 4px 9px 4px 6px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .add-field:hover {
    border-color: var(--accent);
    color: var(--accent-strong);
    background: var(--accent-softer);
  }
  .key {
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
</style>
