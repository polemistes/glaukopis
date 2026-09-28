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
  import { truncate } from '$lib/library/format';
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

  const SURE = { certain: 'Certain', likely: 'Likely', possible: 'Possible' } as const;

  const taken = $derived(work.suggestions.find((s) => s.reference === work.reference));
  const others = $derived(work.suggestions.filter((s) => s.reference !== work.reference));
  const said = $derived(describeItem(work.item));
  /** What the text says the work is, in a line. */
  const told = $derived(
    [[said.who, said.year].filter(Boolean).join(' '), said.title].filter(Boolean).join(', ') ||
      work.item.key ||
      work.words,
  );
  /** The file says what the work is, and the library does not have it for certain. */
  const addable = $derived(!!work.item.data && !certain(work.suggestions));
</script>

<CitationItem reference={work.reference} bind:said={work} {mode} {index} {onremove} {onedit}>
  {#snippet unknown()}
    <span class="told">{told || 'A work'}</span>
    <span class="none">
      {#if asking}
        is looked for in your library…
      {:else if work.item.key && !work.item.data}
        is a tag that no reference of your library has.
      {:else}
        was not found in your library.
      {/if}
    </span>
  {/snippet}
  {#snippet more()}
    <div class="more">
      {#if work.reference}
        <div class="sure" data-sure={work.chosen ? 'chosen' : (taken?.sure ?? 'possible')}>
          {#if work.chosen}
            Chosen by you
          {:else if taken}
            {SURE[taken.sure]}{taken.why ? ` · ${taken.why}` : ''}
          {/if}
          {#if told}<span class="from">for “{truncate(told, 80)}”</span>{/if}
        </div>
      {/if}
      {#if others.length}
        <div class="others" role="group" aria-label="Other references it may be">
          <span class="or">{work.reference ? 'Or' : 'It may be'}</span>
          {#each others as other (other.reference)}
            {@const ref = lookup(other.reference)}
            <button type="button" class="other" onclick={() => onchoose(other.reference)}>
              <span class="who">{ref ? `${ref.authors || '—'} ${ref.year}` : other.reference}</span>
              {#if ref}<span class="title serif">{truncate(ref.title, 48)}</span>{/if}
              <span class="how">{SURE[other.sure].toLowerCase()} · {other.why}</span>
            </button>
          {/each}
        </div>
      {/if}
      <div class="means">
        <button type="button" class="mean" onclick={(e) => onanother(e.currentTarget)}>
          <Search size={13} />
          {work.reference ? 'Another…' : 'Find it…'}
        </button>
        {#if addable}
          <button type="button" class="mean" onclick={onadd}>
            <BookPlus size={13} /> Add it to the library
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
