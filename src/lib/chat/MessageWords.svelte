<script lang="ts">
  /**
   * The words of a message of the chat, drawn from its words and marks and
   * never as HTML (record 0107): stretches within `strong`, `em`, `u`, `s`
   * and `code`, and its addresses of the web as links, which open in the
   * system's browser. Nothing but the words is drawn here, so that what is
   * read of it is what was written.
   */
  import { openPath } from '$lib/api/documents';
  import { t } from '$lib/i18n';
  import type { ChatMarkKind, ChatWords } from '$lib/project/model/types';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { stretches } from './written';

  let { words }: { words: ChatWords } = $props();

  const parts = $derived(stretches(words));

  function follow(event: MouseEvent, href: string) {
    event.preventDefault();
    openPath(href).catch((e) => notifyError(t('common-link-open-failed'), e));
  }
</script>

{#snippet marked(text: string, marks: ChatMarkKind[], i: number)}
  {#if i >= marks.length}{text}{:else if marks[i] === 'strong'}<strong
      >{@render marked(text, marks, i + 1)}</strong
    >{:else if marks[i] === 'em'}<em>{@render marked(text, marks, i + 1)}</em
    >{:else if marks[i] === 'underline'}<u>{@render marked(text, marks, i + 1)}</u
    >{:else if marks[i] === 'strike'}<s>{@render marked(text, marks, i + 1)}</s
    >{:else}<code>{@render marked(text, marks, i + 1)}</code>{/if}
{/snippet}

{#each parts as part, i (i)}
  {#if part.href}<a href={part.href} rel="noopener" onclick={(e) => follow(e, part.href!)}
      >{@render marked(part.text, part.marks, 0)}</a
    >{:else}{@render marked(part.text, part.marks, 0)}{/if}
{/each}

<style>
  code {
    padding: 0 2px;
    border-radius: 3px;
    background: var(--paper-sunken);
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
  a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
