<script lang="ts">
  /**
   * Over a project of the words of a language (ADR 0034): what it is, and
   * the writing of what was changed in it into Fluent files, with what was
   * and was not written.
   */
  import Languages from '@lucide/svelte/icons/languages';
  import { open as chooseFolder } from '@tauri-apps/plugin-dialog';
  import { languageName, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { projectWords } from './project';
  import { writeWords, type WrittenOut } from './words.svelte';

  interface Props {
    project: Project;
  }

  let { project }: Props = $props();

  const words = $derived(projectWords(project));
  let writing = $state(false);
  let result = $state<WrittenOut | null>(null);

  async function write() {
    const dir = await chooseFolder({ title: t('words-write-choose'), directory: true });
    if (typeof dir !== 'string') return;
    writing = true;
    try {
      const done = await writeWords(project, dir);
      if (!done.conflicts.length && !done.refused.length) {
        notifyOk(t('words-written', { count: done.done.length, files: done.files.size }));
      } else result = done;
    } catch (error) {
      notifyError(t('words-write-failed'), error);
    } finally {
      writing = false;
    }
  }

  /** Why a part was not written, in words. */
  function why(kind: string, detail: string): string {
    return t(`words-refused-${kind}`, { detail });
  }
</script>

{#if words}
  <div class="bar" data-words-bar>
    <Languages size={15} />
    <span class="said">{t('words-bar', { language: languageName(words.language) })}</span>
    <Button size="sm" disabled={writing} onclick={write}>
      {writing ? t('words-writing') : t('words-write')}
    </Button>
  </div>
{/if}

{#if result}
  <Dialog open title={t('words-result-title')} width={620} tall onclose={() => (result = null)}>
    <div class="result" data-words-result>
      <p>{t('words-written', { count: result.done.length, files: result.files.size })}</p>
      {#if result.conflicts.length}
        <h3>{t('words-conflicts')}</h3>
        <ul>
          {#each result.conflicts as c (c.file + c.key)}
            <li><code>{c.file.replace(/\.ftl$/, '')}: {c.key}</code></li>
          {/each}
        </ul>
      {/if}
      {#if result.refused.length}
        <h3>{t('words-refused')}</h3>
        <ul>
          {#each result.refused as r (r.change.file + r.change.key)}
            <li>
              <code>{r.change.file.replace(/\.ftl$/, '')}: {r.change.key}</code>
              <span>{why(r.fault.kind, r.fault.detail)}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#snippet footer()}
      <Button variant="primary" onclick={() => (result = null)}>{t('common-close')}</Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--accent-soft);
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .said {
    flex: 1;
    min-width: 0;
  }
  .result {
    display: flex;
    flex-direction: column;
    gap: 8px;
    line-height: 1.5;
  }
  h3 {
    margin-top: 6px;
    font-size: var(--text-md);
    font-weight: 600;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
  }
  li span {
    color: var(--ink-3);
  }
</style>
