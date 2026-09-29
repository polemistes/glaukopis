<script lang="ts">
  /**
   * One work of what is gone through: what the text says of it, the
   * reference it is taken for with how sure that is and why, the others it
   * may be, and the means to find another or to add it to the library.
   */
  import BookPlus from '@lucide/svelte/icons/book-plus';
  import Search from '@lucide/svelte/icons/search';
  import CitationItem from '$lib/editor/CitationItem.svelte';
  import { lookup } from '$lib/editor/references.svelte';
  import type { CiteMode } from '$lib/editor/schema';
  import { languages, t } from '$lib/i18n';
  import { truncate, wordsAround } from '$lib/library/format';
  import { certain, describeItem } from './works';
  import type { Work } from './going.svelte';

  interface Props {
    work: Work;
    mode: CiteMode;
    index: number;
    /** Whether the library is being asked for it. */
    asking: boolean;
    onchoose: (reference: string) => void;
    onremove: () => void;
    onedit: (id: string) => void;
    /** Another reference is to be looked for; the button is where the picker opens. */
    onanother: (anchor: HTMLElement) => void;
    /** It is to be added to the library from what the file says of it. */
    onadd: () => void;
  }

  let {
    work = $bindable(),
    mode,
    index,
    asking,
    onchoose,
    onremove,
    onedit,
    onanother,
    onadd,
  }: Props = $props();

  const SURE = $derived({
    certain: t('found-work-certain'),
    likely: t('found-work-likely'),
    possible: t('found-work-possible'),
  });

  /** What is said of a work that no reference is taken for, around the work, where the language puts it. */
  const untaken = $derived(
    wordsAround((mark) =>
      asking
        ? t('found-work-looking', { work: mark })
        : work.item.key && !work.item.data
          ? t('found-work-no-tag', { work: mark })
          : t('found-work-not-found', { work: mark }),
    ),
  );

  const taken = $derived(work.suggestions.find((s) => s.reference === work.reference));
  const others = $derived(work.suggestions.filter((s) => s.reference !== work.reference));
  const said = $derived(describeItem(work.item));
  /** What the text says the work is, in a line. */
  const told = $derived(
    [[said.who, said.year].filter(Boolean).join(' '), said.title].filter(Boolean).join(', ') ||
      work.item.key ||
      work.words,
  );
  /** The file says what the work is, and neither the library nor the writer has said which it is. */
  const addable = $derived(
    !!work.item.data && !certain(work.suggestions) && !(work.chosen && work.reference),
  );
</script>

<CitationItem reference={work.reference} bind:said={work} {mode} {index} {onremove} {onedit}>
  {#snippet unknown()}
    {#if untaken[0]}<span class="none">{untaken[0]}</span>{/if}<span class="told"
      >{told || t('found-work-a-work')}</span
    ><span class="none">{untaken[1]}</span>
  {/snippet}
  {#snippet more()}
    <div class="more">
      {#if work.reference}
        <div class="sure" data-sure={work.chosen ? 'chosen' : (taken?.sure ?? 'possible')}>
          {#if work.chosen}
            {t('found-work-chosen')}
          {:else if taken}
            {SURE[taken.sure]}{taken.why ? ` · ${taken.why}` : ''}
          {/if}
          {#if told}<span class="from">{t('found-work-for', { work: truncate(told, 80) })}</span
            >{/if}
        </div>
      {/if}
      {#if others.length}
        <div class="others" role="group" aria-label={t('found-work-others')}>
          <span class="or">{work.reference ? t('found-work-or') : t('found-work-may-be')}</span>
          {#each others as other (other.reference)}
            {@const ref = lookup(other.reference)}
            <button type="button" class="other" onclick={() => onchoose(other.reference)}>
              <span class="who">{ref ? `${ref.authors || '—'} ${ref.year}` : other.reference}</span>
              {#if ref}<span class="title serif">{truncate(ref.title, 48)}</span>{/if}
              <span class="how"
                >{SURE[other.sure].toLocaleLowerCase(languages.current)} · {other.why}</span
              >
            </button>
          {/each}
        </div>
      {/if}
      <div class="means">
        <button type="button" class="mean" onclick={(e) => onanother(e.currentTarget)}>
          <Search size={13} />
          {work.reference ? t('found-work-another') : t('found-work-find')}
        </button>
        {#if addable}
          <button type="button" class="mean" onclick={onadd}>
            <BookPlus size={13} />
            {t('found-work-add')}
          </button>
        {/if}
      </div>
    </div>
  {/snippet}
</CitationItem>

<style>
  .told {
    font-weight: 550;
  }
  .none {
    color: var(--ink-3);
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
  }
  .sure {
    font-size: var(--text-sm);
    font-weight: 550;
    color: var(--ink-2);
  }
  .sure[data-sure='certain'] {
    color: var(--ok);
  }
  .sure[data-sure='likely'],
  .sure[data-sure='chosen'] {
    color: var(--accent-strong);
  }
  .sure[data-sure='possible'] {
    color: var(--warn);
  }
  .from {
    margin-left: 6px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .others {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .or {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .other {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 3px 7px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .other:hover {
    border-color: var(--accent);
    background: var(--accent-softer);
  }
  .who {
    font-weight: 550;
  }
  .title {
    color: var(--ink-2);
  }
  .how {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .means {
    display: flex;
    gap: 4px;
  }
  .mean {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 8px;
    margin-left: -8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
  }
  .mean + .mean {
    margin-left: 0;
  }
  .mean:hover {
    background: var(--paper-hover);
  }
</style>
