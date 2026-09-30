<script lang="ts">
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { compare, type Compared } from './compare';
  import type { Project } from './model/project.svelte';
  import { blocksText } from './model/text';

  interface Props {
    project: Project;
    /** The copy that is compared with its original. */
    id: string;
    onclose: () => void;
    /** Goes to the original, in its map. */
    ongo: (map: string, element: string) => void;
  }

  let { project, id, onclose, ongo }: Props = $props();

  const copy = $derived(project.node(id));
  const of = $derived(project.copyOf(id));
  const original = $derived(of?.original ?? null);

  /** Where the two differ: in their names, and in their texts, with the notes. */
  const names = $derived(
    copy && original ? compare(original.title, copy.title) : ([] as Compared[]),
  );
  const texts = $derived(
    copy && original
      ? compare(
          blocksText(project.blocksOf(original.id), true),
          blocksText(project.blocksOf(id), true),
        )
      : ([] as Compared[]),
  );
  const alike = $derived(
    names.every((p) => p.status === 'same') && texts.every((p) => p.status === 'same'),
  );

  // A copy that is gone, or no copy, has nothing to compare.
  $effect(() => {
    if (!copy || !of) onclose();
  });

  function take() {
    project.checkpoint();
    project.takeOriginal(id);
    project.checkpoint();
    onclose();
  }

  function seen() {
    project.settleCopy(id);
    onclose();
  }

  function go() {
    if (!original) return;
    ongo(original.map, original.id);
    onclose();
  }
</script>

{#snippet compared(pieces: Compared[])}
  {#each pieces as piece, i (i)}<span
      class={piece.status}
      title={piece.status === 'gone'
        ? t('copy-only-original')
        : piece.status === 'new'
          ? t('copy-only-copy')
          : undefined}>{piece.text}</span
    >{/each}
{/snippet}

<Dialog
  open
  title={t('copy-title')}
  subtitle={of?.map && original
    ? t('copy-from', { name: original.title || t('project-untitled'), map: of.map.name })
    : undefined}
  width={720}
  {onclose}
>
  {#if !original}
    <p class="said">{t('copy-original-gone')}</p>
  {:else}
    <p class="said" class:changed={of?.changed}>
      {of?.changed === true
        ? t('copy-original-changed')
        : of?.changed === false
          ? t('copy-original-same')
          : t('copy-original-unknown')}
      {#if !alike}{t('copy-how-shown')}{/if}
    </p>
    {#if alike}
      <p class="alike">{t('copy-alike')}</p>
    {:else}
      <div class="compared selectable">
        <p class="name">{@render compared(names)}</p>
        <div class="text">{@render compared(texts)}</div>
      </div>
    {/if}
  {/if}

  {#snippet footer()}
    {#if original}
      <Button variant="ghost" onclick={go}>{t('copy-go')}</Button>
      <span class="gap"></span>
      {#if of?.changed}
        <Button onclick={seen}>{t('copy-seen')}</Button>
      {/if}
      {#if !alike}
        <Button variant={of?.changed ? 'primary' : 'secondary'} onclick={take}>
          {t('copy-take')}
        </Button>
      {/if}
    {/if}
    <Button variant={original && !alike ? 'ghost' : 'primary'} onclick={onclose}
      >{t('common-close')}</Button
    >
  {/snippet}
</Dialog>

<style>
  .said {
    color: var(--ink-2);
    line-height: 1.5;
  }
  .said.changed {
    color: var(--ink);
  }
  .alike {
    margin-top: 12px;
    color: var(--ink-3);
  }
  .compared {
    margin-top: 14px;
    max-height: 52vh;
    overflow-y: auto;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
    font-family: var(--font-text);
    line-height: 1.6;
  }
  .name {
    margin-bottom: 10px;
    font-weight: 600;
  }
  .text {
    white-space: pre-wrap;
  }
  .gone {
    background: var(--danger-soft);
    color: var(--danger);
    text-decoration: line-through;
  }
  .new {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .gap {
    flex: 1;
  }
</style>
