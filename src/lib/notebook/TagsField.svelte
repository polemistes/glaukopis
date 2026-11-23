<script lang="ts">
  /**
   * The tags of a note, under its name (stage 2): each a small chip with an
   * × that takes it away, and a field after them that adds one. What is
   * typed offers the tags there are that begin with it or hold it, in a
   * small list under the field: the arrows mark one, Enter takes the one
   * marked; with none marked, Enter or a comma adds what was typed as a new
   * tag. Backspace in the empty field takes the last tag away; Escape
   * closes the list.
   */
  import { tick } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import { place } from '$lib/ui/floating';
  import { onTop } from '$lib/ui/top';
  import type { TagCount } from './model/types';
  import { offeredTags } from './page.svelte';

  interface Props {
    /** The tags the note has. */
    tags: readonly string[];
    /** Every tag there is, with how many notes have it. */
    all: readonly TagCount[];
    onadd: (tag: string) => void;
    onremove: (tag: string) => void;
  }

  let { tags, all, onadd, onremove }: Props = $props();

  const listId = `tags-offered-${Math.random().toString(36).slice(2, 9)}`;

  let field = $state<HTMLInputElement>();
  let list = $state<HTMLUListElement>();
  let typed = $state('');
  let focused = $state(false);
  /** Escape closed the list: it opens again as more is typed. */
  let dismissed = $state(false);
  /** The tag marked in the list, by its place; none where none is. */
  let marked = $state(-1);

  const offered = $derived(offeredTags(all, typed, tags));
  const open = $derived(focused && !dismissed && offered.length > 0);

  // What is offered changes as it is typed: nothing is marked until the arrows mark it.
  $effect(() => {
    void offered;
    marked = -1;
  });

  // The list lies under the field, over what is around it.
  $effect(() => {
    if (!open || !list || !field) return;
    void offered.length;
    place(list, field.getBoundingClientRect(), { side: 'bottom', align: 'start', gap: 4 });
  });

  function add(tag: string) {
    if (tag.trim()) onadd(tag);
    typed = '';
    dismissed = false;
  }

  function onkeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!offered.length) return;
        event.preventDefault();
        dismissed = false;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        marked =
          marked < 0
            ? step > 0
              ? 0
              : offered.length - 1
            : (marked + step + offered.length) % offered.length;
        return;
      }
      case 'Enter':
        event.preventDefault();
        add(open && marked >= 0 ? offered[marked] : typed);
        return;
      case ',':
        event.preventDefault();
        add(typed);
        return;
      case 'Backspace':
        if (!typed && tags.length) {
          event.preventDefault();
          onremove(tags[tags.length - 1]);
        }
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          dismissed = true;
        }
        return;
    }
  }

  /** Gives the field the cursor. */
  export function focus() {
    field?.focus();
  }
</script>

<div class="tags" data-note-tags>
  {#each tags as tag (tag)}
    <span class="chip" data-tag={tag}>
      <span class="word truncate">{tag}</span>
      <button
        type="button"
        class="away"
        aria-label={t('notebook-tag-take-away', { tag })}
        onclick={() => {
          onremove(tag);
          void tick().then(() => field?.focus());
        }}
      >
        <X size={11} />
      </button>
    </span>
  {/each}
  <input
    bind:this={field}
    bind:value={typed}
    class="field"
    placeholder={tags.length ? '' : t('notebook-tag-add')}
    aria-label={t('notebook-tag-add')}
    role="combobox"
    aria-expanded={open}
    aria-controls={listId}
    aria-autocomplete="list"
    aria-activedescendant={open && marked >= 0 ? `${listId}-${marked}` : undefined}
    spellcheck="false"
    autocomplete="off"
    data-tag-field
    oninput={() => (dismissed = false)}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
    {onkeydown}
  />
</div>

{#if open}
  <ul
    bind:this={list}
    id={listId}
    class="offered"
    role="listbox"
    aria-label={t('notebook-tags-offered')}
    use:onTop
    data-tags-offered
  >
    {#each offered as tag, i (tag)}
      <!-- The field keeps the cursor: a press takes the tag without taking the focus. -->
      <li
        id="{listId}-{i}"
        class="option truncate"
        class:marked={i === marked}
        role="option"
        aria-selected={i === marked}
        data-offered={tag}
        onpointerdown={(e) => {
          e.preventDefault();
          add(tag);
        }}
        onpointerenter={() => (marked = i)}
      >
        {tag}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    min-height: 26px;
    margin-top: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    height: 22px;
    padding: 0 3px 0 9px;
    border-radius: 11px;
    background: var(--paper-sunken);
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .word {
    min-width: 0;
  }
  .away {
    display: inline-flex;
    padding: 3px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  @media (hover: hover) {
    .away:hover {
      background: var(--paper-hover);
      color: var(--ink);
    }
  }
  .field {
    flex: 1;
    min-width: 8em;
    height: 22px;
    padding: 0 2px;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
  }
  .field::placeholder {
    color: var(--ink-4);
  }
  .offered {
    position: fixed;
    z-index: 800;
    left: 0;
    top: 0;
    min-width: 160px;
    max-width: 320px;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-2);
  }
  .option {
    padding: 4px 8px;
    border-radius: var(--radius-s);
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .option.marked {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
</style>
