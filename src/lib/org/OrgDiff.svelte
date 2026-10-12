<script lang="ts">
  /**
   * The difference between two Org texts, line by line: lines put in and
   * taken out, and in a line changed, the words that changed marked. For
   * the history and the review, where a text is seen as Org.
   */
  import { t } from '$lib/i18n';
  import { anyChange, diffLines } from './diff';

  let { before, after }: { before: string; after: string } = $props();

  const lines = $derived(diffLines(before, after));
</script>

<div class="org-diff" data-org-diff>
  {#if !anyChange(lines)}
    <p class="unchanged">{t('history-org-same')}</p>
  {/if}
  <pre class="selectable">{#each lines as line, i (i)}{#if line.kind === 'changed'}<span
          class="line removed"
          data-line="removed"
          ><span class="sign">−</span>{#each line.before as w, j (j)}{#if w.changed}<del
                class="words">{w.text}</del
              >{:else}{w.text}{/if}{/each}</span
        ><span class="line added" data-line="added"
          ><span class="sign">+</span>{#each line.after as w, j (j)}{#if w.changed}<ins
                class="words">{w.text}</ins
              >{:else}{w.text}{/if}{/each}</span
        >{:else}<span class="line {line.kind}" data-line={line.kind}
          ><span class="sign"
            >{line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : '\u00a0'}</span
          >{line.text}</span
        >{/if}{/each}</pre>
</div>

<style>
  .org-diff {
    min-width: 0;
  }
  .unchanged {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  pre {
    margin: 0;
    padding: 8px 0;
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    font-family: var(--font-mono);
    font-size: 12.5px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .line {
    display: block;
    min-height: 1.5em;
    /* A line that wraps goes on under its words, not under its sign. */
    padding: 0 10px 0 1.8em;
    text-indent: -1.8em;
  }
  .sign {
    display: inline-block;
    width: 1.8em;
    text-indent: 0;
    vertical-align: top;
    color: var(--ink-3);
    text-align: center;
    user-select: none;
  }
  .added {
    background: var(--ok-soft);
  }
  .added .sign {
    color: var(--ok);
  }
  .removed {
    background: var(--danger-soft);
  }
  .removed .sign {
    color: var(--danger);
  }
  ins.words {
    text-decoration: none;
    background: color-mix(in srgb, var(--ok) 28%, transparent);
    border-radius: 2px;
  }
  del.words {
    text-decoration: line-through;
    text-decoration-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 22%, transparent);
    border-radius: 2px;
  }
</style>
