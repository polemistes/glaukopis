<script lang="ts">
  /**
   * What is to be done with the works of a project file that the library
   * has otherwise (ADR 0036): one of the same id that differs, or one that
   * is the same work under another id. What is not asked is said below.
   */
  import type { SummaryLite } from '$lib/api/library';
  import type { FileChoice, FoundWork } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { reasonWords } from '$lib/library/format';
  import { fieldLabel } from '$lib/library/schema';
  import TypeIcon from '$lib/library/TypeIcon.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import type { Asking } from './project-actions.svelte';

  let {
    asking,
    onanswer,
  }: { asking: Asking; onanswer: (choices: Record<string, FileChoice> | null) => void } = $props();

  // svelte-ignore state_referenced_locally
  let choices = $state<Record<string, FileChoice>>({ ...asking.choices });

  const asked = $derived(
    asking.works.filter((w) => w.finding.kind === 'differs' || w.finding.kind === 'alike'),
  );
  const same = $derived(asking.works.filter((w) => w.finding.kind === 'same').length);
  const added = $derived(asking.works.filter((w) => w.finding.kind === 'new').length);

  const options: Record<'differs' | 'alike', { value: FileChoice; label: () => string }[]> = {
    differs: [
      { value: 'library', label: () => t('home-file-keep-library') },
      { value: 'file', label: () => t('home-file-take-file') },
      { value: 'both', label: () => t('home-file-keep-both') },
    ],
    alike: [
      { value: 'cite', label: () => t('home-file-cite-library') },
      { value: 'another', label: () => t('home-file-add-another') },
    ],
  };

  function gains(names: string[]): string {
    const named = (n: string) =>
      n === 'glaukopis-zotero' ? t('library-import-gains-zotero') : fieldLabel(n);
    return names.map(named).join(', ');
  }
</script>

{#snippet line(s: SummaryLite)}
  <span class="authors">{s.authors || '—'}</span>
  <span class="year">{s.year}</span>
  <span class="serif title">{s.title || t('library-untitled')}</span>
{/snippet}

<Dialog
  open
  title={t('home-file-references-title')}
  subtitle={t('home-file-references-about', { name: asking.name })}
  width={680}
  padded={false}
  onclose={() => onanswer(null)}
>
  <div class="content">
    {#each asked as work (work.id)}
      {@const finding = work.finding}
      <div class="item">
        <div class="what">
          <TypeIcon type={work.file.type} />
          <div class="text selectable">
            <div class="overline">{t('home-file-in-file')}</div>
            {@render line(work.file)}
          </div>
        </div>
        {#if finding.kind === 'differs' || finding.kind === 'alike'}
          <div class="against">
            <div class="overline">
              {#if finding.kind === 'differs'}
                {t('home-file-same-id')}
              {:else if finding.merged}
                {t('home-file-merged')}
              {:else}
                {t('library-in-library')} · {reasonWords(finding.reasons)}
              {/if}
            </div>
            <div class="existing selectable">{@render line(finding.library)}</div>
            {#if finding.kind === 'alike' && finding.gains.length}
              <div class="gains">
                {t('library-import-would-gain', { fields: gains(finding.gains) })}
              </div>
            {/if}
          </div>
          <div class="choices" role="radiogroup" aria-label={t('home-file-what-to-do')}>
            {#each options[finding.kind] as option (option.value)}
              <label>
                <input
                  type="radio"
                  name="choice-{work.id}"
                  checked={choices[work.id] === option.value}
                  onchange={() => (choices[work.id] = option.value)}
                />
                {option.label()}
              </label>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if same || added}
      <ul class="said">
        {#if same}<li>{t('home-file-same', { count: same })}</li>{/if}
        {#if added}<li>{t('home-file-added', { count: added })}</li>{/if}
      </ul>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={() => onanswer(null)}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={() => onanswer($state.snapshot(choices))}>
      {t('home-file-make')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: var(--space-3) var(--space-5) var(--space-4);
  }
  .item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .what {
    display: flex;
    gap: 9px;
    min-width: 0;
  }
  .what :global(.type-icon) {
    margin-top: 2px;
  }
  .text {
    min-width: 0;
  }
  .authors {
    font-weight: 550;
  }
  .year,
  .title {
    color: var(--ink-2);
  }
  .text .authors,
  .text .year {
    margin-right: 8px;
  }
  .text .title {
    display: block;
    line-height: 1.4;
  }
  .against {
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
  }
  .overline {
    margin-bottom: 2px;
  }
  .existing {
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
    line-height: 1.45;
  }
  .gains {
    margin-top: 3px;
    font-size: var(--text-sm);
    color: var(--ok);
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    font-size: var(--text-sm);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  input[type='radio'] {
    accent-color: var(--accent);
  }
  .said {
    margin: 4px 0 0;
    padding-left: 18px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.6;
  }
</style>
