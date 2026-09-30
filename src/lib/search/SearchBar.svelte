<script lang="ts">
  import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Regex from '@lucide/svelte/icons/regex';
  import Search from '@lucide/svelte/icons/search';
  import Tag from '@lucide/svelte/icons/tag';
  import TextSelect from '@lucide/svelte/icons/text-select';
  import WholeWord from '@lucide/svelte/icons/whole-word';
  import X from '@lucide/svelte/icons/x';
  import { onMount, untrack } from 'svelte';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { remembered, type TextSearch } from './text.svelte';

  interface Props {
    search: TextSearch;
    /** Closes the bar; the search has been told. */
    onclose: () => void;
    /** Narrower, as in the edit box of an element. */
    compact?: boolean;
  }

  let { search, onclose, compact = false }: Props = $props();

  let field = $state<HTMLInputElement>();
  let replaceField = $state<HTMLInputElement>();

  /** Puts the cursor in the words, all of them selected. */
  export function focusQuery() {
    field?.focus();
    field?.select();
  }

  /** Shows the field of what replaces, and puts the cursor there. */
  export function focusReplace() {
    search.replacing = true;
    queueMicrotask(() => {
      replaceField?.focus();
      replaceField?.select();
    });
  }

  onMount(() => {
    if (search.replacing && search.query) focusReplace();
    else focusQuery();
  });

  // What is searched for is searched for again, a moment after it was changed.
  let first = true;
  $effect(() => {
    void search.query;
    void search.replacing;
    const o = remembered.options;
    void [o.caseSensitive, o.wholeWords, o.accentsAlike, o.regex, o.labels];
    if (first) {
      first = false;
      return;
    }
    untrack(() => {
      // What was replaced is said until the words are written anew.
      search.replaced = null;
      search.later(undefined, true);
    });
  });

  // Text selected in an editor here is what the search can be kept to.
  $effect(() => {
    const selection = editorUi.selection;
    if (!selection || selection.empty) return;
    untrack(() => search.noticeSelection(selection.view));
  });

  const said = $derived.by(() => {
    if (search.error) return t('search-invalid');
    if (search.replaced !== null) return t('search-replaced', { count: search.replaced });
    if (!search.query) return '';
    const count = search.matches.length;
    if (!count) return t('search-nothing');
    if (search.index >= 0) return t('search-count', { current: search.index + 1, count });
    return t('search-found', { count });
  });

  function toggle(option: 'caseSensitive' | 'wholeWords' | 'accentsAlike' | 'regex' | 'labels') {
    remembered.options[option] = !remembered.options[option];
  }

  function close() {
    onclose();
  }

  /** The keys of the bar, in either field. */
  function keys(event: KeyboardEvent, which: 'find' | 'replace') {
    const mod = event.ctrlKey || event.metaKey;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'F3') {
      event.preventDefault();
      if (event.shiftKey) search.previous();
      else search.next();
    } else if (event.key === 'Enter' && which === 'find') {
      event.preventDefault();
      if (event.shiftKey) search.previous();
      else search.next();
    } else if (event.key === 'Enter' && which === 'replace') {
      event.preventDefault();
      if (mod && event.altKey) search.replaceAll();
      else search.replace();
    } else if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      focusReplace();
    } else if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      focusQuery();
    } else return;
    // What the bar takes is not taken again by what it stands in.
    event.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="search-bar"
  class:compact
  role="search"
  onmousedown={(e) => {
    // Pressing the bar keeps the cursor where it is, unless a field is pressed.
    if (!(e.target as HTMLElement).closest('input')) e.preventDefault();
  }}
