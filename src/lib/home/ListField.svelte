<script lang="ts">
  /**
   * The field at the top of the list of projects (record 0098). In the list
   * at the left it searches what is written in the projects, all of them or
   * the one opened last, and what is found stands in the list in the place
   * of the tree; or, chosen from the menu of its glass, it finds a project
   * by its name, as the list has always done. Elsewhere, in the dropdown of
   * the path and in the chooser of a project, it only finds a project.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import { tick, untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import { everything } from '$lib/search/everything.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { listUi } from './list.svelte';

  interface Props {
    /** Whether the field searches what is written in the projects as well: the list at the left. */
    search?: boolean;
    /** The words that find a project, where the field does not search what is written. */
    filter?: string;
    /** Down from the field, into what it found. */
    ondown?: () => void;
  }

  let { search = false, filter = $bindable(''), ondown }: Props = $props();

  let input = $state<HTMLInputElement>();

  /** Whether the field searches what is written, rather than finding a project. */
  const texts = $derived(search && listUi.field === 'texts');

  const placeholder = $derived(
    !texts
      ? t('home-search')
      : everything.scope === 'all'
        ? t('search-everything-field')
        : t('home-search-last'),
  );

  // What is written is searched for again, a moment after the words or the
  // options were changed. It depends on them and on what the field does.
  let first = true;
  $effect(() => {
    void everything.words;
    void everything.scope;
    const o = everything.options;
    void [o.caseSensitive, o.wholeWords, o.accentsAlike, o.regex, o.labels];
    const on = texts;
    if (first) {
      first = false;
      return;
    }
    if (on) untrack(() => everything.later());
  });

  // The field takes the cursor where it is asked to, by Ctrl+Shift+F. It
  // depends on the asking.
  $effect(() => {
    if (!search || !listUi.fieldAsked) return;
    untrack(() => {
      listUi.fieldAsked = false;
      void tick().then(() => {
        input?.focus();
        input?.select();
      });
    });
  });

  /** The menu of the glass: what the field searches. */
  function what(anchor: HTMLElement) {
    // What is written is searched for again by the effect above, where the field searches it now.
    const set = (field: 'texts' | 'names', scope = everything.scope) => {
      listUi.field = field;
      everything.scope = scope;
      input?.focus();
    };
    openMenu(anchor, [
      {
        label: t('search-all-projects'),
        checked: texts && everything.scope === 'all',
        action: () => set('texts', 'all'),
      },
      {
        label: t('search-last-project'),
        checked: texts && everything.scope === 'last',
        action: () => set('texts', 'last'),
      },
      { kind: 'separator' },
      { label: t('home-search'), checked: !texts, action: () => set('names') },
    ]);
  }

  function clear() {
    if (search) everything.words = '';
    else filter = '';
    input?.focus();
  }

  function onkeydown(event: KeyboardEvent) {
    const words = search ? everything.words : filter;
    if (event.key === 'Escape' && words) {
      event.preventDefault();
      event.stopPropagation();
      clear();
    } else if (event.key === 'Enter' && texts) {
      event.preventDefault();
      void everything.search();
    } else if (event.key === 'ArrowDown' && ondown) {
      event.preventDefault();
      ondown();
    }
  }
</script>

<TextField
  bind:el={input}
  bind:value={
    () => (search ? everything.words : filter),
    (v) => (search ? (everything.words = v) : (filter = v))
  }
  size="sm"
  type="search"
  {placeholder}
  aria-label={placeholder}
  data-list-field={texts ? 'texts' : 'names'}
  {onkeydown}
>
  {#snippet leading()}
    {#if search}
      <button
        type="button"
        class="what"
        aria-label={t('home-search-what')}
        aria-haspopup="menu"
        data-list-field-menu
        use:tooltip={{ text: t('home-search-what') }}
        onclick={(e) => what(e.currentTarget)}
        ><Search size={14} /><ChevronDown size={10} strokeWidth={2.2} /></button
      >
    {:else}
      <Search size={14} />
    {/if}
  {/snippet}
  {#snippet trailing()}
    {#if search ? everything.words : filter}
      <button type="button" class="clear" aria-label={t('common-close')} onclick={clear}
        ><X size={12} /></button
      >
    {/if}
  {/snippet}
</TextField>

<style>
  .what,
  .clear {
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .what {
    gap: 0;
    margin-left: -4px;
    padding: 2px 1px 2px 3px;
  }
  .what:hover,
  .clear:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .clear {
    margin-right: -4px;
    border-radius: 50%;
  }
  :global([data-list-field])::-webkit-search-cancel-button {
    display: none;
  }
</style>
