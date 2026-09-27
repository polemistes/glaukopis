<script lang="ts">
  import { tick } from 'svelte';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Plus from '@lucide/svelte/icons/plus';
  import type { Person } from '$lib/api/library';
  import { openMenu } from '$lib/ui/menu.svelte';

  interface Props {
    people: Person[];
    /** "Author", "Editor": used in the button that adds one. */
    label: string;
    onchange: () => void;
    id?: string;
  }

  let { people = $bindable(), label, onchange, id }: Props = $props();

  let root = $state<HTMLDivElement>();
  /** Rows whose prefix and suffix fields are shown although empty. */
  let expanded = $state(new Set<number>());

  const rows = $derived(people.length ? people : [{ family: '', given: '' }]);

  function ensure(): Person[] {
    if (!people.length) people = [{ family: '', given: '' }];
    return people;
  }

  function set(i: number, key: 'family' | 'given' | 'prefix' | 'suffix', value: string) {
    ensure()[i][key] = value;
    onchange();
  }

  async function focusRow(i: number, which = 0) {
    await tick();
    const inputs = root?.querySelectorAll<HTMLInputElement>(`[data-row="${i}"] input`);
    inputs?.[Math.min(which, (inputs?.length ?? 1) - 1)]?.focus();
  }

  function add(after = people.length - 1) {
    ensure().splice(after + 1, 0, { family: '', given: '' });
    focusRow(after + 1);
  }

  function remove(i: number) {
    people.splice(i, 1);
    expanded.delete(i);
    onchange();
    focusRow(Math.max(0, i - 1));
  }

  function move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= people.length) return;
    const [p] = people.splice(i, 1);
    people.splice(j, 0, p);
    onchange();
  }

  function isEmpty(p: Person) {
    return !p.family?.trim() && !p.given?.trim();
  }

  function onkeydown(event: KeyboardEvent, i: number) {
    const input = event.currentTarget as HTMLInputElement;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isEmpty(rows[i])) add(i);
    } else if (
      event.key === 'Backspace' &&
      input.value === '' &&
      isEmpty(rows[i]) &&
      people.length > 1
    ) {
      event.preventDefault();
      remove(i);
    }
  }

  /** "Nagy, Gregory and Lord, Albert", or one name to a line, pasted at once. */
  function onpaste(event: ClipboardEvent, i: number) {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const pieces = text
      .split(/\s+and\s+|;|\n/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (pieces.length < 2 && !text.includes(',')) return;
    const parsed = pieces.map(parseName);
    if (!parsed.length) return;
    event.preventDefault();
    const list = ensure();
    if (isEmpty(list[i])) list.splice(i, 1, ...parsed);
    else list.splice(i + 1, 0, ...parsed);
    onchange();
  }

  function parseName(text: string): Person {
    const comma = text.indexOf(',');
    if (comma >= 0) {
      return { family: text.slice(0, comma).trim(), given: text.slice(comma + 1).trim() };
    }
    const words = text.split(/\s+/);
    if (words.length === 1) return { family: words[0], given: '' };
    return { family: words[words.length - 1], given: words.slice(0, -1).join(' ') };
  }

  function menu(event: MouseEvent, i: number) {
    const person = ensure()[i];
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: 'Institution or other name kept whole',
          icon: Building2,
          checked: !!person.literal,
          action: () => {
            if (person.literal) {
              people[i] = { ...parseName(person.family), literal: false };
            } else {
              const whole = [person.given, person.prefix, person.family].filter(Boolean).join(' ');
              people[i] = { family: whole, given: '', literal: true };
            }
            onchange();
          },
        },
        {
          label: 'Prefix and suffix',
          hint: '“van”, “de la” · “Jr.”, “III”',
          checked: expanded.has(i) || !!person.prefix || !!person.suffix,
          disabled: !!person.literal,
          action: () => {
            if (expanded.has(i)) expanded.delete(i);
            else expanded.add(i);
            expanded = new Set(expanded);
          },
        },
        { kind: 'separator' },
        { label: 'Move up', disabled: i === 0, action: () => move(i, -1) },
        { label: 'Move down', disabled: i >= people.length - 1, action: () => move(i, 1) },
        { kind: 'separator' },
        {
          label: 'Remove',
          danger: true,
          disabled: people.length <= 1 && isEmpty(person),
          action: () => remove(i),
        },
      ],
      { align: 'end' },
    );
  }
</script>

<div class="names" bind:this={root}>
  {#each rows as person, i (i)}
    <div class="row" data-row={i}>
      {#if person.literal}
        <input
          id={i === 0 ? id : undefined}
          class="whole"
          value={person.family}
          placeholder="Name"
          aria-label="{label}: name"
          oninput={(e) => set(i, 'family', e.currentTarget.value)}
          onkeydown={(e) => onkeydown(e, i)}
        />
      {:else}
        <input
          id={i === 0 ? id : undefined}
          value={person.family}
          placeholder="Family name"
          aria-label="{label}: family name"
          oninput={(e) => set(i, 'family', e.currentTarget.value)}
          onkeydown={(e) => onkeydown(e, i)}
          onpaste={(e) => onpaste(e, i)}
        />
        <input
          value={person.given ?? ''}
          placeholder="Given names"
          aria-label="{label}: given names"
          oninput={(e) => set(i, 'given', e.currentTarget.value)}
          onkeydown={(e) => onkeydown(e, i)}
        />
      {/if}
      <button
        type="button"
        class="more"
        aria-label="More for this name"
        tabindex="-1"
        onclick={(e) => menu(e, i)}
      >
        <Ellipsis size={14} />
      </button>
    </div>
    {#if !person.literal && (expanded.has(i) || person.prefix || person.suffix)}
      <div class="row extra">
        <input
          value={person.prefix ?? ''}
          placeholder="Prefix: van, de la"
          aria-label="{label}: prefix"
          oninput={(e) => set(i, 'prefix', e.currentTarget.value)}
        />
        <input
          value={person.suffix ?? ''}
          placeholder="Suffix: Jr., III"
          aria-label="{label}: suffix"
          oninput={(e) => set(i, 'suffix', e.currentTarget.value)}
        />
        <span class="more"></span>
      </div>
    {/if}
  {/each}
  <button type="button" class="add" onclick={() => add()}>
    <Plus size={12} />
    <span>{label.toLowerCase()}</span>
  </button>
</div>

<style>
  .names {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 22px;
    gap: 2px;
    align-items: center;
  }
  .row:has(.whole) {
    grid-template-columns: minmax(0, 1fr) 22px;
  }
  .extra input {
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  input {
    height: 28px;
    min-width: 0;
    padding: 0 7px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    outline: none;
    transition:
      border-color var(--fast) var(--ease),
      background var(--fast) var(--ease);
  }
  input:hover {
    border-color: var(--line-strong);
  }
  input:focus {
    border-color: var(--accent);
    background: var(--paper-raised);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input::placeholder {
    color: var(--ink-4);
  }
  .more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
  }
  .row:hover .more,
  .row:focus-within .more {
    opacity: 1;
  }
  button.more:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    align-self: flex-start;
    margin: 0 0 2px 4px;
    padding: 1px 6px 1px 4px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .add:hover {
    background: var(--paper-hover);
    color: var(--accent-strong);
  }
</style>
