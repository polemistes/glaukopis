<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import type { Match } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { describe, reasonWords } from './format';

  interface Props {
    matches: Match[];
    /** What choosing the existing entry is called here: "Use this one", "Open". */
    action?: string;
    onuse?: (match: Match) => void;
  }

  let { matches, action, onuse }: Props = $props();
</script>

{#if matches.length}
  <div class="notice" class:certain={matches[0].certainty === 'certain'} role="status">
    <span class="icon"><Copy size={15} /></span>
    <div class="body">
      <p class="lead">
        {matches[0].certainty === 'certain'
          ? t('library-duplicate-certain')
          : t('library-duplicate-probable')}
      </p>
      {#each matches.slice(0, 3) as match (match.id)}
        <div class="match">
          <div class="what selectable">
            <span class="serif">{describe(match.summary)}</span>
            <span class="why">{reasonWords(match.reasons)}</span>
          </div>
          {#if onuse}
            <button type="button" onclick={() => onuse(match)}
              >{action ?? t('library-duplicate-use')}</button
            >
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .notice {
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
  }
  .icon {
    display: inline-flex;
    margin-top: 2px;
    color: var(--gold);
  }
  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lead {
    font-weight: 550;
  }
  .match {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .what {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .why {
    display: block;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  button {
    flex: none;
    height: 26px;
    padding: 0 10px;
    border: 1px solid var(--gold);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
  }
  button:hover {
    background: var(--gold);
    color: #fff;
  }
</style>