>
  <div class="row">
    <IconButton
      label={search.replacing ? t('search-hide-replace') : t('search-show-replace')}
      shortcut={search.replacing ? undefined : 'Ctrl+H'}
      size="sm"
      onclick={() => (search.replacing ? (search.replacing = false) : focusReplace())}
    >
      {#if search.replacing}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
    </IconButton>
    <label class="field" class:invalid={!!search.error}>
      <Search size={14} />
      <input
        bind:this={field}
        bind:value={search.query}
        placeholder={t('search-find')}
        aria-label={t('search-find')}
        spellcheck="false"
        autocomplete="off"
        onkeydown={(e) => keys(e, 'find')}
      />
    </label>
    <span class="said" class:none={!!search.query && !search.matches.length} aria-live="polite"
      >{said}</span
    >
    <IconButton
      label={t('search-previous')}
      shortcut="Shift+Enter"
      size="sm"
      disabled={!search.matches.length}
      onclick={() => search.previous()}
    >
      <ChevronUp size={15} />
    </IconButton>
    <IconButton
      label={t('search-next')}
      shortcut="Enter"
      size="sm"
      disabled={!search.matches.length}
      onclick={() => search.next()}
    >
      <ChevronDown size={15} />
    </IconButton>
    <span class="sep"></span>
    <div class="options" role="group">
      <IconButton
        label={t('search-case')}
        size="sm"
        active={remembered.options.caseSensitive}
        onclick={() => toggle('caseSensitive')}
      >
        <CaseSensitive size={16} />
      </IconButton>
      <IconButton
        label={t('search-whole-words')}
        size="sm"
        active={remembered.options.wholeWords}
        onclick={() => toggle('wholeWords')}
      >
        <WholeWord size={16} />
      </IconButton>
      <button
        type="button"
        class="sign"
        class:active={remembered.options.accentsAlike}
        aria-pressed={remembered.options.accentsAlike}
        aria-label={t('search-accents')}
        use:tooltip={{ text: t('search-accents') }}
        onclick={() => toggle('accentsAlike')}>{t('search-accents-sign')}</button
      >
      <IconButton
        label={t('search-regex')}
        size="sm"
        active={remembered.options.regex}
        onclick={() => toggle('regex')}
      >
        <Regex size={15} />
      </IconButton>
      <IconButton
        label={search.selected ? t('search-selection') : t('search-selection-none')}
        size="sm"
        active={!!search.scope}
        disabled={!search.selected && !search.scope}
        onclick={() => search.keepToSelection(!search.scope)}
      >
        <TextSelect size={15} />
      </IconButton>
      {#if !search.replacing}
        <IconButton
          label={t('search-labels')}
          size="sm"
          active={remembered.options.labels}
          onclick={() => toggle('labels')}
        >
          <Tag size={14} />
        </IconButton>
      {/if}
    </div>
    <span class="spring"></span>
    <IconButton label={t('search-close')} shortcut="Esc" size="sm" onclick={close}>
      <X size={14} />
    </IconButton>
  </div>
  {#if search.replacing}
    <div class="row">
      <span class="indent"></span>
      <label class="field">
        <input
          bind:this={replaceField}
          bind:value={search.replacement}
          placeholder={t('search-replace-with')}
          aria-label={t('search-replace-with')}
          spellcheck="false"
          autocomplete="off"
          onkeydown={(e) => keys(e, 'replace')}
        />
      </label>
      <Button
        size="sm"
        disabled={!search.current && !search.matches.length}
        onclick={() => search.replace()}>{t('search-replace')}</Button
      >
      <Button size="sm" disabled={!search.matches.length} onclick={() => search.replaceAll()}
        >{t('search-replace-all')}</Button
      >
    </div>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-sunken);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .indent {
    width: 24px;
    flex: none;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 1 300px;
    min-width: 120px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink-3);
    cursor: text;
  }
  .field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .field.invalid {
    border-color: var(--danger);
  }
  .field input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-md);
    outline: none;
  }
  .field input::placeholder {
    color: var(--ink-4);
  }
  .said {
    flex: none;
    min-width: 64px;
    padding: 0 6px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .said.none {
    color: var(--danger);
  }
  .sep {
    width: 1px;
    height: 16px;
    margin: 0 4px;
    flex: none;
    background: var(--line);
  }
  .options {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .sign {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 3px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: -0.02em;
    cursor: pointer;
  }
  .sign:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .sign.active {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .spring {
    flex: 1;
  }
  .compact .said {
    min-width: 0;
  }
  .compact .field {
    flex: 1 1 160px;
  }

  /* What is found, where it stands: all of it, the one that is shown, and the text a search is kept to. */
  :global(::highlight(search)) {
    background-color: color-mix(in srgb, var(--gold) 26%, transparent);
  }
  :global(::highlight(search-current)) {
    background-color: color-mix(in srgb, var(--gold) 62%, transparent);
    color: var(--ink);
  }
  :global(::highlight(search-scope)) {
    background-color: color-mix(in srgb, var(--accent) 9%, transparent);
  }
  /* The same, where an editor draws the marks itself: see decorations.ts. */
  :global(.search-mark) {
    background-color: color-mix(in srgb, var(--gold) 26%, transparent);
  }
  :global(.search-mark.current) {
    background-color: color-mix(in srgb, var(--gold) 62%, transparent);
  }
  :global(.search-scope) {
    background-color: color-mix(in srgb, var(--accent) 9%, transparent);
  }
  :global(.footnote.search-found) {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent);
  }
  :global(.footnote.search-current) {
    box-shadow: 0 0 0 2px var(--gold);
  }
</style>
