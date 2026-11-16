<!--
  The user's guide in the window of Help: the contents at the left, with the
  field that finds in the guide over them, and the chapter in view at the
  right, one chapter at a time, with the chapters before and after it at its
  foot. It opens where it was left, if it was left at the place it is opened
  at, and else at the part of the guide about that place (see help-ui).
-->
<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Search from '@lucide/svelte/icons/search';
  import { t } from '$lib/i18n';
  import { keyOf } from '$lib/shell/keys.svelte';
  import {
    chapterById,
    chapterHtml,
    findInGuide,
    loadGuide,
    partByTitle,
    queryWords,
    type Found,
    type Guide,
  } from './guide';
  import { helpUi } from './help-ui.svelte';
  import { markWords, unmark } from './marks';

  /** Where in the chapter drawn the page is to be brought: how far down, a part's heading, or the first hit in a part. */
  type Going = { top: number } | { part: string } | { hit: string };

  let guide = $state.raw<Guide | null>(null);
  let chapterId = $state('');
  let query = $state('');
  let active = $state(0);
  let going = $state.raw<Going | null>(null);

  let field = $state<HTMLInputElement>();
  let page = $state<HTMLElement>();
  let text = $state<HTMLElement>();
  let side = $state<HTMLElement>();

  /** How far down the chapter has been read: kept when Help closes. */
  let scrolled = 0;
  /** The chapter whose HTML is in the text now. */
  let drawn: string | null = null;

  const chapter = $derived(guide ? chapterById(guide, chapterId) : undefined);
  const index = $derived(guide && chapter ? guide.chapters.indexOf(chapter) : -1);
  const previous = $derived(guide && index > 0 ? guide.chapters[index - 1] : undefined);
  const next = $derived(guide && index >= 0 ? guide.chapters[index + 1] : undefined);
  const words = $derived(queryWords(query));
  const found = $derived(guide && words.length ? findInGuide(guide, query) : []);

  onMount(() => {
    let gone = false;
    loadGuide().then(
      (read) => {
        if (gone) return;
        guide = read;
        const back = helpUi.resumed;
        if (back && chapterById(read, back.chapter)) {
          chapterId = back.chapter;
          going = { top: back.scroll };
          return;
        }
        const at = helpUi.place ? partByTitle(read, helpUi.place) : null;
        chapterId = at?.chapter.id ?? read.chapters[0]?.id ?? '';
        going = at && at.part !== at.chapter.parts[0] ? { part: at.part.id } : { top: 0 };
      },
      (error) => console.error('The guide could not be read', error),
    );
    return () => {
      gone = true;
      if (chapterId) helpUi.left = { place: helpUi.place, chapter: chapterId, scroll: scrolled };
    };
  });

  // The chapter drawn, and the words found marked in it. Every mark is taken
  // out first, whatever was drawn: see marks.ts.
  $effect(() => {
    const el = text;
    if (!el || !chapter) return;
    const marking = words;
    if (drawn !== chapter.id) {
      el.innerHTML = chapterHtml(chapter);
      drawn = chapter.id;
    }
    unmark(el);
    markWords(el, marking);
  });

  // Then the place in it that is to be read, once it is drawn and marked.
  $effect(() => {
    const want = going;
    void words;
    if (!want || !chapter || !page || !text) return;
    untrack(() => {
      going = null;
      bring(want);
    });
  });

  // A new search begins at its first hit.
  $effect(() => {
    void query;
    active = 0;
  });

  // The hit chosen, and the chapter in view in the contents, are kept in sight.
  $effect(() => {
    void active;
    void chapterId;
    void found;
    side
      ?.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="page"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  });

  /** Brings the page to where it is to be read. */
  function bring(want: Going) {
    if (!page || !text) return;
    if ('top' in want) {
      page.scrollTop = want.top;
    } else {
      const id = 'part' in want ? want.part : want.hit;
      const heading = text.querySelector<HTMLElement>(`[data-help-heading="${id}"]`);
      const target = 'hit' in want ? (firstMarkIn(id) ?? heading) : heading;
      if (target) {
        const top =
          target.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop;
        // A heading at the top; a word found a third of the way down, with what leads to it over it.
        page.scrollTop = target === heading ? top - 16 : top - page.clientHeight / 3;
      }
    }
    scrolled = page.scrollTop;
  }

  /** The first word marked in a part: after its heading, before the next part's. */
  function firstMarkIn(id: string): HTMLElement | null {
    if (!text) return null;
    let within = false;
    for (const el of text.querySelectorAll<HTMLElement>(
      '[data-help-heading], mark[data-help-mark]',
    )) {
      if (el.dataset.helpHeading !== undefined) {
        if (within) return null;
        within = el.dataset.helpHeading === id;
      } else if (within) return el;
    }
    return null;
  }

  /** Shows a chapter, at its beginning or at one of its parts. */
  function show(id: string, part?: string) {
    chapterId = id;
    going = part ? { part } : { top: 0 };
  }

  /** Shows the part in which words were found, at the first of them. */
  function go(hit: Found) {
    chapterId = hit.chapter.id;
    going = { hit: hit.part.id };
  }

  function onFieldKey(event: KeyboardEvent) {
    const n = found.length;
    if (event.key === 'ArrowDown' && words.length) active = n ? (active + 1) % n : 0;
    else if (event.key === 'ArrowUp' && words.length) active = n ? (active - 1 + n) % n : 0;
    else if (event.key === 'Enter' && words.length) {
      if (found[active]) go(found[active]);
    }
    // Escape empties the field; where it is empty, it closes Help, as it does elsewhere.
    else if (event.key === 'Escape' && query) query = '';
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onkeydown(event: KeyboardEvent) {
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      keyOf(event) === 'f'
    ) {
      event.preventDefault();
      field?.focus();
      field?.select();
      return;
    }
    // The keys that move about a page are Help's own here, not those of a file read behind it.
    const moving = ['PageDown', 'PageUp', 'Home', 'End'].includes(event.key);
    if (moving && !(event.target as HTMLElement).closest('input')) event.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="help" data-help {onkeydown}>
  <aside class="side" bind:this={side}>
    <label class="find">
      <Search size={14} strokeWidth={1.8} />
      <input
        bind:this={field}
        bind:value={query}
        type="search"
        placeholder={t('help-find')}
        aria-label={t('help-find')}
        spellcheck="false"
        data-help-find
        onkeydown={onFieldKey}
      />
    </label>
    {#if words.length}
      <ul class="hits" role="listbox" aria-label={t('help-find')}>
        {#each found as hit, i (hit.part.id)}
          <li
            role="option"
            aria-selected={i === active}
            class:active={i === active}
            data-help-hit={hit.part.id}
            onpointermove={() => (active = i)}
            onclick={() => go(hit)}
            onkeydown={() => {}}
          >
            <span class="title">{hit.part.title}</span>
            {#if hit.part !== hit.chapter.parts[0]}
              <span class="chapter-name">{hit.chapter.title}</span>
            {/if}
            <span class="line">{hit.before}<mark>{hit.hit}</mark>{hit.after}</span>
          </li>
        {:else}
          <li class="none">{t('help-none')}</li>
        {/each}
      </ul>
    {:else if guide}
      <nav class="contents" aria-label={t('help-contents')}>
        <ul>
          {#each guide.chapters as c (c.id)}
            <li>
              <button
                type="button"
                class="chapter"
                class:current={c.id === chapterId}
                aria-current={c.id === chapterId ? 'page' : undefined}
                data-help-chapter={c.id}
                onclick={() => show(c.id)}>{c.title}</button
              >
              {#if c.id === chapterId && c.parts.length > 1}
                <ul class="parts">
                  {#each c.parts.slice(1) as p (p.id)}
                    <li>
                      <button
                        type="button"
                        class="part"
                        data-help-part={p.id}
                        onclick={() => show(c.id, p.id)}>{p.title}</button
                      >
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  </aside>

  <div
    class="page"
    bind:this={page}
    tabindex="-1"
    data-autofocus
    onscroll={() => (scrolled = page?.scrollTop ?? 0)}
  >
    <!-- Drawn from the guide's HTML, everything in it escaped: see markdown.ts. -->
    <article class="text" data-help-text bind:this={text}></article>
    {#if chapter && (previous || next)}
      <nav class="steps">
        {#if previous}
          <button type="button" class="step" data-help-previous onclick={() => show(previous.id)}>
            <span class="what">{t('help-previous')}</span>
            <span class="name"><ChevronLeft size={15} />{previous.title}</span>
          </button>
        {:else}
          <span></span>
        {/if}
        {#if next}
          <button type="button" class="step after" data-help-next onclick={() => show(next.id)}>
            <span class="what">{t('help-next')}</span>
            <span class="name">{next.title}<ChevronRight size={15} /></span>
          </button>
        {/if}
      </nav>
    {/if}
  </div>
</div>

<style>
  .help {
    display: grid;
    grid-template-columns: minmax(200px, 280px) minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    border-top: 1px solid var(--line);
  }

  /* The contents, and the field over them. */
  .side {
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-3) var(--space-2) var(--space-4) var(--space-3);
    border-right: 1px solid var(--line);
    background: var(--paper);
  }
  .find {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    margin: 0 0 var(--space-2);
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    color: var(--ink-3);
  }
  .find:focus-within {
    box-shadow: 0 0 0 2px var(--focus-ring);
  }
  .find input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: none;
    color: var(--ink);
    font-size: var(--text-md);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .contents button {
    display: block;
    width: 100%;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--ink-2);
    font-size: var(--text-md);
    text-align: left;
    cursor: pointer;
  }
  .contents button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .contents .chapter.current {
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 500;
  }
  .parts {
    margin: 2px 0 6px 10px;
    padding-left: 6px;
    border-left: 1px solid var(--line);
  }
  .contents .part {
    padding: 3px 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }

  /* What is found. */
  .hits li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .hits li.active {
    background: var(--accent-soft);
  }
  .hits .title {
    font-size: var(--text-md);
    font-weight: 500;
  }
  .hits .chapter-name {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .hits .line {
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.4;
  }
  .hits mark {
    background: var(--highlight);
    color: inherit;
  }
  .hits .none {
    color: var(--ink-3);
    cursor: default;
  }

  /* The chapter, as reading text. */
  .page {
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-4) var(--space-6) var(--space-6);
    background: var(--paper-raised);
    outline: none;
  }
  .text {
    max-width: 70ch;
    margin: 0 auto;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 15.5px;
    line-height: 1.6;
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
  }
  .text :global(h2) {
    margin: 0.4em 0 0.8em;
    font-size: 1.6em;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }
  .text :global(h3) {
    margin: 1.8em 0 0.5em;
    font-size: 1.2em;
    font-weight: 600;
    line-height: 1.3;
  }
  .text :global(h4) {
    margin: 1.4em 0 0.4em;
    font-size: 1em;
    font-weight: 600;
  }
  .text :global(p) {
    margin: 0 0 0.85em;
  }
  .text :global(ul),
  .text :global(ol) {
    margin: 0 0 0.85em;
    padding-left: 1.6em;
  }
  .text :global(ul) {
    list-style: disc;
  }
  .text :global(ol) {
    list-style: decimal;
  }
  .text :global(li) {
    margin: 0.25em 0;
  }
  .text :global(li > p) {
    margin: 0 0 0.5em;
  }
  .text :global(code) {
    padding: 0.05em 0.3em;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    font-family: var(--font-mono);
    font-size: 0.86em;
  }
  .text :global(.table) {
    margin: 0 0 1em;
    overflow-x: auto;
  }
  .text :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92em;
    line-height: 1.45;
  }
  .text :global(th),
  .text :global(td) {
    padding: 5px 10px 5px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .text :global(th) {
    border-bottom-color: var(--line-strong);
    font-weight: 600;
  }
  .text :global(mark[data-help-mark]) {
    border-radius: 2px;
    background: var(--highlight);
    color: inherit;
  }

  /* The chapters before and after. */
  .steps {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    max-width: 70ch;
    margin: var(--space-6) auto 0;
    padding-top: var(--space-4);
    border-top: 1px solid var(--line);
  }
  .step {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 6px 10px;
    border: none;
    border-radius: var(--radius-m);
    background: none;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .step:hover {
    background: var(--paper-hover);
  }
  .step.after {
    margin-left: auto;
    align-items: flex-end;
    text-align: right;
  }
  .step .what {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .step .name {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-text);
    font-size: var(--text-lg);
  }
</style>
